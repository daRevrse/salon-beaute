# Guide d'Intégration WhatsApp Business

## Vue d'ensemble

Ce guide explique comment intégrer l'API WhatsApp Business pour envoyer des notifications réelles (confirmations de RDV, rappels, promotions).

---

## 🎯 Options d'Intégration

### Option 1 : Twilio (Recommandé - Simple et Rapide) ⭐

**Avantages** :
- ✅ Simple à configurer
- ✅ Pas besoin d'approbation Meta
- ✅ Tarifs clairs (0.005€/message)
- ✅ Support français excellent
- ✅ Sandbox gratuit pour tests

**Inconvénients** :
- ❌ Coût par message
- ❌ Nécessite un numéro Twilio

**Tarif** : ~0.005€ par message WhatsApp

---

### Option 2 : WhatsApp Business API Officielle

**Avantages** :
- ✅ Gratuit pour 1000 premiers messages/mois
- ✅ Solution officielle Meta
- ✅ Templates approuvés pour usage professionnel

**Inconvénients** :
- ❌ Configuration complexe
- ❌ Nécessite approbation Meta
- ❌ Délai d'activation (plusieurs jours)
- ❌ Nécessite un numéro dédié

**Tarif** : Gratuit jusqu'à 1000 messages/mois, puis ~0.004€/message

---

### Option 3 : Services Tiers (MessageBird, Vonage, Infobip)

**Avantages** :
- ✅ Solutions tout-en-un
- ✅ Dashboard de gestion
- ✅ Support multi-canal (SMS + WhatsApp)

**Inconvénients** :
- ❌ Coûts variables
- ❌ Complexité selon le service

---

## 🚀 Intégration avec Twilio (Recommandée)

### Étape 1 : Créer un compte Twilio

1. Aller sur https://www.twilio.com/
2. S'inscrire (essai gratuit : 15$ de crédit)
3. Vérifier le compte

### Étape 2 : Configurer WhatsApp Sandbox

1. Dashboard Twilio → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Scanner le QR code avec WhatsApp
3. Envoyer le code de connexion (ex: `join <code>`)
4. ✅ Votre numéro est maintenant connecté au sandbox

### Étape 3 : Récupérer les credentials

Dans le dashboard Twilio :
- **Account SID** : `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token** : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **WhatsApp Number** : `+14155238886` (sandbox)

### Étape 4 : Installation des dépendances

```bash
cd salonhub-backend
npm install twilio
```

### Étape 5 : Configuration Backend

**Fichier** : `salonhub-backend/.env`

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Étape 6 : Créer le service WhatsApp

**Créer** : `salonhub-backend/src/services/whatsappService.js`

```javascript
/**
 * Service WhatsApp avec Twilio
 */

