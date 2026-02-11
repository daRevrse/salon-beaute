-- ============================================
-- Migration 011: Refonte système de facturation
-- De: starter/professional/business
-- Vers: essential/pro/custom
-- + Tables communication admin
-- ============================================

-- 1. Élargir l'enum pour inclure les nouvelles ET anciennes valeurs (transition)
ALTER TABLE tenants
  MODIFY COLUMN subscription_plan ENUM('starter','professional','business','essential','pro','custom') DEFAULT 'essential';

-- 2. Migrer les données existantes
UPDATE tenants SET subscription_plan = 'essential' WHERE subscription_plan = 'starter';
UPDATE tenants SET subscription_plan = 'pro' WHERE subscription_plan IN ('professional', 'business');

-- 3. Restreindre l'enum aux nouvelles valeurs uniquement
ALTER TABLE tenants
  MODIFY COLUMN subscription_plan ENUM('essential','pro','custom') DEFAULT 'essential';

-- 4. Table des annonces admin
CREATE TABLE IF NOT EXISTS admin_announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  super_admin_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_type ENUM('all','plan','specific') DEFAULT 'all',
  target_plans JSON DEFAULT NULL,
  target_tenant_ids JSON DEFAULT NULL,
  sent_via ENUM('email','in_app','both') DEFAULT 'email',
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (super_admin_id) REFERENCES super_admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table des messages admin -> tenant
CREATE TABLE IF NOT EXISTS admin_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  super_admin_id INT NOT NULL,
  tenant_id INT NOT NULL,
  user_id INT DEFAULT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (super_admin_id) REFERENCES super_admins(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table des overrides de features par tenant
CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  feature_key VARCHAR(100) NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  metadata JSON DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tenant_feature (tenant_id, feature_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
