const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function updateAdminPassword() {
  try {
    // Hash the password "Admin@123"
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Updating admin password...');
    console.log('New hash:', hashedPassword);
    
    // Update admin user password
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('Username: admin');
      console.log('Password: Admin@123');
    } else {
      console.log('❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
