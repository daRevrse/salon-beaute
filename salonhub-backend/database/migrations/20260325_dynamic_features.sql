-- Migration: Dynamic Feature Management

-- 1. Create table for all available technical features
CREATE TABLE IF NOT EXISTS system_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feature_key VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add technical_features column to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS technical_features JSON AFTER features;

-- 3. Seed default features
INSERT IGNORE INTO system_features (feature_key, display_name, description, category) VALUES
('appointments', 'Agenda en ligne', 'Gestion des rendez-vous et calendrier', 'Core'),
('multi_staff', 'Multi-collaborateurs (jusqu''à 5)', 'Gérer jusqu''à 5 membres d''équipe', 'Team'),
('unlimited_staff', 'Collaborateurs illimités', 'Gérer un nombre illimité de membres d''équipe', 'Team'),
('sms_reminders', 'Rappels SMS', 'Envoi automatique de rappels par SMS', 'Communication'),
('statistics_basic', 'Statistiques basiques', 'Rapports d''activité simplifiés', 'Analytics'),
('statistics_advanced', 'Statistiques avancées', 'Analyses détaillées et exports', 'Analytics'),
('online_payment', 'Paiement en ligne', 'Accepter les paiements par carte/mobile', 'Finances'),
('marketing', 'Campagnes Marketing', 'Envoi d''emails et SMS marketing', 'Marketing'),
('shop', 'Boutique en ligne', 'Ventes de produits en ligne', 'E-commerce'),
('wallet', 'Portefeuille numérique', 'Gestion des revenus et retraits', 'Finances'),
('api_access', 'Accès API REST', 'Accès développeur pour intégrations', 'Developer'),
('webhooks', 'Webhooks', 'Notifications en temps réel pour serveurs externes', 'Developer'),
('white_label', 'Marque blanche', 'Retrait du logo SalonHub et domaine personnalisé', 'Premium');

-- 4. Initialize existing plans with default technical features
UPDATE subscription_plans SET technical_features = '["appointments", "statistics_basic"]' WHERE name = 'essential';
UPDATE subscription_plans SET technical_features = '["appointments", "multi_staff", "sms_reminders", "statistics_advanced", "online_payment", "marketing", "shop", "wallet"]' WHERE name = 'pro';
UPDATE subscription_plans SET technical_features = '["appointments", "unlimited_staff", "sms_reminders", "statistics_advanced", "online_payment", "marketing", "shop", "wallet", "api_access", "webhooks", "white_label"]' WHERE name = 'custom';
