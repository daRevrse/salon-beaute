-- Migration: Améliorations salon beauté
-- Date: 2026-01-27
-- Description: Ajoute le slogan aux tenants et la galerie aux services

-- 1. Ajouter le champ slogan à la table tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS slogan VARCHAR(255) DEFAULT NULL
COMMENT 'Slogan/phrase d''accroche du salon'
AFTER banner_url;

-- 2. Ajouter le champ gallery à la table services (tableau JSON d'URLs d'images)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS gallery JSON DEFAULT NULL
COMMENT 'Galerie d''images du service (tableau JSON d''URLs)'
AFTER image_url;

-- Index pour améliorer les performances des requêtes sur les tenants actifs
CREATE INDEX IF NOT EXISTS idx_tenants_active_slug ON tenants(slug, is_active);
