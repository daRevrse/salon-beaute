-- Migration: Ajouter la colonne preferred_contact_method à la table clients
-- Date: 2025-11-13

ALTER TABLE clients
ADD COLUMN preferred_contact_method ENUM('email', 'sms', 'whatsapp', 'phone') DEFAULT 'email'
COMMENT 'Moyen de contact préféré pour les notifications'
AFTER phone;
