const { query } = require('../config/database');

(async () => {
  try {
    // Check what GRN tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%grn%'
    `);
    console.log('GRN-related tables:');
    console.table(tables.rows);

    // Check scrap_grn structure
    const grnCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scrap_grn'
      ORDER BY ordinal_position
    `);
    console.log('\nscrap_grn columns:');
    console.table(grnCols.rows);

    // Check if there's a GRN items table
    const itemsTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%grn%item%' OR table_name LIKE '%item%grn%')
    `);
    console.log('\nGRN Items tables:');
    console.table(itemsTables.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
