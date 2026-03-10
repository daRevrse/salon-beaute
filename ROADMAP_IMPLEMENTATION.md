# 🗺️ Roadmap d'Implémentation Multi-Secteur

**Projet:** SalonHub Multi-Secteur
**Date:** 2025-01-16
**Durée estimée:** 10-15 semaines
**Charge totale:** 75 jours-développeur

---

## 📊 Analyse du Schéma Actuel

### Tables Principales Existantes (33 tables)

#### Core Business (Multi-tenant)
1. **tenants** - Salons (723→748)
   - Champs actuels: id, name, slug, email, phone, address, subscription_plan, etc.
   - ✅ Déjà présents: currency, logo_url, banner_url
   - ❌ Manquant: `business_type` (CRITIQUE)

2. **users** - Employés/Staff (820→834)
   - Champs: tenant_id, email, role (owner/admin/staff), working_hours
   - ✅ Compatible multi-secteur (pas de modification nécessaire)

3. **clients** - Clients (245→262)
   - Champs: tenant_id, first_name, last_name, email, phone
   - ✅ Compatible (générique pour tous les secteurs)

4. **services** - Prestations (516→531)
   - Champs: tenant_id, name, description, duration, price, category
   - ✅ Compatible (services = menus/formations/consultations)

5. **appointments** - Rendez-vous (163→185)
   - Champs: tenant_id, client_id, service_id, staff_id, appointment_date, start_time, end_time, status
   - ⚠️ Nécessite colonnes additionnelles pour multi-secteur

#### Tables de Support
- settings (540→547) - Paramètres par tenant ✅
- promotions (432→452) - Codes promo ✅
- marketing_campaigns (380→403) - Campagnes marketing ✅
- client_notifications (270→283) - Notifications ✅
- push_subscriptions (478→489) - Push notifications ✅
- reminder_logs (498→507) - Logs des rappels ✅

#### Tables SuperAdmin (13 tables)
- super_admins, admin_roles, admin_sessions, admin_activity_logs
- support_tickets, system_error_logs, feature_flags, announcements
- billing_transactions, subscription_changes
- ✅ Toutes compatibles multi-secteur

---

## 🎯 Modifications Nécessaires à la Base de Données

### Phase 0 : Préparation de la Migration

#### Étape 0.1 : Backup et Sécurité
```bash
# Backup complet de la base avant migration
mysqldump -u root -p salonhub_dev > backup_before_multisector_$(date +%Y%m%d).sql
```

#### Étape 0.2 : Analyse d'Impact
- [ ] Vérifier les contraintes d'intégrité référentielle
- [ ] Identifier les triggers existants (aucun détecté)
- [ ] Lister les vues existantes (tenant_stats détectée)
- [ ] Documenter les index pour performance

---

## 📅 PHASE 1 : Modifications Base de Données (Semaine 1-2)

### Sprint 1.1 - Ajout du Type de Business (2 jours)

**Objectif:** Ajouter la colonne business_type à la table tenants

```sql
-- Migration 001: Ajout du type de business
-- Fichier: salonhub-backend/database/migrations/001_add_business_type.sql

USE salonhub_dev;

-- Étape 1: Ajouter la colonne business_type
ALTER TABLE tenants
ADD COLUMN business_type ENUM('beauty', 'restaurant', 'training', 'medical')
NOT NULL DEFAULT 'beauty'
COMMENT 'Type d activité du tenant'
AFTER subscription_status;

-- Étape 2: Ajouter un index pour performance
ALTER TABLE tenants
ADD INDEX idx_business_type (business_type);

-- Étape 3: Mettre à jour les données existantes
UPDATE tenants SET business_type = 'beauty' WHERE business_type IS NULL;

-- Étape 4: Vérification
SELECT business_type, COUNT(*) as count FROM tenants GROUP BY business_type;
```

**Tests:**
- [ ] Vérifier que tous les tenants existants sont "beauty"
- [ ] Tester insertion d'un nouveau tenant de type "restaurant"
- [ ] Vérifier l'index avec EXPLAIN

---

### Sprint 1.2 - Tables Spécifiques Restaurant (3 jours)

**Objectif:** Créer les tables pour gérer les restaurants

