-- Migration: Add Feature Flags System Tables
-- Date: 2025-12-29
-- Description: Create tables for feature flags and A/B testing

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flag_key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_tenants JSON,
  environment ENUM('development', 'staging', 'production', 'all') DEFAULT 'all',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_flag_key (flag_key),
  INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tenant-specific feature overrides
CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  feature_flag_id INT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  reason TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  UNIQUE KEY unique_tenant_feature (tenant_id, feature_flag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature flag usage analytics
CREATE TABLE IF NOT EXISTS feature_flag_checks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  feature_flag_id INT NOT NULL,
  tenant_id INT NOT NULL,
  was_enabled BOOLEAN NOT NULL,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_flag_tenant (feature_flag_id, tenant_id, checked_at),
  INDEX idx_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
