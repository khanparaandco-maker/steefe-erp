const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function checkTriggers() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Checking Database Triggers ===\n');
        
        const triggers = await client.query(`
            SELECT 
                trigger_name,
                event_object_table,
                action_timing,
                event_manipulation
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND event_object_table IN ('melting_processes', 'heat_treatment', 'scrap_grn_items', 'dispatch_items')
            ORDER BY event_object_table, trigger_name
        `);
        
        console.log('Active Triggers:\n');
        let currentTable = '';
        triggers.rows.forEach(t => {
            if (t.event_object_table !== currentTable) {
                console.log(`\n${t.event_object_table.toUpperCase()}:`);
                currentTable = t.event_object_table;
            }
            console.log(`  ✓ ${t.trigger_name} (${t.action_timing} ${t.event_manipulation})`);
        });
        
        console.log('\n=== Testing Melting Trigger ===\n');
        
        // Try to update a melting record to trigger the stock transaction
        await client.query('BEGIN');
        
        console.log('Updating melting process ID 3...');
        await client.query(`
            UPDATE melting_processes 
            SET scrap_total = scrap_total 
            WHERE id = 3
        `);
        
        // Check if transactions were created/updated
        const txnCheck = await client.query(`
            SELECT COUNT(*) as count
            FROM stock_transactions
            WHERE reference_type IN ('MELTING', 'MELTING_OUTPUT')
            AND reference_id = 3
        `);
        
        await client.query('ROLLBACK');
        
        console.log(`Transactions for melting ID 3: ${txnCheck.rows[0].count}`);
        
        if (parseInt(txnCheck.rows[0].count) > 0) {
            console.log('✅ Melting trigger is working!');
        } else {
            console.log('❌ Melting trigger is NOT creating transactions');
        }
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTriggers();
