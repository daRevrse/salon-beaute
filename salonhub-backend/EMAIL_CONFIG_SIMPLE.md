# 📧 Configuration Email Simplifiée - SalonHub

## Questions fréquentes

### ❓ Dois-je configurer plusieurs fournisseurs d'email ?

**NON !** Vous n'avez besoin que d'**UN SEUL** fournisseur SMTP.

Le terme "support multi-fournisseurs" signifie simplement que le système est **compatible** avec n'importe quel service SMTP, mais vous n'en utilisez qu'**un seul à la fois**.

---

### ❓ Comment fonctionnent les emails dans SalonHub ?

**Tous les emails passent par le MÊME compte email** (celui configuré dans `.env`)

```
┌─────────────────────────────────────────────────────┐
│  TOUS LES SALONS SUR LA PLATEFORME                  │
│                                                      │
│  Salon A → Email client → salonhub@flowkraftagency │
│  Salon B → Email client → salonhub@flowkraftagency │
│  Salon C → Email client → salonhub@flowkraftagency │
│                                                      │
│  UN SEUL COMPTE EMAIL POUR TOUTE LA PLATEFORME      │
└─────────────────────────────────────────────────────┘
```

**C'est normal et standard pour une plateforme SaaS multi-tenant !**

Exemples :
- Airbnb → Tous les emails viennent de `automated@airbnb.com`
- Stripe → Tous les emails viennent de `notifications@stripe.com`
- SalonHub → Tous les emails viennent de `salonhub@flowkraftagency.com`

---

### ✅ Configuration recommandée pour SalonHub

#### Utiliser salonhub@flowkraftagency.com

**C'est la solution idéale !** Voici comment configurer :

#### Option 1️⃣ : Si vous avez un serveur email FlowKraft

```env
SMTP_HOST=mail.flowkraftagency.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salonhub@flowkraftagency.com
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM="SalonHub - FlowKraft Agency" <salonhub@flowkraftagency.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

#### Option 2️⃣ : Si FlowKraft utilise Google Workspace

1. **Créer un mot de passe d'application** :
   - Aller sur [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Activer la validation en 2 étapes
   - Générer un "Mot de passe d'application"

2. **Configuration** :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salonhub@flowkraftagency.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Mot de passe d'application (16 caractères)
SMTP_FROM="SalonHub - FlowKraft Agency" <salonhub@flowkraftagency.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

#### Option 3️⃣ : Si FlowKraft utilise Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salonhub@flowkraftagency.com
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM="SalonHub - FlowKraft Agency" <salonhub@flowkraftagency.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

---

### 📨 Ce que verront les clients des salons

Quand un salon envoie un email à un client, le client verra :

```
De: SalonHub - FlowKraft Agency <salonhub@flowkraftagency.com>
À: client@example.com
Objet: ⏰ Rappel: Votre rendez-vous chez Beauty Lounge

Bonjour Marie,

