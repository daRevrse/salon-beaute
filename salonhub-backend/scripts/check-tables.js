/**
 * Script pour vérifier quelles tables existent
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salonhub_dev',
    });

    console.log('✅ Connecté à la base de données\n');

    const tablesToCheck = [
      'billing_transactions',
      'subscription_changes',
      'impersonation_sessions',
      'admin_sessions',
      'alert_rules',
      'alert_instances',
      'announcements',
      'broadcast_emails',
      'admin_roles',
      'support_tickets',
      'feature_flags',
      'system_error_logs',
    ];

    console.log('Vérification des tables...\n');

    for (const table of tablesToCheck) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM ${table} LIMIT 1`
        );
        console.log(`✅ ${table} - existe`);
      } catch (error) {
        console.log(`❌ ${table} - MANQUANTE`);
      }
    }

    // Vérifier si la colonne mrr existe dans tenants
    console.log('\nVérification de la colonne mrr dans tenants...');
    try {
      const [rows] = await connection.query(
        `SELECT mrr FROM tenants LIMIT 1`
      );
      console.log('✅ Colonne mrr existe dans tenants');
    } catch (error) {
      console.log('❌ Colonne mrr MANQUANTE dans tenants');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
