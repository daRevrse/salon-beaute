/**
 * Script pour créer les tables du système de promotions
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './salonhub-backend/.env' });

const setupPromotionsTables = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salonhub_dev',
    });

    console.log('✅ Connecté à MySQL');

    // Table promotions
    console.log('📝 Création de la table "promotions"...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,

        -- Informations de base
        code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,

        -- Type de réduction
        discount_type ENUM('percentage', 'fixed_amount', 'service_discount') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10,2) NOT NULL,

        -- Applicabilité
        applies_to ENUM('all_services', 'specific_services', 'categories') DEFAULT 'all_services',
        service_ids JSON NULL,

        -- Conditions d'utilisation
        min_purchase_amount DECIMAL(10,2) NULL,
        max_discount_amount DECIMAL(10,2) NULL,
        usage_limit INT NULL,
        usage_per_client INT DEFAULT 1,

        -- Période de validité
        valid_from DATETIME NOT NULL,
        valid_until DATETIME NOT NULL,

        -- Visibilité et statut
        is_active BOOLEAN DEFAULT TRUE,
        is_public BOOLEAN DEFAULT TRUE,

        -- Métadonnées
        created_by INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Contraintes et index
        UNIQUE KEY unique_code_per_tenant (tenant_id, code),
        INDEX idx_tenant (tenant_id),
        INDEX idx_active (is_active),
        INDEX idx_dates (valid_from, valid_until),
        INDEX idx_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "promotions" créée');

    // Table promotion_usages
    console.log('📝 Création de la table "promotion_usages"...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promotion_usages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        promotion_id INT NOT NULL,
        client_id INT NOT NULL,
        appointment_id INT NULL,

        -- Détails de l'utilisation
        discount_amount DECIMAL(10,2) NOT NULL,
        order_amount DECIMAL(10,2) NOT NULL,

        -- Métadonnées
        used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_tenant (tenant_id),
        INDEX idx_promotion (promotion_id),
        INDEX idx_client (client_id),
        INDEX idx_used_at (used_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "promotion_usages" créée');

    // Table marketing_campaigns
    console.log('📝 Création de la table "marketing_campaigns"...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,

        -- Informations de la campagne
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        image_url VARCHAR(500) NULL,

        -- Type de campagne
        campaign_type ENUM('promotion', 'announcement', 'event', 'newsletter') NOT NULL DEFAULT 'promotion',

        -- Promotion associée (optionnel)
        promotion_id INT NULL,

        -- Ciblage
        target_audience ENUM('all_clients', 'active_clients', 'inactive_clients', 'vip_clients', 'custom') DEFAULT 'all_clients',
        custom_client_ids JSON NULL,

        -- Canaux d'envoi
        send_via_email BOOLEAN DEFAULT FALSE,
        send_via_sms BOOLEAN DEFAULT FALSE,
        send_via_whatsapp BOOLEAN DEFAULT FALSE,

        -- Planification
        scheduled_for DATETIME NULL,
        sent_at DATETIME NULL,

        -- Statistiques
        total_recipients INT DEFAULT 0,
        emails_sent INT DEFAULT 0,
        sms_sent INT DEFAULT 0,
        whatsapp_sent INT DEFAULT 0,

        -- Statut
        status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') DEFAULT 'draft',

        -- Métadonnées
        created_by INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_tenant (tenant_id),
        INDEX idx_status (status),
        INDEX idx_scheduled (scheduled_for),
        INDEX idx_type (campaign_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "marketing_campaigns" créée');

    // Données de test
    console.log('📝 Insertion de données de test...');
    await connection.execute(`
      INSERT IGNORE INTO promotions (tenant_id, code, title, description, discount_type, discount_value, applies_to, valid_from, valid_until, created_by, is_public) VALUES
      (1, 'BIENVENUE20', 'Bienvenue !', '20% de réduction sur votre première visite', 'percentage', 20.00, 'all_services', '2025-01-01', '2025-12-31', 1, TRUE),
      (1, 'NOEL2024', 'Noël 2024', 'Offre spéciale Noël - 15% sur tous les services', 'percentage', 15.00, 'all_services', '2024-12-01', '2024-12-31', 1, TRUE),
      (1, 'COUPE10', 'Réduction Coupe', '10€ de réduction sur les coupes', 'fixed_amount', 10.00, 'specific_services', '2025-01-01', '2025-06-30', 1, TRUE),
      (1, 'VIP50', 'Offre VIP', '50% sur le 5ème rendez-vous', 'percentage', 50.00, 'all_services', '2025-01-01', '2025-12-31', 1, FALSE)
    `);
    console.log('✅ Données de test insérées');

    console.log('\n✨ Setup terminé avec succès !');
    console.log('🎯 Vous pouvez maintenant utiliser le système de promotions\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupPromotionsTables();
