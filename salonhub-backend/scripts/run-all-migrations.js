/**
 * Script pour exécuter toutes les migrations
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrationsDir = path.join(__dirname, '../migrations');

// Liste des migrations dans l'ordre
const migrations = [
  '001_add_billing_tables.sql',
  '002_add_impersonation_tables.sql',
  '003_add_alerts_tables.sql',
  '004_add_communication_tables.sql',
  '005_add_roles_tables.sql',
  '006_add_support_tables.sql',
  '007_add_feature_flags_tables.sql',
  '008_add_system_monitoring_tables.sql',
];

async function runMigrations() {
  let connection;

  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salonhub_dev',
      multipleStatements: true,
    });

    console.log('✅ Connecté à la base de données\n');

    // Exécuter chaque migration
    for (const migrationFile of migrations) {
      const filePath = path.join(migrationsDir, migrationFile);

      console.log(`📄 Migration: ${migrationFile}`);

      if (!fs.existsSync(filePath)) {
        console.log(`❌ Fichier introuvable: ${filePath}\n`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await connection.query(sql);
        console.log(`✅ Migration réussie: ${migrationFile}\n`);
      } catch (error) {
        console.log(`⚠️  Erreur (peut être ignorée si déjà appliquée): ${error.message}\n`);
      }
    }

    console.log('✅ Toutes les migrations ont été exécutées!');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
