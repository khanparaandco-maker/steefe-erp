const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'steelmelt_erp',
  user: 'steelmelt_user',
  password: 'steelmelt_password_2024',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running migration: Add user_id to permissions table...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migration_add_user_permissions.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✓ Migration completed successfully!');
    
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
