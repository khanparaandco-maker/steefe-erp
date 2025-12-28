const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function setupWIPandApplyTriggers() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('\n=== Step 1: Creating WIP Item ===');
        
        // Check if WIP item already exists
        const checkWIP = await client.query(`
            SELECT id FROM items WHERE item_name = 'WIP - Work In Progress'
        `);
        
        if (checkWIP.rows.length > 0) {
            console.log('✓ WIP item already exists with ID:', checkWIP.rows[0].id);
        } else {
            // Get WIP category (or create it)
            let categoryResult = await client.query(`
                SELECT id FROM categories WHERE category_name = 'WIP'
            `);
            
            if (categoryResult.rows.length === 0) {
                // Create WIP category
                categoryResult = await client.query(`
                    INSERT INTO categories (category_name, created_at)
                    VALUES ('WIP', NOW())
                    RETURNING id
                `);
                console.log('✓ Created WIP category with ID:', categoryResult.rows[0].id);
            }
            
            const categoryId = categoryResult.rows[0].id;
            
            // Get KG UOM
            const uomResult = await client.query(`
                SELECT id FROM uom WHERE uom_short_name = 'KG'
            `);
            
            const uomId = uomResult.rows[0].id;
            
            // Get a default GST rate
            const gstResult = await client.query(`
                SELECT id FROM gst_rates ORDER BY id LIMIT 1
            `);
            
            const gstRateId = gstResult.rows[0].id;
            
            // Create WIP item
            const wipResult = await client.query(`
                INSERT INTO items (item_name, alias, category_id, uom_id, gst_rate_id, created_at)
                VALUES ('WIP - Work In Progress', 'WIP', $1, $2, $3, NOW())
                RETURNING id
            `, [categoryId, uomId, gstRateId]);
            
            console.log('✓ Created WIP item with ID:', wipResult.rows[0].id);
        }
        
        console.log('\n=== Step 2: Applying Updated Triggers ===');
        
        // Read and execute the trigger file
        const triggerSQL = fs.readFileSync(
            path.join(__dirname, '../database/stock_transaction_triggers.sql'),
            'utf8'
        );
        
        await client.query(triggerSQL);
        console.log('✓ All triggers applied successfully');
        
        console.log('\n=== Step 3: Verifying Trigger Installation ===');
        
        const triggers = await client.query(`
            SELECT trigger_name, event_object_table, action_statement
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            ORDER BY event_object_table, trigger_name
        `);
        
        console.log('\nInstalled Triggers:');
        triggers.rows.forEach(t => {
            console.log(`  - ${t.trigger_name} on ${t.event_object_table}`);
        });
        
        await client.query('COMMIT');
        console.log('\n✅ Setup completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        console.error('Details:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

setupWIPandApplyTriggers();
