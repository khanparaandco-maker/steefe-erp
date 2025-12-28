const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('Creating test user with Manager role...\n');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    // Create user
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, mobile_no, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE 
       SET email = EXCLUDED.email, 
           password_hash = EXCLUDED.password_hash,
           is_active = EXCLUDED.is_active
       RETURNING id, username, email`,
      ['testuser', 'test@steelmelt.com', hashedPassword, 'Test', 'User', '+919999999999', true]
    );
    
    const userId = userResult.rows[0].id;
    console.log('✓ User created:', userResult.rows[0]);
    
    // Assign Manager role (role_id = 2)
    await query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, 2]
    );
    console.log('✓ Assigned Manager role');
    
    // Test permissions
    const perms = await query('SELECT * FROM get_user_permissions($1)', [userId]);
    console.log(`\nTotal permissions: ${perms.rows.length}`);
    
    const userMgmt = perms.rows.filter(p => 
      p.module_name.includes('User') || p.parent_module === 'Users'
    );
    
    if (userMgmt.length === 0) {
      console.log('✅ SUCCESS: Test user does NOT have User Management permissions');
    } else {
      console.log('❌ FAIL: Test user has User Management permissions:');
      console.table(userMgmt);
    }
    
    console.log('\n📝 Test credentials:');
    console.log('   Username: testuser');
    console.log('   Password: Test@123');
    console.log('   Role: Manager');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();
