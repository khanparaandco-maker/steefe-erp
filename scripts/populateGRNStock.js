const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== POPULATING STOCK TRANSACTIONS FROM EXISTING GRN DATA ===\n');
    
    // Get all GRN items with their dates
    const grnItems = await query(`
      SELECT 
        gi.id,
        g.invoice_date,
        gi.item_id,
        gi.quantity,
        gi.rate,
        gi.amount,
        gi.grn_id,
        i.item_name
      FROM scrap_grn_items gi
      JOIN scrap_grn g ON gi.grn_id = g.id
      JOIN items i ON gi.item_id = i.id
      ORDER BY g.invoice_date, gi.id
    `);
    
    console.log(`Found ${grnItems.rows.length} GRN items to process\n`);
    
    let inserted = 0;
    
    for (const item of grnItems.rows) {
      // Check if already exists
      const existing = await query(`
        SELECT id FROM stock_transactions 
        WHERE reference_type = 'GRN' 
        AND reference_id = $1
      `, [item.id]);
      
      if (existing.rows.length > 0) {
        console.log(`✓ GRN Item ${item.id} already has stock transaction`);
        continue;
      }
      
      // Insert stock transaction
      await query(`
        INSERT INTO stock_transactions (
          transaction_date, 
          transaction_type, 
          item_id, 
          quantity, 
          rate, 
          amount, 
          reference_type, 
          reference_id, 
          remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        item.invoice_date,
        'RECEIPT',
        item.item_id,
        item.quantity,
        item.rate,
        item.amount,
        'GRN',
        item.id,
        `Auto-populated from GRN Item ${item.id} - ${item.item_name}`
      ]);
      
      inserted++;
      console.log(`✓ Created RECEIPT for ${item.item_name}: ${item.quantity} @ ${item.rate}`);
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total GRN Items: ${grnItems.rows.length}`);
    console.log(`New Transactions Created: ${inserted}`);
    
    // Verify
    const total = await query('SELECT COUNT(*) as count FROM stock_transactions');
    console.log(`Total Stock Transactions: ${total.rows[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
