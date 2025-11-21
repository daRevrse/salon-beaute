# Guide Complet des Notifications - SalonHub

Ce guide explique comment configurer et utiliser le système de notifications automatiques de SalonHub (Phases 1, 2 et 3).

---

## Phase 1 : Automatisation Serveur (Cron Jobs)

### Fonctionnalités

- **Rappels automatiques par email** :
  - 24h avant le rendez-vous (tous les jours à 9h00)
  - 2h avant le rendez-vous (toutes les 30 minutes entre 8h-20h)
- **Tracking des rappels envoyés** pour éviter les doublons
- **Nettoyage automatique** des anciens logs (tous les dimanches à 2h00)

### Installation

#### 1. Créer les tables en base de données

Exécutez le script SQL :

```bash
mysql -u root -p salonhub < salonhub-backend/src/database/create_reminder_logs.sql
```

Ou manuellement dans votre client MySQL :

```sql
CREATE TABLE IF NOT EXISTS reminder_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  appointment_id INT NOT NULL,
  client_id INT NOT NULL,
  reminder_type ENUM('24h_before', '2h_before', '1h_before', 'confirmation') NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  channel ENUM('email', 'sms', 'push') NOT NULL,
  status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  error_message TEXT,
  INDEX idx_appointment (appointment_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_sent_at (sent_at),
  UNIQUE KEY unique_reminder (appointment_id, reminder_type, channel),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 2. Configuration SMTP

Le fichier `.env` doit contenir les variables suivantes :

```env
# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM="SalonHub <noreply@salonhub.com>"
```

**Note Gmail** : Créez un "Mot de passe d'application" dans les paramètres de sécurité Google.

#### 3. Démarrage automatique

Le scheduler se lance automatiquement au démarrage du serveur backend :

```bash
cd salonhub-backend
npm start
```

Vous verrez dans les logs :

```
⏰ Démarrage du scheduler...
✅ Scheduler démarré avec succès
📋 3 tâches planifiées:
   - Rappels 24h: Tous les jours à 9h00
   - Rappels 2h: Toutes les 30min (8h-20h)
   - Nettoyage logs: Dimanches à 2h00
```

### Tests Manuels

Vous pouvez déclencher manuellement les rappels via l'API (authentification admin requise) :

```bash
# Tester les rappels 24h
curl -X POST http://localhost:5000/api/scheduler/trigger/24h \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"

# Tester les rappels 2h
curl -X POST http://localhost:5000/api/scheduler/trigger/2h \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"

# Voir le statut du scheduler
curl http://localhost:5000/api/scheduler/status \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
```

---

## Phase 2 : Notifications Push (Web Push / VAPID)

### Fonctionnalités

- **Notifications push natives** même si l'application est fermée
- **Support multi-navigateurs** (Chrome, Firefox, Edge, Safari 16.4+)
- **Rappels automatiques** envoyés en plus des emails
- **Gestion des abonnements** par client et par staff

### Installation

#### 1. Générer les clés VAPID

```bash
cd salonhub-backend
npx web-push generate-vapid-keys
```

Cela génère deux clés :

```
Public Key:
BHxJ...

Private Key:
XYZ...
```

#### 2. Configuration des clés VAPID

Ajoutez ces clés dans le fichier `.env` :

```env
# Clés VAPID pour les notifications push
VAPID_PUBLIC_KEY=BHxJ...votre-cle-publique...
VAPID_PRIVATE_KEY=XYZ...votre-cle-privee...
VAPID_SUBJECT=mailto:support@votresalon.com
```

**⚠️ IMPORTANT** :
- Ne partagez JAMAIS votre clé privée
- Changez la clé si elle est compromise
- Le `VAPID_SUBJECT` doit être un email valide ou une URL HTTPS

#### 3. Créer la table push_subscriptions

```bash
mysql -u root -p salonhub < salonhub-backend/src/database/create_push_subscriptions.sql
```

Ou manuellement :

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  client_id INT,
  user_id INT,
  endpoint TEXT NOT NULL,
  p256dh_key VARCHAR(255) NOT NULL,
  auth_key VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  INDEX idx_tenant (tenant_id),
  INDEX idx_client (client_id),
  INDEX idx_user (user_id),
  INDEX idx_endpoint (endpoint(255)),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4. Configuration Frontend

Le fichier `.env` du frontend doit contenir :

```env
REACT_APP_API_URL=http://localhost:5000
```

#### 5. Activer les notifications dans l'interface

1. Connectez-vous en tant qu'admin/staff
2. Allez dans **Paramètres** → **Notifications**
3. Cliquez sur **Activer les notifications**
4. Accordez la permission dans le navigateur
5. Testez avec le bouton "Envoyer une notification de test"

### Tests Manuels

```bash
# Récupérer la clé publique VAPID
curl http://localhost:5000/api/push/vapid-public-key

# Envoyer une notification de test (admin seulement)
curl -X POST http://localhost:5000/api/push/test \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Notification de test"
  }'
