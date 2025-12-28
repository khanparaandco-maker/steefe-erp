const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function populateMeltingStockData() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('\n=== Step 1: Getting Current Melting Data ===');
        
        const meltingData = await client.query(`
            SELECT 
                id,
                melting_date,
                heat_no,
                scrap_total,
                carbon,
                manganese,
                silicon,
                aluminium,
                calcium
            FROM melting_processes
            ORDER BY melting_date, id
        `);
        
        console.log(`Found ${meltingData.rows.length} melting process records`);
        
        console.log('\n=== Step 2: Deleting Old MELTING and MELTING_OUTPUT Transactions ===');
        
        const deleted = await client.query(`
            DELETE FROM stock_transactions
            WHERE reference_type IN ('MELTING', 'MELTING_OUTPUT')
        `);
        
        console.log(`Deleted ${deleted.rowCount} old melting-related transactions`);
        
        console.log('\n=== Step 3: Getting Item IDs and Average Rates ===');
        
        // Get item mappings
        const itemMap = {
            ms_scrap: 2,
            carbon: 3,
            manganese: 4,
            silicon: 5,
            aluminium: 6,
            calcium: 7,
            wip: 9
        };
        
        // Get average rates for each material
        const rates = {};
        for (const [name, itemId] of Object.entries(itemMap)) {
            if (name !== 'wip') {
                const rateResult = await client.query(`
                    SELECT AVG(rate) as avg_rate
                    FROM stock_transactions
                    WHERE item_id = $1 AND transaction_type = 'RECEIPT'
                `, [itemId]);
                
                rates[name] = parseFloat(rateResult.rows[0].avg_rate) || 30.00;
                console.log(`  ${name} (item_id ${itemId}): ₹${rates[name].toFixed(2)}/kg`);
            }
        }
        
        console.log('\n=== Step 4: Creating New Stock Transactions ===');
        
        let totalTransactions = 0;
        
        for (const melting of meltingData.rows) {
            console.log(`\nProcessing Heat No ${melting.heat_no} (${melting.melting_date.toISOString().split('T')[0]}):`);
            
            let totalInputCost = 0;
            let totalInputQty = 0;
            
            // 1. MS Scrap ISSUE
            if (melting.scrap_total > 0) {
                const amount = melting.scrap_total * rates.ms_scrap;
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'ISSUE', $2, $3, $4, $5, 'MELTING', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.ms_scrap,
                    melting.scrap_total,
                    rates.ms_scrap,
                    amount,
                    melting.id,
                    `MS Scrap consumed - Heat No: ${melting.heat_no}`
                ]);
                
                totalInputCost += melting.scrap_total * rates.ms_scrap;
                totalInputQty += parseFloat(melting.scrap_total);
                totalTransactions++;
                console.log(`  ✓ MS Scrap: ${melting.scrap_total} kg @ ₹${rates.ms_scrap.toFixed(2)}`);
            }
            
            // 2. Carbon ISSUE
            if (melting.carbon > 0) {
                const amount = melting.carbon * rates.carbon;
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'ISSUE', $2, $3, $4, $5, 'MELTING', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.carbon,
                    melting.carbon,
                    rates.carbon,
                    amount,
                    melting.id,
                    `Carbon consumed - Heat No: ${melting.heat_no}`
                ]);
                
                totalInputCost += melting.carbon * rates.carbon;
                totalInputQty += parseFloat(melting.carbon);
                totalTransactions++;
                console.log(`  ✓ Carbon: ${melting.carbon} kg @ ₹${rates.carbon.toFixed(2)}`);
            }
            
            // 3. Manganese ISSUE
            if (melting.manganese > 0) {
                const amount = melting.manganese * rates.manganese;
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'ISSUE', $2, $3, $4, $5, 'MELTING', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.manganese,
                    melting.manganese,
                    rates.manganese,
                    amount,
                    melting.id,
                    `Manganese consumed - Heat No: ${melting.heat_no}`
                ]);
                
                totalInputCost += melting.manganese * rates.manganese;
                totalInputQty += parseFloat(melting.manganese);
                totalTransactions++;
                console.log(`  ✓ Manganese: ${melting.manganese} kg @ ₹${rates.manganese.toFixed(2)}`);
            }
            
            // 4. Silicon ISSUE
            if (melting.silicon > 0) {
                const amount = melting.silicon * rates.silicon;
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'ISSUE', $2, $3, $4, $5, 'MELTING', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.silicon,
                    melting.silicon,
                    rates.silicon,
                    amount,
                    melting.id,
                    `Silicon consumed - Heat No: ${melting.heat_no}`
                ]);
                
                totalInputCost += melting.silicon * rates.silicon;
                totalInputQty += parseFloat(melting.silicon);
                totalTransactions++;
                console.log(`  ✓ Silicon: ${melting.silicon} kg @ ₹${rates.silicon.toFixed(2)}`);
            }
            
            // 5. Aluminium ISSUE
            if (melting.aluminium > 0) {
                const amount = melting.aluminium * rates.aluminium;
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'ISSUE', $2, $3, $4, $5, 'MELTING', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.aluminium,
                    melting.aluminium,
                    rates.aluminium,
                    amount,
                    melting.id,
                    `Aluminium consumed - Heat No: ${melting.heat_no}`
                ]);
                
                totalInputCost += melting.aluminium * rates.aluminium;
                totalInputQty += parseFloat(melting.aluminium);
                totalTransactions++;
                console.log(`  ✓ Aluminium: ${melting.aluminium} kg @ ₹${rates.aluminium.toFixed(2)}`);
            }
            
            // 6. Calcium ISSUE
            if (melting.calcium > 0) {
                const amount = melting.calcium * rates.calcium;
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'ISSUE', $2, $3, $4, $5, 'MELTING', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.calcium,
                    melting.calcium,
                    rates.calcium,
                    amount,
                    melting.id,
                    `Calcium consumed - Heat No: ${melting.heat_no}`
                ]);
                
                totalInputCost += melting.calcium * rates.calcium;
                totalInputQty += parseFloat(melting.calcium);
                totalTransactions++;
                console.log(`  ✓ Calcium: ${melting.calcium} kg @ ₹${rates.calcium.toFixed(2)}`);
            }
            
            // 7. WIP RECEIPT (output)
            if (totalInputQty > 0) {
                const wipRate = totalInputCost / totalInputQty;
                const wipAmount = totalInputQty * wipRate;
                
                await client.query(`
                    INSERT INTO stock_transactions 
                    (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                    VALUES ($1, 'RECEIPT', $2, $3, $4, $5, 'MELTING_OUTPUT', $6, $7)
                `, [
                    melting.melting_date,
                    itemMap.wip,
                    totalInputQty,
                    wipRate,
                    wipAmount,
                    melting.id,
                    `WIP Output - Heat No: ${melting.heat_no} (Total cost: ₹${totalInputCost.toFixed(2)})`
                ]);
                
                totalTransactions++;
                console.log(`  ✓ WIP Output: ${totalInputQty.toFixed(2)} kg @ ₹${wipRate.toFixed(2)} (Total: ₹${totalInputCost.toFixed(2)})`);
            }
        }
        
        console.log(`\n=== Step 5: Verifying Stock Transactions ===`);
        
        const verification = await client.query(`
            SELECT 
                i.item_name,
                st.transaction_type,
                COUNT(*) as count,
                SUM(st.quantity) as total_qty,
                SUM(st.quantity * st.rate) as total_value
            FROM stock_transactions st
            JOIN items i ON i.id = st.item_id
            WHERE st.reference_type IN ('MELTING', 'MELTING_OUTPUT')
            GROUP BY i.item_name, st.transaction_type
            ORDER BY i.item_name, st.transaction_type
        `);
        
        console.log('\nStock Transaction Summary:');
        verification.rows.forEach(row => {
            console.log(`  ${row.item_name} (${row.transaction_type}): ${row.count} txns, ${parseFloat(row.total_qty).toFixed(2)} kg, ₹${parseFloat(row.total_value).toFixed(2)}`);
        });
        
        await client.query('COMMIT');
        console.log(`\n✅ Successfully created ${totalTransactions} stock transactions!`);
        
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

populateMeltingStockData();
