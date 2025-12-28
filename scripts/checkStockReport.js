const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== CHECKING STOCK STATEMENT REPORT ===\n');
    
    // Check if function exists
    const funcCheck = await query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_name = 'get_stock_statement_report'
    `);
    console.log('Function exists:', funcCheck.rows.length > 0);
    
    // Check items table
    const items = await query('SELECT id, item_name, category_id FROM items ORDER BY id');
    console.log('\n=== ITEMS IN DATABASE ===');
    console.table(items.rows);
    
    // Check stock transactions
    const transactions = await query('SELECT COUNT(*) as count FROM stock_transactions');
    console.log('\nStock Transactions Count:', transactions.rows[0].count);
    
    // Run the report
    const report = await query(`
      SELECT * FROM get_stock_statement_report('2025-01-01', '2025-12-31', NULL)
    `);
    
    console.log('\n=== STOCK STATEMENT REPORT OUTPUT ===');
    console.table(report.rows);
    console.log('\nTotal Items in Report:', report.rows.length);
    
    // Check if report shows items with zero stock
    const zeroStock = report.rows.filter(r => 
      parseFloat(r.opening_qty) === 0 && 
      parseFloat(r.receipt_qty) === 0 && 
      parseFloat(r.issue_qty) === 0
    );
    console.log('Items with zero stock:', zeroStock.length);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
