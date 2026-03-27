-- Migration: Add FCM Token to push_subscriptions
-- Created: 2026-03-25

ALTER TABLE `push_subscriptions` 
ADD COLUMN `fcm_token` TEXT AFTER `auth_key`;

-- Optionnel: Index sur fcm_token (attention à la taille si TEXT, on peut utiliser un préfixe ou VARCHAR)
-- ALTER TABLE `push_subscriptions` ADD INDEX (`fcm_token`(255));
