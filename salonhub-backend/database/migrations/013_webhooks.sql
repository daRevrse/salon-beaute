-- Migration 013: Webhook system for API Developer plan
-- Allows tenants to receive HTTP notifications when events occur

-- Webhook endpoints configured by tenants
CREATE TABLE IF NOT EXISTS webhooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  url VARCHAR(2048) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events JSON NOT NULL COMMENT 'Array of event types: ["appointment.created", ...]',
  is_active BOOLEAN DEFAULT TRUE,
  description VARCHAR(255) DEFAULT NULL,
  failure_count INT DEFAULT 0 COMMENT 'Consecutive failures, reset on success',
  last_triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_webhooks_tenant (tenant_id),
  INDEX idx_webhooks_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  webhook_id INT NOT NULL,
  tenant_id INT NOT NULL,
  event VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  response_status INT DEFAULT NULL,
  response_body TEXT DEFAULT NULL,
  response_time_ms INT DEFAULT NULL COMMENT 'Response time in milliseconds',
  attempt INT DEFAULT 1,
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  delivered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_webhook_logs_webhook (webhook_id),
  INDEX idx_webhook_logs_tenant (tenant_id),
  INDEX idx_webhook_logs_status (status),
  INDEX idx_webhook_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
