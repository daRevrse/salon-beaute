const fs = require('fs');
const mysql = require('mysql2/promise');

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

const tablesWithInitialData = [
  'business_sectors',
  'categories',
  'subscription_plans',
  'ticket_counter'
];

const modifiedColumns = [
  "ALTER TABLE `appointments` ADD COLUMN `guest_count` tinyint(3) unsigned DEFAULT NULL;",
  "ALTER TABLE `appointments` ADD COLUMN `payment_reference` varchar(100) DEFAULT NULL;",
  "ALTER TABLE `medical_patients` ADD COLUMN `client_id` int(11) NOT NULL;",
  "ALTER TABLE `medical_prescriptions` ADD COLUMN `refills_allowed` tinyint(3) unsigned NOT NULL DEFAULT 0;",
  "ALTER TABLE `medical_prescriptions` ADD COLUMN `refills_used` tinyint(3) unsigned NOT NULL DEFAULT 0;",
  "ALTER TABLE `medical_vaccinations` ADD COLUMN `dose_number` tinyint(3) unsigned DEFAULT NULL;",
  "ALTER TABLE `restaurant_order_items` ADD COLUMN `quantity` smallint(5) unsigned NOT NULL DEFAULT 1;",
  "ALTER TABLE `restaurant_orders` ADD COLUMN `guest_count` tinyint(3) unsigned DEFAULT NULL;",
  "ALTER TABLE `restaurant_tables` ADD COLUMN `capacity` tinyint(3) unsigned NOT NULL;",
  "ALTER TABLE `tenants` ADD COLUMN `subscription_status` enum('trial','active','suspended','cancelled') DEFAULT 'trial';",
  "ALTER TABLE `training_courses` ADD COLUMN `max_students` tinyint(3) unsigned DEFAULT NULL;",
  "ALTER TABLE `training_sessions` ADD COLUMN `max_students` tinyint(3) unsigned DEFAULT NULL;"
];

async function generate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salonhub_dev'
  });

  const devSql = fs.readFileSync('./dev_schema.sql', 'utf8');
  let migrationSql = "-- ==========================================\n";
  migrationSql += "-- MIGRATION SCRIPT: DEV TO PROD\n";
  migrationSql += "-- Generated automatically based on schema diff\n";
  migrationSql += "-- ==========================================\n\n";

  migrationSql += "SET FOREIGN_KEY_CHECKS=0;\n\n";

  migrationSql += "-- 1. NEW TABLES\n\n";

  const tablesMap = {};
  const regex = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=[^;]+;/g;
  let match;
  while ((match = regex.exec(devSql)) !== null) {
    tablesMap[match[1]] = match[0];
  }

  missingTables.forEach(table => {
    if (tablesMap[table]) {
      migrationSql += `-- Table: ${table}\n`;
      migrationSql += tablesMap[table] + "\n\n";
    } else {
      migrationSql += `-- WARNING: Table ${table} not found in dev_schema.sql!\n\n`;
    }
  });

  migrationSql += "-- 2. ALTER EXISTING TABLES\n\n";
  modifiedColumns.forEach(col => {
    migrationSql += col + "\n";
  });

  migrationSql += "\n-- 3. DEFAULT DATA FOR CRITICAL NEW TABLES\n\n";

  for (const table of tablesWithInitialData) {
    try {
      const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
      if (rows.length > 0) {
        migrationSql += `-- Data for table \`${table}\`\n`;
        const columns = Object.keys(rows[0]);
        
        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          
          migrationSql += `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
        }
        migrationSql += '\n';
      } else {
        migrationSql += `-- Table \`${table}\` is empty in dev.\n\n`;
      }
    } catch (e) {
      console.error(`Error querying table ${table}:`, e.message);
    }
  }

  migrationSql += "\nSET FOREIGN_KEY_CHECKS=1;\n";

  fs.writeFileSync('../migration_to_prod.sql', migrationSql);
  console.log('Migration script generated at -> salon-beaute/migration_to_prod.sql');
  
  await connection.end();
}

generate().catch(console.error);
