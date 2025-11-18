# ⚙️ Configuration Rapide - SalonHub

Guide ultra-rapide pour démarrer en local.

---

## 🚀 Démarrage express (5 minutes)

### 1️⃣ Cloner et installer

```bash
cd C:\Users\Administrateur\salon-beaute

# Backend
cd salonhub-backend
npm install

# Frontend
cd ../salonhub-frontend
npm install
```

### 2️⃣ Configurer

**Automatique (Windows)** :
```bash
# À la racine du projet
setup-dev.bat
```

**Automatique (Linux/Mac)** :
```bash
# À la racine du projet
chmod +x setup-dev.sh
./setup-dev.sh
```

**Manuel** :
```bash
# Backend
cd salonhub-backend
copy .env.local .env.development  # Windows
cp .env.local .env.development    # Linux/Mac

# Frontend
cd salonhub-frontend
copy .env.local .env.development  # Windows
cp .env.local .env.development    # Linux/Mac
```

### 3️⃣ Base de données

```sql
-- Ouvrir MySQL
mysql -u root -p

-- Créer la base
CREATE DATABASE salonhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

-- Importer le schéma
cd salonhub-backend
mysql -u root -p salonhub < database/schema.sql
```

### 4️⃣ Configurer les credentials

Éditer `salonhub-backend/.env.development` :
```env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=salonhub
```

### 5️⃣ Démarrer

**Terminal 1 - Backend** :
```bash
cd salonhub-backend
npm start
```

**Terminal 2 - Frontend** :
```bash
cd salonhub-frontend
npm start
```

**URLs** :
- Frontend : http://localhost:3000
- Backend : http://localhost:5000

---

## 📁 Fichiers créés

### Backend
- ✅ `.env.local` - Template de développement
- ✅ `.env.example` - Documentation
- ⚠️ `.env` - Production (NE PAS MODIFIER)

### Frontend
- ✅ `.env.local` - Template de développement
- ⚠️ `.env` - Production (NE PAS MODIFIER)

### Racine
- ✅ `SETUP_LOCAL.md` - Guide détaillé
- ✅ `CONFIG_FILES.md` - Documentation des configs
- ✅ `setup-dev.bat` - Script Windows
- ✅ `setup-dev.sh` - Script Linux/Mac
- ✅ `.gitignore` - Protection des .env

---

## ✅ Checklist rapide

- [ ] Node.js installé (v16+)
- [ ] MySQL installé et démarré
- [ ] Base `salonhub` créée
- [ ] Schéma SQL importé
- [ ] Backend : `npm install` fait
- [ ] Backend : `.env.development` configuré
- [ ] Frontend : `npm install` fait
- [ ] Frontend : `.env.development` créé
- [ ] Backend démarré (port 5000)
- [ ] Frontend démarré (port 3000)

---

## 🆘 Problèmes courants

### Port 5000 déjà utilisé
```bash
# Changer dans .env.development
PORT=5001
```

### Cannot connect to MySQL
```bash
# Vérifier MySQL
mysql -u root -p

# Vérifier credentials dans .env.development
DB_USER=root
DB_PASSWORD=votre_password
```

### CORS error
```bash
# Vérifier dans backend .env.development
FRONTEND_URL=http://localhost:3000
```

---

## 📚 Documentation complète

- **Installation détaillée** : [SETUP_LOCAL.md](./SETUP_LOCAL.md)
- **Fichiers de config** : [CONFIG_FILES.md](./CONFIG_FILES.md)
- **Configuration email** : [salonhub-backend/EMAIL_SETUP.md](./salonhub-backend/EMAIL_SETUP.md)
- **Permissions frontend** : [salonhub-frontend/FRONTEND_PERMISSIONS.md](./salonhub-frontend/FRONTEND_PERMISSIONS.md)

---

## 🎯 Structure des fichiers .env

### Backend (.env.development)
```env
# Environnement
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_password
DB_NAME=salonhub

# JWT
JWT_SECRET=dev_secret_local
JWT_EXPIRES_IN=7d

# Email (optionnel - mode simulation par défaut)
SUPPORT_EMAIL=support@flowkraftagency.com

# Stripe (clés de test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...
```

### Frontend (.env.development)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_ENV=development
```

---

## 🔐 Sécurité

**NE JAMAIS** :
- ❌ Commiter les fichiers `.env`
- ❌ Partager vos credentials
- ❌ Utiliser les clés de production en dev

**TOUJOURS** :
- ✅ Utiliser `.env.local` ou `.env.development` en dev
- ✅ Utiliser les clés de TEST Stripe
- ✅ Vérifier `.gitignore`

---

## 🎉 C'est prêt !

Une fois configuré :
1. Créez un compte test
2. Connectez-vous
3. Explorez l'application

**FlowKraft Agency - SalonHub**
Configuration rapide - v1.0
