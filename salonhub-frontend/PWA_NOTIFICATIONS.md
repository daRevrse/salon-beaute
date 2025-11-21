# 📱 PWA et Notifications Push - SalonHub

## Vue d'ensemble

SalonHub est maintenant une Progressive Web App (PWA) complète avec support des notifications push pour les rappels de rendez-vous.

## 🎯 Fonctionnalités

### Installation PWA
- ✅ Installation sur appareil (mobile et desktop)
- ✅ Icône sur l'écran d'accueil
- ✅ Mode standalone (plein écran)
- ✅ Cache offline intelligent
- ✅ Mises à jour automatiques avec notification

### Notifications Push
- ✅ Rappels automatiques de rendez-vous
- ✅ Notifications en temps réel
- ✅ Fonctionne même app fermée
- ✅ Gestion des permissions
- ✅ Notifications de test

## 📋 Fichiers créés/modifiés

### Backend
Aucune modification backend nécessaire - les notifications utilisent le système existant.

### Frontend

#### Nouveaux fichiers :
1. **`public/manifest.json`** - Configuration PWA
2. **`public/service-worker.js`** - Service Worker pour offline et notifications
3. **`src/services/pwaService.js`** - Service de gestion PWA et notifications
4. **`src/components/settings/PWASettings.js`** - Interface de configuration
5. **`src/components/common/UpdateBanner.js`** - Bannière de mise à jour
6. **`PWA_NOTIFICATIONS.md`** - Cette documentation

#### Fichiers modifiés :
1. **`public/index.html`** - Ajout des métadonnées PWA
2. **`src/index.js`** - Enregistrement du Service Worker
3. **`src/App.js`** - Ajout de la bannière de mise à jour
4. **`src/pages/Settings.js`** - Ajout de l'onglet Notifications
5. **`src/styles/animations.css`** - Animation slide-up

## 🚀 Installation

### Pour les utilisateurs

1. **Ouvrir SalonHub dans le navigateur**
   - Chrome, Edge, ou Safari sur mobile

2. **Installer l'application**
   - **Desktop**: Clic sur l'icône d'installation dans la barre d'adresse
   - **Mobile**: Menu navigateur → "Ajouter à l'écran d'accueil"
   - **Ou**: Paramètres → Onglet Notifications → "Installer l'application"

3. **Activer les notifications**
   - Paramètres → Onglet Notifications
   - Cliquer sur "Activer les notifications"
   - Accepter la demande de permission du navigateur

### Pour les développeurs

1. **Ajouter les icônes PWA** (requis)
   ```bash
   # Créer les icônes dans public/
   public/favicon.ico (64x64)
   public/logo192.png (192x192)
   public/logo512.png (512x512)
   ```

2. **Variables d'environnement** (optionnel pour push)
   ```env
   # Dans .env
   REACT_APP_VAPID_PUBLIC_KEY=votre_cle_publique_vapid
   ```

3. **Déployer**
   - Le Service Worker fonctionne uniquement en HTTPS (ou localhost)
   - Assurez-vous que le site est servi en HTTPS en production

## 📱 Utilisation

### Installer l'application

1. Aller dans **Paramètres** (icône engrenage)
2. Cliquer sur l'onglet **Notifications**
3. Dans la section "Installation de l'application"
4. Cliquer sur **"Installer l'application"**

### Activer les notifications

1. Aller dans **Paramètres** → **Notifications**
2. Dans la section "Notifications push"
3. Cliquer sur **"Activer les notifications"**
4. Accepter la permission dans le navigateur
5. Tester avec **"Tester les notifications"**

### Planifier des rappels

Les rappels de rendez-vous sont **automatiques** :
- Envoyés 24h avant chaque rendez-vous confirmé
- Affichés même si l'application est fermée
- Cliquables pour ouvrir directement les rendez-vous

## 🔧 Configuration technique

### Service Worker

Le Service Worker gère :
- **Cache** : Stratégie Network First pour les performances
- **Push** : Réception et affichage des notifications
- **Sync** : Synchronisation des rappels en arrière-plan
- **Update** : Détection et notification des mises à jour

### Cache Strategy

```javascript
// Network First, puis Cache
fetch(request)
  .then(response => {
    cache.put(request, response.clone());
    return response;
  })
  .catch(() => cache.match(request));
```

### Notifications Push

Format du payload :
```javascript
{
  title: "Rappel de rendez-vous",
  body: "Marie Dupont - Coupe + Coloration à 14:30",
  icon: "/logo192.png",
  badge: "/logo192.png",
  data: {
    url: "/appointments",
    appointmentId: 123
  },
  actions: [
    { action: "view", title: "Voir" },
    { action: "close", title: "Fermer" }
  ]
}
```

