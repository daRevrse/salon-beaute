-- Ajouter le champ banner_url à la table tenants
-- pour permettre d'avoir un logo ET une bannière séparés

ALTER TABLE tenants
ADD COLUMN banner_url VARCHAR(255) NULL COMMENT 'URL de la bannière du salon' AFTER logo_url;

-- Mettre à jour le commentaire du logo pour plus de clarté
ALTER TABLE tenants
MODIFY COLUMN logo_url VARCHAR(255) NULL COMMENT 'URL du logo du salon (icône/avatar)';
