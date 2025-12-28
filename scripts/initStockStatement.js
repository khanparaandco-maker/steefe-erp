const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeStockStatement() {
  try {
    console.log('📦 Initializing Stock Statement Schema...\n');

    // Read and execute the schema SQL
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'stock_statement_schema.sql'),
      'utf8'
    );

    console.log('Creating stock_transactions table and functions...');
    await query(schemaSQL);
    console.log('✅ Schema created successfully\n');

    // Insert sample opening stock data
    console.log('Inserting sample opening stock...');
    
    // Get some items from the database
    const itemsResult = await query(`
      SELECT id, item_name FROM items 
      WHERE category_id IN (SELECT id FROM categories WHERE category_name IN ('Raw Material', 'Finished Product'))
      LIMIT 5
    `);

    if (itemsResult.rows.length > 0) {
      for (const item of itemsResult.rows) {
        // Insert opening stock (dated 30 days ago)
        const openingDate = new Date();
        openingDate.setDate(openingDate.getDate() - 30);
        const formattedDate = openingDate.toISOString().split('T')[0];

        await query(
          `INSERT INTO stock_transactions 
           (transaction_date, transaction_type, item_id, quantity, rate, amount, reference_type, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            formattedDate,
            'OPENING',
            item.id,
            Math.floor(Math.random() * 1000) + 100, // Random quantity between 100-1100
            Math.floor(Math.random() * 50) + 10,    // Random rate between 10-60
            0, // Will be calculated by trigger or updated
            'OPENING_STOCK',
            `Opening stock for ${item.item_name}`
          ]
        );
      }
      console.log(`✅ Inserted opening stock for ${itemsResult.rows.length} items\n`);
    }

    // Update amounts based on qty * rate
    await query(`
      UPDATE stock_transactions 
      SET amount = quantity * rate 
      WHERE amount = 0
    `);
    console.log('✅ Updated transaction amounts\n');

    // Test the stock statement function
    console.log('Testing stock statement report...');
    const testStartDate = new Date();
    testStartDate.setDate(testStartDate.getDate() - 30);
    const testEndDate = new Date();
    
    const testResult = await query(
      'SELECT * FROM get_stock_statement_report($1, $2, NULL) LIMIT 5',
      [testStartDate.toISOString().split('T')[0], testEndDate.toISOString().split('T')[0]]
    );

    console.log('📊 Sample Stock Statement Report:');
    console.table(testResult.rows);

    console.log('\n✅ Stock Statement system initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Use POST /api/stock-reports/stock-transactions to add opening stock');
    console.log('2. Use GET /api/stock-reports/stock-statement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD to view reports');
    console.log('3. Optional: Add categoryId parameter to filter by category');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing stock statement:', error);
    process.exit(1);
  }
}

initializeStockStatement();
