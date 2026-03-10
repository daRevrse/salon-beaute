-- Migration: Google Sign-In support
-- Date: 2026-02-09
-- Description: Add Google OAuth fields to users table, make password_hash nullable

-- 1. Make password_hash nullable (for Google-only users who never set a password)
ALTER TABLE users
MODIFY COLUMN password_hash VARCHAR(255) DEFAULT NULL;

-- 2. Add Google OAuth fields to users table
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER avatar_url;

ALTER TABLE users
ADD COLUMN auth_provider ENUM('local', 'google', 'both') DEFAULT 'local' AFTER google_id;

-- 3. Index on google_id for fast lookups during Google login
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id);
