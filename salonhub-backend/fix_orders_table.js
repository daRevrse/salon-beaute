require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  // 1. Kill any sleeping connections to free locks
  try {
    const [procs] = await conn.query('SHOW PROCESSLIST');
    console.log(`Found ${procs.length} MySQL processes`);
    for (const p of procs) {
      if (p.Id !== conn.threadId && p.Command === 'Sleep') {
        try {
          await conn.query(`KILL ${p.Id}`);
          console.log(`  Killed sleeping process ${p.Id}`);
        } catch (e) { /* ignore */ }
      }
    }
  } catch (e) {
    console.log('Could not clean processes:', e.message);
  }

  // 2. Check current orders table schema
  const [cols] = await conn.query('SHOW COLUMNS FROM orders');
  const colNames = cols.map(c => c.Field);
  console.log('Current orders columns:', colNames.join(', '));

  // 3. Add missing columns
  const alterations = [];
  if (!colNames.includes('client_name')) {
    alterations.push("ADD COLUMN `client_name` VARCHAR(255) DEFAULT '' AFTER `tenant_id`");
  }
  if (!colNames.includes('client_phone')) {
    alterations.push("ADD COLUMN `client_phone` VARCHAR(50) DEFAULT '' AFTER `client_name`");
  }
  if (!colNames.includes('client_address')) {
    alterations.push("ADD COLUMN `client_address` TEXT DEFAULT NULL AFTER `client_phone`");
  }
  if (!colNames.includes('payment_method')) {
    alterations.push("ADD COLUMN `payment_method` VARCHAR(50) DEFAULT NULL AFTER `status`");
  }
  if (!colNames.includes('payment_status')) {
    alterations.push("ADD COLUMN `payment_status` ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING' AFTER `payment_method`");
  }

  if (alterations.length === 0) {
    console.log('All columns already exist. Nothing to do.');
  } else {
    const sql = 'ALTER TABLE `orders` ' + alterations.join(', ');
    console.log('Running ALTER:', sql);
    await conn.query(sql);
    console.log('ALTER TABLE orders — OK');
  }

  // 4. Verify
  const [cols2] = await conn.query('SHOW COLUMNS FROM orders');
  console.log('Final orders columns:', cols2.map(c => c.Field).join(', '));

  await conn.end();
  console.log('Done.');
  process.exit(0);
})();
