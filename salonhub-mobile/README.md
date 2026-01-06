# SalonHub Mobile

Application mobile React Native pour la gestion des salons de beauté (propriétaires et employés uniquement).

## 🚀 Technologies

- **React Native** avec **Expo** (managed workflow)
- **React Navigation** (Stack & Bottom Tabs)
- **Axios** pour les appels API
- **Expo Secure Store** pour le stockage sécurisé
- **JavaScript** (pas TypeScript)

## 📱 Fonctionnalités

### Pour les propriétaires et employés de salons:

- ✅ **Authentification** - Connexion sécurisée avec JWT
- 📊 **Dashboard** - Vue d'ensemble des statistiques
- 📅 **Rendez-vous** - Liste et gestion des réservations
- 👥 **Clients** - Gestion de la clientèle
- ✂️ **Services** - Liste des services disponibles
- ⚙️ **Paramètres** - Configuration du profil

## 🛠️ Installation

### Prérequis

- Node.js v20.18.0 ou supérieur
- npm ou yarn
- Expo Go app sur votre téléphone (iOS/Android)

### Étapes

1. **Installer les dépendances**
   ```bash
   cd salonhub-mobile
   npm install
   ```

2. **Configurer l'API**

   L'URL de l'API backend est définie dans `src/services/api.js`:
   ```javascript
   const API_URL = 'http://localhost:5000/api';
   ```

   Pour tester sur un appareil physique, changez `localhost` par l'adresse IP locale de votre machine:
   ```javascript
   const API_URL = 'http://192.168.1.X:5000/api';
   ```

3. **Démarrer l'application**
   ```bash
   npm start
   ```

   Ou directement sur une plateforme spécifique:
   ```bash
   npm run android  # Android
   npm run ios      # iOS (macOS uniquement)
   npm run web      # Web
   ```

4. **Scanner le QR code**
   - Ouvrez **Expo Go** sur votre téléphone
   - Scannez le QR code affiché dans le terminal
   - L'app se chargera automatiquement

## 📂 Structure du projet

```
salonhub-mobile/
├── src/
│   ├── screens/           # Écrans de l'application
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── AppointmentsScreen.js
│   │   ├── ClientsScreen.js
│   │   ├── ServicesScreen.js
│   │   └── SettingsScreen.js
│   ├── components/        # Composants réutilisables
│   ├── navigation/        # Configuration React Navigation
│   │   └── AppNavigator.js
│   ├── contexts/          # Contextes React (Auth, etc.)
│   │   └── AuthContext.js
│   ├── services/          # Services API
│   │   └── api.js
│   ├── utils/             # Utilitaires
│   └── constants/         # Constantes
├── App.js                 # Point d'entrée
├── package.json
└── README.md
```

## 🔐 Authentification

L'application utilise JWT (JSON Web Tokens) pour l'authentification:

- Le token est stocké de manière sécurisée avec **Expo Secure Store**
- Le token est automatiquement ajouté à chaque requête API via un intercepteur Axios
- Déconnexion automatique si le token expire (401)

## 🎨 Design

- Palette de couleurs: Indigo (#4F46E5) comme couleur principale
- UI/UX moderne et épurée
- Icons: Ionicons (@expo/vector-icons)
- Compatible iOS et Android

## 📱 Écrans

### 1. Login
- Champs: Email et Mot de passe
- Validation côté client
- Messages d'erreur clairs

### 2. Dashboard
- Statistiques du jour (rendez-vous, clients, revenus)
- Actions rapides
- Pull-to-refresh

### 3. Rendez-vous
- Liste des rendez-vous avec statuts
- Codes couleur par statut
- Filtrage et recherche

### 4. Clients
- Liste des clients avec recherche
- Avatars avec initiales
- Informations de contact

### 5. Services
- Liste des services
- Badge actif/inactif
- Prix et durée

### 6. Paramètres
- Profil utilisateur
- Déconnexion

## 🔧 Configuration API

L'application se connecte au backend SalonHub sur `http://localhost:5000/api`.

### Endpoints utilisés:

- `POST /auth/login` - Connexion
- `GET /dashboard/stats` - Statistiques
- `GET /appointments` - Liste des rendez-vous
- `GET /clients` - Liste des clients
- `GET /services` - Liste des services

## 🚫 Limitations connues

- Pas de création/modification de données (lecture seule pour le moment)
- Pas de notifications push
- Pas de mode hors ligne

## 🔮 Prochaines étapes

- [ ] Ajout de la création de rendez-vous
- [ ] Ajout de la création de clients
- [ ] Notifications push
- [ ] Mode hors ligne avec synchronisation
- [ ] Gestion des images (upload logo, photos)
- [ ] Calendrier interactif
- [ ] Chat avec les clients

## ⚠️ Notes importantes

- Cette application est **uniquement pour les propriétaires et employés de salons**
- Elle n'est **pas destinée aux clients** ni aux **super-admins**
- Utilisez Expo managed workflow (pas bare workflow) pour éviter les erreurs Java

## 🐛 Dépannage

### L'app ne se connecte pas à l'API

1. Vérifiez que le backend est démarré (`npm start` dans `salonhub-backend`)
2. Si vous testez sur un appareil physique, changez `localhost` par votre IP locale
3. Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau WiFi

### Erreurs de build

- Supprimez `node_modules` et réinstallez: `rm -rf node_modules && npm install`
- Nettoyez le cache Expo: `npx expo start --clear`

## 📄 Licence

Propriétaire - SalonHub 2025
