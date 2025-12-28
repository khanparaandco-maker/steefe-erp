const { query } = require('./config/database');

async function testHeatTreatment() {
  try {
    // Check if table exists
    console.log('1. Checking if heat_treatment table exists...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'heat_treatment'
      )
    `);
    console.log('Table exists:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('\n❌ heat_treatment table does NOT exist!');
      console.log('Solution: Run the schema creation script');
      process.exit(1);
    }

    // Check table structure
    console.log('\n2. Checking table structure...');
    const structure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'heat_treatment'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', structure.rows);

    // Check if there are any finished products
    console.log('\n3. Checking for Finished Product items...');
    const finishedProducts = await query(`
      SELECT i.id, i.item_name, c.category_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE c.category_name = 'Finished Product'
      LIMIT 5
    `);
    console.log('Finished Products found:', finishedProducts.rows.length);
    if (finishedProducts.rows.length > 0) {
      console.log('Sample:', finishedProducts.rows);
    } else {
      console.log('⚠️ No Finished Product items found!');
    }

    // Test a simple insert
    console.log('\n4. Testing insert with sample data...');
    if (finishedProducts.rows.length > 0) {
      const testItem = finishedProducts.rows[0];
      try {
        const insertResult = await query(`
          INSERT INTO heat_treatment (
            treatment_date, furnace_no, size_item_id, time_in, time_out, temperature, bags_produced
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, ['2025-12-01', 1, testItem.id, '08:00', '16:00', 850, 10]);
        
        console.log('✅ Insert successful! ID:', insertResult.rows[0].id);
        
        // Clean up test record
        await query('DELETE FROM heat_treatment WHERE id = $1', [insertResult.rows[0].id]);
        console.log('✅ Test record cleaned up');
      } catch (insertError) {
        console.error('❌ Insert failed:', insertError.message);
        console.error('Full error:', insertError);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testHeatTreatment();