```sql
-- Migration 002: Tables Restaurant
-- Fichier: salonhub-backend/database/migrations/002_restaurant_tables.sql

USE salonhub_dev;

-- ==========================================
-- TABLE: restaurant_tables (Gestion des tables)
-- ==========================================
CREATE TABLE restaurant_tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,

    -- Informations de la table
    table_number VARCHAR(20) NOT NULL COMMENT 'Numéro/nom de la table',
    capacity INT NOT NULL COMMENT 'Nombre de couverts max',
    location VARCHAR(100) DEFAULT NULL COMMENT 'Zone: Salle, Terrasse, VIP, etc.',

    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    is_reservable BOOLEAN DEFAULT TRUE COMMENT 'Disponible pour réservation en ligne',
    notes TEXT DEFAULT NULL COMMENT 'Notes internes',

    -- Position dans le plan de salle
    position_x INT DEFAULT NULL COMMENT 'Position X dans le plan',
    position_y INT DEFAULT NULL COMMENT 'Position Y dans le plan',
    shape ENUM('square', 'round', 'rectangular') DEFAULT 'square',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_table (tenant_id, table_number),
    INDEX idx_tenant_active (tenant_id, is_active),
    INDEX idx_capacity (capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tables de restaurant pour la gestion des réservations';

-- ==========================================
-- TABLE: restaurant_service_periods (Périodes de service)
-- ==========================================
CREATE TABLE restaurant_service_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,

    -- Configuration du service
    name VARCHAR(100) NOT NULL COMMENT 'Nom: Déjeuner, Dîner, Brunch',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week JSON NOT NULL COMMENT 'Jours: [1,2,3,4,5] pour lun-ven',

    -- Paramètres de réservation
    default_duration INT DEFAULT 90 COMMENT 'Durée par défaut en minutes',
    min_covers INT DEFAULT 1,
    max_covers INT DEFAULT NULL,

    -- État
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Périodes de service pour restaurants (déjeuner, dîner, etc.)';
```

**Tests:**
- [ ] Insertion de tables de test (Table 1-10)
- [ ] Vérifier les contraintes d'unicité
- [ ] Tester la suppression en cascade

---

### Sprint 1.3 - Tables Spécifiques Formation (3 jours)

**Objectif:** Créer les tables pour gérer les centres de formation

```sql
-- Migration 003: Tables Formation
-- Fichier: salonhub-backend/database/migrations/003_training_tables.sql

USE salonhub_dev;

-- ==========================================
-- TABLE: training_sessions (Sessions de formation)
-- ==========================================
CREATE TABLE training_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    service_id INT NOT NULL COMMENT 'Référence au module de formation',

    -- Informations de session
    session_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,

    -- Dates et horaires
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Capacité
    max_participants INT DEFAULT 20,
    current_participants INT DEFAULT 0,
    waiting_list_count INT DEFAULT 0,

    -- Configuration
    location VARCHAR(255) DEFAULT NULL COMMENT 'Salle, Adresse, Lien visio',
    instructor_id INT DEFAULT NULL COMMENT 'Formateur assigné',

    -- Statut
    status ENUM('scheduled', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',

    -- Prix et facturation
    price_override DECIMAL(10,2) DEFAULT NULL COMMENT 'Prix spécifique à la session',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tenant_dates (tenant_id, start_date, end_date),
    INDEX idx_status (status),
    INDEX idx_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sessions de formation avec gestion des inscriptions';

-- ==========================================
-- TABLE: training_certificates (Certificats)
-- ==========================================
CREATE TABLE training_certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    session_id INT NOT NULL,
    client_id INT NOT NULL,

    -- Informations du certificat
    certificate_number VARCHAR(100) NOT NULL COMMENT 'Numéro unique',
    issued_date DATE NOT NULL,
    expiry_date DATE DEFAULT NULL,

    -- Contenu
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    grade VARCHAR(50) DEFAULT NULL COMMENT 'Note/Appréciation',

    -- Fichier PDF
    pdf_url VARCHAR(500) DEFAULT NULL,
    pdf_hash VARCHAR(64) DEFAULT NULL COMMENT 'SHA-256 pour vérification',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_certificate (tenant_id, certificate_number),
    INDEX idx_client (client_id),
    INDEX idx_session (session_id),
    INDEX idx_issued_date (issued_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Certificats de formation émis aux participants';

-- ==========================================
-- TABLE: training_materials (Support pédagogique)
-- ==========================================
CREATE TABLE training_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    session_id INT DEFAULT NULL COMMENT 'Lié à une session ou général',
    service_id INT DEFAULT NULL COMMENT 'Lié à un module',

    -- Informations du fichier
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('pdf', 'video', 'document', 'image', 'link') NOT NULL,
    file_size BIGINT DEFAULT NULL COMMENT 'Taille en octets',

    -- Accès
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Accessible avant inscription',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id),
    INDEX idx_session (session_id),
    INDEX idx_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Documents et supports pédagogiques pour formations';
```

