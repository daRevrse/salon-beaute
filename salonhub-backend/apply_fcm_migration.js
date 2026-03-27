const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function applyFcmMigration() {
  const sqlPath = path.join(__dirname, 'database', 'migrations', '20260325_add_fcm_token.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.replace(/--.*$/gm, '').trim())
    .filter(s => s.length > 0);

  console.log(`Applying ${statements.length} SQL statements...`);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const statement of statements) {
      console.log(`Running: ${statement.substring(0, 100)}...`);
      await connection.query(statement);
    }
    await connection.commit();
    console.log('✅ FCM Migration applied successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ FCM Migration failed:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

applyFcmMigration();
