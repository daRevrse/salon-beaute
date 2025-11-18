/**
 * SALONHUB - Setup des tables SuperAdmin
 * Crée les tables nécessaires pour le système SuperAdmin
 */

require("dotenv").config();
const db = require("../src/config/database");

async function setupSuperAdminTables() {
  try {
    console.log("");
    console.log("=========================================");
    console.log("🚀 SETUP TABLES SUPERADMIN");
    console.log("=========================================");
    console.log("");

    // 1. Table super_admins
    console.log("📋 Création table: super_admins");
    await db.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
          id INT PRIMARY KEY AUTO_INCREMENT,

          -- Authentification
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',

          -- Informations personnelles
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),

          -- Permissions granulaires
          permissions JSON COMMENT 'Permissions système',

          -- Status
          is_active BOOLEAN DEFAULT TRUE COMMENT 'Compte actif ou désactivé',
          is_super BOOLEAN DEFAULT FALSE COMMENT 'Super admin avec tous les droits',

          -- Audit
          last_login_at DATETIME,
          last_login_ip VARCHAR(45),
          login_count INT DEFAULT 0,

          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          INDEX idx_email (email),
          INDEX idx_active (is_active),
          INDEX idx_last_login (last_login_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Table super_admins créée");

    // 2. Table admin_activity_logs
    console.log("📋 Création table: admin_activity_logs");
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,

          super_admin_id INT NOT NULL,

          -- Action
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50),
          resource_id INT,

          -- Détails
          description TEXT,
          metadata JSON,

          -- Context
          ip_address VARCHAR(45),
          user_agent TEXT,

          -- Timestamp
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE,

          INDEX idx_super_admin (super_admin_id),
          INDEX idx_action (action),
          INDEX idx_resource (resource_type, resource_id),
          INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Table admin_activity_logs créée");

    // 3. Table system_settings
    console.log("📋 Création table: system_settings");
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,

          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',

          description TEXT,
          is_public BOOLEAN DEFAULT FALSE,

          updated_by INT,

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          FOREIGN KEY (updated_by) REFERENCES super_admins(id) ON DELETE SET NULL,

          INDEX idx_key (setting_key),
          INDEX idx_public (is_public)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Table system_settings créée");

    // 4. Insérer les paramètres système par défaut
    console.log("📋 Insertion paramètres système par défaut");

    const defaultSettings = [
      ['maintenance_mode', 'false', 'boolean', 'Mode maintenance du SaaS', false],
      ['allow_new_signups', 'true', 'boolean', 'Autoriser les nouvelles inscriptions', false],
      ['trial_duration_days', '14', 'number', 'Durée de la période d essai en jours', false],
      ['max_tenants', '1000', 'number', 'Nombre maximum de tenants autorisés', false],
      ['default_subscription_plan', 'starter', 'string', 'Plan par défaut', false],
      ['support_email', 'support@salonhub.com', 'string', 'Email de support', true],
      ['app_version', '1.0.0', 'string', 'Version de l application', true],
    ];

    for (const [key, value, type, desc, isPublic] of defaultSettings) {
      await db.query(`
        INSERT IGNORE INTO system_settings
        (setting_key, setting_value, setting_type, description, is_public)
        VALUES (?, ?, ?, ?, ?)
      `, [key, value, type, desc, isPublic]);
    }
    console.log("✅ Paramètres système insérés");

    console.log("");
    console.log("=========================================");
    console.log("✅ SETUP TERMINÉ AVEC SUCCÈS");
    console.log("=========================================");
    console.log("");
    console.log("📊 Tables créées:");
    console.log("   - super_admins");
    console.log("   - admin_activity_logs");
    console.log("   - system_settings");
    console.log("");
    console.log("🎯 Prochaine étape:");
    console.log("   node scripts/create-superadmin.js");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter
setupSuperAdminTables();
