-- =====================================================
-- MIGRATION 001: Add business_type to tenants table (SAFE VERSION)
-- Date: 2026-01-16
-- Description: Add business_type column to support multi-sector
-- This version checks if column exists before adding it
-- =====================================================

-- Check if column exists and add it if not
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tenants'
        AND COLUMN_NAME = 'business_type'
);

-- Add column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_type ENUM(''beauty'', ''restaurant'', ''training'', ''medical'') NOT NULL DEFAULT ''beauty'' AFTER subscription_status',
    'SELECT ''Column business_type already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if index exists and add it if not
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tenants'
        AND INDEX_NAME = 'idx_business_type'
);

-- Add index if it doesn't exist
SET @sql = IF(@index_exists = 0,
    'ALTER TABLE tenants ADD INDEX idx_business_type (business_type)',
    'SELECT ''Index idx_business_type already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing tenants to 'beauty' if they are NULL
UPDATE tenants SET business_type = 'beauty' WHERE business_type IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Migration 001 completed successfully!' AS status;

-- Show the column
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'business_type';

-- Show the index
SELECT
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND INDEX_NAME = 'idx_business_type';

-- Show business_type distribution
SELECT business_type, COUNT(*) as count
FROM tenants
GROUP BY business_type;