const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken) {
      console.warn('⚠️ Configuration Twilio manquante - Mode simulation');
      this.client = null;
      return;
    }

    this.client = twilio(accountSid, authToken);
    console.log('✅ Service WhatsApp initialisé');
  }

  /**
   * Envoyer un message WhatsApp
   */
  async sendMessage({ to, body, mediaUrl = null }) {
    // Mode simulation si Twilio non configuré
    if (!this.client) {
      console.log(`📱 [SIMULATION WHATSAPP] To: ${to}`);
      console.log(body);
      return {
        success: true,
        messageSid: 'SIMULATION',
        simulated: true
      };
    }

    try {
      // Formater le numéro
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const messageOptions = {
        from: this.whatsappFrom,
        to: formattedTo,
        body: body
      };

      // Ajouter media si présent
      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
      }

      const message = await this.client.messages.create(messageOptions);

      console.log(`✅ WhatsApp envoyé à ${to} - SID: ${message.sid}`);

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        simulated: false
      };
    } catch (error) {
      console.error('❌ Erreur envoi WhatsApp:', error.message);
      throw new Error(`Erreur WhatsApp: ${error.message}`);
    }
  }

  /**
   * Envoyer une confirmation de RDV
   */
  async sendAppointmentConfirmation(data) {
    const message = `
🎉 *Confirmation de rendez-vous*

Bonjour ${data.clientName},

Votre rendez-vous est confirmé :

📋 *Service :* ${data.serviceName}
📅 *Date :* ${data.date}
🕐 *Heure :* ${data.time}
⏱️ *Durée :* ${data.duration} min
👤 *Avec :* ${data.staffName}

Nous vous attendons avec plaisir ! 😊

📞 ${data.salonPhone}
*${data.salonName}*
    `.trim();

    return this.sendMessage({
      to: data.clientPhone,
      body: message
    });
  }

  /**
   * Envoyer un rappel de RDV
   */
  async sendAppointmentReminder(data) {
    const message = `
⏰ *Rappel de rendez-vous*

Bonjour ${data.clientName},

Nous vous rappelons votre rendez-vous :

📋 *Service :* ${data.serviceName}
📅 *Date :* ${data.date}
🕐 *Heure :* ${data.time}

À bientôt ! 😊

📞 ${data.salonPhone}
*${data.salonName}*
    `.trim();

    return this.sendMessage({
      to: data.clientPhone,
      body: message
    });
  }

  /**
   * Envoyer une promotion
   */
  async sendPromotion(data) {
    const message = `
🎁 *${data.title}*

${data.message}

${data.promoCode ? `Code promo : *${data.promoCode}*` : ''}
${data.discount ? `Réduction : *${data.discount}*` : ''}
${data.validUntil ? `Valable jusqu'au : ${data.validUntil}` : ''}

Réservez dès maintenant ! 📲

📞 ${data.salonPhone}
*${data.salonName}*
    `.trim();

    return this.sendMessage({
      to: data.clientPhone,
      body: message,
      mediaUrl: data.imageUrl || null
    });
  }

  /**
   * Envoyer un message personnalisé
   */
  async sendCustomMessage({ to, message, salonName }) {
    const formattedMessage = `
${message}

*${salonName}*
    `.trim();

    return this.sendMessage({
      to: to,
      body: formattedMessage
    });
  }

  /**
   * Vérifier le statut d'un message
   */
  async getMessageStatus(messageSid) {
    if (!this.client) {
      return { status: 'simulated' };
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error('Erreur récupération statut:', error.message);
      throw error;
    }
  }
}

// Export singleton
module.exports = new WhatsAppService();
```

### Étape 7 : Modifier la route appointments.js

**Fichier** : `salonhub-backend/src/routes/appointments.js`

Ajouter en haut du fichier :
```javascript
const whatsappService = require("../services/whatsappService");
```

Remplacer la section WhatsApp (lignes 742-776) :
```javascript
// Envoyer par WhatsApp
if (send_via === 'whatsapp' || send_via === 'both') {
  if (!appointment.client_phone) {
    return res.status(400).json({
      success: false,
      error: "Le client n'a pas de numéro de téléphone"
    });
  }

  try {
    const whatsappData = {
      clientName: confirmationData.clientName,
      clientPhone: appointment.client_phone,
      serviceName: confirmationData.serviceName,
      date: confirmationData.date,
      time: confirmationData.time,
      duration: confirmationData.duration,
      staffName: confirmationData.staffName,
      salonPhone: confirmationData.salonPhone,
      salonName: confirmationData.salonName
    };

    const result = await whatsappService.sendAppointmentConfirmation(whatsappData);
    whatsappSent = result.success;

    if (result.simulated) {
      console.log('📱 WhatsApp en mode simulation');
    } else {
      console.log(`✅ WhatsApp envoyé - SID: ${result.messageSid}`);
    }
  } catch (error) {
    console.error('❌ Erreur envoi WhatsApp:', error.message);
  }
}
```

### Étape 8 : Test

1. **Configurer les variables d'environnement**
2. **Redémarrer le serveur** : `npm run dev`
3. **Connecter votre numéro** au sandbox Twilio
4. **Créer un RDV** avec votre numéro de téléphone
5. **Envoyer la confirmation** WhatsApp
6. ✅ **Recevoir le message** sur WhatsApp

---

## 📱 Passer en Production (WhatsApp Business API)

### Prérequis
- Numéro de téléphone dédié (non utilisé sur WhatsApp personnel)
- Compte Facebook Business
- Site web vérifié

### Étapes

1. **Créer un compte Meta Business** : https://business.facebook.com/
2. **Ajouter WhatsApp Business** dans le compte Meta
3. **Vérifier le numéro de téléphone**
4. **Créer des templates de messages** (obligatoire pour l'API officielle)
5. **Attendre l'approbation** (24-48h)
6. **Configurer le webhook** pour recevoir les réponses
7. **Obtenir l'Access Token**
8. **Modifier le code** pour utiliser l'API officielle au lieu de Twilio

### Templates WhatsApp (Exemples)

**Template Confirmation RDV** :
```
Bonjour {{1}},

Votre rendez-vous est confirmé :

Service : {{2}}
Date : {{3}}
Heure : {{4}}

À bientôt !
{{5}}
```

**Template Rappel** :
```
⏰ Rappel : Rendez-vous demain à {{1}} pour {{2}}.

À bientôt !
{{3}}
```

---

## 💰 Tarifs Comparatifs

| Service | Prix/message | Gratuit | Complexité |
|---------|--------------|---------|------------|
| **Twilio** | 0.005€ | 15$ crédit | ⭐⭐ Facile |
| **Meta API** | 0.004€ | 1000/mois | ⭐⭐⭐⭐ Complexe |
| **MessageBird** | 0.006€ | Non | ⭐⭐⭐ Moyen |
| **Vonage** | 0.005€ | Oui (limité) | ⭐⭐⭐ Moyen |

---

## 🔒 Conformité RGPD

### Consentement Obligatoire

Avant d'envoyer des messages WhatsApp marketing, vous **devez** avoir le consentement explicite du client.

**Ajouter dans la table `clients`** :
```sql
ALTER TABLE clients
ADD COLUMN whatsapp_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN whatsapp_consent_date DATETIME NULL;
```

**Vérifier avant envoi** :
```javascript
if (type === 'marketing' && !client.whatsapp_consent) {
  throw new Error('Le client n\'a pas consenti aux messages WhatsApp marketing');
}
```

### Types de messages autorisés SANS consentement
- ✅ Confirmations de RDV
- ✅ Rappels de RDV
- ✅ Messages de service (annulation, modification)

### Types de messages nécessitant un consentement
- ❌ Promotions
- ❌ Newsletters
- ❌ Offres commerciales

---

## 🧪 Test en Sandbox (Gratuit)

Twilio offre un sandbox WhatsApp gratuit pour tester :

1. Aller sur https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Scanner le QR code
3. Envoyer `join <your-code>` à +1 415 523 8886
4. Tester gratuitement !

**Limites du sandbox** :
- ⏰ Connexion valable 72h (renouveler après)
- 📱 Max 5 numéros connectés simultanément
- 🚫 Pas pour la production

---

## ✅ Checklist d'Intégration

### Phase 1 : Test (Sandbox)
- [ ] Créer compte Twilio
- [ ] Configurer le sandbox WhatsApp
- [ ] Installer `npm install twilio`
- [ ] Créer `whatsappService.js`
- [ ] Configurer `.env` avec credentials
- [ ] Modifier `appointments.js`
- [ ] Tester l'envoi de confirmation
- [ ] Vérifier réception sur WhatsApp

### Phase 2 : Production
- [ ] Obtenir un numéro WhatsApp Business dédié
- [ ] Demander l'approbation Meta (si API officielle)
- [ ] Créer les templates de messages
- [ ] Configurer les variables d'environnement de production
- [ ] Ajouter les champs de consentement en base
- [ ] Implémenter la vérification du consentement
- [ ] Tester en production
- [ ] Monitorer les coûts

---

## 🚨 Erreurs Courantes

### Erreur : "Unable to create record"
**Cause** : Numéro non connecté au sandbox
**Solution** : Scanner le QR code et envoyer `join <code>`

### Erreur : "Invalid phone number"
**Cause** : Format de numéro incorrect
**Solution** : Utiliser le format international : `+33612345678`

### Erreur : "Authentication failed"
**Cause** : Credentials Twilio incorrects
**Solution** : Vérifier ACCOUNT_SID et AUTH_TOKEN dans `.env`

### Sandbox expiré (72h)
**Solution** : Renvoyer `join <code>` au numéro Twilio

---

## 📊 Monitoring et Analytics

### Voir les messages envoyés (Dashboard Twilio)
1. Console Twilio → **Monitor** → **Logs** → **Messaging**
2. Filtrer par statut : `delivered`, `failed`, `undelivered`

### Webhooks pour suivi en temps réel
```javascript
// Recevoir les statuts de livraison
app.post('/webhooks/twilio/status', (req, res) => {
  const { MessageSid, MessageStatus, To } = req.body;

  console.log(`Message ${MessageSid} : ${MessageStatus}`);

  // Mettre à jour la base de données
  // ...

  res.sendStatus(200);
});
```

---

**Recommandation** : Commencer avec Twilio Sandbox (gratuit) pour tester, puis passer à un numéro Twilio dédié (~1€/mois + messages) pour la production.

---

**Date** : 2025-11-18
**Auteur** : FlowKraft Agency
