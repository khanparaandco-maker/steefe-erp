const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== POPULATING STOCK TRANSACTIONS - ISSUES & PRODUCTION ===\n');
    
    let inserted = 0;
    
    // ============================================
    // 1. DISPATCH ISSUES (Finished Goods)
    // ============================================
    console.log('1. PROCESSING DISPATCH ISSUES...');
    const dispatches = await query(`
      SELECT 
        di.id as dispatch_item_id,
        d.dispatch_date,
        oi.item_id,
        i.item_name,
        di.quantity_dispatched as quantity,
        oi.rate,
        (di.quantity_dispatched * oi.rate) as amount
      FROM dispatch_items di
      JOIN dispatches d ON di.dispatch_id = d.id
      JOIN order_items oi ON di.order_item_id = oi.id
      LEFT JOIN items i ON oi.item_id = i.id
      ORDER BY d.dispatch_date
    `);
    
    for (const item of dispatches.rows) {
      // Check if already exists
      const existing = await query(`
        SELECT id FROM stock_transactions 
        WHERE reference_type = 'DISPATCH' 
        AND reference_id = $1
      `, [item.dispatch_item_id]);
      
      if (existing.rows.length > 0) {
        console.log(`  ✓ Dispatch ${item.dispatch_item_id} already processed`);
        continue;
      }
      
      // Insert ISSUE transaction
      await query(`
        INSERT INTO stock_transactions (
          transaction_date, transaction_type, item_id, 
          quantity, rate, amount, 
          reference_type, reference_id, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        item.dispatch_date,
        'ISSUE',
        item.item_id,
        item.quantity,
        item.rate,
        item.amount,
        'DISPATCH',
        item.dispatch_item_id,
        `Dispatched ${item.item_name} - Auto-populated`
      ]);
      
      inserted++;
      console.log(`  ✓ Created ISSUE: ${item.item_name} - ${item.quantity} bags @ ₹${item.rate}`);
    }
    
    // ============================================
    // 2. MELTING PROCESS ISSUES (Raw Material)
    // ============================================
    console.log('\n2. PROCESSING MELTING PROCESS ISSUES...');
    const meltingProcesses = await query(`
      SELECT 
        mp.id,
        mp.melting_date,
        mp.scrap_total,
        2 as item_id
      FROM melting_processes mp
      WHERE mp.scrap_total > 0
      ORDER BY mp.melting_date
    `);
    
    for (const item of meltingProcesses.rows) {
      // Check if already exists
      const existing = await query(`
        SELECT id FROM stock_transactions 
        WHERE reference_type = 'MELTING' 
        AND reference_id = $1
        AND transaction_type = 'ISSUE'
      `, [item.id]);
      
      if (existing.rows.length > 0) {
        console.log(`  ✓ Melting ${item.id} already processed`);
        continue;
      }
      
      // Get average rate for MS Scrap from recent receipts
      const rateQuery = await query(`
        SELECT AVG(rate) as avg_rate 
        FROM stock_transactions 
        WHERE item_id = 2 
        AND transaction_type = 'RECEIPT'
      `);
      const rate = rateQuery.rows[0].avg_rate || 30.00;
      
      // Insert ISSUE transaction
      await query(`
        INSERT INTO stock_transactions (
          transaction_date, transaction_type, item_id, 
          quantity, rate, amount, 
          reference_type, reference_id, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        item.melting_date,
        'ISSUE',
        item.item_id,
        item.scrap_total,
        rate,
        parseFloat(item.scrap_total) * parseFloat(rate),
        'MELTING',
        item.id,
        `MS Scrap consumed in melting - Auto-populated`
      ]);
      
      inserted++;
      console.log(`  ✓ Created ISSUE: MS Scrap - ${item.scrap_total} kg @ ₹${rate}`);
    }
    
    // ============================================
    // 3. HEAT TREATMENT RECEIPTS (Finished Goods Production)
    // ============================================
    console.log('\n3. PROCESSING HEAT TREATMENT PRODUCTION...');
    const heatTreatments = await query(`
      SELECT 
        ht.id,
        ht.treatment_date,
        ht.size_item_id as item_id,
        i.item_name,
        ht.bags_produced as quantity
      FROM heat_treatment ht
      LEFT JOIN items i ON ht.size_item_id = i.id
      WHERE ht.bags_produced > 0
      ORDER BY ht.treatment_date
    `);
    
    for (const item of heatTreatments.rows) {
      // Check if already exists
      const existing = await query(`
        SELECT id FROM stock_transactions 
        WHERE reference_type = 'HEAT_TREATMENT' 
        AND reference_id = $1
      `, [item.id]);
      
      if (existing.rows.length > 0) {
        console.log(`  ✓ Heat Treatment ${item.id} already processed`);
        continue;
      }
      
      // Get rate from order_items or use default
      const rateQuery = await query(`
        SELECT rate FROM order_items 
        WHERE item_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [item.item_id]);
      const rate = rateQuery.rows.length > 0 ? rateQuery.rows[0].rate : 50.00;
      
      // Insert RECEIPT transaction
      await query(`
        INSERT INTO stock_transactions (
          transaction_date, transaction_type, item_id, 
          quantity, rate, amount, 
          reference_type, reference_id, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        item.treatment_date,
        'RECEIPT',
        item.item_id,
        item.quantity,
        rate,
        parseFloat(item.quantity) * parseFloat(rate),
        'HEAT_TREATMENT',
        item.id,
        `${item.item_name} produced - Auto-populated`
      ]);
      
      inserted++;
      console.log(`  ✓ Created RECEIPT: ${item.item_name} - ${item.quantity} bags @ ₹${rate}`);
    }
    
    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n=== SUMMARY ===');
    console.log(`New Transactions Created: ${inserted}`);
    
    const total = await query('SELECT COUNT(*) as count FROM stock_transactions');
    console.log(`Total Stock Transactions: ${total.rows[0].count}`);
    
    const byType = await query(`
      SELECT 
        transaction_type, 
        reference_type,
        COUNT(*) as count 
      FROM stock_transactions 
      GROUP BY transaction_type, reference_type
      ORDER BY transaction_type, reference_type
    `);
    console.log('\nTransactions by Type:');
    console.table(byType.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
