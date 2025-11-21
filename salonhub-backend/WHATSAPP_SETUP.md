# Configuration WhatsApp pour SalonHub

Ce guide explique comment fonctionne l'intégration WhatsApp dans SalonHub.

## 🎯 Fonctionnalités WhatsApp

SalonHub utilise WhatsApp pour :
- ✅ **Confirmations de rendez-vous** : Lors de la confirmation d'un RDV
- ⏰ **Rappels de rendez-vous** : Rappel automatique avant le rendez-vous
- 💬 **Messages personnalisés** : Envoi de messages depuis la page Clients

## 📱 Mode de fonctionnement actuel

**Par défaut, SalonHub utilise les liens WhatsApp (wa.me) :**

- ✅ **Aucune configuration nécessaire** : Pas besoin d'API ou de compte développeur
- ✅ **Gratuit** : Aucun coût d'envoi
- ✅ **Simple** : WhatsApp s'ouvre directement avec le message pré-rempli
- ✅ **Fonctionne partout** : Desktop (WhatsApp Web) et mobile (application)

Lorsqu'un message WhatsApp est envoyé depuis SalonHub :
1. Un lien `wa.me` est généré avec le numéro et le message
2. Ce lien s'ouvre dans un nouvel onglet
3. WhatsApp Web ou l'application mobile s'ouvre automatiquement
4. Le message est pré-rempli, il suffit de cliquer sur "Envoyer"

---

## 🔧 Configuration avancée (optionnel)

Si vous souhaitez un envoi entièrement automatique via API, vous pouvez configurer :

### Option 1: Twilio (Recommandé pour débuter)
- ✅ Simple à configurer
- ✅ Pas besoin d'approbation Meta
- ⚠️ Coût par message
- ⚠️ Limité à 1000 messages/mois en mode sandbox

### Option 2: Meta WhatsApp Business API
- ✅ Messages illimités
- ✅ Templates personnalisables
- ⚠️ Nécessite un Business Account vérifié
- ⚠️ Processus d'approbation plus long

> **Note:** La configuration API n'est nécessaire que si vous voulez un envoi 100% automatique sans interaction. Le mode lien (par défaut) est suffisant pour la plupart des utilisateurs.

---

## 🚀 Configuration avec Twilio

### Étape 1: Créer un compte Twilio

1. Allez sur [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Créez un compte gratuit (crédit de $15 offert)
3. Vérifiez votre email et numéro de téléphone

### Étape 2: Activer WhatsApp Sandbox

1. Dans la console Twilio : [https://console.twilio.com](https://console.twilio.com)
2. Allez dans **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Suivez les instructions pour rejoindre le Sandbox :
   - Envoyez le code fourni (ex: `join <code>`) au numéro Twilio WhatsApp
   - Vous recevrez une confirmation

### Étape 3: Récupérer vos identifiants

Dans la console Twilio :
1. **Account SID** : Sur le dashboard principal
2. **Auth Token** : Cliquez sur "Show" à côté de Auth Token
3. **WhatsApp Number** : Dans **Messaging** → **Try it out**, format `whatsapp:+14155238886`

### Étape 4: Configurer SalonHub

Ajoutez ces variables dans votre fichier `.env` :

```env
# Activer WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=twilio

# Identifiants Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre_auth_token_ici
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Étape 5: Tester

1. Redémarrez votre serveur backend
2. Dans SalonHub, confirmez un rendez-vous ou envoyez un message test
3. Le client devrait recevoir le message sur WhatsApp

⚠️ **Important en Sandbox** : Les destinataires doivent d'abord rejoindre votre sandbox en envoyant le code fourni.

---

## 🏢 Configuration avec Meta WhatsApp Business API

### Étape 1: Créer un Business Account

1. Allez sur [Facebook Business Manager](https://business.facebook.com)
2. Créez un compte professionnel
3. Vérifiez votre entreprise (peut prendre quelques jours)

### Étape 2: Configurer WhatsApp Business API

1. Dans Business Manager, allez dans **WhatsApp Manager**
2. Ajoutez un numéro de téléphone pour votre compte
3. Créez une application dans [Facebook Developers](https://developers.facebook.com)
4. Ajoutez le produit **WhatsApp** à votre application

### Étape 3: Récupérer les identifiants

1. **Access Token** : Dans **WhatsApp** → **Getting Started**, générez un token
2. **Phone Number ID** : Dans **WhatsApp** → **API Setup**
3. **Business Account ID** : Dans **WhatsApp** → **Settings**

### Étape 4: Créer des templates de messages

Meta impose l'utilisation de templates approuvés. Créez-les dans **WhatsApp Manager** → **Message Templates**.

Exemples de templates :
- **Confirmation RDV** : "Bonjour {{1}}, votre RDV {{2}} le {{3}} à {{4}} est confirmé ✓"
- **Rappel RDV** : "Bonjour {{1}}, rappel de votre RDV {{2}} demain à {{3}}"

### Étape 5: Configurer SalonHub

```env
# Activer WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=meta

# Identifiants Meta
WHATSAPP_ACCESS_TOKEN=votre_access_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

---

## 🧪 Mode Simulation (Par défaut)

Si vous ne configurez pas WhatsApp, le système fonctionne en **mode simulation** :
- Les messages ne sont pas réellement envoyés
- Les logs affichent le contenu des messages dans la console
- Pratique pour le développement et les tests

Pour activer la simulation :
```env
WHATSAPP_ENABLED=false
```

---

## 📱 Format des numéros de téléphone

SalonHub formatte automatiquement les numéros français :
- `06 12 34 56 78` → `+33612345678`
- `0612345678` → `+33612345678`
- `+33612345678` → `+33612345678` (déjà valide)

Pour d'autres pays, utilisez le format international : `+[code pays][numéro]`

---

## 💰 Coûts

### Twilio
- **Sandbox** : Gratuit (limité)
- **Production** : ~0.005€ par message
- Voir la tarification : [https://www.twilio.com/pricing/messaging](https://www.twilio.com/pricing/messaging)

### Meta WhatsApp Business API
- **Conversations gratuites** : 1000 premières conversations/mois
- **Au-delà** : ~0.04€ par conversation
- Voir la tarification : [https://developers.facebook.com/docs/whatsapp/pricing](https://developers.facebook.com/docs/whatsapp/pricing)

---

## 🔍 Dépannage

### Les messages ne partent pas

1. **Vérifiez les logs** : `npm run dev` affiche les erreurs
2. **Vérifiez WHATSAPP_ENABLED** : Doit être `true`
3. **Vérifiez les identifiants** : Account SID, Auth Token, etc.
4. **Format du numéro** : Doit être au format international

### Erreur "Unauthorized"

- Vérifiez que le **Auth Token** est correct
- Le token peut être régénéré dans la console Twilio

### Erreur "To number not sandbox verified"

En mode Twilio Sandbox, le destinataire doit d'abord rejoindre le sandbox.

### Les messages arrivent en retard

- Normal en sandbox Twilio
- En production avec Meta, les messages arrivent instantanément

---

## 📚 Ressources

- [Documentation Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Documentation Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business Platform](https://business.whatsapp.com)

---

## ✅ Checklist de mise en production

- [ ] Compte Twilio ou Meta configuré
- [ ] Numéro de téléphone vérifié
- [ ] Variables d'environnement renseignées
- [ ] `WHATSAPP_ENABLED=true`
- [ ] Tests réalisés avec succès
- [ ] Templates Meta approuvés (si Meta)
- [ ] Crédits suffisants (si Twilio)

---

🎉 Une fois configuré, vos clients recevront automatiquement les confirmations et rappels par WhatsApp !
