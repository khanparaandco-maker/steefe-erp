const { query } = require('../config/database');

async function checkStockPermissions() {
  try {
    console.log('=== CHECKING STOCK MOVEMENT PERMISSIONS ===\n');

    // Get Stock Movement module
    const stockModule = await query(
      "SELECT * FROM modules WHERE module_name = 'Stock Movement'"
    );
    
    if (stockModule.rows.length === 0) {
      console.log('❌ Stock Movement module not found!');
      process.exit(1);
    }

    const moduleId = stockModule.rows[0].id;
    console.log('✅ Stock Movement module found:');
    console.table(stockModule.rows);

    // Get Super Admin role
    const superAdminRole = await query(
      "SELECT * FROM roles WHERE role_name = 'Super Admin'"
    );
    
    if (superAdminRole.rows.length === 0) {
      console.log('❌ Super Admin role not found!');
      process.exit(1);
    }

    const roleId = superAdminRole.rows[0].id;
    console.log('\n✅ Super Admin role found:');
    console.table(superAdminRole.rows);

    // Check if permissions exist for Stock Movement
    const permissions = await query(
      `SELECT * FROM permissions WHERE module_id = $1 AND role_id = $2`,
      [moduleId, roleId]
    );

    console.log('\n📋 Permissions for Super Admin on Stock Movement:');
    if (permissions.rows.length === 0) {
      console.log('❌ NO PERMISSIONS FOUND! This is the problem.');
      console.log('\n🔧 Creating permissions now...');
      
      const insertResult = await query(
        `INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
         VALUES ($1, $2, TRUE, TRUE, TRUE, TRUE)
         RETURNING *`,
        [roleId, moduleId]
      );
      
      console.log('✅ Permissions created:');
      console.table(insertResult.rows);
    } else {
      console.log('✅ Permissions exist:');
      console.table(permissions.rows);
    }

    // Test the permission check function
    console.log('\n🧪 Testing permission check function...');
    const testResult = await query(
      "SELECT check_user_permission(1, 'Stock Movement', 'view') as can_view",
    );
    console.log('Can admin user view Stock Movement?', testResult.rows[0].can_view);

    // Get all permissions for Super Admin
    console.log('\n📊 All permissions for Super Admin role:');
    const allPermissions = await query(
      `SELECT p.*, m.module_name, pm.module_name as parent_module
       FROM permissions p
       JOIN modules m ON p.module_id = m.id
       LEFT JOIN modules pm ON m.parent_module_id = pm.id
       WHERE p.role_id = $1
       ORDER BY pm.module_name, m.module_name`,
      [roleId]
    );
    console.table(allPermissions.rows);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

checkStockPermissions();
