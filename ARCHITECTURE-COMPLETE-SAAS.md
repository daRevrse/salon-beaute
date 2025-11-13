# 🏗️ ARCHITECTURE COMPLÈTE PROJET SALONHUB SAAS

## 📊 VISION D'ENSEMBLE DU REPO GIT

```
📁 salonhub-saas/  (Repo Git unique)
│
├── 📁 v1-local/                    ← Application LOCAL (Octobre 2024)
│   ├── backend/
│   │   ├── server.js              (SQLite, single-tenant)
│   │   ├── database.js
│   │   └── salon.db
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx            (Interface admin)
│       │   └── App.css
│       └── package.json
│
├── 📁 landing-page/                ← Landing SaaS (Novembre 2024)
│   ├── index.html                 ✅ DÉPLOYÉ
│   ├── styles.css                 (salon.flowkraftagency.com)
│   └── script.js
│
├── 📁 saas-backend/                ← Backend MySQL Multi-tenant
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        (MySQL pool)
│   │   ├── middleware/
│   │   │   ├── auth.js            (JWT)
│   │   │   └── tenant.js          (Isolation)
│   │   ├── routes/
│   │   │   ├── public.js          ← Routes booking public
│   │   │   ├── tenants.js
│   │   │   ├── clients.js
│   │   │   ├── services.js
│   │   │   └── appointments.js
│   │   └── server.js
│   ├── database/
│   │   └── schema.sql             (Multi-tenant structure)
│   ├── .env
│   └── package.json
│
├── 📁 saas-frontend/               ← Frontend React Multi-tenant
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/            ← Pages booking public
│   │   │   │   ├── BookingLanding.js
│   │   │   │   ├── BookingDateTime.js
│   │   │   │   ├── BookingClientInfo.js
│   │   │   │   └── BookingConfirmation.js
│   │   │   └── admin/             ← Dashboard salons
│   │   │       ├── Dashboard.js
│   │   │       ├── Services.js
│   │   │       ├── Clients.js
│   │   │       └── Appointments.js
│   │   ├── components/
│   │   │   └── booking/
│   │   │       └── Calendar.js
│   │   ├── hooks/
│   │   │   └── usePublicBooking.js
│   │   └── App.jsx
│   └── package.json
│
├── 📁 docs/
│   ├── PLAN-BOOKING-PUBLIC-COMPLET.md  ✅ Existe
│   └── ARCHITECTURE-COMPLETE-SAAS.md   ← Ce fichier
│
└── README.md                       (Documentation repo)
```

---

## 🎯 ÉTAT ACTUEL DU PROJET

### ✅ CE QUI EXISTE (Déployé/Fonctionnel)

1. **Landing Page SaaS**
   - 📍 Chemin: `/landing-page/`
   - 🌐 URL: https://salon.flowkraftagency.com
   - ✅ Live et fonctionnel
   - 📧 Collecte emails (besoin alternative Formspree)

2. **Application V1 Local**
   - 📍 Chemin: `/v1-local/`
   - 💾 SQLite single-tenant
   - ✅ Code complet et fonctionnel
   - 🎨 Interface admin React
   - ⚠️ Pas encore de booking public

3. **Schéma MySQL Multi-tenant**
   - 📍 Chemin: `/saas-backend/database/schema.sql`
   - ✅ Structure complète définie
   - 🏗️ Tables: tenants, users, clients, services, appointments
   - 🔒 Isolation par tenant_id

### ⏳ CE QUI EST EN COURS

4. **Backend MySQL SaaS**
   - 📍 Chemin: `/saas-backend/`
   - 🔧 Config database.js
   - 🔧 Middleware tenant + auth
   - 🔧 Routes CRUD multi-tenant
   - ❌ Routes publiques booking (à créer)

### 🚀 CE QU'IL FAUT CRÉER MAINTENANT

5. **Système Booking Public** (PLAN-BOOKING-PUBLIC-COMPLET.md)
   - Backend: Routes publiques API
   - Frontend: Pages booking workflow
   - Composants: Calendar, formulaires
   - Logique: Calcul disponibilités

---

## 🔗 COMMENT TOUT S'ARTICULE

