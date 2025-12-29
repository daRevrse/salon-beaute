-- Migration: Add Impersonation System Tables
-- Date: 2025-12-29
-- Description: Create tables for super admin impersonation sessions and tracking

-- Impersonation sessions
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  super_admin_id INT NOT NULL,
  user_id INT NOT NULL,
  tenant_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  reason TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_super_admin (super_admin_id, is_active),
  INDEX idx_expires (expires_at, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin sessions tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  super_admin_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_super_admin_active (super_admin_id, is_active),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_time (email, attempted_at),
  INDEX idx_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
