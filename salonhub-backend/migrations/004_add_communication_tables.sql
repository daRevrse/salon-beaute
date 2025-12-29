-- Migration: Add Communication & Announcement Tables
-- Date: 2025-12-29
-- Description: Create tables for announcements and broadcast emails

-- System announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
  target_audience ENUM('all', 'active', 'trial', 'suspended', 'specific_plan', 'specific_tenants') DEFAULT 'all',
  target_plan VARCHAR(50) NULL,
  target_tenant_ids JSON NULL,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP NULL,
  end_date TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_active_dates (is_active, start_date, end_date),
  INDEX idx_target (target_audience)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broadcast emails
CREATE TABLE IF NOT EXISTS broadcast_emails (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  recipients_filter JSON,
  target_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') DEFAULT 'draft',
  scheduled_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email delivery tracking
CREATE TABLE IF NOT EXISTS email_deliveries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  broadcast_email_id INT NOT NULL,
  tenant_id INT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  opened_at TIMESTAMP NULL,
  clicked_at TIMESTAMP NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (broadcast_email_id) REFERENCES broadcast_emails(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_broadcast (broadcast_email_id, status),
  INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
