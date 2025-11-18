# 📧 Configuration de l'envoi d'emails - SalonHub

Ce document explique comment configurer l'envoi d'emails dans SalonHub en utilisant Nodemailer.

## 📋 Vue d'ensemble

SalonHub utilise **Nodemailer** pour envoyer des emails professionnels aux utilisateurs. Le système d'emails fonctionne en deux modes :

- **Mode simulation** : Si la configuration SMTP n'est pas fournie, les emails sont loggés dans la console
- **Mode production** : Avec une configuration SMTP valide, les emails sont réellement envoyés

## 🎯 Fonctionnalités email disponibles

### 1. Email de bienvenue
Envoyé automatiquement lors de l'inscription d'un nouveau salon.

**Template** : `emailService.sendWelcomeEmail()`
- Confirmation de l'essai gratuit 14 jours
- Lien vers la plateforme
- Guide de démarrage
- Informations de contact support

### 2. Rappel de rendez-vous
Envoyé manuellement ou automatiquement avant un rendez-vous.

**Template** : `emailService.sendAppointmentReminder()`
- Rappel de la date et heure
- Nom du service
- Informations du salon

### 3. Confirmation de rendez-vous
Envoyé après la création d'un nouveau rendez-vous.

**Template** : `emailService.sendAppointmentConfirmation()`
- Confirmation de réservation
- Détails complets du RDV
- Prix du service

### 4. Notifications personnalisées
Envoi d'emails personnalisés aux clients.

**Template** : `emailService.sendEmail()`
- Sujet et contenu personnalisables
- Support HTML

## ⚙️ Configuration SMTP

### Option 1 : Gmail (pour le développement)

