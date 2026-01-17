# 📋 Plan d'Implémentation Multi-Secteur SalonHub

**Version:** 1.0
**Date:** 2025-01-16
**Objectif:** Adapter la plateforme SalonHub pour supporter les restaurants, centres de formation, et cabinets médicaux

---

## 🎯 Vue d'ensemble

### État actuel
- ✅ Système fonctionnel pour salons de beauté
- ✅ Architecture multi-tenant avec isolation des données
- ✅ Frontend React + Backend Node.js/Express + Mobile React Native
- ✅ Gestion des rendez-vous, clients, services, paiements

### Objectif
Créer une plateforme unique capable de servir **4 secteurs d'activité** avec des fonctionnalités spécifiques à chaque secteur tout en maintenant une base commune.

---

## 📊 Analyse des Besoins par Secteur

### 1. 💇 Salons de Beauté (Actuel)
**Fonctionnalités existantes:**
- Gestion des rendez-vous avec durée variable
- Services esthétiques (coupe, coloration, manucure, etc.)
- Clients réguliers avec historique
- Staff (coiffeurs, esthéticiens)
- Promotions et codes promo
- Rappels automatiques (SMS/Email/WhatsApp)

**Terminologie:**
- **Prestation** → Service
- **Client** → Client
- **Rendez-vous** → Appointment
- **Staff** → Styliste/Esthéticien

---

### 2. 🍽️ Restaurants & Cafés
**Besoins spécifiques:**
- Réservation de **tables** (non de services)
- Gestion du **nombre de couverts** par réservation
- **Plans de salle** avec tables numérotées
- **Durée fixe** des créneaux (généralement 1h30-2h)
- Gestion des **menus** (à la place des services)
- **Horaires de service** : déjeuner, dîner, brunch
- **Préférences alimentaires** : allergies, régimes spéciaux
- **Statuts spécifiques** : Réservé, En cours, Servi, Libéré
- **Overbooking** possible dans certains cas
- **Gestion des salles privées** ou espaces événementiels

**Terminologie:**
- **Prestation** → Menu/Formule (optionnel)
- **Client** → Client/Groupe
- **Rendez-vous** → Réservation
- **Staff** → Serveur/Chef de salle
- **Service** → Table

**Fonctionnalités uniques:**
- Attribution automatique des tables selon disponibilité
- Vue plan de salle en temps réel
- Gestion des horaires de service (déjeuner/dîner)
- Notes spéciales : anniversaires, événements
- Précommande de menus possibles

---

### 3. 🎓 Centres de Formation
**Besoins spécifiques:**
- **Sessions de groupe** (non individuelles)
- **Capacité limitée** par session
- **Modules/Formations** à la place des services
- **Certificats** et suivi pédagogique
- **Paiement par session** ou forfait
- **Calendrier de formations** sur plusieurs jours
- **Évaluation des participants**
- **Support documentaire** (PDF, vidéos)
- **Gestion des formateurs**
- **Statuts d'inscription** : Inscrit, Confirmé, En cours, Terminé, Certifié

**Terminologie:**
- **Prestation** → Formation/Module
- **Client** → Participant/Apprenant
- **Rendez-vous** → Inscription/Session
- **Staff** → Formateur/Instructeur
- **Service** → Session de formation

**Fonctionnalités uniques:**
- Inscription de groupe avec liste des participants
- Émission de certificats automatiques
- Envoi de supports de cours
- Calendrier multi-jours pour formations longues
- Suivi de progression
- Évaluation post-formation
- Gestion des prérequis

---

### 4. 🏥 Cabinets Médicaux
**Besoins spécifiques:**
- **Consultations médicales** individuelles
- **Dossier patient** avec historique médical
- **Confidentialité renforcée** (RGPD médical)
- **Types de consultation** : première visite, suivi, urgence
- **Ordonnances** et documents médicaux
- **Spécialités médicales** (généraliste, dentiste, kiné, etc.)
- **Mutuelle et remboursements**
- **Rappels de rendez-vous** avec respect vie privée
- **Statuts spécifiques** : Prévu, En consultation, Terminé, Annulé
- **Gestion des absences** stricte

**Terminologie:**
- **Prestation** → Type de consultation
- **Client** → Patient
- **Rendez-vous** → Consultation
- **Staff** → Praticien/Médecin
- **Service** → Acte médical

