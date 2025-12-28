const { query } = require('../config/database');

async function checkPermissions() {
  try {
    // Check Stock Movement module
    console.log('=== CHECKING STOCK MOVEMENT MODULE ===');
    const modules = await query(
      "SELECT * FROM modules WHERE module_name = 'Stock Movement' OR module_name LIKE '%Stock%'"
    );
    console.log('Stock-related modules:');
    console.table(modules.rows);

    // Check admin user permissions
    console.log('\n=== CHECKING ADMIN USER PERMISSIONS ===');
    const adminUser = await query(
      "SELECT * FROM users WHERE username = 'admin'"
    );
    console.log('Admin user:');
    console.table(adminUser.rows);

    if (adminUser.rows.length > 0) {
      const userId = adminUser.rows[0].id;
      
      // Check user roles
      const userRoles = await query(
        `SELECT ur.*, r.role_name 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = $1`,
        [userId]
      );
      console.log('\nAdmin user roles:');
      console.table(userRoles.rows);

      // Check specific permissions for Stock Movement
      if (modules.rows.length > 0) {
        const moduleId = modules.rows[0].id;
        const permissions = await query(
          `SELECT * FROM user_roles WHERE user_id = $1 AND module_id = $2`,
          [userId, moduleId]
        );
        console.log('\nAdmin permissions for Stock Movement:');
        console.table(permissions.rows);
      }

      // Check all permissions for admin
      const allPermissions = await query(
        `SELECT ur.*, m.module_name, m.parent_id, r.role_name
         FROM user_roles ur 
         JOIN modules m ON ur.module_id = m.id
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1
         ORDER BY m.module_name`,
        [userId]
      );
      console.log('\nAll admin permissions:');
      console.table(allPermissions.rows);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

checkPermissions();
