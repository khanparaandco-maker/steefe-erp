const { query } = require('./config/database');

async function listModules() {
  try {
    const result = await query('SELECT id, module_name, parent_module_id FROM modules ORDER BY id');
    console.log('Available modules:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listModules();
