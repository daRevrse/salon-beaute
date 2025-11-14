-- Migration: Add image support columns to tenants and services
-- Date: 2025-11-13

-- Add logo_url to tenants table (for salon logo/banner)
ALTER TABLE tenants
ADD COLUMN logo_url VARCHAR(255) NULL
COMMENT 'URL du logo/bannière du salon';

-- Add image_url to services table (for service mise en avant)
ALTER TABLE services
ADD COLUMN image_url VARCHAR(255) NULL
COMMENT 'URL de l image de mise en avant du service';

-- Add logo_url to users table (for staff photo/avatar)
ALTER TABLE users
ADD COLUMN avatar_url VARCHAR(255) NULL
COMMENT 'URL de l avatar de l employé';