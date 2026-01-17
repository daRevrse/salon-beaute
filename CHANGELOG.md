# Changelog - SalonHub Multi-Secteur

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [2.0.0] - 2026-01-16

### 🎉 Ajouté - Phase 2: Restaurant

#### Base de Données
- **Nouvelle colonne** `business_type` dans la table `tenants`
  - ENUM: 'beauty', 'restaurant', 'training', 'medical'
  - Permet d'identifier le type de business de chaque tenant
- **4 nouvelles tables** pour le secteur restaurant:
  - `restaurant_tables` - Gestion des tables physiques du restaurant
  - `restaurant_menus` - Carte du restaurant avec informations nutritionnelles
  - `restaurant_orders` - Gestion des commandes avec tracking financier
  - `restaurant_order_items` - Lignes de commande individuelles
- **Extension de la table `appointments`**:
  - `table_id` - Pour les réservations de tables
  - `guest_count` - Nombre de convives
  - `special_requests` - Demandes spéciales

#### API Routes
- **Nouveau middleware** `businessTypeMiddleware`
  - Injecte automatiquement `req.businessType` dans toutes les requêtes
  - Fonction `requireBusinessType(types)` pour restreindre l'accès par secteur
- **Routes Restaurant** (`/api/restaurant`):
  - `/tables` - CRUD complet (6 endpoints)
  - `/menus` - CRUD complet + filtres (7 endpoints)
  - `/orders` - CRUD complet + gestion statut/paiement (7 endpoints)

#### Authentification
- **Paramètre `business_type`** ajouté à l'inscription (`/api/auth/register`)
- **Retour de `business_type`** dans `/api/auth/login` et `/api/auth/me`

#### Documentation
- [PHASE2_COMPLETED.md](salonhub-backend/database/PHASE2_COMPLETED.md) - Documentation technique complète
- [RESTAURANT_API_TESTS.md](salonhub-backend/database/RESTAURANT_API_TESTS.md) - Guide de tests API avec exemples
- [MULTI_SECTOR_README.md](MULTI_SECTOR_README.md) - Architecture multi-secteur globale
- [QUICK_START_RESTAURANT.md](QUICK_START_RESTAURANT.md) - Guide de démarrage rapide

#### Migrations
- `001_add_business_type_safe.sql` - Ajout du champ business_type avec vérifications
- `002_restaurant_tables.sql` - Création des tables restaurant
- `INSTALL_FINAL_NO_CHECKS.sql` - Script d'installation tout-en-un

### 🔒 Sécurité
- **Isolation multi-secteur**: Les routes restaurant sont automatiquement bloquées pour les salons de beauté
- **Vérifications**: Middleware vérifie le business_type avant d'autoriser l'accès

### 🎯 Fonctionnalités Restaurant
- Gestion complète des tables (capacité, section, disponibilité)
- Menu avec allergènes et informations diététiques (végétarien, vegan, sans gluten)
- Commandes avec calculs automatiques:
  - Subtotal (calculé depuis les prix des items)
  - Taxes (10% automatique)
  - Pourboires
  - Remises
  - Total final
- Statuts de commande: pending → confirmed → preparing → ready → served → completed
- Statuts de paiement: unpaid → partial → paid → refunded
- Réservations de tables via le système d'appointments existant

---

## [1.0.0] - 2025-XX-XX

### 🎉 Ajouté - Version Initiale (Beauty)

#### Base de Données
- Architecture multi-tenant complète
- Tables de base:
  - `tenants` - Données des salons
  - `users` - Utilisateurs/Staff
  - `clients` - Clients des salons
  - `services` - Services proposés
  - `appointments` - Rendez-vous
  - `notifications` - Notifications push
  - `promotions` - Offres promotionnelles

#### API Routes
- `/api/auth` - Authentification (register, login, me)
- `/api/clients` - CRUD clients
- `/api/services` - CRUD services
- `/api/appointments` - CRUD rendez-vous
- `/api/settings` - Paramètres du salon
- `/api/notifications` - Gestion des notifications
- `/api/promotions` - Gestion des promotions
- `/api/scheduler` - Tâches planifiées (rappels)

#### Fonctionnalités
- Multi-tenant avec isolation complète
- Authentification JWT
- Upload de fichiers (images)
- Notifications push (web + mobile)
- Rappels automatiques (24h et 2h avant)
- Paiement Stripe
- Mode public pour booking sans authentification
- Socket.io pour temps réel

#### Administration
- Routes SuperAdmin:
  - `/api/admin` - Gestion globale
  - `/api/admin/billing` - Facturation
  - `/api/admin/analytics` - Analytics avancées
  - `/api/admin/alerts` - Alertes système
  - `/api/admin/impersonate` - Impersonation
  - `/api/admin/system` - Santé du système

