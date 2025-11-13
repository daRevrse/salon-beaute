# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## Installation en 3 minutes

### Méthode 1 : Script Automatique (Linux/Mac)
```bash
cd salon-beaute
./install.sh
```

### Méthode 2 : Installation Manuelle

#### 1️⃣ Installer le Backend
```bash
cd salon-beaute/backend
npm install
```

#### 2️⃣ Installer le Frontend
```bash
cd ../frontend
npm install
```

## Démarrage de l'Application

### Vous avez besoin de 2 terminaux ouverts

**Terminal 1 - Backend (API):**
```bash
cd backend
npm start
```
✅ Le serveur démarre sur http://localhost:3000

**Terminal 2 - Frontend (Interface):**
```bash
cd frontend
npm run dev
```
✅ L'interface démarre sur http://localhost:5173

### Ouvrir l'Application
Ouvrez votre navigateur sur : **http://localhost:5173**

## 🎯 Premier Rendez-vous

1. Cliquez sur **"➕ Nouveau RDV"**
2. Sélectionnez un service (ex: Coupe Femme)
3. Entrez un numéro de téléphone (ex: 0612345678)
4. Remplissez le nom et prénom
5. Choisissez une date et heure
6. Cliquez sur **"✓ Créer le rendez-vous"**

C'est fait ! 🎉

## 📊 Données de Démonstration

L'application contient déjà :
- ✂️ 10 services (coupes, coloration, manucure, etc.)
- 👥 3 clients de test
- 📅 Une base de données prête à l'emploi

## 🔧 Ports Utilisés

- **Backend** : 3000
- **Frontend** : 5173

Si ces ports sont occupés, modifiez-les dans :
- Backend : `backend/server.js` (ligne `const PORT = 3000`)
- Frontend : `frontend/vite.config.js` (ligne `port: 5173`)

## ❓ Problèmes Courants

### "Port 3000 already in use"
Un autre programme utilise le port 3000. Arrêtez-le ou changez le port.

### "Cannot connect to backend"
Vérifiez que le backend tourne bien sur le port 3000.

### "Module not found"
Réinstallez les dépendances :
```bash
cd backend && npm install
cd ../frontend && npm install
```

## 📱 Utilisation Mobile

L'interface est responsive. Ouvrez simplement l'URL sur votre mobile/tablette :
```
http://[votre-ip-locale]:5173
```

## 🎨 Personnalisation Rapide

### Changer les couleurs
Éditez `frontend/src/App.css` :
- Ligne 9 : `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`

### Ajouter un service
Éditez `backend/database.js`, section `services` (ligne 51)

---

**Besoin d'aide ?** Consultez le README.md complet
