-- =====================================================
-- MIGRATION 002: Restaurant Sector Tables
-- Date: 2026-01-16
-- Description: Create restaurant-specific tables
-- Prerequisite: Migration 001 (business_type column)
-- =====================================================

-- =====================================================
-- TABLE: restaurant_tables
-- Description: Physical tables in the restaurant
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,

  -- Table identification
  table_number VARCHAR(20) NOT NULL,
  table_name VARCHAR(100) NULL COMMENT 'Optional friendly name (e.g., "Window Table", "VIP Corner")',

  -- Table properties
  capacity TINYINT UNSIGNED NOT NULL COMMENT 'Maximum number of guests',
  section VARCHAR(50) NULL COMMENT 'Section/zone (e.g., "Terrasse", "Salle principale", "Bar")',

  -- Availability
  is_available BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Currently available for booking',
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Table exists and is in use',

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_tenant_tables (tenant_id),
  INDEX idx_table_availability (tenant_id, is_available, is_active),
  UNIQUE KEY unique_table_per_section (tenant_id, table_number, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: restaurant_menus
-- Description: Menu items/dishes offered by restaurant
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurant_menus (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,

  -- Menu item details
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL COMMENT 'e.g., "Entrées", "Plats", "Desserts", "Boissons"',

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,

  -- Dietary information
  allergens TEXT NULL COMMENT 'JSON array of allergens',
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,

  -- Availability
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Media
  image_url VARCHAR(500) NULL,

  -- Display order
  display_order INT UNSIGNED NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_tenant_menus (tenant_id),
  INDEX idx_menu_category (tenant_id, category, is_active),
  INDEX idx_menu_availability (tenant_id, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: restaurant_orders
-- Description: Orders placed at the restaurant
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurant_orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,

  -- Order identification
  order_number VARCHAR(50) NOT NULL COMMENT 'Human-readable order number',

  -- Related entities
  table_id INT UNSIGNED NULL COMMENT 'Table where order was placed',
  client_id INT UNSIGNED NULL COMMENT 'Optional: registered client',
  staff_id INT UNSIGNED NULL COMMENT 'Staff member who took the order',
  appointment_id INT UNSIGNED NULL COMMENT 'Optional: linked reservation',

  -- Order details
  order_type ENUM('dine_in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine_in',
  guest_count TINYINT UNSIGNED NULL COMMENT 'Number of guests',

  -- Financial
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tip_amount DECIMAL(10, 2) NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Status
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')
    NOT NULL DEFAULT 'pending',

  -- Payment
  payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  payment_method ENUM('cash', 'card', 'mobile', 'other') NULL,

  -- Notes
  notes TEXT NULL COMMENT 'Special requests or instructions',

  -- Timestamps
  order_date DATE NOT NULL,
  order_time TIME NOT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_tenant_orders (tenant_id),
  INDEX idx_order_date (tenant_id, order_date, order_time),
  INDEX idx_order_status (tenant_id, status),
  INDEX idx_table_orders (table_id, status),
  UNIQUE KEY unique_order_number (tenant_id, order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: restaurant_order_items
-- Description: Individual items in an order
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurant_order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,

  -- Menu item reference
  menu_item_id INT UNSIGNED NULL COMMENT 'Reference to menu item (can be null if item deleted)',
  menu_item_name VARCHAR(200) NOT NULL COMMENT 'Snapshot of item name at order time',

  -- Quantity and pricing
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL COMMENT 'quantity * unit_price',

  -- Item status
  status ENUM('ordered', 'preparing', 'ready', 'served', 'cancelled') NOT NULL DEFAULT 'ordered',

  -- Customization
  special_instructions TEXT NULL COMMENT 'e.g., "No onions", "Extra spicy"',

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES restaurant_menus(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_order_items (order_id),
  INDEX idx_tenant_items (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EXTEND appointments table for restaurant reservations
-- =====================================================
ALTER TABLE appointments
ADD COLUMN table_id INT UNSIGNED NULL COMMENT 'For restaurant: table reservation' AFTER service_id,
ADD COLUMN guest_count TINYINT UNSIGNED NULL COMMENT 'For restaurant: number of guests' AFTER table_id,
ADD COLUMN special_requests TEXT NULL COMMENT 'Special requests (dietary, occasion, etc.)' AFTER notes;

-- Add foreign key for table_id
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_table
FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;

-- Add index for table bookings
CREATE INDEX idx_appointments_table ON appointments(table_id, appointment_date, start_time);

-- =====================================================
-- INITIAL DATA (Optional - Example for testing)
-- =====================================================
-- Uncomment to add sample data for testing

/*
-- Sample restaurant tables (only for restaurants)
INSERT INTO restaurant_tables (tenant_id, table_number, table_name, capacity, section)
SELECT id, '1', 'Table 1', 4, 'Salle principale'
FROM tenants WHERE business_type = 'restaurant' LIMIT 1;

INSERT INTO restaurant_tables (tenant_id, table_number, table_name, capacity, section)
SELECT id, '2', 'Table 2', 2, 'Terrasse'
FROM tenants WHERE business_type = 'restaurant' LIMIT 1;

-- Sample menu items
INSERT INTO restaurant_menus (tenant_id, name, description, category, price, is_vegetarian)
SELECT id, 'Salade Caesar', 'Salade romaine, poulet grillé, parmesan, croûtons', 'Entrées', 12.50, FALSE
FROM tenants WHERE business_type = 'restaurant' LIMIT 1;

INSERT INTO restaurant_menus (tenant_id, name, description, category, price, is_vegan, is_gluten_free)
SELECT id, 'Buddha Bowl', 'Quinoa, légumes rôtis, avocat, sauce tahini', 'Plats', 14.90, TRUE, TRUE
FROM tenants WHERE business_type = 'restaurant' LIMIT 1;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration:

/*
-- Check tables were created
SHOW TABLES LIKE 'restaurant_%';

-- Check appointments table was extended
DESCRIBE appointments;

-- Verify restaurant tables count
SELECT COUNT(*) as restaurant_tables_count FROM restaurant_tables;

-- Verify menu items count
SELECT COUNT(*) as menu_items_count FROM restaurant_menus;
*/

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
/*
-- Remove foreign key constraint from appointments
ALTER TABLE appointments DROP FOREIGN KEY fk_appointments_table;

-- Remove new columns from appointments
ALTER TABLE appointments
  DROP INDEX idx_appointments_table,
  DROP COLUMN special_requests,
  DROP COLUMN guest_count,
  DROP COLUMN table_id;

-- Drop restaurant tables in reverse order (due to foreign keys)
DROP TABLE IF EXISTS restaurant_order_items;
DROP TABLE IF EXISTS restaurant_orders;
DROP TABLE IF EXISTS restaurant_menus;
DROP TABLE IF EXISTS restaurant_tables;
*/
