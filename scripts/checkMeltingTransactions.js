const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function checkMeltingTransactions() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Checking Melting Stock Transactions ===\n');
        
        // Check all stock transactions for melting
        const result = await client.query(`
            SELECT 
                st.id,
                st.transaction_date,
                st.transaction_type,
                i.item_name,
                st.quantity,
                st.rate,
                st.amount,
                st.reference_type,
                st.reference_id
            FROM stock_transactions st
            JOIN items i ON i.id = st.item_id
            WHERE st.reference_type IN ('MELTING', 'MELTING_OUTPUT')
            ORDER BY st.transaction_date, st.id
        `);
        
        console.log(`Found ${result.rows.length} melting-related transactions:\n`);
        
        if (result.rows.length === 0) {
            console.log('❌ NO MELTING TRANSACTIONS FOUND!');
            console.log('\nThis is the problem - melting process stock transactions are missing.');
        } else {
            result.rows.forEach(row => {
                console.log(`${row.transaction_date.toISOString().split('T')[0]} | ${row.transaction_type.padEnd(10)} | ${row.item_name.padEnd(25)} | ${row.quantity} kg | Ref: ${row.reference_type}/${row.reference_id}`);
            });
        }
        
        console.log('\n=== Checking Melting Processes ===\n');
        const melting = await client.query(`
            SELECT id, melting_date, heat_no, scrap_total 
            FROM melting_processes 
            ORDER BY melting_date
        `);
        
        console.log(`Found ${melting.rows.length} melting process records:`);
        melting.rows.forEach(m => {
            console.log(`  ID: ${m.id}, Date: ${m.melting_date.toISOString().split('T')[0]}, Heat: ${m.heat_no}, Scrap: ${m.scrap_total} kg`);
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkMeltingTransactions();
