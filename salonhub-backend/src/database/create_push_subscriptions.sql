/**
 * Table pour stocker les abonnements push des clients
 * Permet d'envoyer des notifications même si l'app est fermée
 */

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  client_id INT,  -- Nullable : peut être NULL si client non identifié
  user_id INT,    -- Nullable : pour le staff qui veut recevoir des notifications

  -- Données de l'abonnement (endpoint + clés)
  endpoint TEXT NOT NULL,
  p256dh_key VARCHAR(255) NOT NULL,
  auth_key VARCHAR(255) NOT NULL,

  -- Métadonnées
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Dates
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,

  -- Indexes
  INDEX idx_tenant (tenant_id),
  INDEX idx_client (client_id),
  INDEX idx_user (user_id),
  INDEX idx_endpoint (endpoint(255)),  -- Index partiel sur endpoint

  -- Relations
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
