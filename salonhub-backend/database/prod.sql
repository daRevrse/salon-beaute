-- ==========================================
-- SALONHUB - SCHÉMA MYSQL MULTI-TENANT (CONSOLIDÉ)
-- Version: 1.1 (Base + Migrations)
-- Date: 2025-11-14
-- ==========================================

-- Suppression des tables existantes (si besoin)
DROP TABLE IF EXISTS client_notifications;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;
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
    
    -- Colonnes des migrations
    logo_url VARCHAR(255) NULL COMMENT 'URL du logo/bannière du salon',
    currency VARCHAR(3) DEFAULT 'EUR' COMMENT 'Devise utilisée par le salon (EUR, USD, GBP, CAD, CHF, MAD, XOF, XAF)',
    
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
    
    -- Index
    INDEX idx_slug (slug),
    INDEX idx_email (email),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_tenants_currency (currency) -- Ajout de la migration
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
    
    -- Colonne de migration
    avatar_url VARCHAR(255) NULL COMMENT 'URL de l avatar de l employé',
    
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
    
    -- Colonne de migration
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
    price DECIMAL(10, 2) NOT NULL COMMENT 'Prix en euros',
    
    -- Catégorie
    category VARCHAR(100) COMMENT 'Catégorie (coupe, coloration, etc.)',
    
    -- Colonne de migration
    image_url VARCHAR(255) NULL COMMENT 'URL de l image de mise en avant du service',
    
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
-- TABLE: client_notifications (Migration)
-- ==========================================
CREATE TABLE IF NOT EXISTS client_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  client_id INT NOT NULL,
  appointment_id INT NULL,
  type ENUM('manual', 'appointment_reminder', 'appointment_confirmation', 'marketing', 'other') DEFAULT 'manual',
  subject VARCHAR(255) NULL COMMENT 'Sujet (pour emails)',
  message TEXT NOT NULL,
  send_via ENUM('email', 'sms', 'both') NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  sent_by INT NULL COMMENT 'ID de l utilisateur qui a envoyé',
  sent_at DATETIME NULL,
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
-- DONNÉES DE TEST
-- ==========================================

-- Salon de test
INSERT INTO tenants (name, slug, email, phone, address, city, postal_code, subscription_plan, subscription_status, trial_ends_at) 
VALUES 
('Salon Beauté Paris', 'salon-beaute-paris', 'contact@salonbeauteparis.fr', '0123456789', '123 Rue de Rivoli', 'Paris', '75001', 'professional', 'trial', DATE_ADD(NOW(), INTERVAL 14 DAY));

-- Propriétaire du salon (password: "password123" - À CHANGER !)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active) 
VALUES 
(1, 'marie@salonbeauteparis.fr', '$2b$10$YourHashedPasswordHere', 'Marie', 'Dupont', 'owner', TRUE);

-- Employé
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) 
VALUES 
(1, 'sophie@salonbeauteparis.fr', '$2b$10$YourHashedPasswordHere', 'Sophie', 'Martin', '0612345678', 'staff', TRUE);

-- Services
INSERT INTO services (tenant_id, name, description, duration, price, category, is_active) 
VALUES 
(1, 'Coupe Femme', 'Coupe et brushing inclus', 45, 35.00, 'coupe', TRUE),
(1, 'Coupe Homme', 'Coupe classique', 30, 20.00, 'coupe', TRUE),
(1, 'Coloration Complète', 'Coloration racines et longueurs', 90, 65.00, 'coloration', TRUE),
(1, 'Balayage', 'Technique balayage californien', 120, 85.00, 'coloration', TRUE),
(1, 'Brushing', 'Brushing simple', 30, 25.00, 'coiffage', TRUE),
(1, 'Soin Capillaire', 'Soin hydratant profond', 30, 20.00, 'soin', TRUE);

-- Clients
INSERT INTO clients (tenant_id, first_name, last_name, email, phone, notes) 
VALUES 
(1, 'Sophie', 'Bernard', 'sophie.bernard@example.com', '0612345678', 'Préfère les RDV en matinée'),
(1, 'Pierre', 'Durand', 'pierre.durand@example.com', '0698765432', 'Allergique aux produits parfumés'),
(1, 'Julie', 'Rousseau', 'julie.rousseau@example.com', '0645678901', 'Cliente fidèle depuis 2 ans'),
(1, 'Marc', 'Lefebvre', 'marc.lefebvre@example.com', '0656789012', NULL);

-- Rendez-vous (quelques exemples)
INSERT INTO appointments (tenant_id, client_id, service_id, staff_id, appointment_date, start_time, end_time, status, booked_by, booking_source) 
VALUES 
(1, 1, 1, 2, CURDATE() + INTERVAL 1 DAY, '10:00:00', '10:45:00', 'confirmed', 'client', 'website'),
(1, 2, 2, 2, CURDATE() + INTERVAL 2 DAY, '14:00:00', '14:30:00', 'pending', 'staff', 'phone'),
(1, 3, 3, 2, CURDATE() + INTERVAL 3 DAY, '09:00:00', '10:30:00', 'confirmed', 'client', 'website'),
(1, 1, 5, 2, CURDATE() - INTERVAL 7 DAY, '11:00:00', '11:30:00', 'completed', 'staff', 'phone');

-- Paramètres du salon
INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type) 
VALUES 
(1, 'business_hours', '{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-20:00","friday":"09:00-20:00","saturday":"09:00-17:00","sunday":"closed"}', 'json'),
(1, 'appointment_buffer', '15', 'number'),
(1, 'require_email_confirmation', 'true', 'boolean'),
(1, 'cancellation_policy', '24h avant le RDV', 'string');

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
-- FIN DU SCHÉMA
-- ==========================================