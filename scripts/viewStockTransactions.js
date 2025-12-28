const { query } = require('../config/database');

(async () => {
  try {
    // Get table structure
    const cols = await query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('=== STOCK_TRANSACTIONS TABLE STRUCTURE ===\n');
    console.table(cols.rows);
    
    // Get recent transactions
    const data = await query(`
      SELECT 
        st.id,
        st.transaction_date,
        st.transaction_type,
        st.item_id,
        i.item_name,
        st.quantity,
        st.rate,
        st.amount,
        st.reference_type,
        st.reference_id,
        st.remarks
      FROM stock_transactions st
      LEFT JOIN items i ON st.item_id = i.id
      ORDER BY st.transaction_date DESC, st.id DESC 
      LIMIT 10
    `);
    
    console.log('\n=== RECENT TRANSACTIONS (Last 10) ===\n');
    console.table(data.rows);
    
    // Get summary by type
    const summary = await query(`
      SELECT 
        transaction_type, 
        reference_type, 
        COUNT(*) as count, 
        SUM(quantity) as total_qty, 
        SUM(amount) as total_amount 
      FROM stock_transactions 
      GROUP BY transaction_type, reference_type 
      ORDER BY transaction_type, reference_type
    `);
    
    console.log('\n=== TRANSACTION SUMMARY ===\n');
    console.table(summary.rows);
    
    // Get total count
    const total = await query('SELECT COUNT(*) as total FROM stock_transactions');
    console.log(`\nTotal Transactions: ${total.rows[0].total}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
