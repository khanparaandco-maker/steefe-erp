require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database');

async function createAdminUser() {
  console.log('Creating/Updating admin user...');
  
  try {
    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Password hash generated');
    
    // Insert or update admin user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, mobile_no, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE 
       SET password_hash = $3,
           email = $2,
           first_name = $4,
           last_name = $5,
           is_active = $7,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, username, email`,
      ['admin', 'admin@steelmelt.com', hashedPassword, 'System', 'Administrator', '+91 9876543210', true]
    );
    
    const adminUserId = result.rows[0].id;
    console.log('✓ Admin user created/updated:', result.rows[0]);
    
    // Check if Super Admin role exists
    let roleResult = await query("SELECT id FROM roles WHERE role_name = 'Super Admin'");
    let roleId;
    
    if (roleResult.rows.length === 0) {
      console.log('Creating Super Admin role...');
      const roleInsert = await query(
        "INSERT INTO roles (role_name, description) VALUES ($1, $2) RETURNING id",
        ['Super Admin', 'Full system access with all permissions']
      );
      roleId = roleInsert.rows[0].id;
      console.log('✓ Super Admin role created with ID:', roleId);
    } else {
      roleId = roleResult.rows[0].id;
      console.log('✓ Super Admin role exists with ID:', roleId);
    }
    
    // Assign Super Admin role to admin user
    await query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by)
       VALUES ($1, $2, $1)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [adminUserId, roleId]
    );
    
    console.log('✓ Super Admin role assigned to admin user');
    
    // Grant all permissions if modules exist
    const moduleCount = await query("SELECT COUNT(*) FROM modules");
    if (moduleCount.rows[0].count > 0) {
      await query(
        `INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, can_export)
         SELECT $1, id, TRUE, TRUE, TRUE, TRUE FROM modules
         ON CONFLICT (role_id, module_id) DO UPDATE
         SET can_view = TRUE, can_edit = TRUE, can_delete = TRUE, can_export = TRUE`,
        [roleId]
      );
      console.log('✓ All permissions granted to Super Admin role');
    }
    
    console.log('\n=================================');
    console.log('Admin user ready!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('=================================');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

createAdminUser();
