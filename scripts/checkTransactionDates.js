const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== CHECKING TRANSACTION DATES ===\n');
    
    // Check dispatch details
    const dispatch = await query(`
      SELECT 
        d.id,
        d.dispatch_date,
        di.quantity_dispatched,
        st.transaction_date,
        st.quantity,
        st.created_at
      FROM dispatches d
      JOIN dispatch_items di ON d.id = di.dispatch_id
      LEFT JOIN stock_transactions st ON st.reference_type = 'DISPATCH' AND st.reference_id = di.id
      ORDER BY d.id DESC
      LIMIT 1
    `);
    
    console.log('Dispatch vs Transaction Date:');
    console.table(dispatch.rows);
    
    // Check melting process
    const melting = await query(`
      SELECT * FROM melting_processes ORDER BY melting_date DESC LIMIT 2
    `);
    
    console.log('\nMelting Processes:');
    console.table(melting.rows);
    
    // Check current stock transactions
    const transactions = await query(`
      SELECT 
        id,
        transaction_date,
        transaction_type,
        item_id,
        quantity,
        reference_type,
        reference_id,
        remarks
      FROM stock_transactions
      ORDER BY transaction_date DESC, id DESC
      LIMIT 10
    `);
    
    console.log('\nRecent Stock Transactions:');
    console.table(transactions.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
