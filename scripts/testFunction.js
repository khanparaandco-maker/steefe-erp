const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function testFunction() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Testing Function Directly ===');
        
        const result = await client.query(`
            SELECT * FROM get_stock_statement_report($1::DATE, $2::DATE, NULL)
            WHERE item_name = 'WIP - Work In Progress'
        `, ['2025-11-01', '2025-11-30']);
        
        console.log('Result:', result.rows);
        
        console.log('\n=== Raw Transaction Query ===');
        const raw = await client.query(`
            SELECT 
                i.item_name,
                st.transaction_date,
                st.transaction_type,
                st.quantity,
                st.rate,
                st.amount
            FROM stock_transactions st
            JOIN items i ON i.id = st.item_id
            WHERE i.item_name = 'WIP - Work In Progress'
            AND st.transaction_date >= $1::DATE
            AND st.transaction_date <= $2::DATE
            ORDER BY st.transaction_date
        `, ['2025-11-01', '2025-11-30']);
        
        console.log('\nMS Scrap Transactions:');
        raw.rows.forEach(row => {
            console.log(`${row.transaction_date.toISOString().split('T')[0]} - ${row.transaction_type}: ${row.quantity} kg @ ₹${row.rate} = ₹${row.amount}`);
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

testFunction();
