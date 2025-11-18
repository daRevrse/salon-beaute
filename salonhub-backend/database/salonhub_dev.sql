-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 18 nov. 2025 à 23:20
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `salonhub_dev`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin_activity_logs`
--

CREATE TABLE `admin_activity_logs` (
  `id` int(11) NOT NULL,
  `super_admin_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `resource_type` varchar(50) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL COMMENT 'Lien vers le salon',
  `client_id` int(11) NOT NULL COMMENT 'Client concerné',
  `service_id` int(11) NOT NULL COMMENT 'Prestation réservée',
  `staff_id` int(11) DEFAULT NULL COMMENT 'Employé assigné (optionnel)',
  `appointment_date` date NOT NULL COMMENT 'Date du RDV',
  `start_time` time NOT NULL COMMENT 'Heure de début',
  `end_time` time NOT NULL COMMENT 'Heure de fin',
  `status` enum('pending','confirmed','cancelled','completed','no_show') DEFAULT 'pending',
  `booked_by` enum('client','staff','admin') DEFAULT 'staff' COMMENT 'Qui a créé le RDV',
  `booking_source` enum('website','phone','walk_in','admin') DEFAULT 'admin',
  `notes` text DEFAULT NULL COMMENT 'Notes internes',
  `client_notes` text DEFAULT NULL COMMENT 'Demandes spéciales du client',
  `reminder_sent` tinyint(1) DEFAULT 0,
  `reminder_sent_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `payment_status` enum('pending','deposit_paid','paid','refunded') DEFAULT 'pending',
  `amount_paid` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL COMMENT 'Lien vers le salon',
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `preferred_contact_method` enum('email','sms','whatsapp','phone') DEFAULT 'email' COMMENT 'Moyen de contact préféré pour les notifications',
  `date_of_birth` date DEFAULT NULL COMMENT 'Date de naissance',
  `gender` enum('male','female','other') DEFAULT NULL COMMENT 'Genre',
  `notes` text DEFAULT NULL COMMENT 'Notes privées sur le client',
  `email_marketing_consent` tinyint(1) DEFAULT 0,
  `sms_marketing_consent` tinyint(1) DEFAULT 0,
  `total_appointments` int(11) DEFAULT 0 COMMENT 'Nombre total de RDV',
  `total_spent` decimal(10,2) DEFAULT 0.00 COMMENT 'Total dépensé',
  `last_visit_date` date DEFAULT NULL COMMENT 'Dernière visite',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `client_notifications`
--

CREATE TABLE `client_notifications` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `type` enum('manual','appointment_reminder','appointment_confirmation','marketing','other') DEFAULT 'manual',
  `subject` varchar(255) DEFAULT NULL COMMENT 'Sujet (pour emails)',
  `message` text NOT NULL,
  `send_via` enum('email','sms','both') NOT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `sent_by` int(11) DEFAULT NULL COMMENT 'ID de l utilisateur qui a envoyé',
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `marketing_campaigns`
--

CREATE TABLE `marketing_campaigns` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `campaign_type` enum('promotion','announcement','event','newsletter') NOT NULL DEFAULT 'promotion',
  `promotion_id` int(11) DEFAULT NULL,
  `target_audience` enum('all_clients','active_clients','inactive_clients','vip_clients','custom') DEFAULT 'all_clients',
  `custom_client_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_client_ids`)),
  `send_via_email` tinyint(1) DEFAULT 0,
  `send_via_sms` tinyint(1) DEFAULT 0,
  `send_via_whatsapp` tinyint(1) DEFAULT 0,
  `scheduled_for` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `total_recipients` int(11) DEFAULT 0,
  `emails_sent` int(11) DEFAULT 0,
  `sms_sent` int(11) DEFAULT 0,
  `whatsapp_sent` int(11) DEFAULT 0,
  `status` enum('draft','scheduled','sending','sent','failed') DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('percentage','fixed_amount','service_discount') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL,
  `applies_to` enum('all_services','specific_services','categories') DEFAULT 'all_services',
  `service_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`service_ids`)),
  `min_purchase_amount` decimal(10,2) DEFAULT NULL,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `usage_per_client` int(11) DEFAULT 1,
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_public` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `promotion_usages`
--

CREATE TABLE `promotion_usages` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `promotion_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `order_amount` decimal(10,2) NOT NULL,
  `used_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL COMMENT 'Lien vers le salon',
  `name` varchar(255) NOT NULL COMMENT 'Nom de la prestation',
  `description` text DEFAULT NULL COMMENT 'Description détaillée',
  `duration` int(11) NOT NULL COMMENT 'Durée en minutes',
  `price` decimal(10,2) NOT NULL COMMENT 'Prix en euros',
  `category` varchar(100) DEFAULT NULL COMMENT 'Catégorie (coupe, coloration, etc.)',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Service disponible à la réservation',
  `requires_deposit` tinyint(1) DEFAULT 0 COMMENT 'Nécessite un acompte',
  `deposit_amount` decimal(10,2) DEFAULT 0.00 COMMENT 'Montant de l acompte',
  `available_for_online_booking` tinyint(1) DEFAULT 1,
  `booking_count` int(11) DEFAULT 0 COMMENT 'Nombre de réservations',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_url` varchar(255) DEFAULT NULL COMMENT 'URL de l image de mise en avant du service'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL COMMENT 'Clé du paramètre',
  `setting_value` text DEFAULT NULL COMMENT 'Valeur du paramètre',
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `super_admins`
--