### IndexedDB

Stockage local des rappels :
```javascript
// Structure
{
  id: number,
  clientName: string,
  serviceName: string,
  time: string,
  date: string,
  sent: boolean
}
```

## 🎨 Interface utilisateur

### Onglet Notifications (Settings)

Affiche :
- État de l'installation PWA
- Bouton d'installation
- État des permissions de notification
- Boutons d'activation/désactivation
- Bouton de test

### Bannière de mise à jour

Apparaît automatiquement quand :
- Une nouvelle version est disponible
- Le Service Worker est mis à jour

Actions :
- **Mettre à jour maintenant** : Recharge avec la nouvelle version
- **X** : Masquer la bannière

## 🔒 Permissions

### Notifications

- **granted** : Notifications activées ✅
- **denied** : Notifications refusées ❌
- **default** : Non configuré ⚠️

Pour réactiver après refus :
1. Chrome/Edge : Paramètres → Confidentialité → Notifications
2. Safari : Réglages → Safari → Sites web → Notifications

## 🐛 Dépannage

### L'installation n'est pas proposée

**Causes possibles** :
- Navigateur non compatible (utiliser Chrome/Edge/Safari)
- Site non en HTTPS (requis en production)
- PWA déjà installée
- Critères PWA non remplis (manifest, service worker, icônes)

**Solution** :
- Vérifier la console : `Application` → `Manifest`
- Vérifier que le manifest.json est accessible
- Ajouter les icônes manquantes

### Les notifications ne fonctionnent pas

**Vérifications** :
1. Permission accordée ? (Settings → Notifications)
2. Service Worker enregistré ? (Console → Application → Service Workers)
3. HTTPS activé ? (requis sauf localhost)
4. Notifications activées dans le système ?

**Solution** :
```javascript
// Vérifier dans la console
navigator.serviceWorker.getRegistration()
  .then(reg => console.log('SW:', reg))

Notification.permission // 'granted', 'denied' ou 'default'
```

### Le cache ne fonctionne pas

**Vérifier** :
- Console → Application → Cache Storage
- Le Service Worker est bien activé
- Pas d'erreur dans la console

**Forcer la mise à jour** :
```javascript
// Dans la console
navigator.serviceWorker.getRegistration()
  .then(reg => reg.update())
```

### Désinstaller la PWA

1. **Desktop** : Paramètres du navigateur → Applications installées
2. **Mobile** : Maintenir l'icône → Désinstaller
3. **Ou** : Console → Application → Clear storage

## 📊 Métriques et suivi

### Service Worker

```javascript
// Vérifier l'état
navigator.serviceWorker.ready
  .then(registration => {
    console.log('SW actif:', registration.active);
    console.log('Scope:', registration.scope);
  });
```

### Notifications

```javascript
// Compter les rappels en attente
const db = await indexedDB.open('SalonHubDB', 1);
const tx = db.transaction(['reminders'], 'readonly');
const reminders = await tx.objectStore('reminders').getAll();
console.log('Rappels en attente:', reminders.length);
```

## 🔄 Mises à jour

### Processus automatique

1. Service Worker détecte une nouvelle version
2. Télécharge et installe en arrière-plan
3. Attend que toutes les fenêtres soient fermées
4. Active la nouvelle version au prochain chargement

### Notification utilisateur

- Bannière en bas de l'écran
- Option "Mettre à jour maintenant" (force le rechargement)
- Option "X" pour masquer et attendre

### Force update

```javascript
// Pour forcer la mise à jour
pwaService.updateServiceWorker();
// Recharge automatiquement la page
```

## 🌐 Compatibilité

| Fonctionnalité | Chrome | Edge | Safari | Firefox |
|----------------|--------|------|--------|---------|
| Installation PWA | ✅ | ✅ | ✅ (iOS 11.3+) | ⚠️ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Background Sync | ✅ | ✅ | ❌ | ❌ |
| Cache API | ✅ | ✅ | ✅ | ✅ |

✅ = Support complet
⚠️ = Support partiel
❌ = Non supporté

## 📚 Ressources

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## ✨ Prochaines améliorations

- [ ] Support des notifications riches (images, actions)
- [ ] Synchronisation offline des données
- [ ] Mode sombre automatique
- [ ] Partage natif
- [ ] Raccourcis d'application
- [ ] Badges de notifications
- [ ] Web Share Target
- [ ] File System Access

---

📱 **SalonHub PWA** - Une expérience application native sur le web !
