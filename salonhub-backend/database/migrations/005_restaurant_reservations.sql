-- =====================================================
-- MIGRATION 005: Restaurant Reservations & Public Features
-- =====================================================

-- Table des réservations restaurant
CREATE TABLE IF NOT EXISTS restaurant_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  table_id INT,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INT NOT NULL DEFAULT 2,
  duration_minutes INT DEFAULT 90,

  -- Infos client
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100),
  customer_phone VARCHAR(20) NOT NULL,
  special_requests TEXT,

  -- Statut et suivi
  status ENUM('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
  confirmation_code VARCHAR(20) UNIQUE,
  confirmed_at DATETIME,
  seated_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  cancellation_reason TEXT,

  -- Notes internes
  internal_notes TEXT,

  -- Métadonnées
  source ENUM('online', 'phone', 'walk_in', 'app') DEFAULT 'online',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  INDEX idx_reservation_date (tenant_id, reservation_date),
  INDEX idx_confirmation_code (confirmation_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajouter colonne qr_code aux tables
ALTER TABLE restaurant_tables
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS location_description VARCHAR(255);

-- Ajouter colonnes client aux commandes pour takeaway/delivery
ALTER TABLE restaurant_orders
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_time TIME;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_orders_type ON restaurant_orders(tenant_id, order_type);
CREATE INDEX IF NOT EXISTS idx_orders_date ON restaurant_orders(tenant_id, order_date);

-- Générer des QR codes pour les tables existantes
UPDATE restaurant_tables t
JOIN tenants te ON t.tenant_id = te.id
SET t.qr_code = CONCAT(te.slug, '-', t.table_number)
WHERE t.qr_code IS NULL;
