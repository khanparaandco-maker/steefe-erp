const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== UPDATING STOCK TRANSACTIONS WITH BAG-TO-KG CONVERSION ===\n');
    
    // 1. Update Heat Treatment transactions (45 bags → 1125 kg)
    console.log('1. HEAT TREATMENT TRANSACTIONS:');
    const htBefore = await query(`
      SELECT * FROM stock_transactions 
      WHERE reference_type = 'HEAT_TREATMENT'
    `);
    console.log('Before:');
    console.table(htBefore.rows);
    
    // Delete old heat treatment transactions
    await query(`DELETE FROM stock_transactions WHERE reference_type = 'HEAT_TREATMENT'`);
    
    // Re-populate from heat_treatment table
    const heatTreatments = await query(`
      SELECT 
        ht.id,
        ht.treatment_date,
        ht.size_item_id as item_id,
        ht.bags_produced,
        (ht.bags_produced * 25) as quantity_kg
      FROM heat_treatment ht
      WHERE ht.bags_produced > 0
      ORDER BY ht.treatment_date
    `);
    
    for (const ht of heatTreatments.rows) {
      const rateQuery = await query(`
        SELECT rate FROM order_items 
        WHERE item_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [ht.item_id]);
      const rate = rateQuery.rows.length > 0 ? rateQuery.rows[0].rate : 50.00;
      
      await query(`
        INSERT INTO stock_transactions (
          transaction_date, transaction_type, item_id, 
          quantity, rate, amount, 
          reference_type, reference_id, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        ht.treatment_date,
        'RECEIPT',
        ht.item_id,
        ht.quantity_kg,
        rate,
        parseFloat(ht.quantity_kg) * parseFloat(rate),
        'HEAT_TREATMENT',
        ht.id,
        `Heat Treatment - ${ht.bags_produced} bags × 25 kg = ${ht.quantity_kg} kg`
      ]);
      
      console.log(`✓ Created RECEIPT: ${ht.bags_produced} bags = ${ht.quantity_kg} kg @ ₹${rate}`);
    }
    
    // 2. Update Dispatch transactions (1000 bags → 25000 kg)
    console.log('\n2. DISPATCH TRANSACTIONS:');
    const dispBefore = await query(`
      SELECT * FROM stock_transactions 
      WHERE reference_type = 'DISPATCH'
    `);
    console.log('Before:');
    console.table(dispBefore.rows);
    
    // Delete old dispatch transactions
    await query(`DELETE FROM stock_transactions WHERE reference_type = 'DISPATCH'`);
    
    // Re-populate from dispatch_items table
    const dispatches = await query(`
      SELECT 
        di.id,
        d.dispatch_date,
        oi.item_id,
        di.quantity_dispatched as bags,
        (di.quantity_dispatched * 25) as quantity_kg,
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
        disp.quantity_kg,
        disp.rate,
        parseFloat(disp.quantity_kg) * parseFloat(disp.rate),
        'DISPATCH',
        disp.id,
        `Dispatched ${disp.bags} bags × 25 kg = ${disp.quantity_kg} kg from Order ${disp.order_no}`
      ]);
      
      console.log(`✓ Created ISSUE: ${disp.bags} bags = ${disp.quantity_kg} kg @ ₹${disp.rate}`);
    }
    
    // 3. Show updated transactions
    console.log('\n=== UPDATED STOCK TRANSACTIONS ===');
    const all = await query(`
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
    console.table(all.rows);
    
    // 4. Show stock report
    console.log('\n=== UPDATED STOCK REPORT ===');
    const report = await query(`
      SELECT * FROM get_stock_statement_report('2025-01-01', '2025-12-31', NULL)
      WHERE closing_qty::numeric != 0
      ORDER BY item_name
    `);
    console.table(report.rows);
    
    console.log('\n✅ Stock transactions updated with bag-to-kg conversion!');
    console.log('Note: 1 bag = 25 kg');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
