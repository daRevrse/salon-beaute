# 🎨 FRONTEND REACT SALONHUB - GUIDE COMPLET

## ✅ CE QUI A ÉTÉ CRÉÉ

### Structure complète React avec Auth JWT

```
salonhub-frontend/
├── public/
│   └── index.html                   ← HTML de base
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.js            ← Formulaire connexion
│   │   │   └── Register.js         ← Formulaire inscription
│   │   └── common/
│   │       └── ProtectedRoute.js   ← Protection routes
│   ├── contexts/
│   │   └── AuthContext.js          ← Context auth global
│   ├── hooks/
│   │   ├── useClients.js           ← Hook CRUD clients
│   │   ├── useServices.js          ← Hook CRUD services
│   │   └── useAppointments.js      ← Hook CRUD rendez-vous
│   ├── pages/
│   │   ├── Dashboard.js            ← Page principale
│   │   └── Clients.js              ← Page gestion clients
│   ├── services/
│   │   └── api.js                  ← Config Axios + intercepteurs
│   ├── App.js                      ← Routes principales
│   ├── index.js                    ← Point d'entrée
│   └── index.css                   ← Styles Tailwind
├── .env.example
├── package.json
└── tailwind.config.js
```

---

## 🚀 INSTALLATION (15 min)

### 1. Télécharger le frontend

Télécharger le dossier : `/mnt/user-data/outputs/salonhub-frontend/`

### 2. Installer Node.js (si pas déjà fait)

**Windows/Mac :**
- Site : https://nodejs.org
- Télécharger version LTS (20.x)
- Installer

**Linux :**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Vérifier installation :**
```bash
node --version  # Doit afficher v20.x.x
npm --version   # Doit afficher 10.x.x
```

### 3. Installer les dépendances

```bash
cd salonhub-frontend

# Installer toutes les dépendances
npm install
```

**Packages installés :**
- react, react-dom : Framework React
- react-router-dom : Navigation
- axios : Requêtes HTTP
- tailwindcss : Styles CSS
- react-scripts : Build tools

**Temps : ~3-5 minutes**

### 4. Configuration

```bash
# Copier .env
cp .env.example .env
```

**Vérifier `.env` :**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**⚠️ Important :** L'URL doit pointer vers ton backend !

---

## 🎯 DÉMARRAGE

### 1. S'assurer que le backend tourne

```bash
# Dans un terminal séparé
cd ../salonhub-backend
npm run dev

# Doit afficher :
# ✅ MySQL connecté
# 🚀 SalonHub Backend démarré sur http://localhost:5000
```

### 2. Démarrer le frontend

```bash
cd salonhub-frontend
npm start
```

**Sortie attendue :**
```
Compiled successfully!

You can now view salonhub-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Navigateur s'ouvre automatiquement sur http://localhost:3000**

---

## 📋 FLOW UTILISATEUR COMPLET

### 1. Inscription (Register)

**URL :** http://localhost:3000/register

**Actions :**
1. Remplir formulaire salon :
   - Nom salon
   - Email salon
   - Téléphone
   - Adresse (optionnel)

2. Remplir infos propriétaire :
   - Prénom
   - Nom  
   - Email
   - Mot de passe (min 8 caractères)

3. Choisir plan :
   - Starter (29€)
   - Professional (59€) - Recommandé
   - Business (99€)

4. Cliquer "Créer mon compte"

**Résultat :**
- ✅ Salon créé
- ✅ Compte owner créé
- ✅ Token JWT sauvegardé
- ✅ Redirection vers `/dashboard`

---

### 2. Connexion (Login)

**URL :** http://localhost:3000/login

**Actions :**
1. Entrer email
2. Entrer mot de passe
3. Cliquer "Se connecter"

**Résultat :**
- ✅ Token JWT sauvegardé dans localStorage
- ✅ Utilisateur chargé dans AuthContext
- ✅ Redirection vers `/dashboard`

---

### 3. Dashboard

**URL :** http://localhost:3000/dashboard

**Affichage :**
- 📊 Stats en temps réel :
  - RDV aujourd'hui
  - Total clients
  - Total services
  - RDV en attente

- 🎯 Actions rapides :
  - Accès Clients
  - Accès Services
  - Accès Rendez-vous

- 📅 RDV du jour :
  - Liste complète
  - Horaires
  - Clients
  - Statuts

---

### 4. Gestion Clients

**URL :** http://localhost:3000/clients

**Fonctionnalités :**

#### A. Liste clients
- Affichage tableau complet
- Recherche en temps réel
- Tri par nom

#### B. Créer client
1. Cliquer "+ Nouveau client"
2. Remplir formulaire :
   - Prénom * (obligatoire)
   - Nom * (obligatoire)
   - Email
   - Téléphone
   - Notes
3. Cliquer "Enregistrer"

#### C. Modifier client
1. Cliquer "Modifier" sur une ligne
2. Modifier les champs
3. Cliquer "Enregistrer"

#### D. Supprimer client
1. Cliquer "Supprimer"
2. Confirmer

**⚠️ Sécurité :**
- Impossible de supprimer si RDV futurs
- Isolation tenant automatique

---

## 🔐 SYSTÈME D'AUTHENTIFICATION

### localStorage

Le token JWT est stocké dans `localStorage` :
```javascript
localStorage.getItem('token')      // Token JWT
localStorage.getItem('user')       // Infos utilisateur
localStorage.getItem('tenant')     // Infos salon
```

### AuthContext

Context React global accessible partout :
```javascript
import { useAuth } from './contexts/AuthContext';