---

## [3.0.0] - 2026-01-16

### 🎉 Ajouté - Phase 3: Training (Formations)

#### Base de Données
- **6 nouvelles tables** pour le secteur formation:
  - `training_courses` - Catalogue de cours avec niveaux et modes de livraison
  - `training_sessions` - Sessions planifiées avec formateurs
  - `training_enrollments` - Inscriptions étudiants avec suivi paiement
  - `training_attendance` - Système de présences et assiduité
  - `training_certificates` - Certificats avec codes de vérification
  - `training_materials` - Supports de cours (documents, vidéos, quiz)
- **Extension table `appointments`**: `training_session_id` (INT NULL)

#### API Routes
- **Routes Training** (`/api/training`):
  - `/courses` - CRUD complet + métadonnées (7 endpoints)
  - `/sessions` - CRUD complet + gestion statut (6 endpoints)
  - `/enrollments` - CRUD + gestion paiement (6 endpoints)
  - `/attendance` - Enregistrement et suivi présences (3 endpoints)
  - `/certificates` - Délivrance + vérification publique (4 endpoints)
  - `/materials` - CRUD supports de cours (5 endpoints)

#### Fonctionnalités
- Modes de livraison: présentiel, en ligne, hybride
- Niveaux: beginner, intermediate, advanced, expert
- Gestion présences avec check-in/check-out
- Certificats avec numéros uniques + codes de vérification
- Endpoint public `/certificates/verify/:code` pour validation
- Supports multimédia téléchargeables

#### Documentation
- [PHASE3_TRAINING_SUMMARY.md](salonhub-backend/database/PHASE3_TRAINING_SUMMARY.md)
- [INSTALL_PHASE3_TRAINING.sql](salonhub-backend/database/INSTALL_PHASE3_TRAINING.sql)

---

## [4.0.0] - 2026-01-16

### 🎉 Ajouté - Phase 4: Medical (Cabinets Médicaux)

#### Base de Données
- **8 nouvelles tables** pour le secteur médical:
  - `medical_patients` - Dossiers patients complets
  - `medical_allergies` - Allergies avec sévérité
  - `medical_conditions` - Conditions médicales (ICD-10)
  - `medical_medications` - Médicaments en cours
  - `medical_records` - Consultations avec signes vitaux
  - `medical_prescriptions` - Ordonnances avec renouvellements
  - `medical_lab_results` - Résultats laboratoire (LOINC)
  - `medical_vaccinations` - Carnet de vaccination (CVX)
- **Extension table `appointments`**: `patient_id`, `appointment_type`, `reason_for_visit`

#### API Routes
- **Routes Medical** (`/api/medical`):
  - `/patients` - CRUD + sous-routes allergies/conditions/médicaments
  - `/records` - Consultations et dossiers
  - `/prescriptions` - Ordonnances
  - `/lab-results` - Résultats examens
  - `/vaccinations` - Vaccinations

#### Fonctionnalités
- Dossiers patients avec contact urgence + assurance
- Historique médical: allergies, conditions, médicaments
- Consultations avec signes vitaux (JSON)
- Ordonnances avec gestion renouvellements
- Résultats laboratoire avec flags anormaux
- Support codes médicaux (ICD-10, LOINC, CVX)

#### Documentation
- [INSTALL_PHASE4_MEDICAL.sql](salonhub-backend/database/INSTALL_PHASE4_MEDICAL.sql)

### 🎊 Milestone: 4 Secteurs Complets
SalonHub supporte maintenant **TOUS** les 4 secteurs prévus:
- ✅ Beauty (Salons)
- ✅ Restaurant
- ✅ Training (Formations)
- ✅ Medical (Cabinets médicaux)

---

## [À venir]

### Améliorations Générales
- Dashboard analytics temps réel
- Export de données (PDF, Excel)
- API publique documentée (OpenAPI/Swagger)
- SDK JavaScript/TypeScript
- Application mobile native (iOS/Android)
- Système de caisse intégré
- Programme de fidélité multi-secteur
- Marketplace de plugins

---

## Types de Changements

- **Ajouté** - Pour les nouvelles fonctionnalités
- **Modifié** - Pour les changements dans les fonctionnalités existantes
- **Déprécié** - Pour les fonctionnalités qui seront bientôt supprimées
- **Supprimé** - Pour les fonctionnalités supprimées
- **Corrigé** - Pour les corrections de bugs
- **Sécurité** - En cas de vulnérabilités

---

## Liens

- [Documentation Générale](MULTI_SECTOR_README.md)
- [Guide Restaurant](QUICK_START_RESTAURANT.md)
- [Issues GitHub](https://github.com/votre-org/salonhub/issues)
- [Roadmap](https://github.com/votre-org/salonhub/projects)
