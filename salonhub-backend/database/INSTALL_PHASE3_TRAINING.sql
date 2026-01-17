-- =====================================================
-- INSTALLATION PHASE 3: TRAINING
-- Date: 2026-01-16
-- Description: Installation des tables pour centres de formation
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- ÉTAPE 1: Nettoyer les tables existantes (si elles existent)
-- =====================================================

DROP TABLE IF EXISTS training_materials;
DROP TABLE IF EXISTS training_certificates;
DROP TABLE IF EXISTS training_attendance;
DROP TABLE IF EXISTS training_enrollments;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS training_courses;

SELECT '✓ Tables training nettoyées' AS status;

-- =====================================================
-- ÉTAPE 2: Créer les tables Training
-- =====================================================

CREATE TABLE training_courses (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL,
  level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL DEFAULT 'beginner',
  duration_hours DECIMAL(5, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  max_students TINYINT UNSIGNED NULL,
  delivery_mode ENUM('in_person', 'online', 'hybrid') NOT NULL DEFAULT 'in_person',
  language VARCHAR(5) NOT NULL DEFAULT 'fr',
  prerequisites TEXT NULL,
  objectives TEXT NULL,
  syllabus TEXT NULL,
  certification_offered TINYINT(1) NOT NULL DEFAULT 0,
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

SELECT '✓ Table training_courses créée' AS status;

CREATE TABLE training_sessions (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  course_id INT(11) NOT NULL,
  session_number VARCHAR(50) NOT NULL,
  instructor_id INT(11) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(200) NULL,
  meeting_url VARCHAR(500) NULL,
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

SELECT '✓ Table training_sessions créée' AS status;

CREATE TABLE training_enrollments (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  session_id INT(11) NOT NULL,
  student_id INT(11) NOT NULL,
  enrollment_number VARCHAR(50) NOT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'dropped', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  payment_method ENUM('cash', 'card', 'transfer', 'other') NULL,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  amount_due DECIMAL(10, 2) NOT NULL,
  attendance_rate DECIMAL(5, 2) NULL,
  final_grade DECIMAL(5, 2) NULL,
  passed TINYINT(1) NULL,
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

SELECT '✓ Table training_enrollments créée' AS status;

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

SELECT '✓ Table training_attendance créée' AS status;

CREATE TABLE training_certificates (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  enrollment_id INT(11) NOT NULL,
  certificate_number VARCHAR(50) NOT NULL,
  certificate_name VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NULL,
  grade DECIMAL(5, 2) NULL,
  certificate_url VARCHAR(500) NULL,
  verification_code VARCHAR(50) NULL,
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

SELECT '✓ Table training_certificates créée' AS status;

CREATE TABLE training_materials (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  course_id INT(11) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  material_type ENUM('document', 'video', 'quiz', 'assignment', 'link', 'other') NOT NULL DEFAULT 'document',
  file_url VARCHAR(500) NULL,
  external_url VARCHAR(500) NULL,
  file_size INT(11) NULL,
  duration_minutes INT(11) NULL,
  display_order INT(11) NOT NULL DEFAULT 0,
  is_downloadable TINYINT(1) NOT NULL DEFAULT 1,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
  INDEX idx_tenant_materials (tenant_id),
  INDEX idx_course (course_id),
  INDEX idx_type (tenant_id, material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table training_materials créée' AS status;

-- =====================================================
-- ÉTAPE 3: Étendre la table appointments
-- =====================================================

-- Nettoyer d'abord
ALTER TABLE appointments DROP FOREIGN KEY IF EXISTS fk_appointments_training_session;
ALTER TABLE appointments DROP INDEX IF EXISTS idx_appointments_training;
ALTER TABLE appointments DROP COLUMN IF EXISTS training_session_id;

-- Ajouter colonne
ALTER TABLE appointments
ADD COLUMN training_session_id INT(11) NULL AFTER table_id;

-- Ajouter FK
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_training_session
FOREIGN KEY (training_session_id) REFERENCES training_sessions(id) ON DELETE SET NULL;

-- Ajouter index
CREATE INDEX idx_appointments_training ON appointments(training_session_id);

SELECT '✓ Table appointments étendue pour Training' AS status;

-- Réactiver les vérifications FK
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

SELECT '===========================================' AS '';
SELECT '✓✓✓ INSTALLATION PHASE 3 TERMINÉE ✓✓✓' AS '';
SELECT '===========================================' AS '';

-- Compter les tables training créées
SHOW TABLES LIKE 'training_%';
