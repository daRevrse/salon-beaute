-- Migration: Add Alert Management System Tables
-- Date: 2025-12-29
-- Description: Create tables for configurable alerts and notifications

-- Alert rules configuration
CREATE TABLE IF NOT EXISTS alert_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  condition_type VARCHAR(100) NOT NULL,
  condition_config JSON,
  notification_channels JSON,
  is_active BOOLEAN DEFAULT TRUE,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_active (is_active),
  INDEX idx_condition_type (condition_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert instances (triggered alerts)
CREATE TABLE IF NOT EXISTS alert_instances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alert_rule_id INT NOT NULL,
  tenant_id INT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by INT NULL,
  acknowledged_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (acknowledged_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_rule_created (alert_rule_id, created_at),
  INDEX idx_tenant (tenant_id),
  INDEX idx_acknowledged (is_acknowledged, created_at),
  INDEX idx_severity (severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
