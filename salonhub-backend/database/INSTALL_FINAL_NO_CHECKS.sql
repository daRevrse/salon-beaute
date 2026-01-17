-- =====================================================
-- INSTALLATION MULTI-SECTEUR - SANS VÉRIFICATIONS
-- Date: 2026-01-16
-- Description: Installation directe sans accès à information_schema
-- Instructions: Exécutez tout le script d'un coup dans phpMyAdmin
-- =====================================================

-- Désactiver les vérifications temporairement pour éviter les erreurs FK
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- ÉTAPE 1: Ajouter business_type à tenants
-- =====================================================

-- Supprimer d'abord si existe (pour éviter les doublons)
ALTER TABLE tenants DROP COLUMN IF EXISTS business_type;
ALTER TABLE tenants DROP INDEX IF EXISTS idx_business_type;

-- Ajouter la colonne
ALTER TABLE tenants
ADD COLUMN business_type ENUM('beauty', 'restaurant', 'training', 'medical')
NOT NULL DEFAULT 'beauty'
AFTER subscription_status;

-- Ajouter l'index
ALTER TABLE tenants
ADD INDEX idx_business_type (business_type);

-- Mettre à jour les tenants existants
UPDATE tenants SET business_type = 'beauty' WHERE business_type IS NULL OR business_type = '';

-- =====================================================
-- ÉTAPE 2: Nettoyer les tables restaurant existantes
-- =====================================================

DROP TABLE IF EXISTS restaurant_order_items;
DROP TABLE IF EXISTS restaurant_orders;
DROP TABLE IF EXISTS restaurant_menus;
DROP TABLE IF EXISTS restaurant_tables;

-- =====================================================
-- ÉTAPE 3: Nettoyer les colonnes dans appointments
-- =====================================================

-- Supprimer la FK si elle existe
ALTER TABLE appointments DROP FOREIGN KEY IF EXISTS fk_appointments_table;

-- Supprimer l'index si il existe
ALTER TABLE appointments DROP INDEX IF EXISTS idx_appointments_table;

-- Supprimer les colonnes si elles existent
ALTER TABLE appointments DROP COLUMN IF EXISTS table_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS guest_count;
ALTER TABLE appointments DROP COLUMN IF EXISTS special_requests;

-- =====================================================
-- ÉTAPE 4: Créer les tables restaurant
-- =====================================================

CREATE TABLE restaurant_tables (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  table_number VARCHAR(20) NOT NULL,
  table_name VARCHAR(100) NULL,
  capacity TINYINT UNSIGNED NOT NULL,
  section VARCHAR(50) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_tables (tenant_id),
  INDEX idx_table_availability (tenant_id, is_available, is_active),
  UNIQUE KEY unique_table_per_section (tenant_id, table_number, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_menus (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL,
  price DECIMAL(10, 2) NOT NULL,
  allergens TEXT NULL,
  is_vegetarian TINYINT(1) DEFAULT 0,
  is_vegan TINYINT(1) DEFAULT 0,
  is_gluten_free TINYINT(1) DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  image_url VARCHAR(500) NULL,
  display_order INT(11) NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_menus (tenant_id),
  INDEX idx_menu_category (tenant_id, category, is_active),
  INDEX idx_menu_availability (tenant_id, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_orders (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  table_id INT(11) NULL,
  client_id INT(11) NULL,
  staff_id INT(11) NULL,
  appointment_id INT(11) NULL,
  order_type ENUM('dine_in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine_in',
  guest_count TINYINT UNSIGNED NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tip_amount DECIMAL(10, 2) NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  payment_method ENUM('cash', 'card', 'mobile', 'other') NULL,
  notes TEXT NULL,
  order_date DATE NOT NULL,
  order_time TIME NOT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_tenant_orders (tenant_id),
  INDEX idx_order_date (tenant_id, order_date, order_time),
  INDEX idx_order_status (tenant_id, status),
  INDEX idx_table_orders (table_id, status),
  UNIQUE KEY unique_order_number (tenant_id, order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_order_items (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  order_id INT(11) NOT NULL,
  menu_item_id INT(11) NULL,
  menu_item_name VARCHAR(200) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  status ENUM('ordered', 'preparing', 'ready', 'served', 'cancelled') NOT NULL DEFAULT 'ordered',
  special_instructions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES restaurant_menus(id) ON DELETE SET NULL,
  INDEX idx_order_items (order_id),
  INDEX idx_tenant_items (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ÉTAPE 5: Ajouter les colonnes à appointments
-- =====================================================

ALTER TABLE appointments
ADD COLUMN table_id INT(11) NULL AFTER service_id;

ALTER TABLE appointments
ADD COLUMN guest_count TINYINT UNSIGNED NULL AFTER table_id;

ALTER TABLE appointments
ADD COLUMN special_requests TEXT NULL AFTER notes;

-- =====================================================
-- ÉTAPE 6: Ajouter FK et index sur appointments
-- =====================================================

ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_table
FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_table ON appointments(table_id, appointment_date, start_time);

-- Réactiver les vérifications FK
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

SELECT '✓✓✓ INSTALLATION TERMINÉE AVEC SUCCÈS ✓✓✓' AS status;

-- Afficher les tables créées
SHOW TABLES LIKE 'restaurant_%';

-- Vérifier la structure de appointments
DESCRIBE appointments;
