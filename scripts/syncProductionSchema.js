require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function syncMissingSchemas() {
  console.log('=================================');
  console.log('SYNCING MISSING SCHEMAS TO PRODUCTION');
  console.log('=================================\n');
  
  try {
    // 1. Add missing column to modules table
    console.log('1. Adding description column to modules table...');
    try {
      await pool.query(`
        ALTER TABLE modules 
        ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      console.log('✓ Description column added to modules\n');
    } catch (err) {
      console.log('⚠️  Description column already exists or error:', err.message, '\n');
    }
    
    // 2. Add missing column to permissions table
    console.log('2. Adding user_id column to permissions table...');
    try {
      await pool.query(`
        ALTER TABLE permissions 
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
      `);
      console.log('✓ User_id column added to permissions\n');
    } catch (err) {
      console.log('⚠️  User_id column already exists or error:', err.message, '\n');
    }
    
    // 3. Add missing column to user_sessions table
    console.log('3. Adding updated_at column to user_sessions table...');
    try {
      await pool.query(`
        ALTER TABLE user_sessions 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✓ Updated_at column added to user_sessions\n');
    } catch (err) {
      console.log('⚠️  Updated_at column already exists or error:', err.message, '\n');
    }
    
    // 4. Run company_settings schema
    console.log('4. Creating company_settings table...');
    const companySchemaPath = path.join(__dirname, '..', 'database', 'company_settings_schema.sql');
    if (fs.existsSync(companySchemaPath)) {
      const companySchema = fs.readFileSync(companySchemaPath, 'utf8');
      await pool.query(companySchema);
      console.log('✓ Company settings schema loaded\n');
    } else {
      console.log('⚠️  company_settings_schema.sql not found\n');
    }
    
    // 5. Run heat_treatment schema
    console.log('5. Creating heat_treatment table...');
    const heatSchemaPath = path.join(__dirname, '..', 'database', 'heat_treatment_schema.sql');
    if (fs.existsSync(heatSchemaPath)) {
      const heatSchema = fs.readFileSync(heatSchemaPath, 'utf8');
      await pool.query(heatSchema);
      console.log('✓ Heat treatment schema loaded\n');
    } else {
      console.log('⚠️  heat_treatment_schema.sql not found\n');
    }
    
    // 6. Run melting_process schema
    console.log('6. Creating melting_processes tables...');
    const meltingSchemaPath = path.join(__dirname, '..', 'database', 'melting_process_schema.sql');
    if (fs.existsSync(meltingSchemaPath)) {
      const meltingSchema = fs.readFileSync(meltingSchemaPath, 'utf8');
      await pool.query(meltingSchema);
      console.log('✓ Melting process schema loaded\n');
    } else {
      console.log('⚠️  melting_process_schema.sql not found\n');
    }
    
    // 7. Run scrap_grn schema
    console.log('7. Creating scrap_grn tables...');
    const scrapSchemaPath = path.join(__dirname, '..', 'database', 'scrap_grn_schema.sql');
    if (fs.existsSync(scrapSchemaPath)) {
      const scrapSchema = fs.readFileSync(scrapSchemaPath, 'utf8');
      await pool.query(scrapSchema);
      console.log('✓ Scrap GRN schema loaded\n');
    } else {
      console.log('⚠️  scrap_grn_schema.sql not found\n');
    }
    
    // 8. Run stock_statement schema (includes stock_transactions)
    console.log('8. Creating stock_transactions table...');
    const stockSchemaPath = path.join(__dirname, '..', 'database', 'stock_statement_schema.sql');
    if (fs.existsSync(stockSchemaPath)) {
      const stockSchema = fs.readFileSync(stockSchemaPath, 'utf8');
      await pool.query(stockSchema);
      console.log('✓ Stock statement schema loaded\n');
    } else {
      console.log('⚠️  stock_statement_schema.sql not found\n');
    }
    
    // 9. Apply stock triggers
    console.log('9. Applying stock transaction triggers...');
    const triggersPath = path.join(__dirname, '..', 'database', 'stock_transaction_triggers.sql');
    if (fs.existsSync(triggersPath)) {
      const triggers = fs.readFileSync(triggersPath, 'utf8');
      await pool.query(triggers);
      console.log('✓ Stock triggers applied\n');
    } else {
      console.log('⚠️  stock_transaction_triggers.sql not found\n');
    }
    
    console.log('=================================');
    console.log('SCHEMA SYNC COMPLETE!');
    console.log('=================================\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error syncing schemas:', error);
    console.error('Stack:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

syncMissingSchemas();
