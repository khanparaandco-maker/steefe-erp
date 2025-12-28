require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const { seedDefaultData } = require('./seedDefaultData');

/**
 * Initialize database by running schema.sql and seeding default data
 */
async function initDatabase() {
  console.log('Starting database initialization...');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✓ Database schema created successfully!');
    console.log('✓ Sample data inserted for UOM, Categories, and GST Rates.');
    
    // Seed default mineral items
    console.log('\nSeeding default mineral items...');
    await seedDefaultData();
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  require('dotenv').config();
  initDatabase();
}

module.exports = initDatabase;
