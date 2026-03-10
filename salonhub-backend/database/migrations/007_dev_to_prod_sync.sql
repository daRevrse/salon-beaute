-- =====================================================
-- Migration: DEV to PROD Schema Sync
-- Date: 2026-01-27
-- Description: Synchronize production database with development schema
-- =====================================================

SET FOREIGN_KEY_CHECKS=0;

-- =====================================================
-- PART 1: ALTER EXISTING TABLES
-- =====================================================

-- -----------------------------------------------------
-- 1.1: Add missing columns to `tenants` table
-- -----------------------------------------------------
ALTER TABLE `tenants`
  ADD COLUMN IF NOT EXISTS `business_type` ENUM('beauty','restaurant','training','medical') NOT NULL DEFAULT 'beauty' AFTER `subscription_status`,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1 AFTER `business_type`,
  ADD COLUMN IF NOT EXISTS `description` TEXT DEFAULT NULL AFTER `banner_url`,
  ADD COLUMN IF NOT EXISTS `opening_hours` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`opening_hours`)) AFTER `description`;

-- Add new indexes for tenants
ALTER TABLE `tenants`
  ADD INDEX IF NOT EXISTS `idx_business_type` (`business_type`),
  ADD INDEX IF NOT EXISTS `idx_tenants_slug_active` (`slug`, `is_active`),
  ADD INDEX IF NOT EXISTS `idx_tenants_business_type` (`business_type`);

-- -----------------------------------------------------
-- 1.2: Add missing columns to `appointments` table
-- -----------------------------------------------------
ALTER TABLE `appointments`
  ADD COLUMN IF NOT EXISTS `table_id` INT(11) DEFAULT NULL AFTER `service_id`,
  ADD COLUMN IF NOT EXISTS `training_session_id` INT(11) DEFAULT NULL AFTER `table_id`,
  ADD COLUMN IF NOT EXISTS `patient_id` INT(11) DEFAULT NULL AFTER `training_session_id`,
  ADD COLUMN IF NOT EXISTS `appointment_type` VARCHAR(50) DEFAULT NULL AFTER `patient_id`,
  ADD COLUMN IF NOT EXISTS `reason_for_visit` TEXT DEFAULT NULL AFTER `appointment_type`,
  ADD COLUMN IF NOT EXISTS `guest_count` TINYINT(3) UNSIGNED DEFAULT NULL AFTER `reason_for_visit`,
  ADD COLUMN IF NOT EXISTS `special_requests` TEXT DEFAULT NULL AFTER `notes`;

-- Add new indexes for appointments
ALTER TABLE `appointments`
  ADD INDEX IF NOT EXISTS `idx_appointments_table` (`table_id`, `appointment_date`, `start_time`),
  ADD INDEX IF NOT EXISTS `idx_appointments_training` (`training_session_id`),
  ADD INDEX IF NOT EXISTS `idx_appointments_patient` (`patient_id`);

-- =====================================================
-- PART 2: CREATE NEW TABLES - RESTAURANT MODULE
-- =====================================================

