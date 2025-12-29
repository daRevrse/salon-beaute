-- Migration: Add Billing & Revenue Management Tables
-- Date: 2025-12-29
-- Description: Create tables for billing transactions, subscription changes, and invoices

-- Billing transactions table
CREATE TABLE IF NOT EXISTS billing_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  invoice_number VARCHAR(50) UNIQUE,
  billing_period_start DATE,
  billing_period_end DATE,
  description TEXT,
  metadata JSON,
  failed_reason TEXT,
  refunded_amount DECIMAL(10,2),
  refunded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_created_at (created_at),
  INDEX idx_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription changes tracking
CREATE TABLE IF NOT EXISTS subscription_changes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  previous_plan VARCHAR(50),
  new_plan VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  change_type ENUM('upgrade', 'downgrade', 'cancelled', 'reactivated', 'trial_started', 'trial_converted') NOT NULL,
  mrr_change DECIMAL(10,2),
  reason TEXT,
  effective_date DATE NOT NULL,
  initiated_by ENUM('customer', 'admin', 'system') DEFAULT 'system',
  admin_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_tenant_date (tenant_id, effective_date),
  INDEX idx_change_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add billing-related fields to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS onboarding_status ENUM(
    'signup', 'setup', 'services_added', 'staff_invited',
    'first_client', 'first_appointment', 'completed'
  ) DEFAULT 'signup' AFTER subscription_status,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP NULL AFTER onboarding_status,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL AFTER onboarding_completed_at,
  ADD COLUMN IF NOT EXISTS trial_converted BOOLEAN DEFAULT FALSE AFTER trial_ends_at,
  ADD COLUMN IF NOT EXISTS mrr DECIMAL(10,2) DEFAULT 0.00 AFTER trial_converted,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP NULL AFTER mrr,
  ADD COLUMN IF NOT EXISTS payment_failed_count INT DEFAULT 0 AFTER last_payment_at;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON tenants(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_trial_ends ON tenants(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON tenants(subscription_status);
