-- ========================================
-- Migration 015 : Expo Push Tokens (Mobile)
-- Support des notifications push mobiles via Expo Push API
-- ========================================

CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NULL,
  token VARCHAR(255) NOT NULL,
  device_name VARCHAR(255) NULL,
  platform ENUM('ios', 'android') NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_token (token),
  INDEX idx_tenant (tenant_id),
  INDEX idx_user (user_id),
  INDEX idx_active (is_active),

  CONSTRAINT fk_expo_push_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_expo_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
