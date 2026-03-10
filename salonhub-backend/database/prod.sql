-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : mar. 27 jan. 2026 à 00:45
-- Version du serveur : 11.4.9-MariaDB-cll-lve
-- Version de PHP : 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `c2695552c_salonhub`
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

--
-- Déchargement des données de la table `admin_activity_logs`
--

INSERT INTO `admin_activity_logs` (`id`, `super_admin_id`, `action`, `resource_type`, `resource_id`, `description`, `metadata`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 10:38:34'),
(2, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 12:24:07'),
(3, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 14:58:46'),
(4, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-22 15:47:23'),
(5, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-03 16:59:14'),
(6, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-18 07:17:21'),
(7, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-07 13:12:14'),
(8, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-12 17:26:00'),
(9, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-12 18:55:27'),
(10, 1, 'impersonation_started', 'user', 2, 'Impersonation de Gilles GASSOU (gassougilles07@gmail.com) - Flowkraft Agency', '{\"reason\":\"Support client\",\"tenant_id\":2}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-12 18:56:48'),
(11, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-12 18:57:49'),
(12, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-13 17:05:53'),
(13, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 18:00:09'),
(14, 1, 'login', NULL, NULL, 'Connexion SuperAdmin', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-01-22 22:49:20');

-- --------------------------------------------------------

--
-- Structure de la table `admin_roles`
--

CREATE TABLE `admin_roles` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `is_super` tinyint(1) DEFAULT 0,
  `is_system_role` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `admin_sessions`
--

CREATE TABLE `admin_sessions` (
  `id` int(11) NOT NULL,
  `super_admin_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `alert_instances`
--

CREATE TABLE `alert_instances` (
  `id` int(11) NOT NULL,
  `alert_rule_id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `is_acknowledged` tinyint(1) DEFAULT 0,
  `acknowledged_by` int(11) DEFAULT NULL,
  `acknowledged_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `alert_rules`
--

CREATE TABLE `alert_rules` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `condition_type` varchar(100) NOT NULL,
  `condition_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`condition_config`)),
  `notification_channels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_channels`)),
  `is_active` tinyint(1) DEFAULT 1,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','error') DEFAULT 'info',
  `target_audience` enum('all','active','trial','suspended','specific_plan','specific_tenants') DEFAULT 'all',
  `target_plan` varchar(50) DEFAULT NULL,
  `target_tenant_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_tenant_ids`)),
  `is_active` tinyint(1) DEFAULT 1,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `api_performance_logs`
--

CREATE TABLE `api_performance_logs` (
  `id` int(11) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `response_time` int(11) NOT NULL COMMENT 'Response time in milliseconds',
  `status_code` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
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

--
-- Déchargement des données de la table `appointments`
--

INSERT INTO `appointments` (`id`, `tenant_id`, `client_id`, `service_id`, `staff_id`, `appointment_date`, `start_time`, `end_time`, `status`, `booked_by`, `booking_source`, `notes`, `client_notes`, `reminder_sent`, `reminder_sent_at`, `cancelled_at`, `cancellation_reason`, `payment_status`, `amount_paid`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, NULL, '2025-11-24', '09:30:00', '10:00:00', 'confirmed', 'client', 'website', NULL, NULL, 0, NULL, NULL, NULL, 'pending', 0.00, '2025-11-19 14:19:51', '2025-11-19 14:23:14'),
(3, 2, 1, 1, NULL, '2025-12-22', '20:30:00', '21:00:00', 'confirmed', 'client', 'website', NULL, NULL, 0, NULL, NULL, NULL, 'pending', 0.00, '2025-11-28 14:36:49', '2025-11-28 14:37:02'),
(4, 8, 3, 2, NULL, '2026-01-20', '12:15:00', '13:28:00', 'confirmed', 'client', 'website', NULL, NULL, 0, NULL, NULL, NULL, 'pending', 0.00, '2026-01-13 18:13:44', '2026-01-13 18:18:19'),
(5, 8, 4, 2, NULL, '2026-01-13', '20:15:00', '21:28:00', 'cancelled', 'client', 'website', NULL, NULL, 0, NULL, '2026-01-13 19:18:11', NULL, 'pending', 0.00, '2026-01-13 18:15:36', '2026-01-13 18:18:11'),
(6, 8, 4, 2, NULL, '2026-01-14', '13:46:00', '14:59:00', 'completed', 'client', 'website', NULL, NULL, 0, NULL, NULL, NULL, 'pending', 0.00, '2026-01-13 18:17:38', '2026-01-13 18:18:18'),
(7, 8, 4, 2, NULL, '2026-01-14', '19:16:00', '20:29:00', 'confirmed', 'client', 'website', NULL, NULL, 0, NULL, NULL, NULL, 'pending', 0.00, '2026-01-13 18:28:55', '2026-01-13 18:29:21');

-- --------------------------------------------------------

--
-- Structure de la table `billing_transactions`
--

CREATE TABLE `billing_transactions` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `status` enum('pending','succeeded','failed','refunded') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `stripe_payment_id` varchar(255) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `billing_period_start` date DEFAULT NULL,
  `billing_period_end` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `failed_reason` text DEFAULT NULL,
  `refunded_amount` decimal(10,2) DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `broadcast_emails`
--

CREATE TABLE `broadcast_emails` (
  `id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `recipients_filter` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recipients_filter`)),
  `target_count` int(11) DEFAULT 0,
  `sent_count` int(11) DEFAULT 0,
  `opened_count` int(11) DEFAULT 0,
  `clicked_count` int(11) DEFAULT 0,
  `bounced_count` int(11) DEFAULT 0,
  `status` enum('draft','scheduled','sending','sent','failed') DEFAULT 'draft',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
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

--
-- Déchargement des données de la table `clients`
--

INSERT INTO `clients` (`id`, `tenant_id`, `first_name`, `last_name`, `email`, `phone`, `preferred_contact_method`, `date_of_birth`, `gender`, `notes`, `email_marketing_consent`, `sms_marketing_consent`, `total_appointments`, `total_spent`, `last_visit_date`, `created_at`, `updated_at`) VALUES
(1, 2, 'Flora', 'NOUDOUKOU', 'fnoudoukou@bostonsolux.com', '+15718646921', 'email', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2025-11-19 14:19:51', '2025-11-19 14:19:51'),
(2, 5, 'Comlan Senam G-C', 'GASSOU', 'gassougilles07@gmail.com', '+22893231346', 'email', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2025-11-22 00:54:05', '2025-11-22 00:54:05'),
(3, 8, 'Flora', 'NOUDOUKOU', 'fnoudoukou@bostonsolux.com', '+15718646921', 'phone', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2026-01-13 18:13:44', '2026-01-13 18:13:44'),
(4, 8, 'Comlan Senam Gilles-Christ', 'GASSOU', 'gassougilles07@gmail.com', '+22893231346', 'email', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2026-01-13 18:15:36', '2026-01-13 18:28:55'),
(5, 10, 'qm', 'qm', 'qm@ok.com', '55555555', 'email', NULL, NULL, '<iframe src=\"javascript:alert(\'I_M_4040\')\">', 0, 0, 0, 0.00, NULL, '2026-01-16 14:44:34', '2026-01-16 14:44:34'),
(6, 10, 'qf', 'qf', 'qf@ok.com', '55555555', 'email', NULL, NULL, '<iframe src=\"javascript:alert(\'I_M_404\')\">', 0, 0, 0, 0.00, NULL, '2026-01-16 14:47:24', '2026-01-16 14:47:24'),
(7, 10, 't', 't', 'o@o.com', '\'', 'email', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2026-01-16 15:34:59', '2026-01-16 15:35:54'),
(8, 10, 'c', 'c', 'cc@ok.com', 'cc', 'email', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2026-01-16 16:21:06', '2026-01-16 16:21:06'),
(9, 10, 'b', 'b', 'b@b', 'b', 'email', NULL, NULL, '<>', 0, 0, 0, 0.00, NULL, '2026-01-16 16:47:31', '2026-01-16 16:47:31'),
(10, 10, 't', 't', 't@t', 't', 'email', NULL, NULL, 't', 0, 0, 0, 0.00, NULL, '2026-01-16 16:51:39', '2026-01-16 16:51:39'),
(11, 10, 't', 't', 't@', 't', 'email', NULL, NULL, 't', 0, 0, 0, 0.00, NULL, '2026-01-16 16:52:49', '2026-01-16 16:52:49'),
(12, 10, 'y', 'y', NULL, NULL, 'email', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, '2026-01-16 16:54:22', '2026-01-16 16:54:22');

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

--
-- Déchargement des données de la table `client_notifications`
--

INSERT INTO `client_notifications` (`id`, `tenant_id`, `client_id`, `appointment_id`, `type`, `subject`, `message`, `send_via`, `status`, `sent_by`, `sent_at`, `created_at`) VALUES
(1, 2, 1, 1, 'appointment_confirmation', 'Confirmation de rendez-vous', 'Rendez-vous confirmé le lundi 24 novembre 2025 à 09:30', '', 'sent', 2, '2025-11-19 16:23:33', '2025-11-19 16:23:33'),
(2, 8, 4, 7, 'appointment_confirmation', 'Confirmation de rendez-vous', 'Rendez-vous confirmé le mercredi 14 janvier 2026 à 19:16', 'email', 'sent', 9, '2026-01-13 21:57:38', '2026-01-13 21:57:38'),
(3, 8, 4, NULL, '', 'Mise à jour de votre rendez-vous', 'Bonjour', 'both', 'sent', 9, NULL, '2026-01-13 21:58:26'),
(4, 10, 6, NULL, 'manual', NULL, '<script>javascript:alert(\'Y_R_HCKD\')</script>', 'sms', 'sent', 14, NULL, '2026-01-16 15:54:23');

-- --------------------------------------------------------

--
-- Structure de la table `email_deliveries`
--

CREATE TABLE `email_deliveries` (
  `id` int(11) NOT NULL,
  `broadcast_email_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `status` enum('pending','sent','delivered','opened','clicked','bounced','failed') DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `failed_login_attempts`
--

CREATE TABLE `failed_login_attempts` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `feature_flags`
--

CREATE TABLE `feature_flags` (
  `id` int(11) NOT NULL,
  `flag_key` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `rollout_percentage` int(11) DEFAULT 0 CHECK (`rollout_percentage` between 0 and 100),
  `target_tenants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_tenants`)),
  `environment` enum('development','staging','production','all') DEFAULT 'all',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `feature_flag_checks`
--

CREATE TABLE `feature_flag_checks` (
  `id` int(11) NOT NULL,
  `feature_flag_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `was_enabled` tinyint(1) NOT NULL,
  `checked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `impersonation_sessions`
--

CREATE TABLE `impersonation_sessions` (
  `id` int(11) NOT NULL,
  `super_admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `reason` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `impersonation_sessions`
--

INSERT INTO `impersonation_sessions` (`id`, `super_admin_id`, `user_id`, `tenant_id`, `token_hash`, `reason`, `ip_address`, `user_agent`, `started_at`, `ended_at`, `last_activity`, `expires_at`, `is_active`) VALUES
(1, 1, 2, 2, 'f1464a3a8510006998288bd4f4db452c11e702c0ce4684aaefde95aeda631a4d', 'Support client', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-12 18:56:48', NULL, '2026-01-12 18:56:48', '2026-01-12 19:56:48', 1);

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
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tokens de réinitialisation de mot de passe avec expiration et tracking';

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
-- Structure de la table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `endpoint` text NOT NULL,
  `p256dh_key` varchar(255) NOT NULL,
  `auth_key` varchar(255) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reminder_logs`
--

CREATE TABLE `reminder_logs` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `reminder_type` enum('24h_before','2h_before','1h_before','confirmation') NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT current_timestamp(),
  `channel` enum('email','sms','push') NOT NULL,
  `status` enum('sent','failed') NOT NULL DEFAULT 'sent',
  `error_message` text DEFAULT NULL
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

--
-- Déchargement des données de la table `services`
--

INSERT INTO `services` (`id`, `tenant_id`, `name`, `description`, `duration`, `price`, `category`, `is_active`, `requires_deposit`, `deposit_amount`, `available_for_online_booking`, `booking_count`, `created_at`, `updated_at`, `image_url`) VALUES
(1, 2, 'Coupe Tendance', 'Error excepturi est ', 30, 2000.00, 'coupe', 1, 0, 0.00, 1, 0, '2025-11-18 22:32:33', '2025-11-18 22:33:51', 'https://api.salonhub.flowkraftagency.com/api/uploads/services/2-1763508829656-197995176.jpg'),
(2, 8, 'Hayfa Walters', 'Nam animi necessita', 73, 110.00, 'Omnis repellendus S', 1, 0, 0.00, 1, 0, '2026-01-13 18:07:18', '2026-01-13 18:07:48', '/uploads/services/8-1768327633006-570904676.png'),
(3, 9, 'Coupe Simple', NULL, 30, 1.53, 'coupe', 1, 0, 0.00, 1, 0, '2026-01-13 22:41:15', '2026-01-13 22:42:59', NULL),
(4, 9, 'Contours', NULL, 10, 1.00, NULL, 1, 0, 0.00, 1, 0, '2026-01-13 22:43:27', '2026-01-13 22:43:27', NULL),
(5, 9, 'Couple + Teinte Noire', NULL, 45, 4.06, NULL, 1, 0, 0.00, 1, 0, '2026-01-13 22:44:08', '2026-01-13 22:44:08', NULL);

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

--
-- Déchargement des données de la table `settings`
--

INSERT INTO `settings` (`id`, `tenant_id`, `setting_key`, `setting_value`, `setting_type`, `created_at`, `updated_at`) VALUES
(1, 1, 'business_hours', '{\"monday\":\"09:00-18:00\",\"tuesday\":\"09:00-18:00\",\"wednesday\":\"09:00-18:00\",\"thursday\":\"09:00-18:00\",\"friday\":\"09:00-18:00\",\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2025-11-18 21:56:48', '2025-11-18 21:56:48'),
(2, 1, 'appointment_buffer', '15', 'number', '2025-11-18 21:56:48', '2025-11-18 21:56:48'),
(3, 1, 'require_email_confirmation', 'true', 'boolean', '2025-11-18 21:56:48', '2025-11-18 21:56:48'),
(4, 2, 'business_hours', '{\"monday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"tuesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"wednesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"thursday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"friday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"saturday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"7\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"sunday\":{\"0\":\"c\",\"1\":\"l\",\"2\":\"o\",\"3\":\"s\",\"4\":\"e\",\"5\":\"d\",\"closed\":true}}', 'json', '2025-11-18 22:13:47', '2025-11-22 00:41:31'),
(5, 2, 'appointment_buffer', '15', 'number', '2025-11-18 22:13:47', '2025-11-18 22:13:47'),
(6, 2, 'require_email_confirmation', 'true', 'boolean', '2025-11-18 22:13:47', '2025-11-18 22:13:47'),
(7, 3, 'business_hours', '{\"monday\":\"09:00-18:00\",\"tuesday\":\"09:00-18:00\",\"wednesday\":\"09:00-18:00\",\"thursday\":\"09:00-18:00\",\"friday\":\"09:00-18:00\",\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2025-11-19 12:53:11', '2025-11-19 12:53:11'),
(8, 3, 'appointment_buffer', '15', 'number', '2025-11-19 12:53:11', '2025-11-19 12:53:11'),
(9, 3, 'require_email_confirmation', 'true', 'boolean', '2025-11-19 12:53:11', '2025-11-19 12:53:11'),
(10, 2, 'slot_duration', '30', 'number', '2025-11-19 14:05:56', '2025-11-22 00:41:31'),
(11, 2, 'currency', 'XOF', 'string', '2025-11-19 14:05:56', '2025-11-22 00:41:31'),
(12, 4, 'business_hours', '{\"monday\":\"09:00-18:00\",\"tuesday\":\"09:00-18:00\",\"wednesday\":\"09:00-18:00\",\"thursday\":\"09:00-18:00\",\"friday\":\"09:00-18:00\",\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2025-11-19 18:33:27', '2025-11-19 18:33:27'),
(13, 4, 'appointment_buffer', '15', 'number', '2025-11-19 18:33:27', '2025-11-19 18:33:27'),
(14, 4, 'require_email_confirmation', 'true', 'boolean', '2025-11-19 18:33:27', '2025-11-19 18:33:27'),
(15, 5, 'business_hours', '{\"monday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"tuesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"wednesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"thursday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"friday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"closed\":true},\"saturday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"7\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"12:30\",\"close\":\"22:30\"},\"sunday\":{\"0\":\"c\",\"1\":\"l\",\"2\":\"o\",\"3\":\"s\",\"4\":\"e\",\"5\":\"d\",\"open\":\"12:30\",\"close\":\"22:30\"}}', 'json', '2025-11-22 00:50:42', '2025-11-22 01:10:57'),
(16, 5, 'appointment_buffer', '15', 'number', '2025-11-22 00:50:42', '2025-11-22 00:50:42'),
(17, 5, 'require_email_confirmation', 'true', 'boolean', '2025-11-22 00:50:42', '2025-11-22 00:50:42'),
(18, 5, 'slot_duration', '30', 'number', '2025-11-22 00:51:37', '2025-11-22 01:10:57'),
(19, 5, 'currency', 'EUR', 'string', '2025-11-22 00:51:37', '2025-11-22 01:10:57'),
(20, 6, 'business_hours', '{\"monday\":\"09:00-18:00\",\"tuesday\":\"09:00-18:00\",\"wednesday\":\"09:00-18:00\",\"thursday\":\"09:00-18:00\",\"friday\":\"09:00-18:00\",\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2025-11-26 22:50:12', '2025-11-26 22:50:12'),
(21, 6, 'appointment_buffer', '15', 'number', '2025-11-26 22:50:12', '2025-11-26 22:50:12'),
(22, 6, 'require_email_confirmation', 'true', 'boolean', '2025-11-26 22:50:12', '2025-11-26 22:50:12'),
(23, 7, 'business_hours', '{\"monday\":\"09:00-18:00\",\"tuesday\":\"09:00-18:00\",\"wednesday\":\"09:00-18:00\",\"thursday\":\"09:00-18:00\",\"friday\":\"09:00-18:00\",\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2026-01-07 09:41:01', '2026-01-07 09:41:01'),
(24, 7, 'appointment_buffer', '15', 'number', '2026-01-07 09:41:01', '2026-01-07 09:41:01'),
(25, 7, 'require_email_confirmation', 'true', 'boolean', '2026-01-07 09:41:01', '2026-01-07 09:41:01'),
(26, 8, 'business_hours', '{\"monday\":\"09:00-18:00\",\"tuesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"06:15\",\"close\":\"22:15\"},\"wednesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"00:16\",\"close\":\"22:17\"},\"thursday\":\"09:00-18:00\",\"friday\":\"09:00-18:00\",\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2026-01-13 15:44:12', '2026-01-13 18:28:09'),
(27, 8, 'appointment_buffer', '15', 'number', '2026-01-13 15:44:12', '2026-01-13 15:44:12'),
(28, 8, 'require_email_confirmation', 'true', 'boolean', '2026-01-13 15:44:12', '2026-01-13 15:44:12'),
(29, 8, 'slot_duration', '30', 'number', '2026-01-13 17:31:06', '2026-01-13 18:28:09'),
(30, 8, 'currency', 'EUR', 'string', '2026-01-13 17:31:06', '2026-01-13 18:28:09'),
(31, 9, 'business_hours', '{\"monday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"06:00\",\"close\":\"20:00\"},\"tuesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"wednesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"thursday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"friday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"saturday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"7\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"09:00\",\"close\":\"21:00\"},\"sunday\":{\"0\":\"c\",\"1\":\"l\",\"2\":\"o\",\"3\":\"s\",\"4\":\"e\",\"5\":\"d\",\"open\":\"09:00\",\"close\":\"21:00\"}}', 'json', '2026-01-13 22:36:49', '2026-01-13 22:40:26'),
(32, 9, 'appointment_buffer', '15', 'number', '2026-01-13 22:36:49', '2026-01-13 22:36:49'),
(33, 9, 'require_email_confirmation', 'true', 'boolean', '2026-01-13 22:36:49', '2026-01-13 22:36:49'),
(34, 9, 'slot_duration', '30', 'number', '2026-01-13 22:38:44', '2026-01-13 22:40:26'),
(35, 9, 'currency', 'XOF', 'string', '2026-01-13 22:38:44', '2026-01-13 22:40:26'),
(36, 10, 'business_hours', '{\"monday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"07:00\",\"close\":\"17:00\"},\"tuesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"07:00\",\"close\":\"17:00\"},\"wednesday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"07:00\",\"close\":\"17:00\"},\"thursday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"07:00\",\"close\":\"17:00\"},\"friday\":{\"0\":\"0\",\"1\":\"9\",\"2\":\":\",\"3\":\"0\",\"4\":\"0\",\"5\":\"-\",\"6\":\"1\",\"7\":\"8\",\"8\":\":\",\"9\":\"0\",\"10\":\"0\",\"open\":\"07:00\",\"close\":\"07:00\"},\"saturday\":\"09:00-17:00\",\"sunday\":\"closed\"}', 'json', '2026-01-15 17:47:04', '2026-01-16 16:44:58'),
(37, 10, 'appointment_buffer', '15', 'number', '2026-01-15 17:47:04', '2026-01-15 17:47:04'),
(38, 10, 'require_email_confirmation', 'true', 'boolean', '2026-01-15 17:47:04', '2026-01-15 17:47:04'),
(39, 10, 'slot_duration', '30', 'number', '2026-01-15 17:53:19', '2026-01-16 16:44:58'),
(40, 10, 'currency', 'USD', 'string', '2026-01-15 17:53:19', '2026-01-16 16:44:58');

-- --------------------------------------------------------

--
-- Structure de la table `slow_query_logs`
--

CREATE TABLE `slow_query_logs` (
  `id` int(11) NOT NULL,
  `query_hash` varchar(64) NOT NULL,
  `query_text` text NOT NULL,
  `execution_time` decimal(10,3) NOT NULL COMMENT 'Execution time in seconds',
  `rows_examined` int(11) DEFAULT NULL,
  `rows_sent` int(11) DEFAULT NULL,
  `database_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `storage_usage`
--

CREATE TABLE `storage_usage` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `total_bytes` bigint(20) NOT NULL,
  `files_count` int(11) DEFAULT 0,
  `last_calculated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `subscription_changes`
--

CREATE TABLE `subscription_changes` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `previous_plan` varchar(50) DEFAULT NULL,
  `new_plan` varchar(50) NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `change_type` enum('upgrade','downgrade','cancelled','reactivated','trial_started','trial_converted') NOT NULL,
  `mrr_change` decimal(10,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `effective_date` date NOT NULL,
  `initiated_by` enum('customer','admin','system') DEFAULT 'system',
  `admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
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
  `role_id` int(11) DEFAULT NULL,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`backup_codes`)),
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Compte actif ou désactivé',
  `is_super` tinyint(1) DEFAULT 0 COMMENT 'Super admin avec tous les droits',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `login_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `super_admins`
--

INSERT INTO `super_admins` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `permissions`, `role_id`, `two_factor_secret`, `two_factor_enabled`, `backup_codes`, `is_active`, `is_super`, `last_login_at`, `last_login_ip`, `login_count`, `created_at`, `updated_at`) VALUES
(1, 'su-admin@salonhub.flowkraftagency.com', '$2b$10$of4GKya9BzFznM7851NS7eWrJesARjgcqtl..SfMuT/lO6XLtAeny', 'Gilles', 'GASSOU', NULL, '{\"tenants\":{\"view\":true,\"create\":true,\"edit\":true,\"suspend\":true,\"delete\":true},\"analytics\":{\"view_global\":true,\"view_tenant\":true,\"export\":true},\"impersonate\":{\"enabled\":true,\"require_2fa\":false},\"billing\":{\"view\":true,\"modify\":true},\"system\":{\"view_logs\":true,\"manage_admins\":true,\"manage_settings\":true}}', NULL, NULL, 0, NULL, 1, 1, '2026-01-22 23:49:20', '127.0.0.1', 13, '2025-11-19 10:31:15', '2026-01-22 22:49:20');

-- --------------------------------------------------------

--
-- Structure de la table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL,
  `ticket_number` varchar(50) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('open','in_progress','waiting_customer','resolved','closed') DEFAULT 'open',
  `category` varchar(100) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `first_response_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `satisfaction_rating` tinyint(4) DEFAULT NULL CHECK (`satisfaction_rating` between 1 and 5),
  `satisfaction_comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `system_error_logs`
--

CREATE TABLE `system_error_logs` (
  `id` int(11) NOT NULL,
  `error_type` varchar(100) NOT NULL,
  `error_message` text NOT NULL,
  `error_stack` text DEFAULT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `endpoint` varchar(255) DEFAULT NULL,
  `method` varchar(10) DEFAULT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_body`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `resolved` tinyint(1) DEFAULT 0,
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `system_health_checks`
--

CREATE TABLE `system_health_checks` (
  `id` int(11) NOT NULL,
  `check_type` varchar(100) NOT NULL COMMENT 'database, redis, email, storage, etc.',
  `status` enum('healthy','degraded','down') NOT NULL,
  `response_time` int(11) DEFAULT NULL COMMENT 'Response time in milliseconds',
  `error_message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `checked_at` timestamp NOT NULL DEFAULT current_timestamp()
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

--
-- Déchargement des données de la table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'maintenance_mode', 'false', 'boolean', 'Mode maintenance du SaaS', 0, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23'),
(2, 'allow_new_signups', 'true', 'boolean', 'Autoriser les nouvelles inscriptions', 0, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23'),
(3, 'trial_duration_days', '14', 'number', 'Durée de la période d essai en jours', 0, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23'),
(4, 'max_tenants', '1000', 'number', 'Nombre maximum de tenants autorisés', 0, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23'),
(5, 'default_subscription_plan', 'starter', 'string', 'Plan par défaut lors de l inscription', 0, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23'),
(6, 'support_email', 'support@salonhub.com', 'string', 'Email de support', 1, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23'),
(7, 'app_version', '2.0.0', 'string', 'Version de l application', 1, NULL, '2025-11-18 21:37:23', '2025-11-18 21:37:23');

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
  `onboarding_status` enum('signup','setup','services_added','staff_invited','first_client','first_appointment','completed') DEFAULT 'signup',
  `onboarding_completed_at` timestamp NULL DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL COMMENT 'Fin de période d essai',
  `trial_converted` tinyint(1) DEFAULT 0,
  `mrr` decimal(10,2) DEFAULT 0.00,
  `last_payment_at` timestamp NULL DEFAULT NULL,
  `payment_failed_count` int(11) DEFAULT 0,
  `subscription_started_at` datetime DEFAULT NULL COMMENT 'Début abonnement payant',
  `stripe_customer_id` varchar(100) DEFAULT NULL COMMENT 'ID client Stripe',
  `stripe_subscription_id` varchar(100) DEFAULT NULL COMMENT 'ID subscription Stripe',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(3) DEFAULT 'EUR' COMMENT 'Devise utilisée par le salon (EUR, USD, GBP, CAD, CHF, MAD, XOF, XAF)',
  `logo_url` varchar(255) DEFAULT NULL COMMENT 'URL du logo du salon (icône/avatar)',
  `banner_url` varchar(255) DEFAULT NULL COMMENT 'URL de la bannière du salon'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `slug`, `email`, `phone`, `address`, `city`, `postal_code`, `subscription_plan`, `subscription_status`, `onboarding_status`, `onboarding_completed_at`, `trial_ends_at`, `trial_converted`, `mrr`, `last_payment_at`, `payment_failed_count`, `subscription_started_at`, `stripe_customer_id`, `stripe_subscription_id`, `created_at`, `updated_at`, `currency`, `logo_url`, `banner_url`) VALUES
(1, 'Mon Salon Test', 'mon-salon-test', 'contact@monsalon.fr', '0123456789', '123 Rue de Test', 'Paris', '75001', 'professional', 'trial', 'signup', NULL, '2025-12-02 23:56:48', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2025-11-18 21:56:48', '2025-11-18 21:56:48', 'EUR', NULL, NULL),
(2, 'Flowkraft Agency', 'flowkraft-agency', 'info@flowkraftagency.com', '+228 93 23 13 46', 'Kpogan', 'Lomé', '75001', 'professional', 'trial', 'signup', NULL, '2025-12-03 00:13:47', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2025-11-18 22:13:47', '2025-11-22 00:41:31', 'XOF', 'https://api.salonhub.flowkraftagency.com/api/uploads/tenants/2-1763564795804-732512241.jpg', NULL),
(3, 'GIRL’S DREAM', 'girl-s-dream', 'girlsdream228@gmail.com', '92773954', 'Agbalepedo cours lumière ', 'Lomé ', NULL, 'professional', 'trial', 'signup', NULL, '2025-12-03 14:53:11', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2025-11-19 12:53:11', '2025-11-19 12:53:11', 'EUR', NULL, NULL),
(4, 'Salon Develo', 'salon-develo', 'megazouma08@gmail.com', '92235335', 'Agbalépedo', 'Lomé', '3842', 'professional', 'trial', 'signup', NULL, '2025-12-03 20:33:27', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2025-11-19 18:33:27', '2025-11-19 18:33:27', 'EUR', NULL, NULL),
(5, 'Bob Marley ', 'bob-marley', 'bobmarley@gmail.com', '93231346', '123 rue de la beuh', 'Lome', '101010', 'professional', 'trial', 'signup', NULL, '2025-12-06 02:50:42', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2025-11-22 00:50:42', '2025-11-22 01:10:57', 'EUR', 'https://api.salonhub.flowkraftagency.com/api/uploads/tenants/5-1763777449070-527258369.jpg', NULL),
(6, 'OPS CORPORATION', 'ops-corporation', 'maatheykaka@gmail.com', '0022893914694', NULL, NULL, NULL, 'professional', 'trial', 'signup', NULL, '2025-12-11 00:50:12', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2025-11-26 22:50:12', '2025-11-26 22:50:12', 'EUR', NULL, NULL),
(7, 'Kristen Leblanc', 'kristen-leblanc', 'quqacygi@mailinator.com', '+1 (894) 215-2635', 'Rerum omnis ad ullam', 'Quia quisquam tempor', 'Quisquam a', 'professional', 'trial', 'signup', NULL, '2026-01-21 11:41:01', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2026-01-07 09:41:01', '2026-01-07 09:41:01', 'EUR', NULL, NULL),
(8, 'JFK', 'jfk', 'ggassou@bostonsolux.com', '93231346', 'Kpogan', 'Lomé', '75001', 'professional', 'trial', 'signup', NULL, '2026-01-27 16:44:12', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2026-01-13 15:44:12', '2026-01-13 18:06:47', 'EUR', '/uploads/tenants/8-1768326814210-421534373.png', '/uploads/tenants/8-1768327604050-656913083.png'),
(9, 'D’ Empire', 'd-empire', 'thierrydiallo40@gmail.com', '91196614', 'Agoe', 'Lome', NULL, '', 'trial', 'signup', NULL, '2026-01-27 23:36:49', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2026-01-13 22:36:49', '2026-01-13 22:40:26', 'XOF', NULL, NULL),
(10, 'ok', 'ok', 'ok@ok.com', '', '', NULL, NULL, 'professional', 'trial', 'signup', NULL, '2026-01-29 18:47:04', 0, 0.00, NULL, 0, NULL, NULL, NULL, '2026-01-15 17:47:04', '2026-01-15 17:53:19', 'USD', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `tenant_feature_overrides`
--

CREATE TABLE `tenant_feature_overrides` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `feature_flag_id` int(11) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
-- Structure de la table `ticket_counter`
--

CREATE TABLE `ticket_counter` (
  `id` int(11) NOT NULL DEFAULT 1,
  `current_number` int(11) NOT NULL DEFAULT 1000
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `author_type` enum('customer','admin','system') NOT NULL,
  `author_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `working_hours`, `is_active`, `last_login_at`, `created_at`, `updated_at`, `avatar_url`) VALUES
(1, 1, 'bob@monsalon.fr', '$2b$10$tZ6T52D8kBls24NNqWNHoejYgWKfhjlE5475VddxgaUpRcyqHUlaO', 'Marie', 'Dupont', NULL, 'owner', NULL, 1, '2025-11-19 00:12:07', '2025-11-18 21:56:48', '2025-11-18 22:12:07', NULL),
(2, 2, 'gassougilles07@gmail.com', '$2b$10$ZZVbQMdTomAWoPk1CIu/L.TAhurqLvQ9OqlS2qocwZ1SI8dWrHgX6', 'Gilles', 'GASSOU', NULL, 'owner', NULL, 1, '2025-11-23 02:10:31', '2025-11-18 22:13:47', '2025-11-23 00:10:31', NULL),
(3, 3, 'hannah.sam206@gmail.com', '$2b$10$kCdAjSOQqbTy33eD7vQyUuOWjey5vgH/g74fQUjOskel4Aq9EZRUS', 'Hannah', 'AMESSOUDJI SAM', NULL, 'owner', NULL, 1, NULL, '2025-11-19 12:53:11', '2025-11-19 12:53:11', NULL),
(4, 4, 'megazouma08@gmail.com', '$2b$10$adxBreVk.jpopmSfMm3FkOjEOYzZJbb7K9iZLakxqXvDMzmDrHQr2', 'Roseline Megane', 'AZOUMA', NULL, 'owner', NULL, 1, NULL, '2025-11-19 18:33:27', '2025-11-19 18:33:27', NULL),
(5, 5, 'test@flowkraftagency.com', '$2b$10$CHU4Ldx6qDzzvQzZ/h/YBeWy8HU47ER2Lr31Lfm6xrZ3HB9UgQTrq', 'Gilles ', 'Nogaro ', NULL, 'owner', NULL, 1, '2025-11-22 03:05:59', '2025-11-22 00:50:42', '2025-11-22 01:05:59', NULL),
(6, 5, 'comlansenam@gmail.com', '$2b$10$q5by6lyppdm6pa0L.X/pOe2EofXWgQZKSdJsD1EMJnerB24ZHQ2Km', 'NOUVI-TEVI', 'Dédé', '06415501', 'staff', NULL, 1, NULL, '2025-11-22 00:58:30', '2025-11-22 00:58:30', NULL),
(7, 6, 'maatheykaka@gmail.com', '$2b$10$dYRL0nm9k6hAhnHlJv6OeeSUPsUCdc4f5qenC1xW6TwzlRWRcyFy6', 'Caringthon', 'Maathey', NULL, 'owner', NULL, 1, NULL, '2025-11-26 22:50:12', '2025-11-26 22:50:12', NULL),
(8, 7, 'rubulovi@mailinator.com', '$2b$10$zxQzVY/HIURF3gqzSagM2e8sh61EOEtqFuNdq5vPk.HYjBA6tonI.', 'Ulysses', 'Pittman', NULL, 'owner', NULL, 1, NULL, '2026-01-07 09:41:01', '2026-01-07 09:41:01', NULL),
(9, 8, 'ggassou@bostonsolux.com', '$2b$10$ZfFPfGq6pMVsYQ0mWDu0BOPMbvjRZcJu4DoE6ePU0gnc26luXezgW', 'Gilles', 'Gassou', '', 'owner', NULL, 1, '2026-01-13 18:55:13', '2026-01-13 15:44:12', '2026-01-13 18:27:28', '/uploads/users/8-1768328843788-318507631.png'),
(10, 9, 'thierrydiallo40@gmail.com', '$2b$10$sl9okLuoWNXfs1761hOqQukHm8Vqpc6yOuOfRXwQqqhdndJyc51vK', 'Judes', 'DIALLO', NULL, 'owner', NULL, 1, NULL, '2026-01-13 22:36:49', '2026-01-13 22:36:49', NULL),
(11, 10, 'ok@ok.com', '$2b$10$ILU8kbO.7lTgQypa/7qbMeWVQ1lsShFOzkYHJYfzw7XMm.dFWZbse', 'ok', 'ok', NULL, 'owner', NULL, 1, '2026-01-16 17:23:28', '2026-01-15 17:47:04', '2026-01-16 16:23:28', NULL),
(12, 10, 'ko@ok.com', '$2b$10$Py.a1SbOo1ioavKd/jzGQeyCsXMmSDEvf0DgJGwK93Lq3FMJai.Ja', 'ko ko', 'ko', '88888888', 'admin', NULL, 1, NULL, '2026-01-16 11:07:25', '2026-01-16 16:27:08', NULL),
(13, 10, 'hacker@ok.com', '$2b$10$UOnKNSQ6F4sZwhVoRf9QR.Qgx7KeJAyQScG3BA5LsrjlWtV8El8Pm', 'h k', 'hk', '88888888', 'admin', NULL, 1, '2026-01-16 18:04:30', '2026-01-16 11:54:09', '2026-01-16 17:04:30', NULL),
(14, 10, 'hacker1@ok.com', '$2b$10$GUFZhV0Ha8fA1uaOf5ydOOqr6r/UmvWodI5bo6JuTYR1OEKVnlWlS', 'h1  k', 'h1k', '00000000', 'staff', NULL, 1, '2026-01-16 18:29:46', '2026-01-16 11:55:01', '2026-01-16 17:29:46', ''),
(15, 10, 'hhhkkk@ok', '$2b$10$l5dI.f3GWd/wu3emLfXU5OkLwUSWsj.egezhx.CMN9Ejh2JNjz9ji', 'H', 'H', '\'', 'staff', NULL, 1, '2026-01-16 18:00:51', '2026-01-16 16:44:27', '2026-01-16 17:00:51', NULL);

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
-- Index pour la table `admin_roles`
--
ALTER TABLE `admin_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`);

--
-- Index pour la table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token_hash` (`token_hash`),
  ADD KEY `idx_super_admin_active` (`super_admin_id`,`is_active`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Index pour la table `alert_instances`
--
ALTER TABLE `alert_instances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `acknowledged_by` (`acknowledged_by`),
  ADD KEY `idx_rule_created` (`alert_rule_id`,`created_at`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_acknowledged` (`is_acknowledged`,`created_at`),
  ADD KEY `idx_severity` (`severity`,`created_at`);

--
-- Index pour la table `alert_rules`
--
ALTER TABLE `alert_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_condition_type` (`condition_type`);

--
-- Index pour la table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_active_dates` (`is_active`,`start_date`,`end_date`),
  ADD KEY `idx_target` (`target_audience`);

--
-- Index pour la table `api_performance_logs`
--
ALTER TABLE `api_performance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_endpoint_time` (`endpoint`,`created_at`),
  ADD KEY `idx_slow_queries` (`response_time`,`created_at`),
  ADD KEY `idx_errors` (`status_code`,`created_at`);

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
-- Index pour la table `billing_transactions`
--
ALTER TABLE `billing_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `idx_tenant_status` (`tenant_id`,`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_invoice_number` (`invoice_number`);

--
-- Index pour la table `broadcast_emails`
--
ALTER TABLE `broadcast_emails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_scheduled` (`scheduled_at`);

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
-- Index pour la table `email_deliveries`
--
ALTER TABLE `email_deliveries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_broadcast` (`broadcast_email_id`,`status`),
  ADD KEY `idx_tenant` (`tenant_id`);

--
-- Index pour la table `failed_login_attempts`
--
ALTER TABLE `failed_login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_time` (`email`,`attempted_at`),
  ADD KEY `idx_ip_time` (`ip_address`,`attempted_at`);

--
-- Index pour la table `feature_flags`
--
ALTER TABLE `feature_flags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `flag_key` (`flag_key`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_flag_key` (`flag_key`),
  ADD KEY `idx_enabled` (`is_enabled`);

--
-- Index pour la table `feature_flag_checks`
--
ALTER TABLE `feature_flag_checks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_flag_tenant` (`feature_flag_id`,`tenant_id`,`checked_at`),
  ADD KEY `idx_checked_at` (`checked_at`);

--
-- Index pour la table `impersonation_sessions`
--
ALTER TABLE `impersonation_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_token_hash` (`token_hash`),
  ADD KEY `idx_super_admin` (`super_admin_id`,`is_active`),
  ADD KEY `idx_expires` (`expires_at`,`is_active`);

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
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `tenant_id` (`tenant_id`);

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
-- Index pour la table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_endpoint` (`endpoint`(255));

--
-- Index pour la table `reminder_logs`
--
ALTER TABLE `reminder_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reminder` (`appointment_id`,`reminder_type`,`channel`),
  ADD KEY `idx_appointment` (`appointment_id`),
  ADD KEY `idx_tenant` (`tenant_id`),
  ADD KEY `idx_sent_at` (`sent_at`),
  ADD KEY `client_id` (`client_id`);

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
-- Index pour la table `slow_query_logs`
--
ALTER TABLE `slow_query_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hash` (`query_hash`),
  ADD KEY `idx_execution_time` (`execution_time`,`created_at`);

--
-- Index pour la table `storage_usage`
--
ALTER TABLE `storage_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_id`,`last_calculated_at`);

--
-- Index pour la table `subscription_changes`
--
ALTER TABLE `subscription_changes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `idx_tenant_date` (`tenant_id`,`effective_date`),
  ADD KEY `idx_change_type` (`change_type`);

--
-- Index pour la table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_last_login` (`last_login_at`),
  ADD KEY `fk_superadmin_role` (`role_id`);

--
-- Index pour la table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_number` (`ticket_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_ticket_number` (`ticket_number`),
  ADD KEY `idx_tenant` (`tenant_id`,`status`),
  ADD KEY `idx_assigned` (`assigned_to`,`status`),
  ADD KEY `idx_status` (`status`,`priority`),
  ADD KEY `idx_created` (`created_at`);

--
-- Index pour la table `system_error_logs`
--
ALTER TABLE `system_error_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `resolved_by` (`resolved_by`),
  ADD KEY `idx_error_type` (`error_type`,`created_at`),
  ADD KEY `idx_severity` (`severity`,`resolved`,`created_at`),
  ADD KEY `idx_tenant` (`tenant_id`,`created_at`),
  ADD KEY `idx_endpoint` (`endpoint`,`created_at`);

--
-- Index pour la table `system_health_checks`
--
ALTER TABLE `system_health_checks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_check_type` (`check_type`,`checked_at`),
  ADD KEY `idx_status` (`status`,`checked_at`);

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
  ADD KEY `idx_tenants_currency` (`currency`),
  ADD KEY `idx_trial_ends` (`trial_ends_at`),
  ADD KEY `idx_onboarding_status` (`onboarding_status`);

--
-- Index pour la table `tenant_feature_overrides`
--
ALTER TABLE `tenant_feature_overrides`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tenant_feature` (`tenant_id`,`feature_flag_id`),
  ADD KEY `feature_flag_id` (`feature_flag_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `ticket_counter`
--
ALTER TABLE `ticket_counter`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ticket` (`ticket_id`,`created_at`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `admin_roles`
--
ALTER TABLE `admin_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `alert_instances`
--
ALTER TABLE `alert_instances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `alert_rules`
--
ALTER TABLE `alert_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `api_performance_logs`
--
ALTER TABLE `api_performance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `billing_transactions`
--
ALTER TABLE `billing_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `broadcast_emails`
--
ALTER TABLE `broadcast_emails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `client_notifications`
--
ALTER TABLE `client_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `email_deliveries`
--
ALTER TABLE `email_deliveries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `failed_login_attempts`
--
ALTER TABLE `failed_login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `feature_flags`
--
ALTER TABLE `feature_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `feature_flag_checks`
--
ALTER TABLE `feature_flag_checks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `impersonation_sessions`
--
ALTER TABLE `impersonation_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `marketing_campaigns`
--
ALTER TABLE `marketing_campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
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
-- AUTO_INCREMENT pour la table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reminder_logs`
--
ALTER TABLE `reminder_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT pour la table `slow_query_logs`
--
ALTER TABLE `slow_query_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `storage_usage`
--
ALTER TABLE `storage_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `subscription_changes`
--
ALTER TABLE `subscription_changes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `super_admins`
--
ALTER TABLE `super_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `support_tickets`
--
ALTER TABLE `support_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `system_error_logs`
--
ALTER TABLE `system_error_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `system_health_checks`
--
ALTER TABLE `system_health_checks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `tenant_feature_overrides`
--
ALTER TABLE `tenant_feature_overrides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

-- --------------------------------------------------------

--
-- Structure de la vue `tenant_stats`
--
DROP TABLE IF EXISTS `tenant_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`c2695552c`@`localhost` SQL SECURITY DEFINER VIEW `tenant_stats`  AS SELECT `t`.`id` AS `tenant_id`, `t`.`name` AS `tenant_name`, count(distinct `c`.`id`) AS `total_clients`, count(distinct `s`.`id`) AS `total_services`, count(distinct `a`.`id`) AS `total_appointments`, count(distinct `u`.`id`) AS `total_staff`, `t`.`subscription_status` AS `subscription_status`, `t`.`subscription_plan` AS `subscription_plan` FROM ((((`tenants` `t` left join `clients` `c` on(`t`.`id` = `c`.`tenant_id`)) left join `services` `s` on(`t`.`id` = `s`.`tenant_id`)) left join `appointments` `a` on(`t`.`id` = `a`.`tenant_id`)) left join `users` `u` on(`t`.`id` = `u`.`tenant_id`)) GROUP BY `t`.`id` ;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD CONSTRAINT `admin_sessions_ibfk_1` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `alert_instances`
--
ALTER TABLE `alert_instances`
  ADD CONSTRAINT `alert_instances_ibfk_1` FOREIGN KEY (`alert_rule_id`) REFERENCES `alert_rules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alert_instances_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alert_instances_ibfk_3` FOREIGN KEY (`acknowledged_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `alert_rules`
--
ALTER TABLE `alert_rules`
  ADD CONSTRAINT `alert_rules_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `api_performance_logs`
--
ALTER TABLE `api_performance_logs`
  ADD CONSTRAINT `api_performance_logs_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `billing_transactions`
--
ALTER TABLE `billing_transactions`
  ADD CONSTRAINT `billing_transactions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `broadcast_emails`
--
ALTER TABLE `broadcast_emails`
  ADD CONSTRAINT `broadcast_emails_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

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
-- Contraintes pour la table `email_deliveries`
--
ALTER TABLE `email_deliveries`
  ADD CONSTRAINT `email_deliveries_ibfk_1` FOREIGN KEY (`broadcast_email_id`) REFERENCES `broadcast_emails` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `email_deliveries_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `feature_flags`
--
ALTER TABLE `feature_flags`
  ADD CONSTRAINT `feature_flags_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `feature_flag_checks`
--
ALTER TABLE `feature_flag_checks`
  ADD CONSTRAINT `feature_flag_checks_ibfk_1` FOREIGN KEY (`feature_flag_id`) REFERENCES `feature_flags` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feature_flag_checks_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `impersonation_sessions`
--
ALTER TABLE `impersonation_sessions`
  ADD CONSTRAINT `impersonation_sessions_ibfk_1` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `impersonation_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `impersonation_sessions_ibfk_3` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `password_reset_tokens_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `push_subscriptions_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `push_subscriptions_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reminder_logs`
--
ALTER TABLE `reminder_logs`
  ADD CONSTRAINT `reminder_logs_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reminder_logs_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reminder_logs_ibfk_3` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

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
-- Contraintes pour la table `storage_usage`
--
ALTER TABLE `storage_usage`
  ADD CONSTRAINT `storage_usage_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `subscription_changes`
--
ALTER TABLE `subscription_changes`
  ADD CONSTRAINT `subscription_changes_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_changes_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `super_admins`
--
ALTER TABLE `super_admins`
  ADD CONSTRAINT `fk_superadmin_role` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `support_tickets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `support_tickets_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `system_error_logs`
--
ALTER TABLE `system_error_logs`
  ADD CONSTRAINT `system_error_logs_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `system_error_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `system_error_logs_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `tenant_feature_overrides`
--
ALTER TABLE `tenant_feature_overrides`
  ADD CONSTRAINT `tenant_feature_overrides_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tenant_feature_overrides_ibfk_2` FOREIGN KEY (`feature_flag_id`) REFERENCES `feature_flags` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tenant_feature_overrides_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
