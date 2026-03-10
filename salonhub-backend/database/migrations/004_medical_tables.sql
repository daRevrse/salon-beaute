-- =====================================================
-- MIGRATION 004: Medical (Cabinets Médicaux)
-- Date: 2026-01-16
-- Description: Tables pour cabinets médicaux
-- =====================================================

-- =====================================================
-- Table 1: medical_patients (Patients)
-- =====================================================

CREATE TABLE medical_patients (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  client_id INT(11) NULL COMMENT 'Référence à clients si existe',
  patient_number VARCHAR(50) NOT NULL COMMENT 'Numéro dossier unique',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
  blood_type VARCHAR(5) NULL COMMENT 'A+, B-, O+, etc.',
  email VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  emergency_contact_name VARCHAR(100) NULL,
  emergency_contact_phone VARCHAR(20) NULL,
  emergency_contact_relation VARCHAR(50) NULL,
  insurance_provider VARCHAR(200) NULL,
  insurance_number VARCHAR(100) NULL,
  social_security_number VARCHAR(50) NULL COMMENT 'Crypté/Hash',
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_tenant_patients (tenant_id),
  INDEX idx_patient_name (tenant_id, last_name, first_name),
  INDEX idx_dob (tenant_id, date_of_birth),
  UNIQUE KEY unique_patient_number (tenant_id, patient_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 2: medical_allergies (Allergies)
-- =====================================================

CREATE TABLE medical_allergies (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  allergen VARCHAR(200) NOT NULL,
  allergy_type ENUM('food', 'medication', 'environmental', 'other') NOT NULL DEFAULT 'other',
  severity ENUM('mild', 'moderate', 'severe', 'life_threatening') NOT NULL DEFAULT 'moderate',
  reaction TEXT NULL COMMENT 'Description de la réaction',
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

-- =====================================================
-- Table 3: medical_conditions (Conditions Médicales)
-- =====================================================

CREATE TABLE medical_conditions (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  condition_name VARCHAR(200) NOT NULL,
  icd_code VARCHAR(20) NULL COMMENT 'Code CIM-10',
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

-- =====================================================
-- Table 4: medical_medications (Médicaments en cours)
-- =====================================================

CREATE TABLE medical_medications (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  medication_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL COMMENT 'Ex: 2x/jour, 1x/semaine',
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

-- =====================================================
-- Table 5: medical_records (Dossiers Médicaux/Consultations)
-- =====================================================

CREATE TABLE medical_records (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  appointment_id INT(11) NULL COMMENT 'Lien avec rendez-vous',
  doctor_id INT(11) NOT NULL COMMENT 'Médecin (users)',
  record_number VARCHAR(50) NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  visit_type ENUM('consultation', 'follow_up', 'emergency', 'preventive', 'procedure') NOT NULL DEFAULT 'consultation',
  chief_complaint TEXT NULL COMMENT 'Motif de consultation',
  history_of_present_illness TEXT NULL COMMENT 'Histoire de la maladie actuelle',
  physical_examination TEXT NULL COMMENT 'Examen physique',
  vital_signs JSON NULL COMMENT '{"temperature": 37.5, "blood_pressure": "120/80", "heart_rate": 72, "weight": 70}',
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

-- =====================================================
-- Table 6: medical_prescriptions (Ordonnances)
-- =====================================================

CREATE TABLE medical_prescriptions (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  record_id INT(11) NULL COMMENT 'Lien avec consultation',
  doctor_id INT(11) NOT NULL,
  prescription_number VARCHAR(50) NOT NULL,
  prescription_date DATE NOT NULL,
  medication_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NULL COMMENT 'Ex: 7 jours, 2 semaines',
  quantity INT(11) NULL COMMENT 'Quantité prescrite',
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

-- =====================================================
-- Table 7: medical_lab_results (Résultats d'examens)
-- =====================================================

CREATE TABLE medical_lab_results (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  record_id INT(11) NULL,
  test_name VARCHAR(200) NOT NULL,
  test_code VARCHAR(50) NULL COMMENT 'Code LOINC',
  test_date DATE NOT NULL,
  result_value VARCHAR(200) NULL,
  result_unit VARCHAR(50) NULL,
  reference_range VARCHAR(200) NULL COMMENT 'Ex: 70-110 mg/dL',
  status ENUM('pending', 'preliminary', 'final', 'corrected', 'cancelled') NOT NULL DEFAULT 'pending',
  abnormal_flag ENUM('normal', 'high', 'low', 'critical') NULL,
  notes TEXT NULL,
  lab_name VARCHAR(200) NULL,
  ordered_by INT(11) NULL COMMENT 'Médecin prescripteur',
  file_url VARCHAR(500) NULL COMMENT 'PDF du résultat',
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

-- =====================================================
-- Table 8: medical_vaccinations (Vaccinations)
-- =====================================================

CREATE TABLE medical_vaccinations (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT(11) NOT NULL,
  patient_id INT(11) NOT NULL,
  vaccine_name VARCHAR(200) NOT NULL,
  vaccine_code VARCHAR(50) NULL COMMENT 'Code CVX',
  lot_number VARCHAR(100) NULL,
  manufacturer VARCHAR(200) NULL,
  vaccination_date DATE NOT NULL,
  administered_by INT(11) NULL COMMENT 'Professionnel de santé',
  site VARCHAR(100) NULL COMMENT 'Site d''injection (bras gauche, cuisse, etc.)',
  dose_number TINYINT UNSIGNED NULL COMMENT 'Ex: dose 1/3',
  next_dose_date DATE NULL,
  reaction TEXT NULL COMMENT 'Réaction adverse',
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

-- =====================================================
-- Extension de la table appointments pour Medical
-- =====================================================

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS patient_id INT(11) NULL COMMENT 'Référence patient médical' AFTER training_session_id;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) NULL COMMENT 'Type de RDV médical' AFTER patient_id;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reason_for_visit TEXT NULL COMMENT 'Motif de consultation' AFTER appointment_type;

-- Ajouter FK
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'appointments'
        AND CONSTRAINT_NAME = 'fk_appointments_patient'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES medical_patients(id) ON DELETE SET NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT '✓ Migration 004 terminée: Medical tables créées' AS status;

SELECT COUNT(*) as medical_tables
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME LIKE 'medical_%';
