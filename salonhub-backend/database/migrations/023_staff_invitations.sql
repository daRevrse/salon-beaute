-- Migration 023: Invitations des employés par lien
-- L'employé choisit lui-même son mot de passe via un lien à usage unique
-- (valable 7 jours). Seule l'empreinte SHA-256 du jeton est stockée.

CREATE TABLE IF NOT EXISTS staff_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_staff_invitation_token (token_hash),
  INDEX idx_staff_invitations_user (user_id),
  INDEX idx_staff_invitations_tenant (tenant_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
