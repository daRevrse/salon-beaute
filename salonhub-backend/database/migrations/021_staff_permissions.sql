-- Migration 021: Staff Permissions
-- Add permissions for appointment confirmation and shop management

ALTER TABLE users 
ADD COLUMN can_confirm_appointments TINYINT(1) DEFAULT 0 AFTER role,
ADD COLUMN can_manage_shop TINYINT(1) DEFAULT 0 AFTER can_confirm_appointments;

-- Set default permissions for owners and admins
UPDATE users 
SET can_confirm_appointments = 1, can_manage_shop = 1 
WHERE role IN ('owner', 'admin');

-- Update user_salons if used for permissions (optional but good for consistency)
-- In this project, main permissions seem to be on the users table directly for the current tenant.
