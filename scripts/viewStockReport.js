const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function viewCurrentStockReport() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Stock Statement Report (November 2025) ===\n');
        
        const result = await client.query(`
            SELECT * FROM get_stock_statement_report('2025-11-01'::DATE, '2025-12-01'::DATE, NULL)
            ORDER BY item_name
        `);
        
        console.log('Item Name                    | Opening | Receipt | Issue   | Closing | Avg Rate | Closing Value');
        console.log('----------------------------- | ------- | ------- | ------- | ------- | -------- | -------------');
        
        result.rows.forEach(row => {
            const itemName = row.item_name.padEnd(28);
            const opening = parseFloat(row.opening_qty || 0).toFixed(2).padStart(7);
            const receipt = parseFloat(row.receipt_qty || 0).toFixed(2).padStart(7);
            const issue = parseFloat(row.issue_qty || 0).toFixed(2).padStart(7);
            const closing = parseFloat(row.closing_qty || 0).toFixed(2).padStart(7);
            const rate = parseFloat(row.closing_rate || 0).toFixed(2).padStart(8);
            const value = parseFloat(row.closing_amount || 0).toFixed(2).padStart(13);
            
            console.log(`${itemName} | ${opening} | ${receipt} | ${issue} | ${closing} | ${rate} | ${value}`);
        });
        
        console.log('\n=== Stock Transactions Summary ===\n');
        
        const txnSummary = await client.query(`
            SELECT 
                i.item_name,
                st.transaction_type,
                st.reference_type,
                COUNT(*) as txn_count,
                SUM(st.quantity) as total_qty,
                SUM(st.amount) as total_amount
            FROM stock_transactions st
            JOIN items i ON i.id = st.item_id
            WHERE st.transaction_date BETWEEN '2025-11-01' AND '2025-11-30'
            GROUP BY i.item_name, st.transaction_type, st.reference_type
            ORDER BY i.item_name, st.transaction_type, st.reference_type
        `);
        
        let currentItem = '';
        txnSummary.rows.forEach(row => {
            if (row.item_name !== currentItem) {
                console.log(`\n${row.item_name}:`);
                currentItem = row.item_name;
            }
            console.log(`  ${row.transaction_type.padEnd(10)} (${row.reference_type.padEnd(20)}): ${row.txn_count} txns, ${parseFloat(row.total_qty).toFixed(2)} kg, ₹${parseFloat(row.total_amount).toFixed(2)}`);
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

viewCurrentStockReport();
