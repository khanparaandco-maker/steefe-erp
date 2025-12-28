const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== ANALYZING DATA FOR STOCK ISSUES ===\n');
    
    // 1. DISPATCH ISSUES - Get item from order_items
    console.log('1. DISPATCH DATA (via order_items):');
    const dispatchData = await query(`
      SELECT 
        di.id as dispatch_item_id,
        d.dispatch_date,
        oi.item_id,
        i.item_name,
        di.quantity_dispatched as bags,
        oi.rate,
        (di.quantity_dispatched * oi.rate) as amount
      FROM dispatch_items di
      JOIN dispatches d ON di.dispatch_id = d.id
      JOIN order_items oi ON di.order_item_id = oi.id
      LEFT JOIN items i ON oi.item_id = i.id
      ORDER BY d.dispatch_date DESC
    `);
    console.table(dispatchData.rows);
    console.log(`Total Dispatches: ${dispatchData.rows.length}\n`);
    
    // 2. MELTING PROCESS - Issues scrap_total as MS Scrap
    console.log('2. MELTING PROCESS DATA:');
    const meltingData = await query(`
      SELECT 
        mp.id,
        mp.melting_date,
        mp.scrap_total,
        2 as item_id,
        'MS Scrap' as item_name
      FROM melting_processes mp
      WHERE mp.scrap_total > 0
      ORDER BY mp.melting_date DESC
    `);
    console.table(meltingData.rows);
    console.log(`Total Melting Records: ${meltingData.rows.length}`);
    console.log('Note: scrap_total represents MS Scrap consumed\n');
    
    // 3. HEAT TREATMENT - Produces finished goods
    console.log('3. HEAT TREATMENT DATA:');
    const heatData = await query(`
      SELECT 
        ht.id,
        ht.treatment_date,
        ht.size_item_id,
        i.item_name,
        ht.bags_produced
      FROM heat_treatment ht
      LEFT JOIN items i ON ht.size_item_id = i.id
      ORDER BY ht.treatment_date DESC
    `);
    console.table(heatData.rows);
    console.log(`Total Heat Treatment Records: ${heatData.rows.length}`);
    console.log('Note: This is RECEIPT of finished goods, not an issue\n');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
