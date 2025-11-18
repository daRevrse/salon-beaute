-- ==========================================
-- SALONHUB - MIGRATION SUPERADMIN
-- Ajout du système SuperAdmin pour gestion SaaS
-- Date: 2025-11-18
-- ==========================================

-- ==========================================
-- TABLE: super_admins
-- Administrateurs système (hors tenants)
-- ==========================================
CREATE TABLE IF NOT EXISTS super_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Authentification
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',

    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),

    -- Permissions granulaires
    permissions JSON COMMENT 'Permissions système: {can_delete_tenants, can_view_analytics, can_impersonate, etc.}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Compte actif ou désactivé',
    is_super BOOLEAN DEFAULT FALSE COMMENT 'Super admin avec tous les droits (fondateur)',

    -- Audit
    last_login_at DATETIME,
    last_login_ip VARCHAR(45) COMMENT 'Dernière IP de connexion (IPv6 compatible)',
    login_count INT DEFAULT 0 COMMENT 'Nombre de connexions',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_email (email),
    INDEX idx_active (is_active),
    INDEX idx_last_login (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Administrateurs système du SaaS';

-- ==========================================
-- TABLE: admin_activity_logs
-- Logs des actions SuperAdmin (audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,

    super_admin_id INT NOT NULL,

    -- Action effectuée
    action VARCHAR(100) NOT NULL COMMENT 'Type d action: tenant_created, tenant_suspended, impersonate, etc.',
    resource_type VARCHAR(50) COMMENT 'Type de ressource: tenant, user, subscription, etc.',
    resource_id INT COMMENT 'ID de la ressource affectée',

    -- Détails
    description TEXT COMMENT 'Description de l action',
    metadata JSON COMMENT 'Données supplémentaires (avant/après, paramètres, etc.)',

    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE,

    -- Index
    INDEX idx_super_admin (super_admin_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs d audit des actions SuperAdmin';

-- ==========================================
-- TABLE: system_settings
-- Paramètres globaux du SaaS
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,

    setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT 'Clé unique du paramètre',
    setting_value TEXT COMMENT 'Valeur du paramètre (peut être JSON)',
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',

    description TEXT COMMENT 'Description du paramètre',
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Paramètre visible par les tenants',

    updated_by INT COMMENT 'ID du SuperAdmin qui a modifié',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (updated_by) REFERENCES super_admins(id) ON DELETE SET NULL,

    INDEX idx_key (setting_key),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Paramètres système globaux';

-- ==========================================
-- Permissions par défaut (JSON example)
-- ==========================================
-- Permissions SuperAdmin standard:
-- {
--   "tenants": {
--     "view": true,
--     "create": true,
--     "edit": true,
--     "suspend": true,
--     "delete": false  // Réservé aux super admins
--   },
--   "analytics": {
--     "view_global": true,
--     "view_tenant": true,
--     "export": true
--   },
--   "impersonate": {
--     "enabled": true,
--     "require_2fa": false
--   },
--   "billing": {
--     "view": true,
--     "modify": false
--   },
--   "system": {
--     "view_logs": true,
--     "manage_admins": false,  // Réservé aux super admins
--     "manage_settings": false
--   }
-- }

-- ==========================================
-- Paramètres système par défaut
-- ==========================================
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('maintenance_mode', 'false', 'boolean', 'Mode maintenance du SaaS', false),
('allow_new_signups', 'true', 'boolean', 'Autoriser les nouvelles inscriptions', false),
('trial_duration_days', '14', 'number', 'Durée de la période d essai en jours', false),
('max_tenants', '1000', 'number', 'Nombre maximum de tenants autorisés', false),
('default_subscription_plan', 'starter', 'string', 'Plan par défaut lors de l inscription', false),
('support_email', 'support@salonhub.com', 'string', 'Email de support', true),
('app_version', '1.0.0', 'string', 'Version de l application', true);

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Migration SuperAdmin terminée avec succès!' AS status;
SELECT
    COUNT(*) as total_super_admins,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as actifs
FROM super_admins;
