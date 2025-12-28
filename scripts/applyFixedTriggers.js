const { query } = require('../config/database');
const fs = require('fs');

(async () => {
  try {
    console.log('=== APPLYING CORRECTED STOCK TRANSACTION TRIGGERS ===\n');
    
    const sql = fs.readFileSync('database/stock_transaction_triggers.sql', 'utf8');
    
    await query(sql);
    
    console.log('✅ Triggers updated successfully!\n');
    
    // Verify triggers
    const triggers = await query(`
      SELECT trigger_name, event_object_table, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_name LIKE '%stock%'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log('Active Stock Triggers:');
    console.table(triggers.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
