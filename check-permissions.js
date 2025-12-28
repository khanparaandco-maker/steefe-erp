const { query } = require('./config/database');

async function checkPermissions() {
  try {
    const result = await query('SELECT user_id, module_id, can_view, can_edit, can_delete FROM permissions WHERE user_id IS NOT NULL ORDER BY user_id, module_id');
    console.log('User-specific permissions in database:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPermissions();
