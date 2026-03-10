-- Migration: Durée de créneau personnalisée par service
-- Date: 2026-01-28
-- Description: Ajoute un champ slot_duration optionnel aux services

-- Ajouter le champ slot_duration à la table services
-- Si NULL, utilise la durée globale du salon
-- Sinon, utilise cette valeur pour ce service spécifique
ALTER TABLE services
ADD COLUMN IF NOT EXISTS slot_duration INT DEFAULT NULL
COMMENT 'Durée de créneau personnalisée en minutes (NULL = utiliser la durée globale)'
AFTER duration;