**Fonctionnalités uniques:**
- Dossier médical sécurisé
- Gestion des motifs de consultation
- Génération d'ordonnances
- Suivi des antécédents
- Gestion des urgences
- Rappels de vaccination/contrôle
- Conformité RGPD médicale
- Téléconsultation (optionnel)

---

## 🏗️ Architecture Technique Proposée

### 1. Base de Données - Approche Multi-Secteur

#### Option A : Champ `business_type` (Recommandée ✅)

**Avantages:**
- Plus simple à implémenter
- Évolutif pour ajouter de nouveaux secteurs
- Partage du code existant
- Migrations faciles

**Structure:**

```sql
-- Modification de la table tenants
ALTER TABLE tenants ADD COLUMN business_type ENUM('beauty', 'restaurant', 'training', 'medical') DEFAULT 'beauty' NOT NULL;

-- Nouvelles tables spécifiques aux restaurants
CREATE TABLE restaurant_tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(100) COMMENT 'Salle, Terrasse, etc.',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_table (tenant_id, table_number),
    INDEX idx_tenant_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Nouvelles tables spécifiques aux formations
CREATE TABLE training_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    service_id INT NOT NULL COMMENT 'Référence au module de formation',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INT DEFAULT 20,
    current_participants INT DEFAULT 0,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    INDEX idx_tenant_dates (tenant_id, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Nouvelles tables spécifiques aux cabinets médicaux
CREATE TABLE medical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    patient_id INT NOT NULL COMMENT 'Référence au client',
    blood_type VARCHAR(10),
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(255),
    insurance_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_record (tenant_id, patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table universelle adaptée avec champs spécifiques
ALTER TABLE appointments ADD COLUMN appointment_type VARCHAR(50) DEFAULT NULL COMMENT 'consultation, session, reservation';
ALTER TABLE appointments ADD COLUMN covers INT DEFAULT NULL COMMENT 'Nombre de couverts (restaurants)';
ALTER TABLE appointments ADD COLUMN table_id INT DEFAULT NULL COMMENT 'ID de table (restaurants)';
ALTER TABLE appointments ADD COLUMN session_id INT DEFAULT NULL COMMENT 'ID de session (formations)';
ALTER TABLE appointments ADD COLUMN consultation_reason TEXT DEFAULT NULL COMMENT 'Motif (médical)';
ALTER TABLE appointments ADD COLUMN is_first_visit BOOLEAN DEFAULT FALSE COMMENT 'Première visite (médical)';

-- Contraintes optionnelles
ALTER TABLE appointments ADD FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE SET NULL;
```

---

### 2. Backend - Adaptations API

#### Routes communes (existantes)
```
/api/auth/*           # Authentification
/api/clients/*        # Gestion clients (universal)
/api/services/*       # Services/Menus/Formations/Consultations
/api/appointments/*   # Réservations/Inscriptions/Consultations
```

#### Nouvelles routes spécifiques

**Restaurants:**
```
GET    /api/restaurant/tables              # Liste des tables
POST   /api/restaurant/tables              # Créer une table
PUT    /api/restaurant/tables/:id          # Modifier une table
DELETE /api/restaurant/tables/:id          # Supprimer une table
GET    /api/restaurant/floor-plan          # Vue plan de salle
GET    /api/restaurant/availability        # Disponibilité tables
```

**Centres de formation:**
```
GET    /api/training/sessions              # Liste des sessions
POST   /api/training/sessions              # Créer une session
PUT    /api/training/sessions/:id          # Modifier une session
GET    /api/training/sessions/:id/participants  # Participants
POST   /api/training/certificates/:id     # Générer certificat
GET    /api/training/courses               # Modules de formation
```

**Cabinets médicaux:**
```
GET    /api/medical/patients               # Liste patients
GET    /api/medical/patients/:id/record    # Dossier médical
PUT    /api/medical/patients/:id/record    # Mettre à jour dossier
GET    /api/medical/consultations          # Consultations
POST   /api/medical/prescriptions          # Créer ordonnance
GET    /api/medical/specialties            # Spécialités
```

#### Middleware de détection du secteur

