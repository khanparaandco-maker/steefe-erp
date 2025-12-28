const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function testRawMaterialQuery() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Testing Raw Material Stock Query ===\n');
        
        const queryText = `
          SELECT 
            i.id,
            i.item_name,
            c.category_name,
            u.uom_short_name as uom_name,
            COALESCE(grn.total_received, 0) as total_received,
            COALESCE(
              CASE 
                WHEN i.item_name = 'MS Scrap' THEN (SELECT COALESCE(SUM(scrap_total), 0) FROM melting_processes)
                WHEN i.item_name = 'CARBON' THEN (SELECT COALESCE(SUM(carbon), 0) FROM melting_processes)
                WHEN i.item_name = 'MANGANESE' THEN (SELECT COALESCE(SUM(manganese), 0) FROM melting_processes)
                WHEN i.item_name = 'SILICON' THEN (SELECT COALESCE(SUM(silicon), 0) FROM melting_processes)
                WHEN i.item_name = 'ALUMINIUM' THEN (SELECT COALESCE(SUM(aluminium), 0) FROM melting_processes)
                WHEN i.item_name = 'CALCIUM' THEN (SELECT COALESCE(SUM(calcium), 0) FROM melting_processes)
                ELSE 0
              END, 0
            ) as total_consumed,
            COALESCE(grn.total_received, 0) - COALESCE(
              CASE 
                WHEN i.item_name = 'MS Scrap' THEN (SELECT COALESCE(SUM(scrap_total), 0) FROM melting_processes)
                WHEN i.item_name = 'CARBON' THEN (SELECT COALESCE(SUM(carbon), 0) FROM melting_processes)
                WHEN i.item_name = 'MANGANESE' THEN (SELECT COALESCE(SUM(manganese), 0) FROM melting_processes)
                WHEN i.item_name = 'SILICON' THEN (SELECT COALESCE(SUM(silicon), 0) FROM melting_processes)
                WHEN i.item_name = 'ALUMINIUM' THEN (SELECT COALESCE(SUM(aluminium), 0) FROM melting_processes)
                WHEN i.item_name = 'CALCIUM' THEN (SELECT COALESCE(SUM(calcium), 0) FROM melting_processes)
                ELSE 0
              END, 0
            ) as current_stock
          FROM items i
          LEFT JOIN categories c ON i.category_id = c.id
          LEFT JOIN uom u ON i.uom_id = u.id
          LEFT JOIN (
            SELECT item_id, SUM(quantity) as total_received
            FROM scrap_grn_items
            GROUP BY item_id
          ) grn ON i.id = grn.item_id
          WHERE c.category_name IN ('Raw Material', 'Minerals')
          ORDER BY i.item_name
        `;
        
        const result = await client.query(queryText);
        
        console.log(`Found ${result.rows.length} raw material items:\n`);
        
        console.log('Item Name                | Category      | Received  | Consumed | Current Stock');
        console.log('------------------------ | ------------- | --------- | -------- | -------------');
        
        result.rows.forEach(row => {
            const itemName = row.item_name.padEnd(24);
            const category = row.category_name.padEnd(13);
            const received = parseFloat(row.total_received || 0).toFixed(2).padStart(9);
            const consumed = parseFloat(row.total_consumed || 0).toFixed(2).padStart(8);
            const stock = parseFloat(row.current_stock || 0).toFixed(2).padStart(13);
            
            console.log(`${itemName} | ${category} | ${received} | ${consumed} | ${stock}`);
        });
        
        if (result.rows.length > 0) {
            console.log('\n✅ Query executed successfully!');
        } else {
            console.log('\n⚠️ No raw material items found. Check if items exist with Raw Material or Minerals category.');
        }
        
    } catch (error) {
        console.error('\n❌ Query Error:', error.message);
        console.error('Error details:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

testRawMaterialQuery();