1. **Créer un mot de passe d'application Google** :
   - Aller sur [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Activer la validation en deux étapes
   - Générer un "Mot de passe d'application"

2. **Ajouter dans `.env`** :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application
SMTP_FROM="SalonHub" <noreply@salonhub.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

### Option 2 : SendGrid (recommandé pour la production)

1. **Créer un compte SendGrid** : [https://sendgrid.com](https://sendgrid.com)
2. **Créer une API Key** dans les paramètres
3. **Ajouter dans `.env`** :
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=votre_sendgrid_api_key
SMTP_FROM="SalonHub" <noreply@votre-domaine.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

### Option 3 : Mailgun

1. **Créer un compte Mailgun** : [https://mailgun.com](https://mailgun.com)
2. **Récupérer les credentials SMTP**
3. **Ajouter dans `.env`** :
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASSWORD=votre_password_mailgun
SMTP_FROM="SalonHub" <noreply@votre-domaine.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

### Option 4 : AWS SES

1. **Configurer SES** dans la console AWS
2. **Vérifier votre domaine ou email**
3. **Créer des credentials SMTP**
4. **Ajouter dans `.env`** :
```env
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_aws_smtp_username
SMTP_PASSWORD=votre_aws_smtp_password
SMTP_FROM="SalonHub" <noreply@votre-domaine.com>
SUPPORT_EMAIL=support@flowkraftagency.com
```

## 🔧 Variables d'environnement

| Variable | Description | Obligatoire | Exemple |
|----------|-------------|-------------|---------|
| `SMTP_HOST` | Serveur SMTP | Non* | smtp.gmail.com |
| `SMTP_PORT` | Port SMTP | Non* | 587 |
| `SMTP_SECURE` | Utiliser SSL (port 465) | Non | false |
| `SMTP_USER` | Nom d'utilisateur SMTP | Non* | user@gmail.com |
| `SMTP_PASSWORD` | Mot de passe SMTP | Non* | ************ |
| `SMTP_FROM` | Expéditeur par défaut | Non | "SalonHub" <noreply@...> |
| `SUPPORT_EMAIL` | Email de support | Non | support@flowkraftagency.com |

\* *Si ces variables ne sont pas définies, le système fonctionne en mode simulation*

## 🚀 Utilisation dans le code

### Initialisation automatique

Le service email s'initialise automatiquement au premier appel. Aucune configuration manuelle n'est nécessaire.

```javascript
const emailService = require('../services/emailService');

// Le service s'initialise automatiquement
await emailService.sendWelcomeEmail({
  to: 'client@example.com',
  firstName: 'Jean',
  tenantSlug: 'mon-salon'
});
```

### Envoyer un email personnalisé

```javascript
await emailService.sendEmail({
  to: 'client@example.com',
  subject: 'Votre promotion exclusive',
  html: '<h1>Bonjour !</h1><p>Profitez de -20% sur votre prochain RDV</p>',
  text: 'Version texte optionnelle'
});
```

### Gestion des erreurs

Le service gère automatiquement les erreurs sans bloquer l'application :

```javascript
// L'inscription continue même si l'email échoue
emailService.sendWelcomeEmail({...}).catch(error => {
  console.error('Erreur email:', error.message);
  // L'utilisateur est quand même créé
});
```

## 🧪 Tester la configuration

### 1. Tester depuis le serveur

Démarrez le serveur et surveillez les logs :

```bash
cd salonhub-backend
npm start
```

Créez un nouveau compte depuis le frontend et vérifiez :
- ✅ Les logs montrent "✓ Email envoyé" (mode production)
- ✅ Les logs montrent "📧 [SIMULATION] Email" (mode simulation)

### 2. Vérifier la connexion SMTP

Créez un fichier de test `test-email.js` :

```javascript
const emailService = require('./src/services/emailService');

async function test() {
  await emailService.initialize();

  const result = await emailService.sendEmail({
    to: 'votre-email-test@gmail.com',
    subject: 'Test SalonHub',
    html: '<h1>Test réussi !</h1>'
  });

  console.log('Résultat:', result);
}

test();
```

Exécutez :
```bash
node test-email.js
```

## 📊 Templates disponibles

### Template de bienvenue

**Fichier** : `emailService.js` → `sendWelcomeEmail()`

**Paramètres** :
- `to` : Email du destinataire
- `firstName` : Prénom de l'utilisateur
- `tenantSlug` : Slug du salon (pour construire l'URL)

**Design** :
- Header avec gradient violet
- Badge "Essai gratuit 14 jours"
- Liste des actions possibles
- Call-to-action vers la plateforme
- Section feedback
- Footer professionnel

### Template de rappel

**Fichier** : `emailService.js` → `sendAppointmentReminder()`

**Paramètres** :
- `to` : Email du client
- `firstName` : Prénom du client
- `appointmentDate` : Date formatée du RDV
- `appointmentTime` : Heure du RDV
- `serviceName` : Nom du service
- `salonName` : Nom du salon

**Design** :
- Header avec gradient rose
- Bloc d'informations du RDV
- Message de courtoisie

### Template de confirmation

**Fichier** : `emailService.js` → `sendAppointmentConfirmation()`

**Paramètres** :
- `to` : Email du client
- `firstName` : Prénom du client
- `appointmentDate` : Date formatée du RDV
- `appointmentTime` : Heure du RDV
- `serviceName` : Nom du service
- `salonName` : Nom du salon
- `price` : Prix du service (optionnel)

**Design** :
- Header avec gradient vert/bleu
- Récapitulatif complet de la réservation
- Mention du rappel à venir

## 🎨 Personnaliser les templates

Les templates sont directement dans `src/services/emailService.js`.

### Modifier les couleurs

```javascript
// Header gradient
style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"

// Bouton CTA
style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
```

### Ajouter votre logo

```html
<tr>
  <td style="padding: 20px; text-align: center;">
    <img src="https://votre-domaine.com/logo.png" alt="Logo" width="150">
  </td>
</tr>
```

### Modifier le footer

Cherchez la section `<!-- Footer -->` et modifiez le contenu.

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commit les credentials SMTP** dans `.env`
2. **Utiliser des mots de passe d'application** (pas le mot de passe principal)
3. **Limiter les permissions** des API keys
4. **Monitorer l'utilisation** pour détecter les abus
5. **Respecter les consentements** (RGPD) avant d'envoyer des emails marketing

### Gestion des consentements

Le système vérifie automatiquement les consentements avant l'envoi :

```javascript
// Dans notifications.js
if (appointment.client_email && appointment.email_marketing_consent) {
  // Email envoyé seulement si consentement = true
}
```

## 🐛 Dépannage

### Problème : Emails non envoyés (mode simulation)

**Cause** : Configuration SMTP manquante

**Solution** :
- Vérifier que les variables `SMTP_*` sont définies dans `.env`
- Redémarrer le serveur après modification de `.env`

### Problème : Erreur "Invalid login"

**Cause** : Credentials SMTP incorrects

**Solution** :
- Gmail : Vérifier que vous utilisez un mot de passe d'application
- Vérifier que la validation en 2 étapes est activée
- Vérifier les credentials dans `.env`

### Problème : Erreur "Connection timeout"

**Cause** : Port ou host incorrect

**Solution** :
- Vérifier `SMTP_HOST` et `SMTP_PORT`
- Port 587 : `SMTP_SECURE=false`
- Port 465 : `SMTP_SECURE=true`

### Problème : Emails dans les spams

**Cause** : Authentification domaine manquante

**Solution** :
- Configurer SPF, DKIM, DMARC pour votre domaine
- Utiliser un service professionnel (SendGrid, Mailgun)
- Utiliser un domaine vérifié

## 📈 Monitoring

### Logs d'emails

Les emails sont loggés automatiquement :

```bash
✓ Service email initialisé avec succès
✓ Email envoyé: <message-id> à client@example.com
❌ Erreur lors de l'envoi de l'email: Invalid login
📧 [SIMULATION] Email: { from: '...', to: '...', subject: '...' }
```

### Base de données

Tous les emails sont enregistrés dans la table `client_notifications` :

```sql
SELECT * FROM client_notifications
WHERE type = 'appointment_reminder'
AND status = 'sent'
ORDER BY created_at DESC;
```

## 🚀 Déploiement en production

### Checklist

- [ ] Configurer un fournisseur SMTP professionnel (SendGrid, Mailgun, SES)
- [ ] Ajouter les variables SMTP dans `.env` de production
- [ ] Vérifier votre domaine d'envoi (SPF, DKIM)
- [ ] Tester l'envoi d'emails depuis la production
- [ ] Monitorer les bounces et plaintes
- [ ] Configurer des alertes en cas d'échec d'envoi

### Recommandations

- **SendGrid** : Gratuit jusqu'à 100 emails/jour, facile à configurer
- **Mailgun** : Gratuit jusqu'à 5000 emails/mois, API puissante
- **AWS SES** : Très peu cher, nécessite configuration AWS
- **Gmail** : OK pour dev/test, **PAS pour la production**

## 🆘 Support

Pour toute question ou problème :

- Email : support@flowkraftagency.com
- Documentation Nodemailer : https://nodemailer.com
- Issues GitHub : [votre-repo]/issues

---

**Créé par FlowKraft Agency**
Dernière mise à jour : 2025-11-18
