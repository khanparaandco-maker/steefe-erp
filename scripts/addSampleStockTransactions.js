const { query } = require('../config/database');

async function addSampleTransactions() {
  try {
    console.log('=== ADDING SAMPLE STOCK TRANSACTIONS ===\n');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    // Add RECEIPT transactions (purchases/inward)
    console.log('Adding RECEIPT transactions...');
    
    await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
       VALUES ($1, 'RECEIPT', 1, 500, 35.00, 17500.00, 'GRN', 'Purchase of Steel Shots from Supplier A')`,
      [twoDaysAgo]
    );
    
    await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
       VALUES ($1, 'RECEIPT', 2, 300, 40.00, 12000.00, 'GRN', 'Purchase of MS Scrap from Supplier B')`,
      [yesterday]
    );

    await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
       VALUES ($1, 'RECEIPT', 3, 150, 50.00, 7500.00, 'GRN', 'Purchase of Aluminium')`,
      [yesterday]
    );

    console.log('✅ RECEIPT transactions added\n');

    // Add ISSUE transactions (sales/outward/consumption)
    console.log('Adding ISSUE transactions...');
    
    await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
       VALUES ($1, 'ISSUE', 1, 200, 35.00, 7000.00, 'DISPATCH', 'Sales to Customer X')`,
      [yesterday]
    );

    await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
       VALUES ($1, 'ISSUE', 2, 100, 40.00, 4000.00, 'PRODUCTION', 'Issued to melting process')`,
      [today]
    );

    await query(
      `INSERT INTO stock_transactions 
       (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
       VALUES ($1, 'ISSUE', 3, 50, 50.00, 2500.00, 'PRODUCTION', 'Issued to manufacturing')`,
      [today]
    );

    console.log('✅ ISSUE transactions added\n');

    // Show summary
    console.log('=== TRANSACTION SUMMARY ===');
    const summary = await query(`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM stock_transactions
      GROUP BY transaction_type
      ORDER BY transaction_type
    `);
    console.table(summary.rows);

    // Test the report
    console.log('\n=== TESTING STOCK STATEMENT (Last 30 days) ===\n');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const report = await query(
      `SELECT 
        item_name,
        category_name,
        opening_qty,
        opening_amount,
        receipt_qty,
        receipt_amount,
        issue_qty,
        issue_amount,
        closing_qty,
        closing_amount
       FROM get_stock_statement_report($1, $2, NULL)
       WHERE opening_qty > 0 OR receipt_qty > 0 OR issue_qty > 0 OR closing_qty > 0
       ORDER BY item_name`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    console.log('Items with stock activity:');
    console.table(report.rows);

    console.log('\n✅ Sample transactions added successfully!');
    console.log('\n📝 You can now view the Stock Statement report in the frontend.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

addSampleTransactions();
