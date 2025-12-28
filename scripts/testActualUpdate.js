const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function testActualUpdate() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('\n=== Testing Actual Heat Treatment Update ===\n');
        
        // Get the first record
        const existing = await client.query('SELECT * FROM heat_treatment WHERE id = 1');
        console.log('Original record:', existing.rows[0]);
        
        // Try to update with NEW values (change bags_produced)
        console.log('\n--- Attempting UPDATE with changed bags_produced ---');
        const newBags = existing.rows[0].bags_produced + 5;
        
        try {
            const result = await client.query(`
                UPDATE heat_treatment
                SET 
                    treatment_date = $1,
                    furnace_no = $2,
                    size_item_id = $3,
                    time_in = $4,
                    time_out = $5,
                    temperature = $6,
                    bags_produced = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8
                RETURNING id
            `, [
                existing.rows[0].treatment_date,
                existing.rows[0].furnace_no,
                existing.rows[0].size_item_id,
                existing.rows[0].time_in,
                existing.rows[0].time_out,
                existing.rows[0].temperature,
                newBags,
                1
            ]);
            
            console.log('✓ UPDATE successful! ID:', result.rows[0].id);
            
            // Check stock transactions created
            const transactions = await client.query(`
                SELECT * FROM stock_transactions 
                WHERE reference_type = 'HEAT_TREATMENT' AND reference_id = 1
                ORDER BY id DESC
                LIMIT 5
            `);
            
            console.log(`\n✓ Stock transactions created: ${transactions.rows.length}`);
            transactions.rows.forEach(t => {
                console.log(`  - ${t.transaction_type}: Item ${t.item_id}, Qty: ${t.quantity}, Rate: ${t.rate}, Amount: ${t.amount}`);
            });
            
        } catch (error) {
            console.error('❌ UPDATE failed!');
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error detail:', error.detail);
            console.error('Error hint:', error.hint);
            if (error.stack) {
                console.error('\nStack trace:', error.stack);
            }
        }
        
        await client.query('ROLLBACK');
        console.log('\n--- Test rolled back (no actual changes) ---');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

testActualUpdate();