**Tests:**
- [ ] Créer une session de formation de test
- [ ] Générer un certificat test
- [ ] Upload d'un support PDF
- [ ] Vérifier compteur participants

---

### Sprint 1.4 - Tables Spécifiques Médical (4 jours)

**Objectif:** Créer les tables pour gérer les cabinets médicaux

```sql
-- Migration 004: Tables Médical
-- Fichier: salonhub-backend/database/migrations/004_medical_tables.sql

USE salonhub_dev;

-- ==========================================
-- TABLE: medical_records (Dossiers médicaux)
-- ==========================================
CREATE TABLE medical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    patient_id INT NOT NULL COMMENT 'Référence au client',

    -- Informations médicales de base
    blood_type VARCHAR(10) DEFAULT NULL,
    height DECIMAL(5,2) DEFAULT NULL COMMENT 'Taille en cm',
    weight DECIMAL(5,2) DEFAULT NULL COMMENT 'Poids en kg',

    -- Antécédents
    allergies TEXT DEFAULT NULL COMMENT 'Liste des allergies',
    chronic_conditions TEXT DEFAULT NULL COMMENT 'Maladies chroniques',
    current_medications TEXT DEFAULT NULL COMMENT 'Traitements en cours',
    medical_history TEXT DEFAULT NULL COMMENT 'Historique médical général',

    -- Contact d'urgence
    emergency_contact_name VARCHAR(255) DEFAULT NULL,
    emergency_contact_phone VARCHAR(20) DEFAULT NULL,
    emergency_contact_relation VARCHAR(100) DEFAULT NULL,

    -- Assurance/Mutuelle
    insurance_provider VARCHAR(255) DEFAULT NULL,
    insurance_number VARCHAR(100) DEFAULT NULL,
    social_security_number VARCHAR(100) DEFAULT NULL COMMENT 'Numéro sécurité sociale (chiffré)',

    -- Consentements RGPD
    data_consent BOOLEAN DEFAULT FALSE,
    data_consent_date DATETIME DEFAULT NULL,
    marketing_consent BOOLEAN DEFAULT FALSE,

    -- Sécurité
    is_encrypted BOOLEAN DEFAULT FALSE COMMENT 'Dossier chiffré',
    encryption_key_id VARCHAR(100) DEFAULT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at DATETIME DEFAULT NULL,
    last_accessed_by INT DEFAULT NULL,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_record (tenant_id, patient_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_patient (patient_id),
    INDEX idx_last_accessed (last_accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dossiers médicaux sécurisés des patients';

-- ==========================================
-- TABLE: medical_consultations (Consultations)
-- ==========================================
CREATE TABLE medical_consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    appointment_id INT NOT NULL COMMENT 'Lien vers le RDV',
    patient_id INT NOT NULL,
    practitioner_id INT NOT NULL COMMENT 'Praticien',

    -- Motif et diagnostic
    reason TEXT NOT NULL COMMENT 'Motif de consultation',
    symptoms TEXT DEFAULT NULL COMMENT 'Symptômes rapportés',
    diagnosis TEXT DEFAULT NULL COMMENT 'Diagnostic',
    treatment TEXT DEFAULT NULL COMMENT 'Traitement prescrit',

    -- Examens
    vital_signs JSON DEFAULT NULL COMMENT 'Tension, température, etc.',
    examination_notes TEXT DEFAULT NULL,

    -- Prescriptions
    has_prescription BOOLEAN DEFAULT FALSE,
    prescription_url VARCHAR(500) DEFAULT NULL,

    -- Documents
    attachments JSON DEFAULT NULL COMMENT 'URLs des documents joints',

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE DEFAULT NULL,
    follow_up_notes TEXT DEFAULT NULL,

    -- Facturation
    consultation_fee DECIMAL(10,2) DEFAULT NULL,
    insurance_covered DECIMAL(10,2) DEFAULT NULL,
    patient_payment DECIMAL(10,2) DEFAULT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_tenant (tenant_id),
    INDEX idx_appointment (appointment_id),
    INDEX idx_patient (patient_id),
    INDEX idx_practitioner (practitioner_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notes de consultation médicale';

-- ==========================================
-- TABLE: medical_prescriptions (Ordonnances)
-- ==========================================
CREATE TABLE medical_prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    consultation_id INT DEFAULT NULL,
    patient_id INT NOT NULL,
    practitioner_id INT NOT NULL,

    -- Informations ordonnance
    prescription_number VARCHAR(100) NOT NULL COMMENT 'Numéro unique',
    prescription_date DATE NOT NULL,
    validity_days INT DEFAULT 90,

    -- Contenu
    medications JSON NOT NULL COMMENT 'Liste des médicaments',
    instructions TEXT DEFAULT NULL,

    -- Fichier PDF
    pdf_url VARCHAR(500) DEFAULT NULL,
    pdf_hash VARCHAR(64) DEFAULT NULL,

    -- Statut
    status ENUM('active', 'dispensed', 'expired', 'cancelled') DEFAULT 'active',
    dispensed_at DATETIME DEFAULT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES medical_consultations(id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_prescription_number (tenant_id, prescription_number),
    INDEX idx_patient (patient_id),
    INDEX idx_practitioner (practitioner_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ordonnances médicales';

-- ==========================================
-- TABLE: medical_access_logs (Logs d'accès RGPD)
-- ==========================================
CREATE TABLE medical_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    patient_id INT NOT NULL,
    accessed_by INT NOT NULL COMMENT 'User ID',

    -- Détails de l'accès
    access_type ENUM('view', 'edit', 'create', 'delete', 'export') NOT NULL,
    resource_type VARCHAR(50) NOT NULL COMMENT 'medical_record, consultation, prescription',
    resource_id INT NOT NULL,

    -- Contexte
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    reason TEXT DEFAULT NULL COMMENT 'Justification de l\'accès',

    -- Timestamp
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_accessed_by (accessed_by),
    INDEX idx_accessed_at (accessed_at),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs d\'accès aux dossiers médicaux (conformité RGPD)';
```

