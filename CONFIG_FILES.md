# 📁 Fichiers de Configuration - SalonHub

Ce document explique la structure et l'utilisation des fichiers de configuration du projet.

---

## 🗂️ Structure des fichiers

```
salon-beaute/
│
├── salonhub-backend/
│   ├── .env                    ← Production (NE PAS MODIFIER)
│   ├── .env.local              ← Développement local (template)
│   ├── .env.example            ← Documentation des variables
│   └── package.json
│
├── salonhub-frontend/
│   ├── .env                    ← Production (NE PAS MODIFIER)
│   ├── .env.local              ← Développement local (template)
│   └── package.json
│
├── .gitignore                  ← Empêche de commiter les .env
├── SETUP_LOCAL.md              ← Guide d'installation locale
└── CONFIG_FILES.md             ← Ce fichier
```

---

## 🔧 Backend - Fichiers de configuration

### `.env` (Production)
**⚠️ NE PAS MODIFIER** - Utilisé pour la production

Contient :
- Configuration de production
- Credentials de la base de données de production
- Clés Stripe de production
- Secrets JWT sécurisés

**Usage** : Automatiquement utilisé en production

---

### `.env.local` (Développement)
**✅ UTILISER POUR LE DEV LOCAL**

Template pour le développement local. Pour l'utiliser :

```bash
# Windows
copy .env.local .env.development

# Linux/Mac
cp .env.local .env.development
```

Puis modifier avec vos valeurs locales :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=salonhub
```

**Usage** : Développement local uniquement

---

### `.env.example` (Documentation)
**📚 RÉFÉRENCE UNIQUEMENT**

Ne contient que des exemples et de la documentation. N'est jamais utilisé directement.

**Usage** : Documentation des variables disponibles

---

## 🎨 Frontend - Fichiers de configuration

### `.env` (Production)
**⚠️ NE PAS MODIFIER**

Contient :
```env
REACT_APP_API_URL=https://salonhub.flowkraftagency.com/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
```

**Usage** : Automatiquement utilisé en production

---

### `.env.local` (Développement)
**✅ UTILISER POUR LE DEV LOCAL**

Template pour le développement local :

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_ENV=development
```

Pour l'utiliser :
```bash
# Windows
copy .env.local .env.development

# Linux/Mac
cp .env.local .env.development
```

**Usage** : Développement local uniquement

---

## 📋 Quelle configuration utiliser ?

### Scénario 1 : Développement local

**Backend** :
1. Copier `.env.local` → `.env.development`
2. Modifier avec vos credentials locaux
3. Démarrer : `npm start`

**Frontend** :
1. Copier `.env.local` → `.env.development`
2. Vérifier que `REACT_APP_API_URL=http://localhost:5000/api`
3. Démarrer : `npm start`

**Base de données** : MySQL local (localhost)

---

### Scénario 2 : Tests en environnement de staging

**Backend** :
Créer `.env.staging` :
```env
NODE_ENV=staging
DB_HOST=staging-db.example.com
DB_USER=staging_user
DB_PASSWORD=staging_password
STRIPE_SECRET_KEY=sk_test_...
```

**Frontend** :
Créer `.env.staging` :
```env
REACT_APP_API_URL=https://staging-api.salonhub.com/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
```

---

### Scénario 3 : Production (déployé)

**Backend** : Utiliser `.env` existant (déjà configuré)

**Frontend** : Utiliser `.env` existant (déjà configuré)

**⚠️ NE JAMAIS MODIFIER directement en production !**

---

## 🔒 Sécurité

### Variables sensibles

Ces variables **NE DOIVENT JAMAIS** être commitées dans Git :

**Backend** :
- `DB_PASSWORD`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_PASSWORD`
- `AWS_SECRET_ACCESS_KEY`

**Frontend** :
- Les clés publiques Stripe peuvent être commitées (elles sont publiques)
- Mais préférez quand même les mettre dans `.env`

### Protection avec .gitignore

Le fichier `.gitignore` à la racine contient :
```gitignore
# Environment
.env
.env.local
.env.development
.env.staging
```

Cela empêche de commiter accidentellement les fichiers de configuration.

---

## 🚀 Variables d'environnement

### Backend

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `NODE_ENV` | Environnement | `development`, `production` | ✅ |
| `PORT` | Port du serveur | `5000` | ✅ |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` | ✅ |
| `DB_HOST` | Hôte MySQL | `localhost` | ✅ |
| `DB_PORT` | Port MySQL | `3306` | ✅ |
| `DB_USER` | Utilisateur MySQL | `root` | ✅ |
| `DB_PASSWORD` | Mot de passe MySQL | `password123` | ✅ |
| `DB_NAME` | Nom de la base | `salonhub` | ✅ |
| `JWT_SECRET` | Secret JWT | `random_string_64_chars` | ✅ |
| `JWT_EXPIRES_IN` | Expiration JWT | `7d` | ❌ |
| `SMTP_HOST` | Serveur SMTP | `smtp.gmail.com` | ❌ |
| `SMTP_PORT` | Port SMTP | `587` | ❌ |
| `SMTP_SECURE` | SSL actif | `false` | ❌ |
| `SMTP_USER` | Email SMTP | `user@gmail.com` | ❌ |
| `SMTP_PASSWORD` | Mot de passe SMTP | `app_password` | ❌ |
| `SMTP_FROM` | Expéditeur email | `"SalonHub" <no-reply@...>` | ❌ |
| `SUPPORT_EMAIL` | Email de support | `support@...` | ❌ |
| `STRIPE_SECRET_KEY` | Clé Stripe secrète | `sk_test_...` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook | `whsec_...` | ✅ |
| `STRIPE_PRICE_STARTER` | Price ID Starter | `price_...` | ✅ |
| `STRIPE_PRICE_PROFESSIONAL` | Price ID Pro | `price_...` | ✅ |
| `STRIPE_PRICE_BUSINESS` | Price ID Business | `price_...` | ✅ |

