const { query } = require('../config/database');

async function testStockStatement() {
  try {
    console.log('=== TESTING STOCK STATEMENT REPORT ===\n');

    // Get total items count
    const itemsCount = await query('SELECT COUNT(*) as count FROM items');
    console.log(`📊 Total items in database: ${itemsCount.rows[0].count}`);

    // Get items with transactions
    const itemsWithTransactions = await query(
      'SELECT COUNT(DISTINCT item_id) as count FROM stock_transactions'
    );
    console.log(`📦 Items with transactions: ${itemsWithTransactions.rows[0].count}\n`);

    // Test the report for last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const reportResult = await query(
      'SELECT * FROM get_stock_statement_report($1, $2, NULL)',
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    console.log(`📋 Items in report: ${reportResult.rows.length}\n`);

    if (reportResult.rows.length > 0) {
      console.log('Sample records from report:');
      console.table(reportResult.rows.slice(0, 5).map(row => ({
        item_name: row.item_name,
        category: row.category_name,
        opening_qty: row.opening_qty,
        receipt_qty: row.receipt_qty,
        issue_qty: row.issue_qty,
        closing_qty: row.closing_qty,
        'Formula Check': `${parseFloat(row.opening_qty)} + ${parseFloat(row.receipt_qty)} - ${parseFloat(row.issue_qty)} = ${parseFloat(row.closing_qty)}`
      })));

      // Verify the formula for all items
      console.log('\n🧪 Verifying Inventory Conservation Equation:');
      console.log('   Closing Stock = Opening Stock + Receipt - Issue\n');
      
      let allCorrect = true;
      reportResult.rows.forEach((row, index) => {
        const calculated = parseFloat(row.opening_qty) + parseFloat(row.receipt_qty) - parseFloat(row.issue_qty);
        const actual = parseFloat(row.closing_qty);
        const diff = Math.abs(calculated - actual);
        
        if (diff > 0.001) { // Allow small floating point differences
          console.log(`❌ ${row.item_name}: Calculated=${calculated.toFixed(3)}, Actual=${actual.toFixed(3)}, Diff=${diff.toFixed(3)}`);
          allCorrect = false;
        }
      });

      if (allCorrect) {
        console.log('✅ All items follow the inventory conservation equation correctly!');
      } else {
        console.log('❌ Some items have calculation errors!');
      }

      // Show items with stock
      const itemsWithStock = reportResult.rows.filter(r => 
        parseFloat(r.opening_qty) > 0 || 
        parseFloat(r.receipt_qty) > 0 || 
        parseFloat(r.issue_qty) > 0 ||
        parseFloat(r.closing_qty) > 0
      );
      console.log(`\n📊 Items with stock activity: ${itemsWithStock.length}`);
      
      const itemsWithZeroStock = reportResult.rows.filter(r => 
        parseFloat(r.opening_qty) === 0 && 
        parseFloat(r.receipt_qty) === 0 && 
        parseFloat(r.issue_qty) === 0 &&
        parseFloat(r.closing_qty) === 0
      );
      console.log(`📊 Items with no stock activity: ${itemsWithZeroStock.length}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testStockStatement();
