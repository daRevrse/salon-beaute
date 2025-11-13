-- Migration : Ajouter le support des devises pour les tenants
-- Date: 2025-01-XX

-- Ajouter la colonne currency à la table tenants
ALTER TABLE tenants
ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR'
COMMENT 'Devise utilisée par le salon (EUR, USD, GBP, CAD, CHF, MAD, XOF, XAF)';

-- Ajouter un index pour les recherches par devise
CREATE INDEX idx_tenants_currency ON tenants(currency);

-- Mettre à jour tous les tenants existants avec EUR par défaut
-- (La détection géographique se fera automatiquement côté frontend)
UPDATE tenants SET currency = 'EUR' WHERE currency IS NULL OR currency = '';
