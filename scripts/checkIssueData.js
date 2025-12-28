const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== CHECKING ISSUE DATA SOURCES ===\n');
    
    // Check Melting Processes
    console.log('1. MELTING PROCESSES:');
    const melting = await query(`
      SELECT * FROM melting_processes 
      ORDER BY melting_date DESC 
      LIMIT 5
    `);
    console.table(melting.rows);
    console.log(`Total Melting Records: ${melting.rows.length}\n`);
    
    // Check Heat Treatment
    console.log('2. HEAT TREATMENT:');
    const heatTreatment = await query(`
      SELECT * FROM heat_treatment 
      ORDER BY treatment_date DESC 
      LIMIT 5
    `);
    console.table(heatTreatment.rows);
    console.log(`Total Heat Treatment Records: ${heatTreatment.rows.length}\n`);
    
    // Check Dispatch Items
    console.log('3. DISPATCH ITEMS:');
    const dispatchItems = await query(`
      SELECT 
        di.*,
        d.dispatch_date,
        i.item_name
      FROM dispatch_items di
      JOIN dispatches d ON di.dispatch_id = d.id
      LEFT JOIN items i ON di.item_id = i.id
      ORDER BY d.dispatch_date DESC
      LIMIT 5
    `);
    console.table(dispatchItems.rows);
    console.log(`Total Dispatch Items: ${dispatchItems.rows.length}\n`);
    
    // Check current stock transactions for ISSUE type
    const issues = await query(`
      SELECT 
        st.*,
        i.item_name
      FROM stock_transactions st
      LEFT JOIN items i ON st.item_id = i.id
      WHERE transaction_type = 'ISSUE'
      ORDER BY transaction_date DESC
    `);
    console.log('4. CURRENT ISSUE TRANSACTIONS:');
    console.table(issues.rows);
    console.log(`Total Issue Transactions: ${issues.rows.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
