# 🚀 Démarrage Rapide - SalonHub Mobile

## 📱 Tester l'Application

### Étape 1: Installer Expo Go sur votre téléphone

- **iOS:** [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- **Android:** [Google Play - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Étape 2: Le serveur est déjà démarré! 🎉

Le serveur Metro Bundler tourne en arrière-plan sur le port 8081.

### Étape 3: Scanner le QR Code

1. Ouvrez **Expo Go** sur votre téléphone
2. Appuyez sur **"Scan QR Code"**
3. Scannez le QR code qui apparaît dans votre terminal

### Étape 4: Connexion

Utilisez les identifiants d'un propriétaire ou employé de salon.

**Exemple:**
- Email: `owner@flowkraft.com`
- Mot de passe: `votre_mot_de_passe`

## ⚙️ Configuration pour Appareil Physique

Si vous testez sur un téléphone (pas un émulateur), modifiez l'URL de l'API:

**Fichier:** `src/services/api.js` (ligne 7)

```javascript
// Remplacez localhost par votre IP locale
const API_URL = 'http://192.168.X.X:5000/api';
```

**Trouver votre IP:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Cherchez l'adresse IPv4 (ex: 192.168.1.100)

## 🔄 Redémarrer le Serveur

Si vous avez besoin de redémarrer:

```bash
cd salonhub-mobile
npx expo start --clear
```

## 🛠️ Commandes Utiles

```bash
# Redémarrer avec cache reset complet
npm start -- --clear --reset-cache

# Ouvrir dans le navigateur
npm run web

# Ouvrir l'émulateur Android (nécessite Android Studio)
npm run android

# Ouvrir le simulateur iOS (macOS uniquement)
npm run ios
```

## ❓ Problèmes Courants

### L'app ne se connecte pas au backend

1. Vérifiez que le backend tourne: `cd ../salonhub-backend && npm start`
2. Vérifiez l'URL de l'API dans `src/services/api.js`
3. Assurez-vous que votre téléphone et PC sont sur le **même WiFi**

### Erreur au scan du QR code

1. Fermez complètement Expo Go
2. Redémarrez le serveur: `npm start -- --clear`
3. Réessayez

### L'app se charge mais reste bloquée

1. Secouez votre téléphone pour ouvrir le menu développeur
2. Appuyez sur "Reload"

## 📋 Fonctionnalités Disponibles

- ✅ Connexion sécurisée
- ✅ Dashboard avec statistiques
- ✅ Liste des rendez-vous
- ✅ Liste des clients avec recherche
- ✅ Liste des services
- ✅ Paramètres et déconnexion
- ✅ Pull-to-refresh sur toutes les listes

## 🎨 Identité Visuelle

- **Couleur principale:** Indigo (#4F46E5)
- **Navigation:** Bottom Tabs avec 5 onglets
- **Icons:** Ionicons
- **Style:** Moderne et épuré

---

**Bon test! 🎉**
