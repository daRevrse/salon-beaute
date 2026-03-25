const mysql = require('mysql2/promise');
const fs = require('fs');

async function extractSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salonhub_dev'
  });

  const [tables] = await connection.query('SHOW TABLES');
  let schema = '';

  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    schema += createTableResult[0]['Create Table'] + ';\n\n';
  }

  fs.writeFileSync('dev_schema.sql', schema);
  console.log('dev_schema.sql generated successfully.');
  await connection.end();
}

extractSchema().catch(console.error);