```javascript
// middleware/businessType.js
const businessTypeMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    // Récupérer le type d'activité du tenant
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

    req.businessType = tenant.business_type;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = { businessTypeMiddleware };
```

---

### 3. Frontend - Adaptations React

#### Structure de composants conditionnels

```jsx
// components/business/BusinessLayout.js
import BeautyDashboard from './BeautyDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import TrainingDashboard from './TrainingDashboard';
import MedicalDashboard from './MedicalDashboard';

const BusinessLayout = () => {
  const { tenant } = useAuth();
  const businessType = tenant?.business_type;

  switch(businessType) {
    case 'beauty':
      return <BeautyDashboard />;
    case 'restaurant':
      return <RestaurantDashboard />;
    case 'training':
      return <TrainingDashboard />;
    case 'medical':
      return <MedicalDashboard />;
    default:
      return <BeautyDashboard />;
  }
};
```

#### Terminologie adaptative

```javascript
// utils/terminology.js
export const getTerminology = (businessType) => {
  const terms = {
    beauty: {
      service: 'Service',
      services: 'Services',
      client: 'Client',
      clients: 'Clients',
      appointment: 'Rendez-vous',
      appointments: 'Rendez-vous',
      staff: 'Styliste',
      staffPlural: 'Stylistes'
    },
    restaurant: {
      service: 'Menu',
      services: 'Menus',
      client: 'Client',
      clients: 'Clients',
      appointment: 'Réservation',
      appointments: 'Réservations',
      staff: 'Serveur',
      staffPlural: 'Serveurs',
      table: 'Table',
      covers: 'Couverts'
    },
    training: {
      service: 'Formation',
      services: 'Formations',
      client: 'Participant',
      clients: 'Participants',
      appointment: 'Inscription',
      appointments: 'Inscriptions',
      staff: 'Formateur',
      staffPlural: 'Formateurs',
      session: 'Session',
      certificate: 'Certificat'
    },
    medical: {
      service: 'Consultation',
      services: 'Consultations',
      client: 'Patient',
      clients: 'Patients',
      appointment: 'Rendez-vous',
      appointments: 'Rendez-vous',
      staff: 'Praticien',
      staffPlural: 'Praticiens',
      record: 'Dossier médical',
      prescription: 'Ordonnance'
    }
  };

  return terms[businessType] || terms.beauty;
};
```

#### Composants spécifiques

**Restaurant:**
- `FloorPlan.js` - Plan de salle interactif
- `TableManagement.js` - Gestion des tables
- `ReservationCalendar.js` - Calendrier avec vue par service

**Formation:**
- `SessionManagement.js` - Gestion des sessions
- `ParticipantList.js` - Liste des inscrits
- `CertificateGenerator.js` - Génération de certificats
- `CourseContent.js` - Contenu pédagogique

**Médical:**
- `PatientRecord.js` - Dossier médical sécurisé
- `ConsultationNotes.js` - Notes de consultation
- `PrescriptionForm.js` - Formulaire d'ordonnance
- `MedicalHistory.js` - Historique médical

---

### 4. Mobile - Adaptations React Native

#### Navigation conditionnelle

```javascript
// navigation/BusinessNavigator.js
const BusinessNavigator = () => {
  const { tenant } = useAuth();
  const businessType = tenant?.business_type;

  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />

      {businessType === 'restaurant' && (
        <>
          <Tab.Screen name="Tables" component={TablesScreen} />
          <Tab.Screen name="Reservations" component={ReservationsScreen} />
        </>
      )}

      {businessType === 'training' && (
        <>
          <Tab.Screen name="Sessions" component={SessionsScreen} />
          <Tab.Screen name="Participants" component={ParticipantsScreen} />
        </>
      )}

      {businessType === 'medical' && (
        <>
          <Tab.Screen name="Patients" component={PatientsScreen} />
          <Tab.Screen name="Consultations" component={ConsultationsScreen} />
        </>
      )}

      {/* Onglets communs */}
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
```

---

## 📅 Plan d'Implémentation Étape par Étape

### Phase 1 : Préparation (1-2 semaines)