### ARCHITECTURE FLUX UTILISATEUR

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET                                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   LANDING    │    │   BOOKING    │    │  ADMIN APP   │
│    PAGE      │    │   PUBLIC     │    │  DASHBOARD   │
│              │    │              │    │              │
│  Inscription │    │ Réservation  │    │  Gestion     │
│   salons     │    │   clients    │    │   salon      │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND SAAS (Node.js + MySQL)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌐 API PUBLIQUE (Sans Auth)                                │
│  ├─ POST /api/leads (landing page)                          │
│  ├─ GET  /api/public/salon/:slug                            │
│  ├─ GET  /api/public/salon/:slug/services                   │
│  ├─ GET  /api/public/salon/:slug/availability               │
│  └─ POST /api/public/appointments                           │
│                                                              │
│  🔐 API PRIVÉE (Auth JWT)                                   │
│  ├─ POST /api/auth/login                                    │
│  ├─ GET  /api/salons/:id/dashboard                          │
│  ├─ GET  /api/salons/:id/appointments                       │
│  ├─ PUT  /api/appointments/:id/status                       │
│  └─ ... (toutes routes CRUD)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES MySQL                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  tenants         (id, slug, nom, plan, status...)           │
│  users           (id, tenant_id, email, password...)        │
│  clients         (id, tenant_id, nom, prenom...)            │
│  services        (id, tenant_id, nom, prix, durée...)       │
│  appointments    (id, tenant_id, client_id, status...)      │
│                                                              │
│  🔒 ISOLATION: Toutes requêtes filtrées par tenant_id       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎭 LES DEUX INTERFACES

### 1️⃣ INTERFACE PUBLIQUE (Clients)

**URL**: `app.salonhub.com/book/[slug-salon]`

```
Workflow Client:
┌──────────────────────────────────────────┐
│ 1. Landing Booking                       │
│    /book/salon-beautiful-paris           │
│    → Voir services disponibles           │
│    → Choisir un service                  │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ 2. Sélection Date/Heure                  │
│    → Calendrier interactif               │
│    → Créneaux disponibles                │
│    → Sélectionner date + heure           │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ 3. Informations Client                   │
│    → Prénom, Nom                         │
│    → Email, Téléphone                    │
│    → Notes optionnelles                  │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ 4. Confirmation                          │
│    → Récapitulatif complet               │
│    → Status: "En attente validation"     │
│    → RDV créé en DB (pending)            │
└──────────────────────────────────────────┘
```

**Caractéristiques**:
- ❌ Pas d'authentification requise
- ✅ Design épuré et responsive
- ✅ Process en 3 clics maximum
- ✅ Validation temps réel

### 2️⃣ INTERFACE ADMIN (Salon)

**URL**: `app.salonhub.com/dashboard`

```
Dashboard Salon:
┌──────────────────────────────────────────┐
│ 🔐 Login (JWT Token)                     │
│    → Email + Password                    │
│    → Token stocké localStorage           │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ 📊 Dashboard                             │
│    → Stats du jour/semaine/mois          │
│    → Prochain RDV                        │
│    → Notifications RDV pending           │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ 📅 Gestion Rendez-vous                   │
│    → Liste tous RDV                      │
│    → Badge "Pending" pour validation     │
│    → Boutons: Confirmer / Refuser        │
│    → Changement status                   │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ 👥 Gestion Clients                       │
│ 🎨 Gestion Services                      │
│ ⚙️  Paramètres Salon                     │
└──────────────────────────────────────────┘
```

**Caractéristiques**:
- 🔐 Authentification JWT obligatoire
- 🏢 Données isolées par tenant_id
- 📱 Interface complète admin
- 🔔 Notifications temps réel

---

## 🔄 ÉVOLUTION V1 LOCAL → V2 SAAS

### Migration Progressive

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: Garder V1 comme référence                          │
├─────────────────────────────────────────────────────────────┤
│ ✅ Code v1-local/ reste intact                              │
│ ✅ Servir de base pour copier logique                       │
│ ✅ Tester comparaison fonctionnalités                       │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: Créer Backend SaaS                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Copier structure routes depuis v1                        │
│ 2. Adapter pour MySQL (au lieu SQLite)                      │
│ 3. Ajouter tenant_id PARTOUT                                │
│ 4. Créer middleware isolation                               │
│ 5. Ajouter système auth JWT                                 │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: Ajouter Routes Publiques Booking                   │
├─────────────────────────────────────────────────────────────┤
│ ✅ Suivre PLAN-BOOKING-PUBLIC-COMPLET.md                    │
│ ✅ Créer routes/public.js                                   │
│ ✅ Middleware bookingValidation.js                          │
│ ✅ Utils availability.js (calcul créneaux)                  │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4: Créer Frontend SaaS                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Reprendre composants v1 pour admin                       │
│ 2. Adapter API calls (SQLite → MySQL)                       │
│ 3. Ajouter pages booking public                             │
│ 4. Créer routing /book/:slug + /dashboard                   │
│ 5. Système auth avec localStorage                           │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 5: Tests & Déploiement                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Tester workflow complet booking                          │
│ ✅ Tester isolation multi-tenant                            │
│ ✅ Déployer sur LWS (FTP)                                   │
│ ✅ Premiers clients beta                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 CORRESPONDANCE FICHIERS V1 → SAAS

