const { query } = require('../config/database');

async function checkAdminPermissions() {
  try {
    console.log('Checking admin user (id=1) permissions...\n');
    
    // Get admin user info
    const userResult = await query('SELECT id, username, email FROM users WHERE id = 1');
    console.log('Admin user:', userResult.rows[0]);
    
    // Get admin roles
    const rolesResult = await query(`
      SELECT r.id, r.role_name 
      FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = 1
    `);
    console.log('\nAdmin roles:', rolesResult.rows);
    
    // Get admin permissions via function
    const permsResult = await query('SELECT * FROM get_user_permissions($1)', [1]);
    console.log(`\nTotal permissions: ${permsResult.rows.length}`);
    console.log('\nUser Management related permissions:');
    const userMgmt = permsResult.rows.filter(p => 
      p.module_name.includes('User') || p.parent_module === 'Users'
    );
    console.table(userMgmt);
    
    // Check if there are ANY role-based permissions for User Management module
    const rolePerms = await query(`
      SELECT r.role_name, m.module_name, p.can_view, p.can_edit, p.can_delete
      FROM permissions p
      JOIN roles r ON p.role_id = r.id
      JOIN modules m ON p.module_id = m.id
      WHERE m.module_name IN ('Users', 'User Management', 'Manage Permissions')
      ORDER BY r.role_name, m.module_name
    `);
    console.log('\nRole-based permissions for User modules:');
    console.table(rolePerms.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminPermissions();