#### Sprint 1.1 - Base de données
- [ ] Ajouter le champ `business_type` à la table `tenants`
- [ ] Créer les tables spécifiques (restaurant_tables, training_sessions, medical_records)
- [ ] Ajouter les colonnes optionnelles à la table `appointments`
- [ ] Migrer les données existantes (business_type = 'beauty')
- [ ] Tester l'intégrité des données

#### Sprint 1.2 - Backend Core
- [ ] Créer le middleware `businessTypeMiddleware`
- [ ] Adapter les routes existantes pour supporter tous les secteurs
- [ ] Ajouter la logique de terminologie côté serveur
- [ ] Tests unitaires du middleware

---

### Phase 2 : Restaurants (2-3 semaines)

#### Sprint 2.1 - Backend Restaurant
- [ ] Créer les routes `/api/restaurant/*`
- [ ] Implémenter la gestion des tables
- [ ] Ajouter la logique de disponibilité des tables
- [ ] Adapter le système de rendez-vous pour les réservations
- [ ] Tests API Postman

#### Sprint 2.2 - Frontend Restaurant
- [ ] Créer `RestaurantDashboard.js`
- [ ] Implémenter `FloorPlan.js` (plan de salle)
- [ ] Créer `TableManagement.js`
- [ ] Adapter le calendrier pour les réservations
- [ ] Formulaire de réservation avec nombre de couverts

#### Sprint 2.3 - Mobile Restaurant
- [ ] Écrans de gestion des tables
- [ ] Vue réservations en liste
- [ ] Formulaire mobile de réservation
- [ ] Tests fonctionnels

---

### Phase 3 : Centres de Formation (2-3 semaines)

#### Sprint 3.1 - Backend Formation
- [ ] Créer les routes `/api/training/*`
- [ ] Implémenter la gestion des sessions
- [ ] Système d'inscription avec capacité max
- [ ] Génération de certificats (PDF)
- [ ] API de suivi des participants

#### Sprint 3.2 - Frontend Formation
- [ ] Créer `TrainingDashboard.js`
- [ ] Implémenter `SessionManagement.js`
- [ ] Créer `ParticipantList.js`
- [ ] `CertificateGenerator.js`
- [ ] Calendrier multi-jours

#### Sprint 3.3 - Mobile Formation
- [ ] Écrans de gestion des sessions
- [ ] Liste des participants
- [ ] Émission de certificats mobile
- [ ] Tests fonctionnels

---

### Phase 4 : Cabinets Médicaux (3-4 semaines)

#### Sprint 4.1 - Backend Médical
- [ ] Créer les routes `/api/medical/*`
- [ ] Implémenter le dossier médical sécurisé
- [ ] Système de gestion des consultations
- [ ] API d'ordonnances
- [ ] Conformité RGPD médicale

#### Sprint 4.2 - Frontend Médical
- [ ] Créer `MedicalDashboard.js`
- [ ] Implémenter `PatientRecord.js` (sécurisé)
- [ ] Créer `ConsultationNotes.js`
- [ ] `PrescriptionForm.js`
- [ ] Historique médical

#### Sprint 4.3 - Mobile Médical
- [ ] Écrans patients
- [ ] Consultation mobile
- [ ] Dossier médical sécurisé
- [ ] Tests de sécurité

---

### Phase 5 : Landing Page & Onboarding (1 semaine)

#### Sprint 5.1 - Sélection du secteur
- [ ] Page de choix du secteur lors de l'inscription
- [ ] Adapter le formulaire d'inscription selon le secteur
- [ ] Personnalisation automatique du tenant
- [ ] Mise à jour de la landing page

#### Sprint 5.2 - Onboarding personnalisé
- [ ] Tutoriel adapté par secteur
- [ ] Données de démonstration par secteur
- [ ] Guide de démarrage spécifique
- [ ] Documentation utilisateur

---

### Phase 6 : Tests & Optimisation (1-2 semaines)

#### Sprint 6.1 - Tests
- [ ] Tests end-to-end par secteur
- [ ] Tests de charge
- [ ] Tests de sécurité (RGPD médical)
- [ ] Tests cross-browser/mobile

#### Sprint 6.2 - Optimisation
- [ ] Performance backend
- [ ] Optimisation queries SQL
- [ ] Caching stratégique
- [ ] Bundle size frontend

---

## 🎨 Adaptations UI/UX par Secteur

### Couleurs & Thèmes

