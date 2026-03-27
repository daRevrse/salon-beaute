const { query } = require('./src/config/database');

async function checkTable() {
  try {
    const results = await query('DESCRIBE users');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkTable();