**Tests:**
- [ ] Créer un dossier médical test
- [ ] Enregistrer une consultation
- [ ] Générer une ordonnance PDF
- [ ] Vérifier les logs d'accès RGPD
- [ ] Tester les contraintes de suppression

---

### Sprint 1.5 - Modifications Table Appointments (2 jours)

**Objectif:** Adapter la table appointments pour tous les secteurs

```sql
-- Migration 005: Extension Appointments Multi-Secteur
-- Fichier: salonhub-backend/database/migrations/005_appointments_multisector.sql

USE salonhub_dev;

-- Ajout de colonnes spécifiques par secteur
ALTER TABLE appointments
ADD COLUMN appointment_type VARCHAR(50) DEFAULT 'service'
COMMENT 'Type: service, reservation, session, consultation'
AFTER status;

-- RESTAURANT: Nombre de couverts et table
ALTER TABLE appointments
ADD COLUMN covers INT DEFAULT NULL
COMMENT 'Nombre de couverts (restaurants)'
AFTER appointment_type;

ALTER TABLE appointments
ADD COLUMN table_id INT DEFAULT NULL
COMMENT 'ID de table (restaurants)'
AFTER covers;

ALTER TABLE appointments
ADD COLUMN service_period_id INT DEFAULT NULL
COMMENT 'Période de service (déjeuner/dîner)'
AFTER table_id;

ALTER TABLE appointments
ADD COLUMN dietary_requirements TEXT DEFAULT NULL
COMMENT 'Régimes alimentaires spéciaux'
AFTER service_period_id;

-- FORMATION: Session et statut inscription
ALTER TABLE appointments
ADD COLUMN session_id INT DEFAULT NULL
COMMENT 'ID de session (formations)'
AFTER dietary_requirements;

ALTER TABLE appointments
ADD COLUMN registration_status ENUM('registered', 'confirmed', 'attended', 'certificated', 'cancelled') DEFAULT NULL
COMMENT 'Statut inscription formation'
AFTER session_id;

ALTER TABLE appointments
ADD COLUMN attendance_confirmed BOOLEAN DEFAULT FALSE
AFTER registration_status;

-- MÉDICAL: Informations consultation
ALTER TABLE appointments
ADD COLUMN consultation_type ENUM('first_visit', 'follow_up', 'emergency', 'routine') DEFAULT NULL
COMMENT 'Type de consultation'
AFTER attendance_confirmed;

ALTER TABLE appointments
ADD COLUMN consultation_reason TEXT DEFAULT NULL
COMMENT 'Motif (médical)'
AFTER consultation_type;

ALTER TABLE appointments
ADD COLUMN is_first_visit BOOLEAN DEFAULT FALSE
COMMENT 'Première visite (médical)'
AFTER consultation_reason;

ALTER TABLE appointments
ADD COLUMN referral_source VARCHAR(255) DEFAULT NULL
COMMENT 'Médecin référent ou source'
AFTER is_first_visit;

-- GÉNÉRAL: Métadonnées supplémentaires
ALTER TABLE appointments
ADD COLUMN metadata JSON DEFAULT NULL
COMMENT 'Données supplémentaires spécifiques au secteur'
AFTER referral_source;

-- Ajout des contraintes
ALTER TABLE appointments
ADD CONSTRAINT fk_table
FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;

ALTER TABLE appointments
ADD CONSTRAINT fk_service_period
FOREIGN KEY (service_period_id) REFERENCES restaurant_service_periods(id) ON DELETE SET NULL;

ALTER TABLE appointments
ADD CONSTRAINT fk_session
FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE SET NULL;

-- Ajout d'index pour performance
ALTER TABLE appointments
ADD INDEX idx_appointment_type (appointment_type);

ALTER TABLE appointments
ADD INDEX idx_table (table_id);

ALTER TABLE appointments
ADD INDEX idx_session (session_id);

ALTER TABLE appointments
ADD INDEX idx_consultation_type (consultation_type);

-- Vérification
SHOW COLUMNS FROM appointments;
```

