const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function checkNov30Transactions() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== All Melting-Related Stock Transactions ===\n');
        
        const result = await client.query(`
            SELECT 
                st.id,
                st.transaction_date,
                i.item_name,
                st.transaction_type,
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
        
        result.rows.forEach(row => {
            console.log(`ID: ${row.id}, Date: ${row.transaction_date.toISOString()}, ${row.item_name}, ${row.transaction_type}, ${row.quantity} kg, Ref: ${row.reference_type}/${row.reference_id}`);
        });
        
        console.log('\n=== Checking Date Comparisons ===');
        const dateCheck = await client.query(`
            SELECT 
                '2025-11-30'::DATE as target_date,
                '2025-11-30 00:00:00'::TIMESTAMP as target_ts,
                (SELECT transaction_date FROM stock_transactions WHERE reference_id = 4 AND reference_type = 'MELTING' LIMIT 1) as actual_date,
                (SELECT transaction_date FROM stock_transactions WHERE reference_id = 4 AND reference_type = 'MELTING' LIMIT 1) <= '2025-11-30'::DATE as is_within_range
        `);
        
        console.log('\nDate comparison:', dateCheck.rows[0]);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkNov30Transactions();