### Frontend

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `REACT_APP_API_URL` | URL de l'API | `http://localhost:5000/api` | ✅ |
| `REACT_APP_STRIPE_PUBLIC_KEY` | Clé publique Stripe | `pk_test_...` | ✅ |
| `REACT_APP_ENV` | Environnement | `development` | ❌ |
| `REACT_APP_NAME` | Nom de l'app | `SalonHub` | ❌ |
| `REACT_APP_VERSION` | Version | `1.0.0` | ❌ |
| `REACT_APP_SUPPORT_EMAIL` | Email support | `support@...` | ❌ |

---

## 🔄 Ordre de priorité des fichiers .env

Node.js et React chargent les fichiers dans cet ordre (du plus prioritaire au moins prioritaire) :

1. `.env.local` (non commité)
2. `.env.development` ou `.env.production` (selon `NODE_ENV`)
3. `.env`

**Exemple** :
Si vous avez `.env` et `.env.local`, les valeurs de `.env.local` écrasent celles de `.env`.

---

## 📝 Bonnes pratiques

### ✅ À FAIRE

1. **Toujours** utiliser `.env.local` ou `.env.development` pour le dev
2. **Toujours** commiter `.env.example` pour documenter
3. **Toujours** vérifier `.gitignore` avant de commit
4. **Générer** des secrets forts pour JWT en production
5. **Utiliser** les clés de TEST Stripe en dev

### ❌ À NE PAS FAIRE

1. **Jamais** commiter `.env` dans Git
2. **Jamais** partager vos credentials de production
3. **Jamais** utiliser les mêmes secrets entre dev et prod
4. **Jamais** hardcoder des secrets dans le code
5. **Jamais** utiliser des clés de production en développement

---

## 🛠️ Commandes utiles

### Copier les templates

**Backend** :
```bash
cd salonhub-backend
cp .env.local .env.development
```

**Frontend** :
```bash
cd salonhub-frontend
cp .env.local .env.development
```

### Vérifier les variables chargées

**Backend** (Node.js) :
```javascript
// Dans un fichier test.js
require('dotenv').config();
console.log(process.env.DB_HOST);
console.log(process.env.PORT);
```

**Frontend** (React) :
```javascript
// Dans n'importe quel composant
console.log(process.env.REACT_APP_API_URL);
console.log(process.env.REACT_APP_ENV);
```

### Générer un secret JWT

```bash
# Windows (PowerShell)
[Convert]::ToBase64String([guid]::NewGuid().ToByteArray() * 4)

# Linux/Mac
openssl rand -hex 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🆘 Dépannage

### Problème : Variables non chargées

**Solution** :
1. Vérifier que le fichier s'appelle bien `.env` (pas `.env.txt`)
2. Redémarrer le serveur après modification
3. Vérifier qu'il n'y a pas d'espaces autour du `=`

**Bon** :
```env
DB_HOST=localhost
```

**Mauvais** :
```env
DB_HOST = localhost  ← Espaces !
```

### Problème : "Cannot read property 'REACT_APP_API_URL'"

**Solution** :
1. Les variables React doivent commencer par `REACT_APP_`
2. Redémarrer le serveur de dev (`npm start`)
3. Vérifier avec `console.log(process.env)`

### Problème : Fichier .env commité par erreur

**Solution** :
```bash
# 1. Supprimer du Git (mais garder localement)
git rm --cached .env

# 2. Vérifier .gitignore
echo ".env" >> .gitignore

# 3. Commit
git add .gitignore
git commit -m "fix: Remove .env from Git"
git push
```

---

## 📚 Ressources

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Create React App - Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [12 Factor App - Config](https://12factor.net/config)
- [Guide SETUP_LOCAL.md](./SETUP_LOCAL.md)

---

**FlowKraft Agency - SalonHub**
Documentation des fichiers de configuration
Dernière mise à jour : 2025-11-18