Nous vous rappelons votre rendez-vous prévu le...
[contenu de l'email avec le nom du salon dans le message]

---
Beauty Lounge
Propulsé par SalonHub
```

**Important** :
- L'**expéditeur** est toujours `salonhub@flowkraftagency.com`
- Le **nom du salon** apparaît dans le **contenu** de l'email
- Si le client répond, la réponse ira vers `salonhub@flowkraftagency.com`

---

### 🔧 Configuration avancée : Reply-To

Si vous voulez que les clients puissent répondre directement au salon (et non à SalonHub), vous pouvez modifier le service email :

**Modification dans `src/services/emailService.js`** :

```javascript
// Ligne ~70, dans la méthode sendEmail()
const mailOptions = {
  from: from || process.env.SMTP_FROM || '"SalonHub" <noreply@salonhub.com>',
  to,
  subject,
  html,
  text: text || this.stripHtml(html),
  replyTo: salonEmail || process.env.SUPPORT_EMAIL  // ← AJOUTER CETTE LIGNE
};
```

Puis, passer l'email du salon dans les appels :

```javascript
await emailService.sendAppointmentReminder({
  to: appointment.client_email,
  firstName: appointment.client_first_name,
  // ... autres params
  salonEmail: appointment.salon_email  // ← Ajouter ceci
});
```

---

### 🧪 Test rapide de configuration

Créez un fichier `test-email.js` dans `salonhub-backend/` :

```javascript
require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmail() {
  console.log('🧪 Test de configuration email...\n');

  console.log('Configuration détectée :');
  console.log('- SMTP_HOST:', process.env.SMTP_HOST || '❌ Non configuré');
  console.log('- SMTP_PORT:', process.env.SMTP_PORT || '❌ Non configuré');
  console.log('- SMTP_USER:', process.env.SMTP_USER || '❌ Non configuré');
  console.log('- SMTP_FROM:', process.env.SMTP_FROM || '❌ Non configuré');
  console.log('');

  // Initialiser le service
  const initialized = await emailService.initialize();

  if (!initialized) {
    console.log('⚠️  Mode SIMULATION activé (pas de configuration SMTP)');
    console.log('Les emails seront loggés dans la console uniquement.\n');
  }

  // Envoyer un email de test
  console.log('📧 Envoi d\'un email de test...');

  try {
    const result = await emailService.sendEmail({
      to: 'VOTRE_EMAIL_TEST@gmail.com',  // ← MODIFIEZ ICI
      subject: '✅ Test SalonHub - Configuration Email',
      html: `
        <h1>Test réussi !</h1>
        <p>Si vous recevez cet email, votre configuration SMTP fonctionne correctement.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      `
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testEmail();
```

**Exécution** :
```bash
cd salonhub-backend
node test-email.js
```

**Résultats possibles** :

✅ **Configuration OK** :
```
✓ Service email initialisé avec succès
✅ Email envoyé avec succès !
Message ID: <...@...>
```

⚠️ **Mode simulation** :
```
⚠️  Configuration SMTP manquante - Les emails ne seront pas envoyés
📧 [SIMULATION] Email: { from: '...', to: '...', subject: '...' }
```

❌ **Erreur de configuration** :
```
❌ Erreur lors de l'initialisation du service email: Invalid login
```
→ Vérifier les credentials dans `.env`

---

### 📋 Checklist de configuration

- [ ] Créer/accéder à l'email `salonhub@flowkraftagency.com`
- [ ] Obtenir les credentials SMTP (host, port, user, password)
- [ ] Ajouter les variables dans `.env` de production
- [ ] Redémarrer le serveur backend
- [ ] Exécuter `node test-email.js` pour tester
- [ ] Créer un compte test et vérifier l'email de bienvenue
- [ ] Tester un rappel de rendez-vous

---

### 🚨 Important pour la production

#### Éviter les spams

Pour que vos emails n'arrivent pas en spam, configurez les enregistrements DNS :

**SPF Record** pour `flowkraftagency.com` :
```
v=spf1 include:_spf.google.com ~all
```
(Si vous utilisez Gmail/Google Workspace)

**DKIM** : Activé automatiquement si vous utilisez Google Workspace ou Office 365

**DMARC** :
```
v=DMARC1; p=none; rua=mailto:admin@flowkraftagency.com
```

→ Ces configurations se font dans votre registrar de domaine (ex: OVH, Namecheap, etc.)

---

### 🎯 Résumé

1. **UN SEUL compte email** : `salonhub@flowkraftagency.com`
2. **UN SEUL fournisseur SMTP** : Celui de flowkraftagency.com (Gmail, Office 365, ou serveur privé)
3. **Tous les salons** utilisent le même expéditeur
4. **C'est normal** et professionnel (comme toutes les plateformes SaaS)

---

**Besoin d'aide ?**
- Email : support@flowkraftagency.com
- Documentation complète : [EMAIL_SETUP.md](./EMAIL_SETUP.md)

---

**FlowKraft Agency - SalonHub**
Dernière mise à jour : 2025-11-18
