# Phase 3: Training (Formations) - Résumé

**Date**: 2026-01-16
**Statut**: ✅ Code implémenté (DB à migrer)

---

## 📋 Vue d'Ensemble

La Phase 3 ajoute le support complet pour les **centres de formation** (training centers) dans SalonHub. Les organismes de formation peuvent désormais gérer:

- 📚 Catalogue de cours avec niveaux et modes de livraison
- 📅 Sessions planifiées avec formateurs
- 👨‍🎓 Inscriptions étudiants avec suivi paiement
- ✅ Présences et assiduité
- 🎓 Certificats avec codes de vérification
- 📑 Supports de cours (documents, vidéos, quiz)

---

## 🗄️ Base de Données

### Tables Créées

#### 1. `training_courses` - Catalogue de Cours
**Données principales**:
- Titre, description, catégorie
- Niveau: beginner, intermediate, advanced, expert
- Durée (heures), prix
- Mode: in_person, online, hybrid
- Prérequis, objectifs pédagogiques, syllabus
- Certification offerte (oui/non) + nom du certificat

**Index**: tenant_id, category, level, delivery_mode

#### 2. `training_sessions` - Sessions Planifiées
**Données principales**:
- Référence au cours
- Numéro de session unique
- Formateur (instructor_id → users)
- Dates: start_date, end_date, start_time, end_time
- Lieu physique OU lien visio (meeting_url + password)
- Capacité: current_students / max_students
- Statut: scheduled, open, full, in_progress, completed, cancelled

**Index**: tenant_id, course_id, instructor_id, dates, status

#### 3. `training_enrollments` - Inscriptions
**Données principales**:
- Référence session + étudiant (student_id → clients)
- Numéro d'inscription unique
- Statut: pending, confirmed, active, completed, dropped, cancelled
- Paiement: payment_status, amount_paid, amount_due
- Résultats: attendance_rate, final_grade, passed

**Index**: tenant_id, session_id, student_id, status, payment_status

#### 4. `training_attendance` - Présences
**Données principales**:
- Référence inscription
- Date de session
- check_in_time, check_out_time
- Statut: present, absent, late, excused

**Index**: tenant_id, enrollment_id, session_date
**Contrainte**: UNIQUE (enrollment_id, session_date) - 1 présence par jour par inscription

#### 5. `training_certificates` - Certificats
**Données principales**:
- Référence inscription
- Numéro de certificat unique
- Nom du certificat
- Date d'émission, expiration (optionnelle)
- Note (grade)
- Code de vérification (pour validation publique)
- URL du PDF généré
- Validité (is_valid - pour révocation)

**Index**: tenant_id, enrollment_id, verification_code

#### 6. `training_materials` - Supports de Cours
**Données principales**:
- Référence cours
- Titre, description
- Type: document, video, quiz, assignment, link, other
- URL fichier OU lien externe
- Taille fichier, durée (pour vidéos)
- Ordre d'affichage
- Téléchargeable, Public (accès sans inscription)

**Index**: tenant_id, course_id, material_type

### Extension `appointments`
**Nouvelle colonne**: `training_session_id` (INT NULL)
- Permet de lier un rendez-vous à une session de formation
- FK vers `training_sessions(id)` ON DELETE SET NULL

---

## 🛣️ Routes API

### Base: `/api/training`

Toutes les routes nécessitent:
- `authMiddleware` - JWT
- `tenantMiddleware` - Isolation tenant
- `businessTypeMiddleware` - Injection business_type
- `requireBusinessType('training')` - Accès réservé centres de formation

### 1. Cours (`/api/training/courses`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des cours (filtres: category, level, delivery_mode, active) |
| GET | `/meta/categories` | Liste des catégories uniques |
| GET | `/:id` | Détails d'un cours + sessions + matériels |
| POST | `/` | Créer un cours |
| PUT | `/:id` | Mettre à jour un cours |
| PATCH | `/:id/status` | Toggle actif/inactif |
| DELETE | `/:id` | Supprimer un cours (si pas de sessions actives) |

