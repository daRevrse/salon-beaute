-- Migration 024: Lien client "Gérer mon rendez-vous"
-- Jeton aléatoire (32 octets, hexadécimal) propre à chaque RDV, utilisé dans
-- les liens envoyés au client (accusé de réception, confirmation, rappel) pour
-- consulter, déplacer ou annuler son RDV sans compte.
-- Le jeton est conservé tel quel afin que les liens de tous les emails restent
-- valides ; il est généré à la réservation en ligne ou au premier envoi.

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS manage_token VARCHAR(64) NULL DEFAULT NULL
COMMENT 'Jeton du lien client Gérer mon rendez-vous';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_appointments_manage_token ON appointments (manage_token);