**Tests:**
- [ ] Créer un RDV salon de beauté (type: service)
- [ ] Créer une réservation restaurant (type: reservation, avec table_id et covers)
- [ ] Créer une inscription formation (type: session, avec session_id)
- [ ] Créer une consultation médicale (type: consultation, avec motif)
- [ ] Vérifier que les anciens RDV fonctionnent toujours

---

### Sprint 1.6 - Mise à Jour de la Vue tenant_stats (1 jour)

**Objectif:** Adapter la vue pour inclure les statistiques multi-secteur

```sql
-- Migration 006: Vue tenant_stats multi-secteur
-- Fichier: salonhub-backend/database/migrations/006_tenant_stats_view.sql

USE salonhub_dev;

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS tenant_stats;

-- Créer la nouvelle vue avec support multi-secteur
CREATE VIEW tenant_stats AS
SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.business_type,

    -- Statistiques communes
    COUNT(DISTINCT c.id) AS total_clients,
    COUNT(DISTINCT s.id) AS total_services,
    COUNT(DISTINCT a.id) AS total_appointments,
    COUNT(DISTINCT u.id) AS total_staff,

    -- Statistiques spécifiques restaurant
    COUNT(DISTINCT CASE WHEN t.business_type = 'restaurant' THEN rt.id END) AS total_tables,

    -- Statistiques spécifiques formation
    COUNT(DISTINCT CASE WHEN t.business_type = 'training' THEN ts.id END) AS total_sessions,
    COUNT(DISTINCT CASE WHEN t.business_type = 'training' THEN tc.id END) AS total_certificates,

    -- Statistiques spécifiques médical
    COUNT(DISTINCT CASE WHEN t.business_type = 'medical' THEN mr.id END) AS total_medical_records,
    COUNT(DISTINCT CASE WHEN t.business_type = 'medical' THEN mc.id END) AS total_consultations,

    -- Informations d'abonnement
    t.subscription_status,
    t.subscription_plan,
    t.currency

FROM tenants t
LEFT JOIN clients c ON t.id = c.tenant_id
LEFT JOIN services s ON t.id = s.tenant_id
LEFT JOIN appointments a ON t.id = a.tenant_id
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN restaurant_tables rt ON t.id = rt.tenant_id AND rt.is_active = 1
LEFT JOIN training_sessions ts ON t.id = ts.tenant_id
LEFT JOIN training_certificates tc ON t.id = tc.tenant_id
LEFT JOIN medical_records mr ON t.id = mr.tenant_id
LEFT JOIN medical_consultations mc ON t.id = mc.tenant_id

GROUP BY t.id;

-- Test de la vue
SELECT * FROM tenant_stats LIMIT 5;
```

