-- Migration: Add Enhanced Role-Based Access Control
-- Date: 2025-12-29
-- Description: Create tables for admin roles and improve permission system

-- Admin roles
CREATE TABLE IF NOT EXISTS admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSON NOT NULL,
  is_super BOOLEAN DEFAULT FALSE,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add role_id to super_admins table
ALTER TABLE super_admins
  ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER permissions,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL AFTER role_id,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE AFTER two_factor_secret,
  ADD COLUMN IF NOT EXISTS backup_codes JSON NULL AFTER two_factor_enabled;

-- Add foreign key for role
ALTER TABLE super_admins
  ADD CONSTRAINT fk_superadmin_role
  FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE SET NULL;

-- Insert default roles
INSERT INTO admin_roles (name, slug, description, permissions, is_super, is_system_role) VALUES
('Founder', 'founder', 'Full system access with all permissions', '{"all": true}', TRUE, TRUE),
('Billing Manager', 'billing_manager', 'Manage billing, invoices, and revenue',
  '{"billing": {"view": true, "modify": true, "refund": true}, "tenants": {"view": true, "suspend": true}, "analytics": {"view_global": true}}',
  FALSE, TRUE),
('Support Manager', 'support_manager', 'Handle tenant support and impersonation',
  '{"tenants": {"view": true, "edit": true}, "users": {"view_all": true, "edit": true}, "impersonate": {"enabled": true}, "system": {"view_logs": true}}',
  FALSE, TRUE),
('Analyst', 'analyst', 'View analytics and reports (read-only)',
  '{"tenants": {"view": true}, "analytics": {"view_global": true, "export": true}, "system": {"view_logs": true}}',
  FALSE, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
