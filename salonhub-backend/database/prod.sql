-- ==========================================
-- SALONHUB - SCHÉMA MYSQL MULTI-TENANT (PRODUCTION)
-- Version: 2.0 (Base + SuperAdmin + Migrations)
-- Date: 2025-11-18
-- ==========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ==========================================
-- Suppression des tables existantes
-- ==========================================
DROP TABLE IF EXISTS promotion_usages;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS marketing_campaigns;
DROP TABLE IF EXISTS client_notifications;
DROP TABLE IF EXISTS admin_activity_logs;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS super_admins;
DROP TABLE IF EXISTS tenants;

-- ==========================================
-- TABLE: tenants (Salons)
-- ==========================================
CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'Nom du salon',
    slug VARCHAR(100) UNIQUE NOT NULL COMMENT 'URL-friendly identifier',
    email VARCHAR(255) NOT NULL COMMENT 'Email principal du salon',
    phone VARCHAR(20) COMMENT 'Téléphone du salon',
    address TEXT COMMENT 'Adresse complète',
    city VARCHAR(100) COMMENT 'Ville',
    postal_code VARCHAR(10) COMMENT 'Code postal',

    -- Abonnement
    subscription_plan ENUM('starter', 'professional', 'business') DEFAULT 'starter',
    subscription_status ENUM('trial', 'active', 'suspended', 'cancelled') DEFAULT 'trial',
    trial_ends_at DATETIME COMMENT 'Fin de période d essai',
    subscription_started_at DATETIME COMMENT 'Début abonnement payant',

    -- Stripe
    stripe_customer_id VARCHAR(100) COMMENT 'ID client Stripe',
    stripe_subscription_id VARCHAR(100) COMMENT 'ID subscription Stripe',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Personnalisation (migrations)
    currency VARCHAR(3) DEFAULT 'EUR' COMMENT 'Devise utilisée par le salon (EUR, USD, GBP, CAD, CHF, MAD, XOF, XAF)',
    logo_url VARCHAR(255) DEFAULT NULL COMMENT 'URL du logo du salon (icône/avatar)',
    banner_url VARCHAR(255) DEFAULT NULL COMMENT 'URL de la bannière du salon',

    -- Index
    INDEX idx_slug (slug),
    INDEX idx_email (email),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_tenants_currency (currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: super_admins (Administrateurs système)
-- ==========================================
CREATE TABLE super_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Authentification
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',

    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,

    -- Permissions granulaires
    permissions JSON COMMENT 'Permissions système',

    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Compte actif ou désactivé',
    is_super BOOLEAN DEFAULT FALSE COMMENT 'Super admin avec tous les droits',

    -- Audit
    last_login_at DATETIME DEFAULT NULL,
    last_login_ip VARCHAR(45) DEFAULT NULL,
    login_count INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_email (email),
    INDEX idx_active (is_active),
    INDEX idx_last_login (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: users (Staff du salon)
-- ==========================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL COMMENT 'Lien vers le salon',

    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),

    -- Rôles
    role ENUM('owner', 'admin', 'staff') DEFAULT 'staff' COMMENT 'owner=propriétaire, admin=manager, staff=employé',

    -- Disponibilités
    working_hours JSON COMMENT 'Horaires de travail par jour',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Personnalisation (migration)
    avatar_url VARCHAR(255) DEFAULT NULL COMMENT 'URL de l avatar de l employé',

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_per_tenant (tenant_id, email),

    -- Index
    INDEX idx_tenant (tenant_id),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: clients (Clients du salon)
-- ==========================================
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL COMMENT 'Lien vers le salon',

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Préférences de contact (migration)
    preferred_contact_method ENUM('email', 'sms', 'whatsapp', 'phone') DEFAULT 'email' COMMENT 'Moyen de contact préféré pour les notifications',

    -- Informations complémentaires
    date_of_birth DATE COMMENT 'Date de naissance',
    gender ENUM('male', 'female', 'other') COMMENT 'Genre',
    notes TEXT COMMENT 'Notes privées sur le client',

    -- Marketing
    email_marketing_consent BOOLEAN DEFAULT FALSE,
    sms_marketing_consent BOOLEAN DEFAULT FALSE,

    -- Stats
    total_appointments INT DEFAULT 0 COMMENT 'Nombre total de RDV',
    total_spent DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total dépensé',
    last_visit_date DATE COMMENT 'Dernière visite',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,

    -- Index
    INDEX idx_tenant (tenant_id),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_last_name (last_name),
    INDEX idx_last_visit (last_visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: services (Prestations)
-- ==========================================
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL COMMENT 'Lien vers le salon',

    name VARCHAR(255) NOT NULL COMMENT 'Nom de la prestation',
    description TEXT COMMENT 'Description détaillée',

    -- Durée et prix
    duration INT NOT NULL COMMENT 'Durée en minutes',
    price DECIMAL(10, 2) NOT NULL COMMENT 'Prix',

    -- Catégorie
    category VARCHAR(100) COMMENT 'Catégorie (coupe, coloration, etc.)',

    -- Options
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Service disponible à la réservation',
    requires_deposit BOOLEAN DEFAULT FALSE COMMENT 'Nécessite un acompte',
    deposit_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Montant de l acompte',

    -- Disponibilité
    available_for_online_booking BOOLEAN DEFAULT TRUE,

    -- Stats
    booking_count INT DEFAULT 0 COMMENT 'Nombre de réservations',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Personnalisation (migration)
    image_url VARCHAR(255) DEFAULT NULL COMMENT 'URL de l image de mise en avant du service',

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,

    -- Index
    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active),
    INDEX idx_category (category),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: appointments (Rendez-vous)
-- ==========================================
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL COMMENT 'Lien vers le salon',
    client_id INT NOT NULL COMMENT 'Client concerné',
    service_id INT NOT NULL COMMENT 'Prestation réservée',
    staff_id INT COMMENT 'Employé assigné (optionnel)',

    -- Date et heure
    appointment_date DATE NOT NULL COMMENT 'Date du RDV',
    start_time TIME NOT NULL COMMENT 'Heure de début',
    end_time TIME NOT NULL COMMENT 'Heure de fin',

    -- Statut
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',

    -- Réservation
    booked_by ENUM('client', 'staff', 'admin') DEFAULT 'staff' COMMENT 'Qui a créé le RDV',
    booking_source ENUM('website', 'phone', 'walk_in', 'admin') DEFAULT 'admin',

    -- Notes
    notes TEXT COMMENT 'Notes internes',
    client_notes TEXT COMMENT 'Demandes spéciales du client',

    -- Rappels
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at DATETIME,

    -- Annulation
    cancelled_at DATETIME,
    cancellation_reason TEXT,

    -- Paiement
    payment_status ENUM('pending', 'deposit_paid', 'paid', 'refunded') DEFAULT 'pending',
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,

    -- Index
    INDEX idx_tenant (tenant_id),
    INDEX idx_date (appointment_date),
    INDEX idx_client (client_id),
    INDEX idx_staff (staff_id),
    INDEX idx_status (status),
    INDEX idx_datetime (appointment_date, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: settings (Configuration salon)
-- ==========================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,

    setting_key VARCHAR(100) NOT NULL COMMENT 'Clé du paramètre',
    setting_value TEXT COMMENT 'Valeur du paramètre',
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_setting_per_tenant (tenant_id, setting_key),

    -- Index
    INDEX idx_tenant (tenant_id),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: system_settings (Paramètres globaux SaaS)
-- ==========================================
CREATE TABLE system_settings (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: admin_activity_logs (Logs SuperAdmin)
-- ==========================================
CREATE TABLE admin_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,

    super_admin_id INT NOT NULL,

    -- Action effectuée
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

    -- Contraintes
    FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE,

    -- Index
    INDEX idx_super_admin (super_admin_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: client_notifications (Notifications clients)
-- ==========================================
CREATE TABLE client_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    client_id INT NOT NULL,
    appointment_id INT DEFAULT NULL,

    type ENUM('manual', 'appointment_reminder', 'appointment_confirmation', 'marketing', 'other') DEFAULT 'manual',
    subject VARCHAR(255) DEFAULT NULL COMMENT 'Sujet (pour emails)',
    message TEXT NOT NULL,
    send_via ENUM('email', 'sms', 'both') NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',

    sent_by INT DEFAULT NULL COMMENT 'ID de l utilisateur qui a envoyé',
    sent_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_client (client_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_appointment (appointment_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: promotions (Codes promo)
-- ==========================================
CREATE TABLE promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,

    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    discount_type ENUM('percentage', 'fixed_amount', 'service_discount') NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,

    applies_to ENUM('all_services', 'specific_services', 'categories') DEFAULT 'all_services',
    service_ids JSON,

    min_purchase_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),

    usage_limit INT,
    usage_per_client INT DEFAULT 1,

    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,

    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_code_per_tenant (tenant_id, code),
    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active),
    INDEX idx_dates (valid_from, valid_until),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: promotion_usages (Utilisation des promos)
-- ==========================================
CREATE TABLE promotion_usages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    promotion_id INT NOT NULL,
    client_id INT NOT NULL,
    appointment_id INT,

    discount_amount DECIMAL(10,2) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_promotion (promotion_id),
    INDEX idx_client (client_id),
    INDEX idx_used_at (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: marketing_campaigns (Campagnes marketing)
-- ==========================================
CREATE TABLE marketing_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    image_url VARCHAR(500),

    campaign_type ENUM('promotion', 'announcement', 'event', 'newsletter') NOT NULL DEFAULT 'promotion',
    promotion_id INT,

    target_audience ENUM('all_clients', 'active_clients', 'inactive_clients', 'vip_clients', 'custom') DEFAULT 'all_clients',
    custom_client_ids JSON,

    send_via_email BOOLEAN DEFAULT FALSE,
    send_via_sms BOOLEAN DEFAULT FALSE,
    send_via_whatsapp BOOLEAN DEFAULT FALSE,

    scheduled_for DATETIME,
    sent_at DATETIME,

    total_recipients INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    sms_sent INT DEFAULT 0,
    whatsapp_sent INT DEFAULT 0,

    status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') DEFAULT 'draft',

    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_type (campaign_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- VUES UTILES
-- ==========================================

-- Vue: Statistiques par salon
CREATE OR REPLACE VIEW tenant_stats AS
SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    COUNT(DISTINCT c.id) AS total_clients,
    COUNT(DISTINCT s.id) AS total_services,
    COUNT(DISTINCT a.id) AS total_appointments,
    COUNT(DISTINCT u.id) AS total_staff,
    t.subscription_status,
    t.subscription_plan
FROM tenants t
LEFT JOIN clients c ON t.id = c.tenant_id
LEFT JOIN services s ON t.id = s.tenant_id
LEFT JOIN appointments a ON t.id = a.tenant_id
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id;

-- ==========================================
-- DONNÉES INITIALES
-- ==========================================

-- Paramètres système par défaut
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('maintenance_mode', 'false', 'boolean', 'Mode maintenance du SaaS', FALSE),
('allow_new_signups', 'true', 'boolean', 'Autoriser les nouvelles inscriptions', FALSE),
('trial_duration_days', '14', 'number', 'Durée de la période d essai en jours', FALSE),
('max_tenants', '1000', 'number', 'Nombre maximum de tenants autorisés', FALSE),
('default_subscription_plan', 'starter', 'string', 'Plan par défaut lors de l inscription', FALSE),
('support_email', 'support@salonhub.com', 'string', 'Email de support', TRUE),
('app_version', '2.0.0', 'string', 'Version de l application', TRUE);

-- ==========================================
-- FIN DU SCHÉMA
-- ==========================================

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
