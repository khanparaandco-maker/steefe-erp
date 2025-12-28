const { query } = require('../config/database');

(async () => {
  try {
    const r = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scrap_grn_items'
      ORDER BY ordinal_position
    `);
    console.log('scrap_grn_items columns:');
    console.table(r.rows);

    // Also check melting_processes table
    const mp = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'melting_processes'
      ORDER BY ordinal_position
    `);
    console.log('\nmelting_processes columns:');
    console.table(mp.rows);

    // Check heat_treatment table
    const ht = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'heat_treatment'
      ORDER BY ordinal_position
    `);
    console.log('\nheat_treatment columns:');
    console.table(ht.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
