const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function updatePermissionsFunction() {
  try {
    console.log('Updating get_user_permissions function...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'update_permissions_function.sql'),
      'utf8'
    );
    
    await query(sql);
    
    console.log('✓ Function updated successfully!');
    console.log('\nTesting with user 7 (should show custom permissions):');
    
    const result = await query('SELECT * FROM get_user_permissions($1)', [7]);
    console.table(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePermissionsFunction();
