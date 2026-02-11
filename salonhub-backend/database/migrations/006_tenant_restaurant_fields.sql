-- Migration 006: Ajouter colonnes manquantes à tenants pour le secteur restaurant
-- Date: 2026-01-19

-- Ajouter colonne description si elle n'existe pas
SET @dbname = DATABASE();
SET @tablename = 'tenants';
SET @columnname = 'description';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE tenants ADD COLUMN description TEXT DEFAULT NULL AFTER banner_url'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter colonne opening_hours si elle n'existe pas
SET @columnname = 'opening_hours';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE tenants ADD COLUMN opening_hours JSON DEFAULT NULL AFTER description'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter colonne is_active si elle n'existe pas
SET @columnname = 'is_active';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE tenants ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER business_type'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Mettre à jour is_active basé sur subscription_status pour les tenants existants
UPDATE tenants
SET is_active = CASE
  WHEN subscription_status IN ('active', 'trial') THEN 1
  ELSE 0
END
WHERE is_active IS NULL OR is_active = 1;

-- Ajouter index pour améliorer les performances des requêtes publiques
CREATE INDEX IF NOT EXISTS idx_tenants_slug_active ON tenants(slug, is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type);