CREATE TABLE `super_admins` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Permissions système' CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Compte actif ou désactivé',
  `is_super` tinyint(1) DEFAULT 0 COMMENT 'Super admin avec tous les droits',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `login_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tenants`
--

CREATE TABLE `tenants` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Nom du salon',
  `slug` varchar(100) NOT NULL COMMENT 'URL-friendly identifier',
  `email` varchar(255) NOT NULL COMMENT 'Email principal du salon',
  `phone` varchar(20) DEFAULT NULL COMMENT 'Téléphone du salon',
  `address` text DEFAULT NULL COMMENT 'Adresse complète',
  `city` varchar(100) DEFAULT NULL COMMENT 'Ville',
  `postal_code` varchar(10) DEFAULT NULL COMMENT 'Code postal',
  `subscription_plan` enum('starter','professional','business') DEFAULT 'starter',
  `subscription_status` enum('trial','active','suspended','cancelled') DEFAULT 'trial',
  `trial_ends_at` datetime DEFAULT NULL COMMENT 'Fin de période d essai',
  `subscription_started_at` datetime DEFAULT NULL COMMENT 'Début abonnement payant',
  `stripe_customer_id` varchar(100) DEFAULT NULL COMMENT 'ID client Stripe',
  `stripe_subscription_id` varchar(100) DEFAULT NULL COMMENT 'ID subscription Stripe',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(3) DEFAULT 'EUR' COMMENT 'Devise utilisée par le salon (EUR, USD, GBP, CAD, CHF, MAD, XOF, XAF)',
  `logo_url` varchar(255) DEFAULT NULL COMMENT 'URL du logo du salon (icône/avatar)',
  `banner_url` varchar(255) DEFAULT NULL COMMENT 'URL de la bannière du salon'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `tenant_stats`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `tenant_stats` (
`tenant_id` int(11)
,`tenant_name` varchar(255)
,`total_clients` bigint(21)
,`total_services` bigint(21)
,`total_appointments` bigint(21)
,`total_staff` bigint(21)
,`subscription_status` enum('trial','active','suspended','cancelled')
,`subscription_plan` enum('starter','professional','business')
);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL COMMENT 'Lien vers le salon',
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('owner','admin','staff') DEFAULT 'staff' COMMENT 'owner=propriétaire, admin=manager, staff=employé',
  `working_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Horaires de travail par jour' CHECK (json_valid(`working_hours`)),
  `is_active` tinyint(1) DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `avatar_url` varchar(255) DEFAULT NULL COMMENT 'URL de l avatar de l employé'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la vue `tenant_stats`
--
DROP TABLE IF EXISTS `tenant_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `tenant_stats`  AS SELECT `t`.`id` AS `tenant_id`, `t`.`name` AS `tenant_name`, count(distinct `c`.`id`) AS `total_clients`, count(distinct `s`.`id`) AS `total_services`, count(distinct `a`.`id`) AS `total_appointments`, count(distinct `u`.`id`) AS `total_staff`, `t`.`subscription_status` AS `subscription_status`, `t`.`subscription_plan` AS `subscription_plan` FROM ((((`tenants` `t` left join `clients` `c` on(`t`.`id` = `c`.`tenant_id`)) left join `services` `s` on(`t`.`id` = `s`.`tenant_id`)) left join `appointments` `a` on(`t`.`id` = `a`.`tenant_id`)) left join `users` `u` on(`t`.`id` = `u`.`tenant_id`)) GROUP BY `t`.`id` ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_super_admin` (`super_admin_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_resource` (`resource_type`,`resource_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Index pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_date` (`appointment_date`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_staff` (`staff_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_datetime` (`appointment_date`,`start_time`);

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_last_name` (`last_name`),
  ADD KEY `idx_last_visit` (`last_visit_date`);

--
-- Index pour la table `client_notifications`
--
ALTER TABLE `client_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sent_by` (`sent_by`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_appointment` (`appointment_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Index pour la table `marketing_campaigns`
--
ALTER TABLE `marketing_campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_scheduled` (`scheduled_for`),
  ADD KEY `idx_type` (`campaign_type`);

--
-- Index pour la table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_code_per_tenant` (`tenant_id`,`code`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_dates` (`valid_from`,`valid_until`),
  ADD KEY `idx_code` (`code`);

--
-- Index pour la table `promotion_usages`
--
ALTER TABLE `promotion_usages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_promotion` (`promotion_id`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_used_at` (`used_at`);

--
-- Index pour la table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_price` (`price`);

--
-- Index pour la table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting_per_tenant` (`tenant_id`,`setting_key`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_key` (`setting_key`);

--
-- Index pour la table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_last_login` (`last_login_at`);

--
-- Index pour la table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_key` (`setting_key`),
  ADD KEY `idx_public` (`is_public`);

--
-- Index pour la table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_subscription_status` (`subscription_status`),
  ADD KEY `idx_tenants_currency` (`currency`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email_per_tenant` (`tenant_id`,`email`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_active` (`is_active`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `client_notifications`
--
ALTER TABLE `client_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `marketing_campaigns`
--
ALTER TABLE `marketing_campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `promotion_usages`
--
ALTER TABLE `promotion_usages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `super_admins`
--
ALTER TABLE `super_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `client_notifications`
--
ALTER TABLE `client_notifications`
  ADD CONSTRAINT `client_notifications_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_notifications_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_notifications_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `client_notifications_ibfk_4` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
