const { Pool } = require('pg');

const pool = new Pool({
    user: 'steelmelt_user',
    host: 'localhost',
    database: 'steelmelt_erp',
    password: 'steelmelt_password_2024',
    port: 5432,
});

async function checkDates() {
    const client = await pool.connect();
    
    try {
        console.log('\n=== Melting Process Dates ===');
        const melting = await client.query(`
            SELECT id, melting_date, heat_no FROM melting_processes ORDER BY melting_date
        `);
        melting.rows.forEach(row => {
            console.log(`ID: ${row.id}, Date: ${row.melting_date.toISOString().split('T')[0]}, Heat No: ${row.heat_no}`);
        });
        
        console.log('\n=== Dispatch Dates ===');
        const dispatch = await client.query(`
            SELECT d.id, d.dispatch_date, di.quantity_dispatched
            FROM dispatches d
            JOIN dispatch_items di ON di.dispatch_id = d.id
        `);
        dispatch.rows.forEach(row => {
            console.log(`ID: ${row.id}, Date: ${row.dispatch_date.toISOString().split('T')[0]}, Qty: ${row.quantity_dispatched} kg`);
        });
        
        console.log('\n=== Stock Transactions by Date ===');
        const transactions = await client.query(`
            SELECT 
                transaction_date::DATE as date,
                reference_type,
                COUNT(*) as txn_count
            FROM stock_transactions
            GROUP BY transaction_date::DATE, reference_type
            ORDER BY date, reference_type
        `);
        transactions.rows.forEach(row => {
            console.log(`${row.date.toISOString().split('T')[0]} - ${row.reference_type.padEnd(20)}: ${row.txn_count} txns`);
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkDates();
