-- =====================================================
-- MIGRATION 001: Add business_type to tenants table
-- Date: 2026-01-16
-- Description: Add business_type column to support multi-sector
-- =====================================================

-- Add business_type column
ALTER TABLE tenants
ADD COLUMN business_type ENUM('beauty', 'restaurant', 'training', 'medical')
NOT NULL DEFAULT 'beauty'
AFTER subscription_status;

-- Add index for better query performance
ALTER TABLE tenants ADD INDEX idx_business_type (business_type);

-- Update existing tenants to 'beauty' (already default)
UPDATE tenants SET business_type = 'beauty' WHERE business_type IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration:
-- SELECT business_type, COUNT(*) FROM tenants GROUP BY business_type;
-- SHOW INDEX FROM tenants WHERE Key_name = 'idx_business_type';

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- ALTER TABLE tenants DROP INDEX idx_business_type;
-- ALTER TABLE tenants DROP COLUMN business_type;
