const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  console.log('Connecting to database:', process.env.DB_NAME);

  try {
    const sqlPath = path.join(__dirname, '../database/INSTALL_PHASE4_MEDICAL.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration script...');
    const [results] = await connection.query(sql);
    
    console.log('Migration completed successfully!');
    if (Array.isArray(results)) {
        results.forEach((res, index) => {
            if (res && res.constructor.name === 'ResultSetHeader') {
                // Skip header
            } else if (Array.isArray(res) && res[0] && res[0].status) {
                console.log(res[0].status);
            }
        });
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
