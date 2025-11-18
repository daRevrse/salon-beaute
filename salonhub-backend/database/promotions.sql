-- ==========================================
-- SYSTÈME DE PROMOTIONS - SALONHUB
-- Codes promo, réductions, campagnes
-- ==========================================

-- Table des promotions/codes promo
CREATE TABLE IF NOT EXISTS promotions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,

  -- Informations de base
  code VARCHAR(50) NOT NULL,                    -- Code promo (ex: NOEL2024)
  title VARCHAR(255) NOT NULL,                  -- Titre de la promo
  description TEXT,                             -- Description détaillée

  -- Type de réduction
  discount_type ENUM('percentage', 'fixed_amount', 'service_discount') NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,        -- Valeur (20 pour 20%, ou 10.00 pour 10€)

  -- Applicabilité
  applies_to ENUM('all_services', 'specific_services', 'categories') DEFAULT 'all_services',
  service_ids JSON NULL,                        -- IDs des services concernés (si specific_services)

  -- Conditions d'utilisation
  min_purchase_amount DECIMAL(10,2) NULL,       -- Montant minimum d'achat
  max_discount_amount DECIMAL(10,2) NULL,       -- Montant maximum de réduction
  usage_limit INT NULL,                         -- Nombre max d'utilisations (NULL = illimité)
  usage_per_client INT DEFAULT 1,               -- Nombre d'utilisations par client

  -- Période de validité
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,

  -- Visibilité et statut
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,               -- Visible sur la page de réservation

  -- Métadonnées
  created_by INT NOT NULL,                      -- Utilisateur qui a créé la promo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Contraintes et index
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_code_per_tenant (tenant_id, code),
  INDEX idx_tenant (tenant_id),
  INDEX idx_active (is_active),
  INDEX idx_dates (valid_from, valid_until),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisations de codes promo
CREATE TABLE IF NOT EXISTS promotion_usages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  promotion_id INT NOT NULL,
  client_id INT NOT NULL,
  appointment_id INT NULL,                      -- RDV concerné

  -- Détails de l'utilisation
  discount_amount DECIMAL(10,2) NOT NULL,       -- Montant de la réduction appliquée
  order_amount DECIMAL(10,2) NOT NULL,          -- Montant total de la commande

  -- Métadonnées
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,

  INDEX idx_tenant (tenant_id),
  INDEX idx_promotion (promotion_id),
  INDEX idx_client (client_id),
  INDEX idx_used_at (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des campagnes marketing/annonces
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
  custom_client_ids JSON NULL,                  -- Liste d'IDs clients (si custom)

  -- Canaux d'envoi
  send_via_email BOOLEAN DEFAULT FALSE,
  send_via_sms BOOLEAN DEFAULT FALSE,
  send_via_whatsapp BOOLEAN DEFAULT FALSE,

  -- Planification
  scheduled_for DATETIME NULL,                  -- Date d'envoi planifiée (NULL = envoi immédiat)
  sent_at DATETIME NULL,                        -- Date d'envoi réelle

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

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_tenant (tenant_id),
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_for),
  INDEX idx_type (campaign_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Données de test
-- ==========================================

-- Exemples de promotions
INSERT INTO promotions (tenant_id, code, title, description, discount_type, discount_value, applies_to, valid_from, valid_until, created_by, is_public) VALUES
(1, 'BIENVENUE20', 'Bienvenue !', '20% de réduction sur votre première visite', 'percentage', 20.00, 'all_services', '2025-01-01', '2025-12-31', 1, TRUE),
(1, 'NOEL2024', 'Noël 2024', 'Offre spéciale Noël - 15% sur tous les services', 'percentage', 15.00, 'all_services', '2024-12-01', '2024-12-31', 1, TRUE),
(1, 'COUPE10', 'Réduction Coupe', '10€ de réduction sur les coupes', 'fixed_amount', 10.00, 'specific_services', '2025-01-01', '2025-06-30', 1, TRUE),
(1, 'VIP50', 'Offre VIP', '50% sur le 5ème rendez-vous', 'percentage', 50.00, 'all_services', '2025-01-01', '2025-12-31', 1, FALSE);

-- Exemples de campagnes
INSERT INTO marketing_campaigns (tenant_id, title, message, campaign_type, target_audience, send_via_email, send_via_whatsapp, status, created_by) VALUES
(1, 'Offre de Bienvenue', 'Profitez de 20% de réduction sur votre première visite avec le code BIENVENUE20 !', 'promotion', 'all_clients', TRUE, TRUE, 'draft', 1),
(1, 'Annonce Fermeture Noël', 'Le salon sera fermé du 24/12 au 02/01. Bonnes fêtes !', 'announcement', 'all_clients', TRUE, FALSE, 'draft', 1);
