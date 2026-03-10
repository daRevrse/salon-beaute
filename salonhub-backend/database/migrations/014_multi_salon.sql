-- Migration 014: Multi-Salon Support
-- Adds user_salons pivot table for many-to-many relationship
-- Keeps users.tenant_id as the "primary/default" salon for backward compatibility

-- ==========================================
-- 1. Table pivot user_salons
-- ==========================================
CREATE TABLE IF NOT EXISTS user_salons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tenant_id INT NOT NULL,
  role ENUM('owner', 'admin', 'staff') NOT NULL DEFAULT 'staff',
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Salon principal de l utilisateur',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'L utilisateur est-il actif dans ce salon',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tenant (user_id, tenant_id),
  INDEX idx_user_salons_user (user_id),
  INDEX idx_user_salons_tenant (tenant_id),
  INDEX idx_user_salons_primary (user_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 2. Migrer les utilisateurs existants
-- ==========================================
-- Chaque utilisateur existant obtient une entrée dans user_salons
-- avec son tenant_id actuel comme salon principal
INSERT IGNORE INTO user_salons (user_id, tenant_id, role, is_primary, is_active)
SELECT id, tenant_id, role, TRUE, is_active
FROM users
WHERE tenant_id IS NOT NULL;

-- ==========================================
-- 3. Table d'invitations salon
-- ==========================================
CREATE TABLE IF NOT EXISTS salon_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invitations_email (email),
  INDEX idx_invitations_token (token),
  INDEX idx_invitations_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