const { user, tenant, isAuthenticated, login, logout } = useAuth();
```

**Propriétés disponibles :**
- `user` : Utilisateur connecté
- `tenant` : Salon (tenant)
- `loading` : État chargement
- `error` : Erreur éventuelle
- `isAuthenticated` : Boolean
- `isOwner` : Boolean (role = owner)
- `isAdmin` : Boolean (role = owner/admin)
- `login(email, password)` : Fonction connexion
- `logout()` : Fonction déconnexion
- `register(data)` : Fonction inscription
- `updateProfile(data)` : Modifier profil
- `changePassword(current, new)` : Changer password

### Axios Interceptors

Tous les appels API ajoutent automatiquement le token :

```javascript
// api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Gestion erreurs :**
- 401 → Déconnexion auto + redirect /login
- 403 → Message accès refusé

### ProtectedRoute

Composant qui protège les routes :

```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Comportement :**
- Si non connecté → Redirect `/login`
- Si connecté → Affiche la page
- Pendant loading → Spinner

---

## 🎣 HOOKS PERSONNALISÉS

### useClients

```javascript
import { useClients } from '../hooks/useClients';

const {
  clients,              // Liste clients
  loading,              // État chargement
  error,                // Erreur éventuelle
  fetchClients,         // Recharger liste
  getClient,            // Récupérer 1 client
  createClient,         // Créer
  updateClient,         // Modifier
  deleteClient,         // Supprimer
} = useClients();
```

**Exemple création :**
```javascript
const result = await createClient({
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean@example.com',
  phone: '0612345678',
});

if (result.success) {
  // Succès
} else {
  alert(result.error);
}
```

### useServices

```javascript
const {
  services,
  loading,
  createService,
  updateService,
  deleteService,
  toggleService,        // Activer/désactiver
} = useServices();
```

### useAppointments

```javascript
const {
  appointments,
  loading,
  fetchTodayAppointments,  // RDV du jour
  createAppointment,
  updateAppointment,
  updateStatus,            // Changer statut
  deleteAppointment,
} = useAppointments();
```

---

## 📁 STRUCTURE DONNÉES

### User (AuthContext)

```javascript
{
  id: 1,
  email: "marie@salon.fr",
  first_name: "Marie",
  last_name: "Dupont",
  role: "owner",  // owner, admin, staff
  tenant_id: 1
}
```

### Tenant

```javascript
{
  id: 1,
  name: "Salon Beauté Paris",
  slug: "salon-beaute-paris",
  subscription_status: "trial",
  subscription_plan: "professional"
}
```

### Client

```javascript
{
  id: 1,
  tenant_id: 1,
  first_name: "Sophie",
  last_name: "Bernard",
  email: "sophie@example.com",
  phone: "0612345678",
  notes: "Préfère matinées",
  created_at: "2025-11-12T..."
}
```

---

## 🐛 TROUBLESHOOTING

### Erreur : "Cannot find module 'react'"

**Solution :**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 déjà utilisé

**Solution :**
```bash
# Changer le port
PORT=3001 npm start
```

Ou arrêter l'autre processus.

### CORS Error

**Erreur :**
```
Access to XMLHttpRequest... has been blocked by CORS policy
```

**Solution :**
1. Vérifier backend démarre bien
2. Vérifier FRONTEND_URL dans backend/.env :
```env
FRONTEND_URL=http://localhost:3000
```
3. Redémarrer backend

### 401 Unauthorized

**Causes :**
- Token expiré → Reconnectez-vous
- Token invalide → Videz localStorage
- Backend pas démarré

**Solution :**
```javascript
// Vider localStorage
localStorage.clear();
// Recharger page
window.location.reload();
```

### Axios ne trouve pas l'API

**Erreur :**
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Solution :**
1. Backend démarré ? → `cd backend && npm run dev`
2. URL correcte dans .env ? → `REACT_APP_API_URL=http://localhost:5000/api`
3. Redémarrer frontend

---

## ✅ CHECKLIST COMPLÈTE

### Setup
```
□ Node.js installé (v20+)
□ Frontend téléchargé
□ npm install exécuté
□ .env configuré
□ Backend démarré (port 5000)
□ Frontend démarré (port 3000)
```

### Tests
```
□ http://localhost:3000 ouvre login
□ Inscription fonctionne
□ Login fonctionne
□ Dashboard s'affiche
□ Stats chargent
□ Page clients accessible
□ Création client fonctionne
□ Modification client fonctionne
□ Recherche client fonctionne
```

---

## 🎉 FÉLICITATIONS !

Tu as maintenant :
✅ **Frontend React complet**
✅ **Authentification JWT fonctionnelle**
✅ **Context Auth global**
✅ **Hooks personnalisés CRUD**
✅ **Protection des routes**
✅ **Interface moderne Tailwind**
✅ **Gestion clients complète**

---

## 🚀 PROCHAINES ÉTAPES

### À faire maintenant
```
□ Tester inscription complète
□ Tester login
□ Créer quelques clients
□ Vérifier isolation multi-tenant
```

### Semaine prochaine - Pages manquantes
```
□ Page Services (similaire à Clients)
□ Page Appointments (calendrier)
□ Page Settings (paramètres salon)
□ Page Profile (profil utilisateur)
```

### Semaine suivante - Stripe
```
□ Page Billing
□ Checkout Stripe
□ Gestion abonnements
□ Webhooks
```

---

## 💬 PROCHAIN MESSAGE

Dis-moi quand tu as :
```
✅ Frontend installé (npm install)
✅ Backend + Frontend démarrés
✅ Inscription testée
✅ Login testé
✅ Dashboard affiché
✅ Client créé
```

**Ou si tu bloques quelque part !**

**Prêt pour les pages Services et Appointments ? 💪**
