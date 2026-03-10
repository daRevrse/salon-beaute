-- =====================================================
-- MIGRATION 003: Training (Formations)
-- Date: 2026-01-16
-- Description: Tables pour centres de formation
-- =====================================================

-- =====================================================
-- Table 1: training_courses (Cours/Formations)
-- =====================================================

CREATE TABLE training_courses (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL COMMENT 'Ex: Technique, Management, Soft Skills',
  level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL DEFAULT 'beginner',
  duration_hours DECIMAL(5, 2) NOT NULL COMMENT 'Durée totale en heures',
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  max_students TINYINT UNSIGNED NULL COMMENT 'Nombre maximum d''étudiants',
  delivery_mode ENUM('in_person', 'online', 'hybrid') NOT NULL DEFAULT 'in_person',
  language VARCHAR(5) NOT NULL DEFAULT 'fr' COMMENT 'Code langue ISO 639-1',
  prerequisites TEXT NULL COMMENT 'Prérequis pour suivre la formation',
  objectives TEXT NULL COMMENT 'Objectifs pédagogiques (JSON array)',
  syllabus TEXT NULL COMMENT 'Programme détaillé',
  certification_offered TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Certification délivrée',
  certification_name VARCHAR(200) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_courses (tenant_id),
  INDEX idx_category (tenant_id, category, is_active),
  INDEX idx_level (tenant_id, level),
  INDEX idx_delivery_mode (tenant_id, delivery_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 2: training_sessions (Sessions planifiées)
-- =====================================================

CREATE TABLE training_sessions (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  course_id INT(11) NOT NULL,
  session_number VARCHAR(50) NOT NULL COMMENT 'Numéro de session unique',
  instructor_id INT(11) NULL COMMENT 'Formateur principal',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(200) NULL COMMENT 'Lieu si présentiel',
  meeting_url VARCHAR(500) NULL COMMENT 'Lien si en ligne',
  meeting_password VARCHAR(100) NULL,
  current_students INT(11) NOT NULL DEFAULT 0,
  max_students TINYINT UNSIGNED NULL,
  status ENUM('scheduled', 'open', 'full', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant_sessions (tenant_id),
  INDEX idx_course (course_id),
  INDEX idx_instructor (instructor_id),
  INDEX idx_dates (tenant_id, start_date, end_date),
  INDEX idx_status (tenant_id, status),
  UNIQUE KEY unique_session_number (tenant_id, session_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 3: training_enrollments (Inscriptions)
-- =====================================================

CREATE TABLE training_enrollments (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  session_id INT(11) NOT NULL,
  student_id INT(11) NOT NULL COMMENT 'Référence à clients ou users',
  enrollment_number VARCHAR(50) NOT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'dropped', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  payment_method ENUM('cash', 'card', 'transfer', 'other') NULL,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  amount_due DECIMAL(10, 2) NOT NULL,
  attendance_rate DECIMAL(5, 2) NULL COMMENT 'Taux de présence en %',
  final_grade DECIMAL(5, 2) NULL COMMENT 'Note finale sur 20 ou 100',
  passed TINYINT(1) NULL COMMENT 'A validé la formation',
  notes TEXT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_tenant_enrollments (tenant_id),
  INDEX idx_session (session_id),
  INDEX idx_student (student_id),
  INDEX idx_status (tenant_id, status),
  INDEX idx_payment_status (tenant_id, payment_status),
  UNIQUE KEY unique_enrollment_number (tenant_id, enrollment_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 4: training_attendance (Présences)
-- =====================================================

CREATE TABLE training_attendance (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  enrollment_id INT(11) NOT NULL,
  session_date DATE NOT NULL,
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(id) ON DELETE CASCADE,
  INDEX idx_tenant_attendance (tenant_id),
  INDEX idx_enrollment (enrollment_id),
  INDEX idx_date (tenant_id, session_date),
  UNIQUE KEY unique_enrollment_date (enrollment_id, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 5: training_certificates (Certificats)
-- =====================================================

CREATE TABLE training_certificates (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  enrollment_id INT(11) NOT NULL,
  certificate_number VARCHAR(50) NOT NULL COMMENT 'Numéro unique du certificat',
  certificate_name VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NULL COMMENT 'Date d''expiration si applicable',
  grade DECIMAL(5, 2) NULL,
  certificate_url VARCHAR(500) NULL COMMENT 'URL du PDF généré',
  verification_code VARCHAR(50) NULL COMMENT 'Code de vérification unique',
  is_valid TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(id) ON DELETE CASCADE,
  INDEX idx_tenant_certificates (tenant_id),
  INDEX idx_enrollment (enrollment_id),
  INDEX idx_verification (verification_code),
  UNIQUE KEY unique_certificate_number (tenant_id, certificate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 6: training_materials (Supports de cours)
-- =====================================================

CREATE TABLE training_materials (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  course_id INT(11) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  material_type ENUM('document', 'video', 'quiz', 'assignment', 'link', 'other') NOT NULL DEFAULT 'document',
  file_url VARCHAR(500) NULL,
  external_url VARCHAR(500) NULL,
  file_size INT(11) NULL COMMENT 'Taille en bytes',
  duration_minutes INT(11) NULL COMMENT 'Pour vidéos',
  display_order INT(11) NOT NULL DEFAULT 0,
  is_downloadable TINYINT(1) NOT NULL DEFAULT 1,
  is_public TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Accessible sans inscription',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
  INDEX idx_tenant_materials (tenant_id),
  INDEX idx_course (course_id),
  INDEX idx_type (tenant_id, material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Extension de la table appointments pour Training
-- =====================================================

-- Ajouter colonnes spécifiques training
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS training_session_id INT(11) NULL COMMENT 'Lien vers session de formation' AFTER table_id;

-- Ajouter FK
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'appointments'
        AND CONSTRAINT_NAME = 'fk_appointments_training_session'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_training_session FOREIGN KEY (training_session_id) REFERENCES training_sessions(id) ON DELETE SET NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index
CREATE INDEX IF NOT EXISTS idx_appointments_training ON appointments(training_session_id);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT '✓ Migration 003 terminée: Training tables créées' AS status;

SELECT COUNT(*) as training_tables
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME LIKE 'training_%';