```

---

## Phase 3 : Temps Réel (WebSockets)

### Fonctionnalités

**Déjà implémenté** : Socket.io est déjà configuré dans votre application !

- **Mise à jour en temps réel** du dashboard quand un nouveau RDV est créé
- **Notifications instantanées** pour le staff
- **Isolation multi-tenant** (chaque salon a sa propre "room")

### Comment ça marche

1. Quand un client crée un RDV depuis le booking public :
   ```
   POST /api/public/appointments
   ```

2. Le serveur émet un événement Socket.io :
   ```javascript
   io.to(`tenant_${tenantId}`).emit("new_appointment", {
     appointment: {...},
     message: "Nouveau RDV : John Doe"
   });
   ```

3. Le dashboard écoute l'événement et se met à jour automatiquement :
   ```javascript
   socket.on("new_appointment", (data) => {
     showToast(data.message, "success");
     fetchAppointments(); // Recharge la liste
   });
   ```

### Vérification

Les WebSockets sont déjà actifs. Pour vérifier :

1. Ouvrez le dashboard (`/appointments`)
2. Ouvrez la console navigateur (F12)
3. Vous devriez voir : `🟢 Connecté au serveur WebSocket`

---

## Déploiement en Production

### 1. Variables d'environnement

Fichier `.env` backend :

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://votre-domaine.com

# Base de données
DB_HOST=localhost
DB_USER=salonhub_user
DB_PASSWORD=mot-de-passe-securise
DB_NAME=salonhub_prod

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM="SalonHub <noreply@votre-salon.com>"

# VAPID pour notifications push
VAPID_PUBLIC_KEY=BHxJ...
VAPID_PRIVATE_KEY=XYZ...
VAPID_SUBJECT=mailto:support@votre-salon.com
```

### 2. HTTPS Obligatoire

⚠️ **Les notifications push ne fonctionnent qu'en HTTPS** (sauf localhost pour les tests).

Utilisez un certificat SSL :
- Let's Encrypt (gratuit)
- Cloudflare SSL
- Certificat payant

### 3. Service Worker

Assurez-vous que le service-worker est bien servi :

```javascript
// public/index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('✅ Service Worker enregistré'))
    .catch(err => console.error('❌ Erreur SW:', err));
}
```

### 4. Process Manager (PM2)

Pour garder le serveur actif en production :

```bash
npm install -g pm2

# Démarrer le serveur
cd salonhub-backend
pm2 start src/server.js --name salonhub-backend

# Sauvegarder la configuration
pm2 save

# Démarrage automatique au boot
pm2 startup
```

### 5. Logs et Monitoring

```bash
# Voir les logs en temps réel
pm2 logs salonhub-backend

# Surveiller l'activité
pm2 monit

# Redémarrer si nécessaire
pm2 restart salonhub-backend
```

---

## Dépannage

### Les rappels ne s'envoient pas

1. **Vérifier les logs du scheduler** :
   ```bash
   pm2 logs salonhub-backend | grep Cron
   ```

2. **Tester manuellement** :
   ```bash
   curl -X POST http://localhost:5000/api/scheduler/trigger/24h \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Vérifier la config SMTP** :
   - Testez avec un email simple depuis le backend
   - Vérifiez que le mot de passe d'application Gmail est correct

### Les notifications push ne fonctionnent pas

1. **Vérifier que HTTPS est activé** (requis en production)

2. **Vérifier les clés VAPID** :
   ```bash
   curl http://localhost:5000/api/push/vapid-public-key
   ```

3. **Vérifier les permissions du navigateur** :
   - Chrome : `chrome://settings/content/notifications`
   - Firefox : `about:preferences#privacy`

4. **Voir les erreurs dans la console** (F12)

### WebSockets ne se connectent pas

1. **Vérifier que Socket.io est bien lancé** :
   ```
   Logs : ⚡ Client connecté: xyz123
   ```

2. **Vérifier le CORS** :
   ```javascript
   // server.js
   cors: {
     origin: process.env.FRONTEND_URL,
     credentials: true
   }
   ```

3. **Vérifier les proxys/firewalls** :
   - Les WebSockets utilisent le port du serveur backend
   - Assurez-vous qu'ils ne sont pas bloqués

---

## Roadmap Future

### Améliorations possibles

- [ ] **SMS** : Intégrer Twilio pour les rappels SMS
- [ ] **WhatsApp** : Notifications via WhatsApp Business API
- [ ] **Notifications dans l'app** : Système de notifications internes
- [ ] **Calendrier** : Synchronisation avec Google Calendar / Outlook
- [ ] **Rappels personnalisables** : Permettre aux salons de configurer les délais
- [ ] **Analytics** : Dashboard des taux d'ouverture des notifications

---

## Support

Pour toute question ou problème :

1. Vérifiez les logs : `pm2 logs salonhub-backend`
2. Consultez ce guide
3. Contactez le support : support@flowkraftagency.com

---

**SalonHub** - Système de notifications automatiques v1.0
© 2025 FlowKraft Agency