**Tests:**
- [ ] Vérifier les stats pour un tenant beauty
- [ ] Vérifier les stats pour un tenant restaurant (si créé)
- [ ] Performance de la vue avec EXPLAIN

---

## 📅 PHASE 2 : Backend API (Semaine 3-6)

### Sprint 2.1 - Middleware Business Type (2 jours)

**Fichier:** `salonhub-backend/src/middleware/businessType.js`

```javascript
const { query } = require('../config/database');

/**
 * Middleware pour détecter et injecter le type de business
 * Doit être utilisé APRÈS authMiddleware et tenantMiddleware
 */
const businessTypeMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tenant context'
      });
    }

    // Récupérer le business_type du tenant
    const [tenant] = await query(
      'SELECT business_type FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Injecter dans la requête
    req.businessType = tenant.business_type;

    next();
  } catch (error) {
    console.error('Business Type Middleware Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Middleware pour restreindre l'accès à un type de business spécifique
 * @param {string[]} allowedTypes - Types autorisés: ['restaurant', 'training']
 */
const requireBusinessType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.businessType) {
      return res.status(500).json({
        success: false,
        error: 'Business type not set. Use businessTypeMiddleware first.'
      });
    }

    if (!allowedTypes.includes(req.businessType)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `This feature is only available for ${allowedTypes.join(', ')} businesses.`
      });
    }

    next();
  };
};

module.exports = {
  businessTypeMiddleware,
  requireBusinessType
};
```

**Tests:**
- [ ] Test unitaire middleware
- [ ] Test avec tenant beauty, restaurant, training, medical
- [ ] Test restriction d'accès

---

### Sprint 2.2 - Routes Restaurant (3 jours)

**Fichier:** `salonhub-backend/src/routes/restaurant.js`

```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');
const { businessTypeMiddleware, requireBusinessType } = require('../middleware/businessType');

// Appliquer les middlewares
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(businessTypeMiddleware);
router.use(requireBusinessType(['restaurant']));

// ========================================
// GESTION DES TABLES
// ========================================

// GET /api/restaurant/tables - Liste des tables
router.get('/tables', async (req, res) => {
  try {
    const tables = await query(
      `SELECT * FROM restaurant_tables
       WHERE tenant_id = ?
       ORDER BY location, table_number`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tables',
      message: error.message
    });
  }
});

// POST /api/restaurant/tables - Créer une table
router.post('/tables', async (req, res) => {
  try {
    const { table_number, capacity, location, is_reservable } = req.body;

    // Validation
    if (!table_number || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'table_number and capacity are required'
      });
    }

    const result = await query(
      `INSERT INTO restaurant_tables
       (tenant_id, table_number, capacity, location, is_reservable)
       VALUES (?, ?, ?, ?, ?)`,
      [req.tenantId, table_number, capacity, location || null, is_reservable ?? true]
    );

    const newTable = await query(
      'SELECT * FROM restaurant_tables WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: newTable[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Table number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create table',
      message: error.message
    });
  }
});

// PUT /api/restaurant/tables/:id - Modifier une table
router.put('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { table_number, capacity, location, is_active, is_reservable } = req.body;

    // Vérifier que la table appartient au tenant
    const [existing] = await query(
      'SELECT * FROM restaurant_tables WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }

    await query(
      `UPDATE restaurant_tables
       SET table_number = ?, capacity = ?, location = ?,
           is_active = ?, is_reservable = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        table_number || existing.table_number,
        capacity || existing.capacity,
        location !== undefined ? location : existing.location,
        is_active !== undefined ? is_active : existing.is_active,
        is_reservable !== undefined ? is_reservable : existing.is_reservable,
        id,
        req.tenantId
      ]
    );

    const updated = await query(
      'SELECT * FROM restaurant_tables WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: updated[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update table',
      message: error.message
    });
  }
});

