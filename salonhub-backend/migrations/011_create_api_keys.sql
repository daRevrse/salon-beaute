-- Migration 011: Create API Keys table
-- SalonHub Developer Plan - API Key authentication system

CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  scopes JSON DEFAULT NULL,
  daily_requests INT DEFAULT 0,
  daily_requests_reset DATE DEFAULT NULL,
  last_used_at DATETIME DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_key_prefix (key_prefix),
  INDEX idx_tenant_active (tenant_id, is_active)
);
