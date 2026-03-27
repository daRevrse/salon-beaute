const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const sqlPath = path.join(__dirname, 'database', 'migrations', '020_appointment_receipts.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found: ${sqlPath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Improved split: filter comments and split by ;
  const statements = sql
    .split(';')
    .map(s => s.replace(/--.*$/gm, '').trim())
    .filter(s => s.length > 0);

  console.log(`Applying ${statements.length} SQL statements from ${path.basename(sqlPath)}...`);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    for (const statement of statements) {
      console.log(`Running: ${statement.substring(0, 100)}...`);
      await connection.query(statement);
    }
    await connection.commit();
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

applyMigration();
