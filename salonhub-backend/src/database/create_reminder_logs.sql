/**
 * Table pour tracker les rappels envoyés
 * Évite l'envoi de doublons
 */

CREATE TABLE IF NOT EXISTS reminder_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  appointment_id INT NOT NULL,
  client_id INT NOT NULL,
  reminder_type ENUM('24h_before', '2h_before', '1h_before', 'confirmation') NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  channel ENUM('email', 'sms', 'push') NOT NULL,
  status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  error_message TEXT,

  -- Indexes pour performance
  INDEX idx_appointment (appointment_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_sent_at (sent_at),

  -- Empêcher l'envoi de doublons
  UNIQUE KEY unique_reminder (appointment_id, reminder_type, channel),

  -- Relations
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
