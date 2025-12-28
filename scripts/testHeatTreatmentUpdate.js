const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function testHeatTreatmentUpdate() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Step 1: Check if WIP item exists ===');
        const wipCheck = await client.query(`
            SELECT id, item_name FROM items WHERE id = 9
        `);
        
        if (wipCheck.rows.length === 0) {
            console.log('❌ WIP item (id=9) does NOT exist!');
        } else {
            console.log('✓ WIP item exists:', wipCheck.rows[0]);
        }
        
        console.log('\n=== Step 2: Check heat_treatment table structure ===');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'heat_treatment'
            ORDER BY ordinal_position
        `);
        
        console.log('Heat Treatment Columns:');
        columns.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n=== Step 3: Get existing heat treatment records ===');
        const records = await client.query(`
            SELECT * FROM heat_treatment ORDER BY id
        `);
        
        console.log(`Found ${records.rows.length} heat treatment records:`);
        records.rows.forEach(r => {
            console.log(`  ID: ${r.id}, Date: ${r.treatment_date?.toISOString().split('T')[0]}, Furnace: ${r.furnace_no}, Bags: ${r.bags_produced}, Item: ${r.size_item_id}`);
        });
        
        console.log('\n=== Step 4: Test UPDATE query directly ===');
        if (records.rows.length > 0) {
            const testId = records.rows[0].id;
            console.log(`Testing UPDATE on heat_treatment id=${testId}...`);
            
            try {
                await client.query('BEGIN');
                
                const result = await client.query(`
                    UPDATE heat_treatment
                    SET 
                        bags_produced = bags_produced,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING id
                `, [testId]);
                
                console.log('✓ UPDATE successful:', result.rows[0]);
                
                await client.query('ROLLBACK'); // Don't actually commit the test
                console.log('✓ Test rolled back (no changes made)');
                
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('❌ UPDATE failed:', error.message);
                console.error('Error detail:', error.detail);
                console.error('Error hint:', error.hint);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

testHeatTreatmentUpdate();
