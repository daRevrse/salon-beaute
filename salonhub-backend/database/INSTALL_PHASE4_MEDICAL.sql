-- =====================================================
-- INSTALLATION PHASE 4: MEDICAL
-- Date: 2026-01-16
-- Description: Installation des tables pour cabinets médicaux
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- ÉTAPE 1: Nettoyer les tables existantes
-- =====================================================

DROP TABLE IF EXISTS medical_vaccinations;
DROP TABLE IF EXISTS medical_lab_results;
DROP TABLE IF EXISTS medical_prescriptions;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS medical_medications;
DROP TABLE IF EXISTS medical_conditions;
DROP TABLE IF EXISTS medical_allergies;
DROP TABLE IF EXISTS medical_patients;

SELECT '✓ Tables medical nettoyées' AS status;

-- =====================================================
-- ÉTAPE 2: Créer les tables Medical
-- =====================================================

CREATE TABLE medical_patients (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  client_id INT(11) NOT NULL,
  patient_number VARCHAR(50) NOT NULL,
  blood_type VARCHAR(5) NULL,
  emergency_contact_name VARCHAR(100) NULL,
  emergency_contact_phone VARCHAR(20) NULL,
  emergency_contact_relation VARCHAR(50) NULL,
  insurance_provider VARCHAR(200) NULL,
  insurance_number VARCHAR(100) NULL,
  social_security_number VARCHAR(50) NULL,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_tenant_patients (tenant_id),
  INDEX idx_client (client_id),
  UNIQUE KEY unique_patient_number (tenant_id, patient_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_patients créée' AS status;

CREATE TABLE medical_allergies (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  allergen VARCHAR(200) NOT NULL,
  allergy_type ENUM('food', 'medication', 'environmental', 'other') NOT NULL DEFAULT 'other',
  severity ENUM('mild', 'moderate', 'severe', 'life_threatening') NOT NULL DEFAULT 'moderate',
  reaction TEXT NULL,
  diagnosed_date DATE NULL,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  INDEX idx_tenant_allergies (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_severity (tenant_id, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_allergies créée' AS status;

CREATE TABLE medical_conditions (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  condition_name VARCHAR(200) NOT NULL,
  icd_code VARCHAR(20) NULL,
  diagnosis_date DATE NULL,
  status ENUM('active', 'resolved', 'chronic', 'under_observation') NOT NULL DEFAULT 'active',
  severity ENUM('mild', 'moderate', 'severe') NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  INDEX idx_tenant_conditions (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_conditions créée' AS status;

CREATE TABLE medical_medications (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  medication_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route ENUM('oral', 'injection', 'topical', 'inhalation', 'other') NOT NULL DEFAULT 'oral',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  prescribing_doctor VARCHAR(200) NULL,
  reason TEXT NULL,
  side_effects TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  INDEX idx_tenant_medications (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_medications créée' AS status;

CREATE TABLE medical_records (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  appointment_id INT(11) NULL,
  doctor_id INT(11) NOT NULL,
  record_number VARCHAR(50) NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  visit_type ENUM('consultation', 'follow_up', 'emergency', 'preventive', 'procedure') NOT NULL DEFAULT 'consultation',
  chief_complaint TEXT NULL,
  history_of_present_illness TEXT NULL,
  physical_examination TEXT NULL,
  vital_signs JSON NULL,
  diagnosis TEXT NULL,
  treatment_plan TEXT NULL,
  notes TEXT NULL,
  follow_up_required TINYINT(1) NOT NULL DEFAULT 0,
  follow_up_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tenant_records (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_doctor (doctor_id),
  INDEX idx_visit_date (tenant_id, visit_date),
  UNIQUE KEY unique_record_number (tenant_id, record_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_records créée' AS status;

CREATE TABLE medical_prescriptions (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  record_id INT(11) NULL,
  doctor_id INT(11) NOT NULL,
  prescription_number VARCHAR(50) NOT NULL,
  prescription_date DATE NOT NULL,
  medication_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NULL,
  quantity INT(11) NULL,
  refills_allowed TINYINT UNSIGNED NOT NULL DEFAULT 0,
  refills_used TINYINT UNSIGNED NOT NULL DEFAULT 0,
  instructions TEXT NULL,
  status ENUM('active', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  expiry_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tenant_prescriptions (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_doctor (doctor_id),
  INDEX idx_status (tenant_id, status),
  UNIQUE KEY unique_prescription_number (tenant_id, prescription_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_prescriptions créée' AS status;

CREATE TABLE medical_lab_results (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  record_id INT(11) NULL,
  test_name VARCHAR(200) NOT NULL,
  test_code VARCHAR(50) NULL,
  test_date DATE NOT NULL,
  result_value VARCHAR(200) NULL,
  result_unit VARCHAR(50) NULL,
  reference_range VARCHAR(200) NULL,
  status ENUM('pending', 'preliminary', 'final', 'corrected', 'cancelled') NOT NULL DEFAULT 'pending',
  abnormal_flag ENUM('normal', 'high', 'low', 'critical') NULL,
  notes TEXT NULL,
  lab_name VARCHAR(200) NULL,
  ordered_by INT(11) NULL,
  file_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
  FOREIGN KEY (ordered_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant_results (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_test_date (tenant_id, test_date),
  INDEX idx_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_lab_results créée' AS status;

CREATE TABLE medical_vaccinations (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  vaccine_name VARCHAR(200) NOT NULL,
  vaccine_code VARCHAR(50) NULL,
  lot_number VARCHAR(100) NULL,
  manufacturer VARCHAR(200) NULL,
  vaccination_date DATE NOT NULL,
  administered_by INT(11) NULL,
  site VARCHAR(100) NULL,
  dose_number TINYINT UNSIGNED NULL,
  next_dose_date DATE NULL,
  reaction TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant_vaccinations (tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_vaccine (tenant_id, vaccine_name),
  INDEX idx_date (tenant_id, vaccination_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Table medical_vaccinations créée' AS status;

-- =====================================================
-- ÉTAPE 3: Étendre la table appointments
-- =====================================================

-- Nettoyer d'abord
ALTER TABLE appointments DROP FOREIGN KEY IF EXISTS fk_appointments_patient;
ALTER TABLE appointments DROP INDEX IF EXISTS idx_appointments_patient;
ALTER TABLE appointments DROP COLUMN IF EXISTS patient_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS appointment_type;
ALTER TABLE appointments DROP COLUMN IF EXISTS reason_for_visit;

-- Ajouter colonnes
ALTER TABLE appointments
ADD COLUMN patient_id INT(11) NULL AFTER training_session_id;

ALTER TABLE appointments
ADD COLUMN appointment_type VARCHAR(50) NULL AFTER patient_id;

ALTER TABLE appointments
ADD COLUMN reason_for_visit TEXT NULL AFTER appointment_type;

-- Ajouter FK
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_patient
FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE SET NULL;

-- Ajouter index
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

SELECT '✓ Table appointments étendue pour Medical' AS status;

-- Réactiver les vérifications FK
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

SELECT '===========================================' AS '';
SELECT '✓✓✓ INSTALLATION PHASE 4 TERMINÉE ✓✓✓' AS '';
SELECT '===========================================' AS '';

-- Compter les tables medical créées
SHOW TABLES LIKE 'medical_%';
