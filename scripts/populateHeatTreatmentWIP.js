const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function populateHeatTreatmentWIPConsumption() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('\n=== Step 1: Getting Heat Treatment Records ===');
        
        const htRecords = await client.query(`
            SELECT 
                ht.id,
                ht.treatment_date,
                ht.bags_produced,
                ht.size_item_id,
                i.item_name
            FROM heat_treatment ht
            JOIN items i ON i.id = ht.size_item_id
            ORDER BY ht.treatment_date
        `);
        
        console.log(`Found ${htRecords.rows.length} heat treatment records`);
        
        console.log('\n=== Step 2: Getting WIP Average Rate ===');
        
        const wipRateResult = await client.query(`
            SELECT AVG(rate) as avg_rate
            FROM stock_transactions
            WHERE item_id = 9 AND transaction_type = 'RECEIPT' AND reference_type = 'MELTING_OUTPUT'
        `);
        
        const wipRate = parseFloat(wipRateResult.rows[0].avg_rate) || 30.00;
        console.log(`WIP Average Rate: ₹${wipRate.toFixed(2)}/kg`);
        
        console.log('\n=== Step 3: Deleting Old Heat Treatment Stock Transactions ===');
        
        const deleted = await client.query(`
            DELETE FROM stock_transactions
            WHERE reference_type = 'HEAT_TREATMENT'
        `);
        
        console.log(`Deleted ${deleted.rowCount} old heat treatment transactions`);
        
        console.log('\n=== Step 4: Creating New WIP ISSUE and FG RECEIPT Transactions ===');
        
        for (const ht of htRecords.rows) {
            const qtyKg = ht.bags_produced * 25;
            
            console.log(`\nProcessing Heat Treatment ID ${ht.id} (${ht.treatment_date.toISOString().split('T')[0]}):`);
            console.log(`  ${ht.bags_produced} bags × 25 kg = ${qtyKg} kg`);
            
            // 1. ISSUE WIP
            const wipAmount = qtyKg * wipRate;
            await client.query(`
                INSERT INTO stock_transactions
                (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                VALUES ($1, 'ISSUE', 9, $2, $3, $4, 'HEAT_TREATMENT', $5, $6)
            `, [
                ht.treatment_date,
                qtyKg,
                wipRate,
                wipAmount,
                ht.id,
                `WIP consumed in Heat Treatment - ${ht.bags_produced} bags`
            ]);
            
            console.log(`  ✓ WIP ISSUE: ${qtyKg} kg @ ₹${wipRate.toFixed(2)} = ₹${wipAmount.toFixed(2)}`);
            
            // 2. RECEIPT Finished Goods
            // Use WIP cost as base for finished goods
            const fgRate = 50.00; // Default rate from order
            const fgAmount = qtyKg * fgRate;
            
            await client.query(`
                INSERT INTO stock_transactions
                (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, reference_id, remarks)
                VALUES ($1, 'RECEIPT', $2, $3, $4, $5, 'HEAT_TREATMENT', $6, $7)
            `, [
                ht.treatment_date,
                ht.size_item_id,
                qtyKg,
                fgRate,
                fgAmount,
                ht.id,
                `Heat Treatment - ${ht.bags_produced} bags × 25 kg = ${qtyKg} kg`
            ]);
            
            console.log(`  ✓ ${ht.item_name} RECEIPT: ${qtyKg} kg @ ₹${fgRate.toFixed(2)} = ₹${fgAmount.toFixed(2)}`);
        }
        
        console.log('\n=== Step 5: Verifying Transactions ===');
        
        const verification = await client.query(`
            SELECT 
                i.item_name,
                st.transaction_type,
                COUNT(*) as count,
                SUM(st.quantity) as total_qty,
                SUM(st.amount) as total_amount
            FROM stock_transactions st
            JOIN items i ON i.id = st.item_id
            WHERE st.reference_type = 'HEAT_TREATMENT'
            GROUP BY i.item_name, st.transaction_type
            ORDER BY i.item_name, st.transaction_type
        `);
        
        console.log('\nHeat Treatment Stock Transactions:');
        verification.rows.forEach(row => {
            console.log(`  ${row.item_name} (${row.transaction_type}): ${row.count} txns, ${parseFloat(row.total_qty).toFixed(2)} kg, ₹${parseFloat(row.total_amount).toFixed(2)}`);
        });
        
        await client.query('COMMIT');
        console.log('\n✅ Successfully populated heat treatment WIP consumption!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        console.error(error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

populateHeatTreatmentWIPConsumption();
