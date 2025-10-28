# 💇‍♀️ Application de Gestion de Rendez-vous - Salon de Beauté

Application fullstack complète pour la gestion des rendez-vous d'un salon de beauté.

## 🎯 Fonctionnalités

### ✨ Gestion des Rendez-vous
- Visualisation des rendez-vous du jour et à venir
- Création de nouveaux rendez-vous en 3 étapes
- Mise à jour du statut (confirmé → en cours → terminé)
- Suppression des rendez-vous
- Détection automatique des conflits horaires

### 👥 Gestion des Clients
- Base de données complète des clients
- Recherche automatique par numéro de téléphone
- Création automatique de nouveaux clients
- Historique complet

### ✂️ Services
- Catalogue complet des services proposés
- Durée et tarifs pour chaque service
- 10 services pré-configurés (coupe, coloration, manucure, etc.)

### 📊 Statistiques en temps réel
- Rendez-vous du jour
- Rendez-vous de la semaine
- Nombre total de clients
- Revenu du mois en cours

## 🏗️ Architecture Technique

### Backend
- **Node.js** + **Express** (API REST)
- **SQLite** avec **better-sqlite3** (base de données embarquée)
- Pas de migrations nécessaires - tout est auto-initialisé
- Données de démonstration incluses

### Frontend
- **React 18** avec **Vite**
- Interface moderne et responsive
- CSS personnalisé (pas de frameworks)
- Gestion d'état avec hooks React

## 📂 Structure des Fichiers

```
salon-beaute/
├── backend/
│   ├── package.json          # Dépendances backend
│   ├── server.js            # Serveur Express + routes API
│   ├── database.js          # Configuration SQLite + initialisation
│   └── salon.db            # Base de données (créée automatiquement)
│
└── frontend/
    ├── package.json         # Dépendances frontend
    ├── vite.config.js      # Configuration Vite
    ├── index.html          # Page HTML principale
    └── src/
        ├── main.jsx        # Point d'entrée React
        ├── App.jsx         # Composant principal
        └── App.css         # Styles

```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ installé
- npm ou yarn

### 1. Installation du Backend

```bash
cd backend
npm install
```

### 2. Installation du Frontend

```bash
cd ../frontend
npm install
```

### 3. Démarrage de l'Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Le serveur démarre sur **http://localhost:3000**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
L'interface démarre sur **http://localhost:5173**

### 4. Accéder à l'Application

Ouvrez votre navigateur sur **http://localhost:5173**

## 📊 Base de Données

### Structure des Tables

#### `services`
- id (INTEGER PRIMARY KEY)
- nom (TEXT)
- description (TEXT)
- duree (INTEGER) - en minutes
- prix (REAL)
- actif (INTEGER) - 0 ou 1
- created_at (DATETIME)

#### `clients`
- id (INTEGER PRIMARY KEY)
- nom (TEXT)
- prenom (TEXT)
- telephone (TEXT UNIQUE)
- email (TEXT)
- notes (TEXT)
- created_at (DATETIME)

#### `rendez_vous`
- id (INTEGER PRIMARY KEY)
- client_id (INTEGER FK)
- service_id (INTEGER FK)
- date_heure (DATETIME)
- statut (TEXT) - 'confirmé', 'en cours', 'terminé', 'annulé'
- notes (TEXT)
- created_at (DATETIME)

### Données de Démonstration

L'application s'initialise automatiquement avec:
- 10 services (coupe, coloration, manucure, etc.)
- 3 clients de test
- Base prête à l'emploi

## 🔌 API Endpoints

### Services
- `GET /api/services` - Liste tous les services
- `GET /api/services/:id` - Détails d'un service
- `POST /api/services` - Créer un service

### Clients
- `GET /api/clients` - Liste tous les clients
- `GET /api/clients/search?telephone=xxx` - Rechercher par téléphone
- `POST /api/clients` - Créer un client
- `PUT /api/clients/:id` - Modifier un client

### Rendez-vous
- `GET /api/rendez-vous` - Liste tous les RDV
- `GET /api/rendez-vous/aujourd-hui` - RDV du jour
- `GET /api/rendez-vous/a-venir` - RDV à venir
- `POST /api/rendez-vous` - Créer un RDV
- `PATCH /api/rendez-vous/:id/statut` - Mettre à jour le statut
- `DELETE /api/rendez-vous/:id` - Supprimer un RDV

### Statistiques
- `GET /api/stats` - Statistiques globales

### Santé
- `GET /api/health` - Vérifier le serveur

## 🎨 Interface Utilisateur

### Navigation
- **📅 Rendez-vous** - Vue d'ensemble des RDV
- **➕ Nouveau RDV** - Créer un rendez-vous en 3 étapes
- **👥 Clients** - Base de données clients
- **✂️ Services** - Catalogue des services

### Workflow de Création de RDV
1. **Étape 1** : Sélection du service
2. **Étape 2** : Informations client (avec recherche auto)
3. **Étape 3** : Choix de la date/heure

### Gestion des Statuts
- **Confirmé** (bleu) → Rendez-vous planifié
- **En cours** (jaune) → Service en cours
- **Terminé** (cyan) → Service complété
- **Annulé** (rouge) → Rendez-vous annulé

## 🔧 Configuration

### Ports
- Backend : `3000` (configurable dans `backend/server.js`)
- Frontend : `5173` (configurable dans `frontend/vite.config.js`)

### CORS
Le backend accepte toutes les origines par défaut. Pour la production, modifiez la configuration CORS dans `server.js`.

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à:
- Desktop (1400px+)
- Tablettes (768px - 1400px)
- Mobiles (< 768px)

## 🛠️ Personnalisation

### Ajouter un Service
Modifiez le tableau `services` dans `backend/database.js` ou utilisez l'API POST.

### Modifier les Couleurs
Les couleurs principales sont dans `frontend/src/App.css`:
- Primaire : `#667eea` et `#764ba2`
- Backgrounds, bordures, etc.

### Ajouter des Champs
1. Modifiez la table dans `database.js`
2. Ajoutez le champ dans les routes API (`server.js`)
3. Mettez à jour le frontend (`App.jsx`)

## 🚨 Dépannage

### Le backend ne démarre pas
- Vérifiez que le port 3000 est libre
- Vérifiez l'installation de `better-sqlite3`

### Le frontend ne se connecte pas au backend
- Vérifiez que le backend tourne sur le port 3000
- Vérifiez la configuration du proxy dans `vite.config.js`

### Erreur "UNIQUE constraint failed"
- Le numéro de téléphone existe déjà
- Utilisez un autre numéro ou recherchez le client existant

## 📝 Licence

Ce projet est libre d'utilisation pour usage personnel ou commercial.

## 🎯 Améliorations Futures Possibles

- Authentification et gestion multi-utilisateurs
- Notifications par SMS/Email
- Calendrier visuel interactif
- Export des données (Excel, PDF)
- Gestion des employés et planning
- Historique complet des rendez-vous par client
- Système de fidélité / points
- Paiements en ligne
- Application mobile (React Native)

---

**Développé avec ❤️ pour les salons de beauté**
