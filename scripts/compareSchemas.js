require('dotenv').config();
const { Pool } = require('pg');

// Local database connection
const localPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'steelmelt_erp',
  user: process.env.DB_USER || 'steelmelt_user',
  password: String(process.env.DB_PASSWORD || 'steelmelt_password_2024'),
});

// Production database connection
const prodPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getTableStructure(pool, dbName) {
  const query = `
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      c.column_default
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c 
      ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position;
  `;
  
  const result = await pool.query(query);
  
  // Group by table
  const tables = {};
  result.rows.forEach(row => {
    if (!tables[row.table_name]) {
      tables[row.table_name] = [];
    }
    if (row.column_name) {
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        length: row.character_maximum_length,
        nullable: row.is_nullable,
        default: row.column_default
      });
    }
  });
  
  return tables;
}

async function compareSchemas() {
  console.log('=================================');
  console.log('DATABASE SCHEMA COMPARISON');
  console.log('=================================\n');
  
  try {
    console.log('Fetching local database schema...');
    const localTables = await getTableStructure(localPool, 'local');
    console.log(`✓ Local: ${Object.keys(localTables).length} tables found\n`);
    
    console.log('Fetching production database schema...');
    const prodTables = await getTableStructure(prodPool, 'production');
    console.log(`✓ Production: ${Object.keys(prodTables).length} tables found\n`);
    
    console.log('=================================');
    console.log('COMPARISON RESULTS');
    console.log('=================================\n');
    
    // Check for missing tables
    const localTableNames = Object.keys(localTables);
    const prodTableNames = Object.keys(prodTables);
    
    const missingTables = localTableNames.filter(t => !prodTableNames.includes(t));
    const extraTables = prodTableNames.filter(t => !localTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log('❌ MISSING TABLES IN PRODUCTION:');
      missingTables.forEach(table => {
        console.log(`   - ${table} (${localTables[table].length} columns)`);
      });
      console.log('');
    } else {
      console.log('✓ All local tables exist in production\n');
    }
    
    if (extraTables.length > 0) {
      console.log('ℹ️  EXTRA TABLES IN PRODUCTION (not in local):');
      extraTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }
    
    // Check for missing columns in existing tables
    let missingColumns = [];
    const commonTables = localTableNames.filter(t => prodTableNames.includes(t));
    
    commonTables.forEach(tableName => {
      const localCols = localTables[tableName].map(c => c.column);
      const prodCols = prodTables[tableName].map(c => c.column);
      
      const missing = localCols.filter(c => !prodCols.includes(c));
      
      if (missing.length > 0) {
        missingColumns.push({ table: tableName, columns: missing });
      }
    });
    
    if (missingColumns.length > 0) {
      console.log('❌ MISSING COLUMNS IN PRODUCTION:');
      missingColumns.forEach(({ table, columns }) => {
        console.log(`   Table: ${table}`);
        columns.forEach(col => {
          const colDef = localTables[table].find(c => c.column === col);
          console.log(`      - ${col} (${colDef.type})`);
        });
      });
      console.log('');
    } else {
      console.log('✓ All columns match between local and production\n');
    }
    
    // Detailed comparison
    console.log('=================================');
    console.log('TABLE DETAILS');
    console.log('=================================\n');
    
    console.log('LOCAL TABLES:');
    localTableNames.sort().forEach(table => {
      console.log(`  ${table} (${localTables[table].length} columns)`);
    });
    
    console.log('\nPRODUCTION TABLES:');
    prodTableNames.sort().forEach(table => {
      console.log(`  ${table} (${prodTables[table].length} columns)`);
    });
    
    console.log('\n=================================');
    console.log('SUMMARY');
    console.log('=================================');
    console.log(`Missing Tables: ${missingTables.length}`);
    console.log(`Missing Columns: ${missingColumns.reduce((sum, t) => sum + t.columns.length, 0)}`);
    console.log('=================================\n');
    
    await localPool.end();
    await prodPool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error comparing schemas:', error);
    await localPool.end();
    await prodPool.end();
    process.exit(1);
  }
}

compareSchemas();
