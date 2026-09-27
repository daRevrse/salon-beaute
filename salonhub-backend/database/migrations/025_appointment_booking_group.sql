-- Migration 025: Réservation de plusieurs prestations
-- Un client peut réserver plusieurs prestations à la suite (ex. coupe + brushing).
-- Chaque prestation reste un RDV (agenda, statut, employé), enchaînés avec le
-- même professionnel et reliés par un identifiant de groupe commun : le lien
-- "Gérer mon rendez-vous", le fichier .ics et la confirmation du salon
-- portent sur l'ensemble.

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS booking_group VARCHAR(36) NULL DEFAULT NULL
COMMENT 'Identifiant commun des RDV réservés ensemble';

CREATE INDEX IF NOT EXISTS idx_appointments_booking_group ON appointments (booking_group);
