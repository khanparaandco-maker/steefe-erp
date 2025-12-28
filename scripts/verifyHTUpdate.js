const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function verifyUpdate() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Verifying Heat Treatment Update ===\n');
        
        // Check heat treatment record
        const ht = await client.query('SELECT * FROM heat_treatment WHERE id = 1');
        console.log('Heat Treatment Record:');
        console.log(`  Bags Produced: ${ht.rows[0].bags_produced}`);
        console.log(`  Last Updated: ${ht.rows[0].updated_at}`);
        
        // Check stock transactions
        const txns = await client.query(`
            SELECT 
                st.id,
                st.transaction_date,
                st.transaction_type,
                i.item_name,
                st.quantity,
                st.rate,
                st.amount,
                st.created_at
            FROM stock_transactions st
            JOIN items i ON i.id = st.item_id
            WHERE st.reference_type = 'HEAT_TREATMENT' 
            AND st.reference_id = 1
            ORDER BY st.created_at DESC
            LIMIT 5
        `);
        
        console.log('\nLatest Stock Transactions:');
        txns.rows.forEach(t => {
            console.log(`  ${t.transaction_type.padEnd(10)} ${t.item_name.padEnd(25)} ${t.quantity} kg @ ₹${t.rate} = ₹${t.amount}`);
        });
        
        console.log('\n✅ Verification Complete!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyUpdate();
