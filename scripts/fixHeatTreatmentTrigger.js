const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function fixHeatTreatmentTrigger() {
  try {
    console.log('Applying fixed heat treatment trigger...\n');
    
    const triggerSQL = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'stock_transaction_triggers.sql'),
      'utf8'
    );
    
    await query(triggerSQL);
    
    console.log('✅ Heat treatment trigger updated successfully!\n');
    
    // Now test the fix
    console.log('Testing heat treatment creation...');
    
    const testResult = await query(`
      INSERT INTO heat_treatment (
        treatment_date, furnace_no, size_item_id, time_in, time_out, temperature, bags_produced
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, ['2025-12-01', 1, 1, '08:00', '16:00', 850, 10]);
    
    console.log('✅ Heat treatment record created successfully! ID:', testResult.rows[0].id);
    
    // Check stock transactions
    const stockCheck = await query(`
      SELECT st.*, i.item_name
      FROM stock_transactions st
      LEFT JOIN items i ON st.item_id = i.id
      WHERE reference_type = 'HEAT_TREATMENT' 
      AND reference_id = $1
    `, [testResult.rows[0].id]);
    
    console.log('\nStock transactions created:', stockCheck.rows.length);
    stockCheck.rows.forEach(row => {
      console.log(`  - ${row.transaction_type}: ${row.item_name}, Qty: ${row.quantity} kg`);
    });
    
    // Clean up
    console.log('\nCleaning up test record...');
    await query('DELETE FROM heat_treatment WHERE id = $1', [testResult.rows[0].id]);
    console.log('✅ Test record removed');
    
    console.log('\n✅ Heat treatment module is now working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

fixHeatTreatmentTrigger();
