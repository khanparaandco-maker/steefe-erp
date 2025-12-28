const { query } = require('../config/database');

(async () => {
  try {
    // Check GRN data
    const grn = await query(`
      SELECT 
        g.id, g.grn_no, g.invoice_date, g.supplier_id,
        COUNT(gi.id) as item_count
      FROM scrap_grn g
      LEFT JOIN scrap_grn_items gi ON g.id = gi.grn_id
      GROUP BY g.id, g.grn_no, g.invoice_date, g.supplier_id
      ORDER BY g.invoice_date DESC
      LIMIT 5
    `);
    
    console.log('=== RECENT GRN RECORDS ===');
    console.table(grn.rows);
    console.log('Total GRNs:', grn.rows.length);
    
    // Check GRN items
    const grnItems = await query(`
      SELECT 
        gi.id, gi.grn_id, gi.item_id, 
        i.item_name, gi.quantity, gi.rate, gi.amount
      FROM scrap_grn_items gi
      LEFT JOIN items i ON gi.item_id = i.id
      ORDER BY gi.id DESC
      LIMIT 10
    `);
    
    console.log('\n=== GRN ITEMS ===');
    console.table(grnItems.rows);
    console.log('Total GRN Items:', grnItems.rows.length);
    
    // Check if triggers exist
    const triggers = await query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name LIKE '%stock%'
    `);
    
    console.log('\n=== STOCK-RELATED TRIGGERS ===');
    console.table(triggers.rows);
    
    // Check dispatch data
    const dispatches = await query(`
      SELECT COUNT(*) as count FROM dispatch_items
    `);
    console.log('\nDispatch Items Count:', dispatches.rows[0].count);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
