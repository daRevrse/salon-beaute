# 🚀 Guide d'installation - Développement Local

Ce guide vous explique comment configurer SalonHub pour le développement local sur votre machine.

---

## 📋 Prérequis

Assurez-vous d'avoir installé :

- ✅ **Node.js** (version 16 ou supérieure) : [nodejs.org](https://nodejs.org)
- ✅ **MySQL** (version 5.7 ou supérieure) : [mysql.com](https://www.mysql.com)
- ✅ **Git** : [git-scm.com](https://git-scm.com)
- ✅ **npm** ou **yarn** (inclus avec Node.js)

---

## 🔧 Installation

### Étape 1 : Cloner le projet

```bash
cd C:\Users\Administrateur
git clone [URL_DU_REPO]
cd salon-beaute
```

---

### Étape 2 : Configuration de la base de données

#### 2.1 Créer la base de données

Ouvrez MySQL et exécutez :

```sql
CREATE DATABASE salonhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.2 Importer le schéma

```bash
cd salonhub-backend
mysql -u root -p salonhub < database/schema.sql
```

Ou depuis MySQL Workbench :
1. Ouvrir MySQL Workbench
2. Se connecter à votre serveur local
3. File → Open SQL Script → `database/schema.sql`
4. Exécuter le script

#### 2.3 Vérifier l'installation

```sql
USE salonhub;
SHOW TABLES;
```

Vous devriez voir :
- `tenants`
- `users`
- `clients`
- `services`
- `appointments`
- `settings`
- `client_notifications`

---

### Étape 3 : Configuration Backend

#### 3.1 Installer les dépendances

```bash
cd salonhub-backend
npm install
```

#### 3.2 Configurer les variables d'environnement

**Option A : Copier le fichier local**
```bash
# Windows
copy .env.local .env

# Linux/Mac
cp .env.local .env
```

**Option B : Créer manuellement**

Créer un fichier `.env` dans `salonhub-backend/` :

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=salonhub

# JWT
JWT_SECRET=dev_secret_jwt_salonhub_local
JWT_EXPIRES_IN=7d

# Email (optionnel - mode simulation par défaut)
SUPPORT_EMAIL=support@flowkraftagency.com

# Stripe (clés de test)
STRIPE_SECRET_KEY=sk_test_votre_cle_test
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_test
STRIPE_PRICE_STARTER=price_starter_test
STRIPE_PRICE_PROFESSIONAL=price_professional_test
STRIPE_PRICE_BUSINESS=price_business_test
```

⚠️ **Important** : Modifiez `DB_PASSWORD` avec votre mot de passe MySQL

#### 3.3 Tester la connexion

```bash
npm start
```

Vous devriez voir :
```
✓ Connecté à MySQL (base: salonhub)
🚀 Serveur démarré sur http://localhost:5000
```

---

### Étape 4 : Configuration Frontend

#### 4.1 Installer les dépendances

```bash
cd salonhub-frontend
npm install
```

#### 4.2 Configurer les variables d'environnement

**Option A : Copier le fichier local**
```bash
# Windows
copy .env.local .env

# Linux/Mac
cp .env.local .env
```

**Option B : Créer manuellement**

Créer un fichier `.env` dans `salonhub-frontend/` :

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique_test
REACT_APP_ENV=development
```

#### 4.3 Démarrer le frontend

```bash
npm start
```

L'application devrait s'ouvrir sur `http://localhost:3000`

---

## ✅ Vérification de l'installation

### Backend

1. Ouvrir `http://localhost:5000/api/public/health` dans votre navigateur

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

### Frontend

1. Ouvrir `http://localhost:3000`
2. Vous devriez voir la page de connexion
3. Créer un compte test

---

## 🧪 Créer un compte de test

### Via le frontend

1. Aller sur `http://localhost:3000/register`
2. Remplir le formulaire :
   - **Nom du salon** : Test Salon
   - **Email salon** : test@salon.com
   - **Prénom** : Test
   - **Nom** : User
   - **Email** : test@user.com
   - **Mot de passe** : Test1234

3. Cliquer sur "S'inscrire"

### Via Postman/Thunder Client

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "salon_name": "Test Salon",
  "salon_email": "test@salon.com",
  "first_name": "Test",
  "last_name": "User",
  "email": "test@user.com",
  "password": "Test1234"
}
```

---

## 📧 Configuration des emails (optionnel)

Par défaut, les emails sont en **mode simulation** (affichés dans la console).

### Activer l'envoi réel avec Gmail

1. **Activer la validation en 2 étapes** sur votre compte Google

2. **Générer un mot de passe d'application** :
   - Aller sur https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et "Windows Computer"
   - Copier le mot de passe généré (16 caractères)

3. **Modifier `.env` du backend** :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM="SalonHub Dev" <noreply@salonhub.com>
```

4. **Redémarrer le serveur**
```bash
npm start
```

5. **Tester** en créant un nouveau compte

---

## 🔑 Configuration Stripe (optionnel)

Pour tester les paiements et abonnements :

### 1. Créer un compte Stripe

- Aller sur https://stripe.com
- Créer un compte gratuit
- Activer le mode TEST

### 2. Récupérer les clés

Dashboard Stripe → Developers → API keys :
- **Clé secrète** (commençant par `sk_test_`)
- **Clé publique** (commençant par `pk_test_`)

### 3. Créer les Price IDs

Dashboard Stripe → Products → Create product :

**Starter (29€/mois)** :
- Nom : Starter Plan
- Prix : 29 EUR recurring monthly
- Copier le Price ID (ex: `price_1ABC...`)

**Professional (59€/mois)** :
- Nom : Professional Plan
- Prix : 59 EUR recurring monthly
- Copier le Price ID

**Business (99€/mois)** :
- Nom : Business Plan
- Prix : 99 EUR recurring monthly
- Copier le Price ID

### 4. Configurer les variables

**Backend `.env`** :
```env
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK
STRIPE_PRICE_STARTER=price_ABC123
STRIPE_PRICE_PROFESSIONAL=price_DEF456
STRIPE_PRICE_BUSINESS=price_GHI789
```

**Frontend `.env`** :
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_PUBLIQUE
```

### 5. Redémarrer les serveurs

```bash
# Backend
cd salonhub-backend
npm start

# Frontend (nouveau terminal)
cd salonhub-frontend
npm start
```

---

## 🛠️ Commandes utiles

### Backend

```bash
# Démarrer le serveur
npm start

# Démarrer avec auto-reload (nodemon)
npm run dev

# Tester la connexion DB
node -e "require('./src/config/database').query('SELECT 1').then(() => console.log('✓ DB OK'))"
```

### Frontend

```bash
# Démarrer le serveur de dev
npm start

# Build pour production
npm run build

# Lancer les tests
npm test
```

### Base de données

```bash
# Exporter la base
mysqldump -u root -p salonhub > backup.sql

# Importer une sauvegarde
mysql -u root -p salonhub < backup.sql

# Réinitialiser la base
mysql -u root -p salonhub < database/schema.sql
```

---

## 🐛 Dépannage

### Erreur : "Cannot connect to MySQL"

**Solution** :
1. Vérifier que MySQL est démarré
2. Vérifier les credentials dans `.env`
3. Tester la connexion :
```bash
mysql -u root -p
```

### Erreur : "Port 5000 already in use"

**Solution** :
1. Trouver le processus qui utilise le port :
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

2. Tuer le processus ou changer le port dans `.env`

### Erreur : "CORS error" dans le frontend

**Solution** :
1. Vérifier que `FRONTEND_URL=http://localhost:3000` dans le backend `.env`
2. Redémarrer le serveur backend

### Erreur : "JWT malformed"

**Solution** :
1. Supprimer le token dans localStorage :
```javascript
// Dans la console du navigateur
localStorage.clear()
```
2. Se reconnecter

### Les emails ne sont pas envoyés

**C'est normal !** En mode développement, les emails sont en **mode simulation** par défaut.

Pour voir les emails :
1. Regarder la console du backend
2. Vous verrez : `📧 [SIMULATION] Email: { ... }`

Pour activer l'envoi réel, configurez SMTP (voir section Emails ci-dessus).

---

## 📚 Ressources

- **Documentation complète** : Voir `/docs`
- **Configuration email** : [EMAIL_SETUP.md](salonhub-backend/EMAIL_SETUP.md)
- **Permissions frontend** : [FRONTEND_PERMISSIONS.md](salonhub-frontend/FRONTEND_PERMISSIONS.md)
- **Architecture multi-salons** : [MULTI_SALON_ARCHITECTURE.md](salonhub-backend/MULTI_SALON_ARCHITECTURE.md)

---

## ✅ Checklist de démarrage

- [ ] Node.js installé (v16+)
- [ ] MySQL installé et démarré
- [ ] Base de données `salonhub` créée
- [ ] Schéma importé (`schema.sql`)
- [ ] Backend : dépendances installées (`npm install`)
- [ ] Backend : `.env` configuré
- [ ] Backend : serveur démarré (`npm start`)
- [ ] Frontend : dépendances installées (`npm install`)
- [ ] Frontend : `.env` configuré
- [ ] Frontend : application démarrée (`npm start`)
- [ ] Compte test créé
- [ ] Login réussi

---

## 🎉 Vous êtes prêt !

Une fois tous les éléments cochés, vous pouvez commencer à développer sur SalonHub !

**URLs importantes** :
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000/api
- Documentation : http://localhost:3000/docs (si configuré)

---

**FlowKraft Agency - SalonHub**
Guide de démarrage local
Dernière mise à jour : 2025-11-18
