const { query } = require('../config/database');

async function restrictUserManagementPermissions() {
  try {
    console.log('Restricting User Management permissions to Super Admin only...\n');
    
    // Get module IDs for Users, User Management, and Manage Permissions
    const modulesResult = await query(`
      SELECT id, module_name 
      FROM modules 
      WHERE module_name IN ('Users', 'User Management', 'Manage Permissions')
    `);
    console.log('Target modules:', modulesResult.rows);
    
    const userModuleIds = modulesResult.rows.map(m => m.id);
    
    // Delete permissions for User Management modules from non-admin roles
    const deleteResult = await query(`
      DELETE FROM permissions 
      WHERE module_id = ANY($1::int[])
      AND role_id IN (2, 3, 4)  -- Manager, Operator, View Only
      RETURNING *
    `, [userModuleIds]);
    
    console.log(`\n✓ Removed ${deleteResult.rows.length} permission records from non-admin roles`);
    
    // Verify remaining permissions
    const verifyResult = await query(`
      SELECT r.role_name, m.module_name, p.can_view, p.can_edit, p.can_delete
      FROM permissions p
      JOIN roles r ON p.role_id = r.id
      JOIN modules m ON p.module_id = m.id
      WHERE m.module_name IN ('Users', 'User Management', 'Manage Permissions')
      ORDER BY r.role_name, m.module_name
    `);
    
    console.log('\nRemaining User Management permissions (should only be Super Admin):');
    console.table(verifyResult.rows);
    
    if (verifyResult.rows.length === 3 && verifyResult.rows.every(r => r.role_name === 'Super Admin')) {
      console.log('\n✅ SUCCESS: User Management is now restricted to Super Admin only!');
    } else {
      console.log('\n⚠️  WARNING: Unexpected permissions configuration');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restrictUserManagementPermissions();