### Backend

| V1 Local (SQLite) | SaaS (MySQL) | Modifications |
|-------------------|--------------|---------------|
| `backend/database.js` | `saas-backend/src/config/database.js` | SQLite → MySQL pool |
| `backend/server.js` | `saas-backend/src/server.js` | Ajouter tenant middleware |
| Routes inline | `saas-backend/src/routes/*.js` | Séparer par resource + tenant_id |
| Pas de routes publiques | `saas-backend/src/routes/public.js` | **À CRÉER** |
| Pas d'auth | `saas-backend/src/middleware/auth.js` | **À CRÉER** (JWT) |
| - | `saas-backend/src/middleware/tenant.js` | **À CRÉER** (isolation) |
| - | `saas-backend/src/utils/availability.js` | **À CRÉER** (créneaux) |
| - | `saas-backend/src/middleware/bookingValidation.js` | **À CRÉER** |

### Frontend

| V1 Local | SaaS | Modifications |
|----------|------|---------------|
| `frontend/src/App.jsx` | `saas-frontend/src/pages/admin/Dashboard.js` | Renommer + adapter |
| Interface admin inline | `saas-frontend/src/pages/admin/*.js` | Séparer composants |
| Pas de booking public | `saas-frontend/src/pages/public/*.js` | **À CRÉER** |
| - | `saas-frontend/src/components/booking/Calendar.js` | **À CRÉER** |
| - | `saas-frontend/src/hooks/usePublicBooking.js` | **À CRÉER** |
| Routing simple | `saas-frontend/src/App.jsx` | Routing /book/:slug + /dashboard |

---

## 🎯 PLAN D'ACTION IMMÉDIAT

### Phase 1: Préparation Backend SaaS (2h)

**Fichiers à créer dans `/saas-backend/`:**

```bash
saas-backend/
├── src/
│   ├── config/
│   │   └── database.js              ← Copier de conversations + MySQL
│   ├── middleware/
│   │   ├── auth.js                  ← JWT authentification
│   │   ├── tenant.js                ← Isolation tenant_id
│   │   └── bookingValidation.js     ← Validation booking
│   ├── routes/
│   │   ├── public.js                ← Routes booking (PRIORITAIRE)
│   │   ├── tenants.js
│   │   ├── clients.js
│   │   ├── services.js
│   │   └── appointments.js
│   ├── utils/
│   │   └── availability.js          ← Calcul créneaux
│   └── server.js                    ← Point entrée
├── database/
│   └── schema.sql                   ← MySQL structure
├── .env.example
└── package.json
```

### Phase 2: Backend Routes Publiques (1h50)

**Selon PLAN-BOOKING-PUBLIC-COMPLET.md:**

1. **routes/public.js** (30 min)
   ```javascript
   GET  /api/public/salon/:slug           // Infos salon
   GET  /api/public/salon/:slug/services  // Services actifs
   GET  /api/public/salon/:slug/availability // Créneaux
   POST /api/public/appointments          // Créer RDV pending
   ```

2. **middleware/bookingValidation.js** (20 min)
   - Valider salon existe
   - Valider service actif
   - Valider créneau disponible
   - Valider données client

3. **utils/availability.js** (40 min)
   - Calculer créneaux libres
   - Vérifier conflits horaires
   - Exclure jours fermés
   - Générer slots 30 min

4. **Tests backend** (20 min)

### Phase 3: Frontend Pages Publiques (3h55)

**Fichiers à créer dans `/saas-frontend/`:**

1. **hooks/usePublicBooking.js** (30 min)
   - Charger salon
   - Charger services
   - Charger disponibilités
   - Créer appointment

2. **pages/public/BookingLanding.js** (30 min)
   - Liste services
   - Cartes cliquables
   - Info salon

3. **pages/public/BookingDateTime.js** (45 min)
   - Intégrer Calendar
   - Afficher créneaux
   - Sélection date/heure

4. **pages/public/BookingClientInfo.js** (30 min)
   - Formulaire client
   - Validation
   - Récapitulatif

5. **pages/public/BookingConfirmation.js** (20 min)
   - Message succès
   - Récap complet
   - Status pending

6. **components/booking/Calendar.js** (40 min)
   - Calendrier mensuel
   - Dates désactivées
   - Navigation

7. **Styles & responsive** (30 min)

8. **Tests frontend** (30 min)

### Phase 4: Intégration & Tests (1h30)

- Tests workflow complet
- Tests isolation tenant
- Corrections bugs
- Optimisation UX

---

## ⏱️ TIMELINE COMPLÈTE