-- -----------------------------------------------------
-- 2.1: restaurant_tables
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_tables` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `table_number` VARCHAR(20) NOT NULL,
  `table_name` VARCHAR(100) DEFAULT NULL,
  `capacity` TINYINT(3) UNSIGNED NOT NULL,
  `section` VARCHAR(50) DEFAULT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `qr_code` VARCHAR(50) DEFAULT NULL,
  `location_description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_table_per_section` (`tenant_id`, `table_number`, `section`),
  UNIQUE KEY `qr_code` (`qr_code`),
  KEY `idx_tenant_tables` (`tenant_id`),
  KEY `idx_table_availability` (`tenant_id`, `is_available`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2.2: restaurant_menus
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_menus` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `allergens` TEXT DEFAULT NULL,
  `is_vegetarian` TINYINT(1) DEFAULT 0,
  `is_vegan` TINYINT(1) DEFAULT 0,
  `is_gluten_free` TINYINT(1) DEFAULT 0,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `display_order` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_menus` (`tenant_id`),
  KEY `idx_menu_category` (`tenant_id`, `category`, `is_active`),
  KEY `idx_menu_availability` (`tenant_id`, `is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2.3: restaurant_orders
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `order_number` VARCHAR(50) NOT NULL,
  `table_id` INT(11) DEFAULT NULL,
  `client_id` INT(11) DEFAULT NULL,
  `staff_id` INT(11) DEFAULT NULL,
  `appointment_id` INT(11) DEFAULT NULL,
  `order_type` ENUM('dine_in','takeaway','delivery') NOT NULL DEFAULT 'dine_in',
  `guest_count` TINYINT(3) UNSIGNED DEFAULT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tip_amount` DECIMAL(10,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending','confirmed','preparing','ready','served','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('unpaid','partial','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `payment_method` ENUM('cash','card','mobile','other') DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `order_date` DATE NOT NULL,
  `order_time` TIME NOT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `customer_name` VARCHAR(100) DEFAULT NULL,
  `customer_email` VARCHAR(100) DEFAULT NULL,
  `customer_phone` VARCHAR(20) DEFAULT NULL,
  `delivery_address` TEXT DEFAULT NULL,
  `pickup_time` TIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_number` (`tenant_id`, `order_number`),
  KEY `idx_tenant_orders` (`tenant_id`),
  KEY `idx_order_date` (`tenant_id`, `order_date`, `order_time`),
  KEY `idx_order_status` (`tenant_id`, `status`),
  KEY `idx_table_orders` (`table_id`, `status`),
  KEY `idx_orders_type` (`tenant_id`, `order_type`),
  KEY `idx_orders_date` (`tenant_id`, `order_date`),
  KEY `client_id` (`client_id`),
  KEY `staff_id` (`staff_id`),
  KEY `appointment_id` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2.4: restaurant_order_items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_order_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `order_id` INT(11) NOT NULL,
  `menu_item_id` INT(11) DEFAULT NULL,
  `menu_item_name` VARCHAR(200) NOT NULL,
  `quantity` SMALLINT(5) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `status` ENUM('ordered','preparing','ready','served','cancelled') NOT NULL DEFAULT 'ordered',
  `special_instructions` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items` (`order_id`),
  KEY `idx_tenant_items` (`tenant_id`),
  KEY `menu_item_id` (`menu_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2.5: restaurant_reservations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_reservations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `table_id` INT(11) DEFAULT NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `party_size` INT(11) NOT NULL DEFAULT 2,
  `duration_minutes` INT(11) DEFAULT 90,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_email` VARCHAR(100) DEFAULT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `special_requests` TEXT DEFAULT NULL,
  `status` ENUM('pending','confirmed','seated','completed','cancelled','no_show') DEFAULT 'pending',
  `confirmation_code` VARCHAR(20) DEFAULT NULL,
  `confirmed_at` DATETIME DEFAULT NULL,
  `seated_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT NULL,
  `cancellation_reason` TEXT DEFAULT NULL,
  `internal_notes` TEXT DEFAULT NULL,
  `source` ENUM('online','phone','walk_in','app') DEFAULT 'online',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `confirmation_code` (`confirmation_code`),
  KEY `table_id` (`table_id`),
  KEY `idx_reservation_date` (`tenant_id`, `reservation_date`),
  KEY `idx_confirmation_code` (`confirmation_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- PART 3: CREATE NEW TABLES - TRAINING MODULE
-- =====================================================

-- -----------------------------------------------------
-- 3.1: training_courses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_courses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `level` ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'beginner',
  `duration_hours` DECIMAL(5,2) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'EUR',
  `max_students` TINYINT(3) UNSIGNED DEFAULT NULL,
  `delivery_mode` ENUM('in_person','online','hybrid') NOT NULL DEFAULT 'in_person',
  `language` VARCHAR(5) NOT NULL DEFAULT 'fr',
  `prerequisites` TEXT DEFAULT NULL,
  `objectives` TEXT DEFAULT NULL,
  `syllabus` TEXT DEFAULT NULL,
  `certification_offered` TINYINT(1) NOT NULL DEFAULT 0,
  `certification_name` VARCHAR(200) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_courses` (`tenant_id`),
  KEY `idx_category` (`tenant_id`, `category`, `is_active`),
  KEY `idx_level` (`tenant_id`, `level`),
  KEY `idx_delivery_mode` (`tenant_id`, `delivery_mode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3.2: training_sessions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `course_id` INT(11) NOT NULL,
  `session_number` VARCHAR(50) NOT NULL,
  `instructor_id` INT(11) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `location` VARCHAR(200) DEFAULT NULL,
  `meeting_url` VARCHAR(500) DEFAULT NULL,
  `meeting_password` VARCHAR(100) DEFAULT NULL,
  `current_students` INT(11) NOT NULL DEFAULT 0,
  `max_students` TINYINT(3) UNSIGNED DEFAULT NULL,
  `status` ENUM('scheduled','open','full','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session_number` (`tenant_id`, `session_number`),
  KEY `idx_tenant_sessions` (`tenant_id`),
  KEY `idx_course` (`course_id`),
  KEY `idx_instructor` (`instructor_id`),
  KEY `idx_dates` (`tenant_id`, `start_date`, `end_date`),
  KEY `idx_status` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3.3: training_enrollments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_enrollments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `session_id` INT(11) NOT NULL,
  `student_id` INT(11) NOT NULL,
  `enrollment_number` VARCHAR(50) NOT NULL,
  `enrollment_date` DATE NOT NULL,
  `status` ENUM('pending','confirmed','active','completed','dropped','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('unpaid','partial','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `payment_method` ENUM('cash','card','transfer','other') DEFAULT NULL,
  `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `amount_due` DECIMAL(10,2) NOT NULL,
  `attendance_rate` DECIMAL(5,2) DEFAULT NULL,
  `final_grade` DECIMAL(5,2) DEFAULT NULL,
  `passed` TINYINT(1) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `enrolled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment_number` (`tenant_id`, `enrollment_number`),
  KEY `idx_tenant_enrollments` (`tenant_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`tenant_id`, `status`),
  KEY `idx_payment_status` (`tenant_id`, `payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3.4: training_attendance
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_attendance` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `enrollment_id` INT(11) NOT NULL,
  `session_date` DATE NOT NULL,
  `check_in_time` TIME DEFAULT NULL,
  `check_out_time` TIME DEFAULT NULL,
  `status` ENUM('present','absent','late','excused') NOT NULL DEFAULT 'present',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment_date` (`enrollment_id`, `session_date`),
  KEY `idx_tenant_attendance` (`tenant_id`),
  KEY `idx_enrollment` (`enrollment_id`),
  KEY `idx_date` (`tenant_id`, `session_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3.5: training_certificates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_certificates` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `enrollment_id` INT(11) NOT NULL,
  `certificate_number` VARCHAR(50) NOT NULL,
  `certificate_name` VARCHAR(200) NOT NULL,
  `issue_date` DATE NOT NULL,
  `expiry_date` DATE DEFAULT NULL,
  `grade` DECIMAL(5,2) DEFAULT NULL,
  `certificate_url` VARCHAR(500) DEFAULT NULL,
  `verification_code` VARCHAR(50) DEFAULT NULL,
  `is_valid` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_certificate_number` (`tenant_id`, `certificate_number`),
  KEY `idx_tenant_certificates` (`tenant_id`),
  KEY `idx_enrollment` (`enrollment_id`),
  KEY `idx_verification` (`verification_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3.6: training_materials
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_materials` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `course_id` INT(11) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `material_type` ENUM('document','video','quiz','assignment','link','other') NOT NULL DEFAULT 'document',
  `file_url` VARCHAR(500) DEFAULT NULL,
  `external_url` VARCHAR(500) DEFAULT NULL,
  `file_size` INT(11) DEFAULT NULL,
  `duration_minutes` INT(11) DEFAULT NULL,
  `display_order` INT(11) NOT NULL DEFAULT 0,
  `is_downloadable` TINYINT(1) NOT NULL DEFAULT 1,
  `is_public` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_materials` (`tenant_id`),
  KEY `idx_course` (`course_id`),
  KEY `idx_type` (`tenant_id`, `material_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PART 4: CREATE NEW TABLES - MEDICAL MODULE
-- =====================================================

-- -----------------------------------------------------
-- 4.1: medical_patients
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_patients` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `client_id` INT(11) DEFAULT NULL,
  `patient_number` VARCHAR(50) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `gender` ENUM('male','female','other','prefer_not_to_say') NOT NULL,
  `blood_type` VARCHAR(5) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `emergency_contact_name` VARCHAR(100) DEFAULT NULL,
  `emergency_contact_phone` VARCHAR(20) DEFAULT NULL,
  `emergency_contact_relation` VARCHAR(50) DEFAULT NULL,
  `insurance_provider` VARCHAR(200) DEFAULT NULL,
  `insurance_number` VARCHAR(100) DEFAULT NULL,
  `social_security_number` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_patient_number` (`tenant_id`, `patient_number`),
  KEY `idx_tenant_patients` (`tenant_id`),
  KEY `idx_patient_name` (`tenant_id`, `last_name`, `first_name`),
  KEY `idx_dob` (`tenant_id`, `date_of_birth`),
  KEY `client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.2: medical_records
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `appointment_id` INT(11) DEFAULT NULL,
  `doctor_id` INT(11) NOT NULL,
  `record_number` VARCHAR(50) NOT NULL,
  `visit_date` DATE NOT NULL,
  `visit_time` TIME NOT NULL,
  `visit_type` ENUM('consultation','follow_up','emergency','preventive','procedure') NOT NULL DEFAULT 'consultation',
  `chief_complaint` TEXT DEFAULT NULL,
  `history_of_present_illness` TEXT DEFAULT NULL,
  `physical_examination` TEXT DEFAULT NULL,
  `vital_signs` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`vital_signs`)),
  `diagnosis` TEXT DEFAULT NULL,
  `treatment_plan` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `follow_up_required` TINYINT(1) NOT NULL DEFAULT 0,
  `follow_up_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_record_number` (`tenant_id`, `record_number`),
  KEY `idx_tenant_records` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_doctor` (`doctor_id`),
  KEY `idx_visit_date` (`tenant_id`, `visit_date`),
  KEY `appointment_id` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.3: medical_prescriptions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_prescriptions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `record_id` INT(11) DEFAULT NULL,
  `doctor_id` INT(11) NOT NULL,
  `prescription_number` VARCHAR(50) NOT NULL,
  `prescription_date` DATE NOT NULL,
  `medication_name` VARCHAR(200) NOT NULL,
  `dosage` VARCHAR(100) NOT NULL,
  `frequency` VARCHAR(100) NOT NULL,
  `duration` VARCHAR(100) DEFAULT NULL,
  `quantity` INT(11) DEFAULT NULL,
  `refills_allowed` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `refills_used` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `instructions` TEXT DEFAULT NULL,
  `status` ENUM('active','completed','cancelled','expired') NOT NULL DEFAULT 'active',
  `expiry_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_prescription_number` (`tenant_id`, `prescription_number`),
  KEY `idx_tenant_prescriptions` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_doctor` (`doctor_id`),
  KEY `idx_status` (`tenant_id`, `status`),
  KEY `record_id` (`record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.4: medical_allergies
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_allergies` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `allergen` VARCHAR(200) NOT NULL,
  `allergy_type` ENUM('food','medication','environmental','other') NOT NULL DEFAULT 'other',
  `severity` ENUM('mild','moderate','severe','life_threatening') NOT NULL DEFAULT 'moderate',
  `reaction` TEXT DEFAULT NULL,
  `diagnosed_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_allergies` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_severity` (`tenant_id`, `severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.5: medical_conditions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_conditions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `condition_name` VARCHAR(200) NOT NULL,
  `icd_code` VARCHAR(20) DEFAULT NULL,
  `diagnosis_date` DATE DEFAULT NULL,
  `status` ENUM('active','resolved','chronic','under_observation') NOT NULL DEFAULT 'active',
  `severity` ENUM('mild','moderate','severe') DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_conditions` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_status` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.6: medical_medications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_medications` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `medication_name` VARCHAR(200) NOT NULL,
  `dosage` VARCHAR(100) NOT NULL,
  `frequency` VARCHAR(100) NOT NULL,
  `route` ENUM('oral','injection','topical','inhalation','other') NOT NULL DEFAULT 'oral',
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `prescribing_doctor` VARCHAR(200) DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `side_effects` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_medications` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_active` (`tenant_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.7: medical_lab_results
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_lab_results` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `record_id` INT(11) DEFAULT NULL,
  `test_name` VARCHAR(200) NOT NULL,
  `test_code` VARCHAR(50) DEFAULT NULL,
  `test_date` DATE NOT NULL,
  `result_value` VARCHAR(200) DEFAULT NULL,
  `result_unit` VARCHAR(50) DEFAULT NULL,
  `reference_range` VARCHAR(200) DEFAULT NULL,
  `status` ENUM('pending','preliminary','final','corrected','cancelled') NOT NULL DEFAULT 'pending',
  `abnormal_flag` ENUM('normal','high','low','critical') DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `lab_name` VARCHAR(200) DEFAULT NULL,
  `ordered_by` INT(11) DEFAULT NULL,
  `file_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_results` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_test_date` (`tenant_id`, `test_date`),
  KEY `idx_status` (`tenant_id`, `status`),
  KEY `record_id` (`record_id`),
  KEY `ordered_by` (`ordered_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4.8: medical_vaccinations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_vaccinations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `vaccine_name` VARCHAR(200) NOT NULL,
  `vaccine_code` VARCHAR(50) DEFAULT NULL,
  `lot_number` VARCHAR(100) DEFAULT NULL,
  `manufacturer` VARCHAR(200) DEFAULT NULL,
  `vaccination_date` DATE NOT NULL,
  `administered_by` INT(11) DEFAULT NULL,
  `site` VARCHAR(100) DEFAULT NULL,
  `dose_number` TINYINT(3) UNSIGNED DEFAULT NULL,
  `next_dose_date` DATE DEFAULT NULL,
  `reaction` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_vaccinations` (`tenant_id`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_vaccine` (`tenant_id`, `vaccine_name`),
  KEY `idx_date` (`tenant_id`, `vaccination_date`),
  KEY `administered_by` (`administered_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PART 5: UPDATE VIEW - tenant_stats
-- =====================================================

-- Drop and recreate the view to include new columns
DROP VIEW IF EXISTS `tenant_stats`;

CREATE VIEW `tenant_stats` AS
SELECT
  `t`.`id` AS `tenant_id`,
  `t`.`name` AS `tenant_name`,
  COUNT(DISTINCT `c`.`id`) AS `total_clients`,
  COUNT(DISTINCT `s`.`id`) AS `total_services`,
  COUNT(DISTINCT `a`.`id`) AS `total_appointments`,
  COUNT(DISTINCT `u`.`id`) AS `total_staff`,
  `t`.`subscription_status` AS `subscription_status`,
  `t`.`subscription_plan` AS `subscription_plan`
FROM `tenants` `t`
LEFT JOIN `clients` `c` ON `t`.`id` = `c`.`tenant_id`
LEFT JOIN `services` `s` ON `t`.`id` = `s`.`tenant_id`
LEFT JOIN `appointments` `a` ON `t`.`id` = `a`.`tenant_id`
LEFT JOIN `users` `u` ON `t`.`id` = `u`.`tenant_id`
GROUP BY `t`.`id`;

-- =====================================================
-- PART 6: UPDATE subscription_status ENUM to include 'expired'
-- =====================================================

-- Note: MariaDB/MySQL requires recreating the column to change ENUM values
-- This is a safe operation that preserves existing data
ALTER TABLE `tenants`
  MODIFY COLUMN `subscription_status` ENUM('trial','active','suspended','cancelled','expired') DEFAULT 'trial';

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