```javascript
// constants/themes.js
export const BUSINESS_THEMES = {
  beauty: {
    primary: '#A85460',    // Rose
    secondary: '#764ba2',  // Violet
    accent: '#f472b6'
  },
  restaurant: {
    primary: '#8B5A3C',    // Marron/Orange
    secondary: '#ea580c',
    accent: '#fb923c'
  },
  training: {
    primary: '#6B8E9E',    // Bleu cyan
    secondary: '#0891b2',
    accent: '#22d3ee'
  },
  medical: {
    primary: '#5E8B7E',    // Vert
    secondary: '#059669',
    accent: '#10b981'
  }
};
```

### Icônes

- **Beauté:** Ciseaux, vernis, brosse
- **Restaurant:** Fourchette/couteau, assiette, table
- **Formation:** Livre, certificat, tableau
- **Médical:** Stéthoscope, cœur, croix

---

## 🔐 Considérations de Sécurité

### RGPD Médical (Renforcé)

1. **Chiffrement des dossiers médicaux**
   - Chiffrement au repos (base de données)
   - Chiffrement en transit (HTTPS/TLS)

2. **Accès restreint**
   - Logs d'accès aux dossiers
   - Audit trail complet
   - Durée de conservation définie

3. **Consentement patient**
   - Consentement explicite pour le stockage
   - Droit à l'effacement garanti
   - Export des données personnelles

---

## 📦 Livrables

### Documentation
- [ ] Spécifications techniques par secteur
- [ ] Guide d'utilisation administrateur
- [ ] Guide utilisateur final par secteur
- [ ] API documentation mise à jour

### Code
- [ ] Backend multi-secteur fonctionnel
- [ ] Frontend adaptatif
- [ ] Mobile adaptatif
- [ ] Scripts de migration

### Tests
- [ ] Suite de tests automatisés
- [ ] Tests de régression
- [ ] Tests de sécurité

---

## 💰 Estimation Budget

### Temps de développement

| Phase | Durée | Charge (jours-dev) |
|-------|-------|-------------------|
| Phase 1 - Préparation | 1-2 semaines | 10 jours |
| Phase 2 - Restaurants | 2-3 semaines | 15 jours |
| Phase 3 - Formation | 2-3 semaines | 15 jours |
| Phase 4 - Médical | 3-4 semaines | 20 jours |
| Phase 5 - Landing/Onboarding | 1 semaine | 5 jours |
| Phase 6 - Tests/Optimisation | 1-2 semaines | 10 jours |
| **TOTAL** | **10-15 semaines** | **75 jours** |

### Ressources nécessaires

- **1 Développeur Backend** (Node.js/SQL)
- **1 Développeur Frontend** (React)
- **1 Développeur Mobile** (React Native)
- **1 Designer UI/UX** (temps partiel)
- **1 QA Tester** (temps partiel)

---

## 🚀 Stratégie de Lancement

### Lancement progressif

1. **Beta privée** : Restaurants (1 mois)
   - 5-10 restaurants pilotes
   - Collecte de feedback
   - Ajustements

2. **Beta privée** : Formation (1 mois)
   - 5-10 centres de formation
   - Feedback utilisateurs
   - Optimisations

3. **Beta privée** : Médical (1 mois)
   - 3-5 cabinets médicaux
   - Validation RGPD
   - Sécurité renforcée

4. **Lancement public** : Tous secteurs
   - Marketing ciblé par secteur
   - Support dédié
   - Documentation complète

---

## ✅ Critères de Succès

### Techniques
- ✅ Tous les secteurs fonctionnels
- ✅ 0 bug critique
- ✅ Performance maintenue (< 2s chargement)
- ✅ 100% couverture tests critiques

### Business
- ✅ 50 nouveaux tenants/mois tous secteurs confondus
- ✅ Taux de satisfaction > 90%
- ✅ Taux de rétention > 85%
- ✅ Support < 24h de réponse

---

## 📞 Prochaines Étapes Immédiates

1. **Validation du plan** par l'équipe
2. **Priorisation** des secteurs (Restaurant en premier ?)
3. **Allocation** des ressources
4. **Lancement Sprint 1.1** (Base de données)

---

**Document préparé par:** Claude Code
**Contact:** Pour questions ou ajustements du plan