### 2. Sessions (`/api/training/sessions`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des sessions (filtres: course_id, instructor_id, status, dates) |
| GET | `/:id` | Détails d'une session + inscriptions |
| POST | `/` | Créer une session (génère session_number auto) |
| PUT | `/:id` | Mettre à jour une session |
| PATCH | `/:id/status` | Changer le statut |
| DELETE | `/:id` | Supprimer une session (si pas d'inscriptions actives) |

### 3. Inscriptions (`/api/training/enrollments`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des inscriptions (filtres: session_id, student_id, status, payment_status) |
| GET | `/:id` | Détails d'une inscription |
| POST | `/` | Créer une inscription (génère enrollment_number auto) |
| PATCH | `/:id/status` | Changer le statut |
| PATCH | `/:id/payment` | Mettre à jour paiement |
| DELETE | `/:id` | Annuler une inscription |

### 4. Présences (`/api/training/attendance`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des présences (filtres: enrollment_id, session_date, status) |
| POST | `/` | Enregistrer/Mettre à jour présence (UPSERT) |
| PATCH | `/:id` | Modifier une présence |

### 5. Certificats (`/api/training/certificates`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des certificats (filtres: enrollment_id, is_valid) |
| GET | `/verify/:code` | **PUBLIC** - Vérifier un certificat par code |
| POST | `/` | Délivrer un certificat (génère cert_number + verification_code) |
| PATCH | `/:id/validity` | Révoquer/Valider un certificat |

### 6. Supports (`/api/training/materials`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des supports (filtres: course_id, material_type, is_public) |
| GET | `/:id` | Détails d'un support |
| POST | `/` | Ajouter un support |
| PUT | `/:id` | Mettre à jour un support |
| DELETE | `/:id` | Supprimer un support |

---

## 📁 Fichiers Créés

### Migrations
- `database/migrations/003_training_tables.sql` - Migration complète
- `database/INSTALL_PHASE3_TRAINING.sql` - Installation rapide

### Routes
- `src/routes/training/index.js` - Router principal
- `src/routes/training/courses.js` - CRUD cours
- `src/routes/training/sessions.js` - CRUD sessions
- `src/routes/training/enrollments.js` - CRUD inscriptions
- `src/routes/training/attendance.js` - Gestion présences
- `src/routes/training/certificates.js` - Gestion certificats
- `src/routes/training/materials.js` - Gestion supports

### Serveur
- `src/server.js` - ✅ Routes Training enregistrées

---

## 🚀 Installation

### Prérequis
- Phase 1 (Beauty) installée
- Phase 2 (Restaurant) installée

### Étapes

1. **Exécuter la migration**
   - Ouvrir phpMyAdmin
   - Sélectionner la base `salonhub_dev`
   - Copier/coller le contenu de `INSTALL_PHASE3_TRAINING.sql`
   - Exécuter

2. **Redémarrer le serveur** (si nécessaire)
   ```bash
   npm start
   ```

3. **Tester**
   ```bash
   # Créer un compte training
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "business_name": "Formation Pro",
       "business_type": "training",
       "owner_name": "Sophie Martin",
       "email": "sophie@formationpro.fr",
       "password": "SecurePass123!"
     }'

   # Test avec le token obtenu
   curl -X GET http://localhost:5000/api/training/health \
     -H "Authorization: Bearer VOTRE_TOKEN"
   ```

---

## 🎯 Cas d'Usage

### 1. Organisme de Formation Professionnelle
- Catalogues de formations certifiantes
- Gestion multi-formateurs
- Suivi assiduité règlementaire (OPCO, CPF)
- Émission de certificats de compétence

### 2. École de Langues
- Cours par niveau (A1, A2, B1, B2, C1, C2)
- Sessions en présentiel + en ligne
- Supports multimédia (vidéos, exercices)
- Certificats de niveau

### 3. Centre de Formation Technique
- Formations métiers (plomberie, électricité, etc.)
- Ateliers pratiques avec présence obligatoire
- Documents techniques téléchargeables
- Certifications professionnelles

### 4. Académie en Ligne
- Cours 100% online avec liens Zoom/Teams
- Supports vidéo et documents PDF
- Quiz et assignments
- Certificats numériques vérifiables

---

## 🔐 Sécurité

### Isolation Multi-Secteur
```javascript
// Salon de beauté ne peut PAS accéder aux routes training
curl -X GET http://localhost:5000/api/training/courses \
  -H "Authorization: Bearer BEAUTY_TOKEN"

// Réponse: 403 Forbidden
{
  "success": false,
  "error": "Access Denied",
  "message": "This feature is only available for training businesses"
}
```

### Vérification Publique des Certificats
L'endpoint `/api/training/certificates/verify/:code` est PUBLIC:
- Permet aux employeurs de vérifier l'authenticité d'un certificat
- Retourne uniquement les informations essentielles (pas de données sensibles)
- Code de vérification unique et aléatoire

---

## 📊 Workflow Typique

```
1. Centre crée un COURS
   ↓
2. Centre planifie des SESSIONS pour ce cours
   ↓
3. Étudiants s'INSCRIVENT à une session
   ↓
4. Centre enregistre les PRÉSENCES chaque jour
   ↓
5. À la fin: Centre calcule taux présence + note finale
   ↓
6. Si réussite: Centre délivre un CERTIFICAT
   ↓
7. Étudiant peut partager le code de vérification
   ↓
8. Employeur vérifie l'authenticité du certificat
```

---

## 📈 KPIs Disponibles

Avec cette structure, vous pouvez facilement calculer:

- **Taux de remplissage**: `current_students / max_students` par session
- **Taux d'assiduité moyen**: `AVG(attendance_rate)` par cours
- **Taux de réussite**: `COUNT(passed=1) / COUNT(*)` par cours
- **CA par formateur**: `SUM(amount_paid)` GROUP BY instructor_id
- **Cours populaires**: `COUNT(enrollments)` par cours
- **Abandons**: `COUNT(status='dropped')`

---

## 🔜 Améliorations Futures

- **Quiz interactifs** avec correction automatique
- **Émission automatique de certificats** (si note >= seuil)
- **Notifications** rappel présence, nouvelle session disponible
- **Visioconférence intégrée** (au lieu de liens externes)
- **Espace étudiant** avec progression visualisée
- **Forum par cours** pour échanges
- **Badges et gamification**
- **Export conformité OPCO/CPF** (France)
- **Intégration LMS** (Moodle, Canvas)

---

## ✅ Statut

- [x] Migration SQL créée
- [x] Routes API implémentées
- [x] Routes enregistrées dans server.js
- [x] Middleware business_type configuré
- [ ] Migration exécutée dans la BDD (à faire par l'utilisateur)
- [ ] Tests API (à faire)
- [ ] Documentation API détaillée (à faire)
- [ ] Frontend (à développer)

---

**Version**: 1.0.0
**Date**: 2026-01-16
**Statut**: Prêt pour installation
