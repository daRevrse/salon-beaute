const mysql = require('mysql2/promise');
const fs = require('fs');

const missingTables = [
  'api_keys',           'business_sectors',
  'categories',         'expo_push_tokens',
  'order_items',        'orders',
  'products',           'salon_invitations',
  'subscription_plans', 'ticket_counter',
  'transactions',       'user_salons',
  'wallets',            'webhook_logs',
  'webhooks',           'withdrawal_requests'
];

async function extractData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salonhub_dev'
  });

  let insertSql = "\n\n-- ==========================================\n";
  insertSql += "-- 3. DEFAULT DATA FOR NEW TABLES\n";
  insertSql += "-- ==========================================\n\n";

  for (const table of missingTables) {
    try {
      const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
      if (rows.length > 0) {
        insertSql += `-- Data for table \`${table}\`\n`;
        const columns = Object.keys(rows[0]);
        
        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            // Escape single quotes and backslashes
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          
          insertSql += `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
        }
        insertSql += '\n';
      } else {
        insertSql += `-- Table \`${table}\` is empty in dev.\n\n`;
      }
    } catch (e) {
      console.error(`Error querying table ${table}:`, e.message);
    }
  }

  // Append to the existing migration script
  fs.appendFileSync('../migration_to_prod.sql', insertSql);
  console.log('Default data appended to migration_to_prod.sql');
  
  await connection.end();
}

extractData().catch(console.error);
