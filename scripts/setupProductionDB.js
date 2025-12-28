require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/database');

/**
 * Complete database setup for production
 * Runs all schema files and creates admin user
 */
async function setupProductionDB() {
  console.log('=================================');
  console.log('PRODUCTION DATABASE SETUP');
  console.log('=================================\n');
  
  try {
    // 1. Run main schema
    console.log('1. Running main schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✓ Main schema created\n');
    
    // 2. Run user management schema
    console.log('2. Running user_management_schema.sql...');
    const userSchemaPath = path.join(__dirname, '..', 'database', 'user_management_schema.sql');
    const userSchema = fs.readFileSync(userSchemaPath, 'utf8');
    await pool.query(userSchema);
    console.log('✓ User management schema created\n');
    
    // 3. Update admin password to admin123
    console.log('3. Creating admin user with password: admin123...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await query(
      `UPDATE users SET password_hash = $1 WHERE username = 'admin'`,
      [hashedPassword]
    );
    console.log('✓ Admin password updated\n');
    
    // 4. Verify admin user
    const adminUser = await query(
      `SELECT id, username, email, first_name, last_name FROM users WHERE username = 'admin'`
    );
    
    if (adminUser.rows.length > 0) {
      console.log('✓ Admin user verified:');
      console.log('  ', adminUser.rows[0]);
    }
    
    console.log('\n=================================');
    console.log('DATABASE SETUP COMPLETE!');
    console.log('=================================');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('=================================\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    console.error('Stack:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  setupProductionDB();
}

module.exports = setupProductionDB;
