const { query } = require('../config/database');

(async () => {
  try {
    // Check dispatch_items structure
    const cols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dispatch_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('=== DISPATCH_ITEMS COLUMNS ===');
    console.table(cols.rows);
    
    // Get sample data
    const data = await query('SELECT * FROM dispatch_items LIMIT 3');
    console.log('\n=== SAMPLE DISPATCH ITEMS ===');
    console.table(data.rows);
    
    // Check dispatches table
    const dispatches = await query(`
      SELECT * FROM dispatches 
      ORDER BY dispatch_date DESC 
      LIMIT 3
    `);
    console.log('\n=== SAMPLE DISPATCHES ===');
    console.table(dispatches.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
