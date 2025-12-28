const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== FIXING DISPATCH STOCK TRANSACTIONS ===\n');
    
    console.log('Dispatch quantities are already in KG, no conversion needed.\n');
    
    // Delete old dispatch transactions
    const before = await query(`SELECT * FROM stock_transactions WHERE reference_type = 'DISPATCH'`);
    console.log('Before fix:');
    console.table(before.rows);
    
    await query(`DELETE FROM stock_transactions WHERE reference_type = 'DISPATCH'`);
    
    // Re-populate from dispatch_items with actual KG quantities (no multiplication)
    const dispatches = await query(`
      SELECT 
        di.id,
        d.dispatch_date,
        oi.item_id,
        di.quantity_dispatched,
        oi.rate,
        o.order_no
      FROM dispatch_items di
      JOIN dispatches d ON di.dispatch_id = d.id
      JOIN order_items oi ON di.order_item_id = oi.id
      JOIN orders o ON d.order_id = o.id
      ORDER BY d.dispatch_date
    `);
    
    for (const disp of dispatches.rows) {
      await query(`
        INSERT INTO stock_transactions (
          transaction_date, transaction_type, item_id, 
          quantity, rate, amount, 
          reference_type, reference_id, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        disp.dispatch_date,
        'ISSUE',
        disp.item_id,
        disp.quantity_dispatched,
        disp.rate,
        parseFloat(disp.quantity_dispatched) * parseFloat(disp.rate),
        'DISPATCH',
        disp.id,
        `Dispatched from Order ${disp.order_no}`
      ]);
      
      console.log(`✓ Created ISSUE: ${disp.quantity_dispatched} kg @ ₹${disp.rate} from ${disp.order_no}`);
    }
    
    // Show updated stock report
    console.log('\n=== UPDATED STOCK REPORT ===');
    const report = await query(`
      SELECT 
        item_name,
        category_name,
        uom_short_name,
        receipt_qty,
        issue_qty,
        closing_qty,
        closing_amount
      FROM get_stock_statement_report('2025-01-01', '2025-12-31', NULL)
      WHERE item_id = 1
    `);
    console.table(report.rows);
    
    // Show summary
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
    
    console.log('\n=== ALL STOCK TRANSACTIONS SUMMARY ===');
    console.table(summary.rows);
    
    console.log('\n✅ Dispatch transactions fixed!');
    console.log('Note: Dispatch quantities are already in KG (not bags)');
    console.log('      Heat Treatment: 45 bags × 25 = 1,125 kg');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
