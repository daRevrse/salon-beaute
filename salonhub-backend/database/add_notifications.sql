-- Migration: Add client_notifications table
-- Date: 2025-11-14

CREATE TABLE IF NOT EXISTS client_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  client_id INT NOT NULL,
  appointment_id INT NULL,
  type ENUM('manual', 'appointment_reminder', 'appointment_confirmation', 'marketing', 'other') DEFAULT 'manual',
  subject VARCHAR(255) NULL COMMENT 'Sujet (pour emails)',
  message TEXT NOT NULL,
  send_via ENUM('email', 'sms', 'both') NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  sent_by INT NULL COMMENT 'ID de l utilisateur qui a envoyé',
  sent_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_client (client_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_appointment (appointment_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
