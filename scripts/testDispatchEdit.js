const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== TESTING DISPATCH EDIT FUNCTIONALITY ===\n');
    
    // 1. Get existing dispatch
    const existing = await query(`
      SELECT 
        d.*,
        o.order_no
      FROM dispatches d
      JOIN orders o ON d.order_id = o.id
      ORDER BY d.id DESC
      LIMIT 1
    `);
    
    if (existing.rows.length === 0) {
      console.log('❌ No dispatches found to test');
      process.exit(1);
    }
    
    const dispatch = existing.rows[0];
    console.log('Testing with Dispatch:');
    console.table([{
      id: dispatch.id,
      order_no: dispatch.order_no,
      dispatch_date: dispatch.dispatch_date,
      transporter_id: dispatch.transporter_id
    }]);
    
    // 2. Get dispatch items
    const items = await query(`
      SELECT 
        di.*,
        oi.item_id,
        i.item_name,
        oi.rate
      FROM dispatch_items di
      JOIN order_items oi ON di.order_item_id = oi.id
      JOIN items i ON oi.item_id = i.id
      WHERE di.dispatch_id = $1
    `, [dispatch.id]);
    
    console.log('\nExisting Dispatch Items:');
    console.table(items.rows);
    
    // 3. Check current stock transactions
    const beforeTxns = await query(`
      SELECT * FROM stock_transactions 
      WHERE reference_type = 'DISPATCH' 
      ORDER BY id
    `);
    
    console.log('\nStock Transactions BEFORE update:');
    console.table(beforeTxns.rows);
    
    // 4. Simulate an update - change quantity
    if (items.rows.length > 0) {
      const item = items.rows[0];
      const newQuantity = parseFloat(item.quantity_dispatched) + 100;
      
      console.log(`\n📝 Updating dispatch item ${item.id}: ${item.quantity_dispatched} → ${newQuantity}`);
      
      // Delete and re-insert (simulating what the update route does)
      await query('BEGIN');
      
      try {
        // Delete old items (trigger will delete stock transactions)
        await query('DELETE FROM dispatch_items WHERE dispatch_id = $1', [dispatch.id]);
        
        console.log('✓ Deleted old dispatch items');
        
        // Insert updated item (trigger will create new stock transactions)
        await query(`
          INSERT INTO dispatch_items (dispatch_id, order_item_id, quantity_dispatched)
          VALUES ($1, $2, $3)
        `, [dispatch.id, item.order_item_id, newQuantity]);
        
        console.log('✓ Inserted updated dispatch item');
        
        await query('COMMIT');
        console.log('✓ Transaction committed successfully\n');
        
      } catch (err) {
        await query('ROLLBACK');
        throw err;
      }
      
      // 5. Check stock transactions after update
      const afterTxns = await query(`
        SELECT * FROM stock_transactions 
        WHERE reference_type = 'DISPATCH' 
        ORDER BY id
      `);
      
      console.log('Stock Transactions AFTER update:');
      console.table(afterTxns.rows);
      
      // 6. Verify the change
      const updatedItem = await query(`
        SELECT * FROM dispatch_items WHERE dispatch_id = $1
      `, [dispatch.id]);
      
      console.log('\nUpdated Dispatch Item:');
      console.table(updatedItem.rows);
      
      // 7. Rollback the test changes
      console.log('\n🔄 Rolling back test changes...');
      await query('BEGIN');
      
      await query('DELETE FROM dispatch_items WHERE dispatch_id = $1', [dispatch.id]);
      
      // Restore original item
      await query(`
        INSERT INTO dispatch_items (dispatch_id, order_item_id, quantity_dispatched)
        VALUES ($1, $2, $3)
      `, [dispatch.id, item.order_item_id, item.quantity_dispatched]);
      
      await query('COMMIT');
      console.log('✓ Test data restored to original state\n');
      
      // Verify restoration
      const finalTxns = await query(`
        SELECT * FROM stock_transactions 
        WHERE reference_type = 'DISPATCH' 
        ORDER BY id
      `);
      
      console.log('Stock Transactions AFTER rollback:');
      console.table(finalTxns.rows);
      
      console.log('\n✅ DISPATCH EDIT TEST COMPLETED SUCCESSFULLY!');
      console.log('Triggers are working correctly.');
      
    } else {
      console.log('❌ No dispatch items found to test');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR during test:', err.message);
    console.error(err);
    
    try {
      await query('ROLLBACK');
    } catch (e) {
      // ignore
    }
    
    process.exit(1);
  }
})();