// DELETE /api/restaurant/tables/:id
router.delete('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM restaurant_tables WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete table',
      message: error.message
    });
  }
});

// ========================================
// DISPONIBILITÉ DES TABLES
// ========================================

// GET /api/restaurant/availability - Vérifier disponibilité
router.get('/availability', async (req, res) => {
  try {
    const { date, covers, service_period_id } = req.query;

    if (!date || !covers) {
      return res.status(400).json({
        success: false,
        error: 'date and covers are required'
      });
    }

    // Tables correspondant à la capacité
    let tablesQuery = `
      SELECT rt.*
      FROM restaurant_tables rt
      WHERE rt.tenant_id = ?
        AND rt.is_active = 1
        AND rt.is_reservable = 1
        AND rt.capacity >= ?
    `;
    const params = [req.tenantId, covers];

    const allTables = await query(tablesQuery, params);

    // Tables déjà réservées
    const bookedTables = await query(
      `SELECT DISTINCT table_id
       FROM appointments
       WHERE tenant_id = ?
         AND appointment_date = ?
         AND table_id IS NOT NULL
         AND status IN ('pending', 'confirmed')`,
      [req.tenantId, date]
    );

    const bookedIds = bookedTables.map(t => t.table_id);
    const availableTables = allTables.filter(t => !bookedIds.includes(t.id));

    res.json({
      success: true,
      data: {
        date,
        covers: parseInt(covers),
        total_tables: allTables.length,
        available_tables: availableTables.length,
        tables: availableTables
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
      message: error.message
    });
  }
});

module.exports = router;
```

**Ajouter dans server.js:**
```javascript
const restaurantRoutes = require('./routes/restaurant');
app.use('/api/restaurant', restaurantRoutes);
```

**Tests:**
- [ ] CRUD complet des tables
- [ ] Vérification disponibilité
- [ ] Réservation avec table_id
- [ ] Test Postman

---

### Sprint 2.3 - Routes Formation (3 jours)
### Sprint 2.4 - Routes Médical (4 jours)
### Sprint 2.5 - Adaptation Routes Existantes (2 jours)

*(Détails complets disponibles sur demande)*

---

## 📅 PHASE 3-6 : Frontend, Mobile, Tests

*(Suite de la roadmap avec sprints détaillés)*

---

## 📊 Suivi de Progression

| Phase | Tâches | Complétées | Statut |
|-------|--------|------------|--------|
| Phase 0 | 2 | 0 | ⏳ Pas commencé |
| Phase 1 | 6 | 0 | ⏳ Pas commencé |
| Phase 2 | 5 | 0 | ⏳ Pas commencé |
| Phase 3 | 3 | 0 | ⏳ Pas commencé |
| Phase 4 | 3 | 0 | ⏳ Pas commencé |
| Phase 5 | 2 | 0 | ⏳ Pas commencé |
| Phase 6 | 2 | 0 | ⏳ Pas commencé |
| **TOTAL** | **23** | **0** | **0%** |

---

## 🎯 Prochaines Actions Immédiates

1. ✅ Validation de la roadmap par l'équipe
2. ⏳ Backup complet de la base de données
3. ⏳ Exécuter Migration 001 (business_type)
4. ⏳ Tests de la migration sur environnement de dev
5. ⏳ Planifier Sprint 1.2

---

**Document mis à jour:** 2025-01-16
**Prochaine révision:** Fin de chaque sprint