```
┌──────────────────────────────────────────────────────────┐
│ AUJOURD'HUI - Setup Backend SaaS (2h)                    │
├──────────────────────────────────────────────────────────┤
│ ✅ Structure dossiers                                    │
│ ✅ Config database MySQL                                 │
│ ✅ Middleware auth + tenant                              │
│ ✅ Routes base CRUD                                      │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│ DEMAIN - Booking Public Backend (1h50)                   │
├──────────────────────────────────────────────────────────┤
│ ✅ Routes publiques API                                  │
│ ✅ Middleware validation                                 │
│ ✅ Logique disponibilités                                │
│ ✅ Tests Postman                                         │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│ JOUR 3-4 - Frontend Booking (3h55)                       │
├──────────────────────────────────────────────────────────┤
│ ✅ Hook usePublicBooking                                 │
│ ✅ Pages workflow booking (4 pages)                      │
│ ✅ Composant Calendar                                    │
│ ✅ Styles responsive                                     │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│ JOUR 5 - Tests & Debug (1h30)                            │
├──────────────────────────────────────────────────────────┤
│ ✅ Tests E2E workflow                                    │
│ ✅ Tests isolation tenant                                │
│ ✅ Corrections bugs                                      │
│ ✅ Polish UX                                             │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│ SEMAINE 2 - Déploiement LWS                              │
├──────────────────────────────────────────────────────────┤
│ ✅ Upload backend (FTP)                                  │
│ ✅ Setup MySQL production                                │
│ ✅ Build frontend                                        │
│ ✅ Tests production                                      │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│ SEMAINE 3-4 - Beta Testing                               │
├──────────────────────────────────────────────────────────┤
│ ✅ Inviter premiers salons                               │
│ ✅ Collecter feedback                                    │
│ ✅ Ajustements UX                                        │
│ ✅ Support personnalisé                                  │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST AVANT DE COMMENCER

### ✅ Prérequis Dev Local

- [ ] Node.js installé
- [ ] MySQL installé (XAMPP/MAMP/standalone)
- [ ] Git configuré sur le repo
- [ ] VSCode ou éditeur

### ✅ Structure Repo Git

- [ ] Dossier `v1-local/` existe (référence)
- [ ] Dossier `landing-page/` existe (déployé)
- [ ] Dossier `saas-backend/` créé (en cours)
- [ ] Dossier `saas-frontend/` créé (en cours)
- [ ] Dossier `docs/` avec plans

### ✅ Base MySQL Dev

- [ ] Base `salonhub_dev` créée
- [ ] User `salonhub_user` créé
- [ ] Schema.sql importé
- [ ] Connexion testée

### ✅ Documentation

- [ ] PLAN-BOOKING-PUBLIC-COMPLET.md lu
- [ ] Architecture comprise
- [ ] Workflow booking clair

---

## 💡 CONSEILS IMPORTANTS

### 🚫 Ce qu'il NE FAUT PAS faire

1. **Ne PAS modifier v1-local/**
   - Garder intact comme référence
   - Utile pour comparaison
   - Base de code stable

2. **Ne PAS coder sans plan**
   - Suivre PLAN-BOOKING-PUBLIC-COMPLET.md
   - Respecter l'ordre des fichiers
   - Ne pas sauter d'étapes

3. **Ne PAS oublier tenant_id**
   - Ajouter PARTOUT dans queries MySQL
   - Toujours filtrer par tenant
   - Tester isolation données

### ✅ Ce qu'il FAUT faire

1. **Réutiliser logique v1**
   - Copier fonctions utiles
   - Adapter pour MySQL
   - Améliorer progressivement

2. **Tester au fur et à mesure**
   - Backend: Postman après chaque route
   - Frontend: Tester chaque page
   - E2E: Workflow complet

3. **Commenter le code**
   - Expliquer logique métier
   - Documenter API
   - Faciliter maintenance

---

## 🎯 PROCHAINE ACTION IMMÉDIATE

**Je vais maintenant créer:**

1. **Structure complète `/saas-backend/`**
   - Tous les fichiers de base
   - Configuration MySQL
   - Middleware auth + tenant
   - Routes publiques booking

2. **Structure complète `/saas-frontend/`**
   - Hook usePublicBooking
   - 4 pages booking public
   - Composant Calendar
   - Routing complet

**Estimation: 15-20 minutes pour générer tout le code**

**Ensuite tu auras:**
- Code prêt à copier dans ton repo Git
- Instructions d'installation
- Guide de test
- Documentation complète

---

# 🚀 PRÊT ?

**Dis "GO" et je crée TOUT le code du système booking public + structure SaaS !**

**Temps estimé génération:** 15 min
**Temps estimé développement après:** 7h30 (réparties sur 3-5 jours)

Le projet sera **complet et prêt pour le déploiement** ✨
