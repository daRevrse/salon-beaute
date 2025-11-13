# Système de Notifications - Guide Complet

## 🎯 Objectif

Permettre aux clients de **choisir leur moyen de notification préféré** lors de la réservation en ligne, pour que le salon puisse les contacter efficacement pour confirmer leur rendez-vous.

---

## ✅ Ce qui a été implémenté

### 1. Migration de la base de données

**Fichier** : [salonhub-backend/database/add_notification_preference.sql](salonhub-backend/database/add_notification_preference.sql)

**Modification :**
```sql
ALTER TABLE clients
ADD COLUMN preferred_contact_method ENUM('email', 'sms', 'whatsapp', 'phone') DEFAULT 'email'
COMMENT 'Moyen de contact préféré pour les notifications'
AFTER phone;
```

### 2. Frontend - Formulaire de réservation

**Fichier modifié** : [salonhub-frontend/src/pages/public/BookingClientInfo.js](salonhub-frontend/src/pages/public/BookingClientInfo.js)

**Ajouts :**
- Section "Comment souhaitez-vous être notifié ?" avec 4 options :
  - 📧 **Email** (par défaut)
  - 💬 **SMS**
  - 📱 **WhatsApp**
  - 📞 **Téléphone**
- Interface visuelle avec des cartes cliquables
- Sélection exclusive (un seul moyen à la fois)
- Sauvegarde du choix avec le rendez-vous

### 3. Backend - Sauvegarde du choix

**Fichier modifié** : [salonhub-backend/src/routes/public.js](salonhub-backend/src/routes/public.js)

**Modifications :**
- Accepte le paramètre `preferred_contact_method` dans la requête POST
- Sauvegarde dans la table `clients` lors de la création
- Met à jour si le client existe déjà
- Valeur par défaut : `email`

### 4. Page de confirmation

**Fichier modifié** : [salonhub-frontend/src/pages/public/BookingConfirmation.js](salonhub-frontend/src/pages/public/BookingConfirmation.js)

**Ajout :**
- Affichage du moyen de contact choisi dans le message de confirmation
- Message personnalisé : "Vous serez contacté par [Email/SMS/WhatsApp/Téléphone] pour confirmation"

---

## 🔄 Workflow complet

### Étape 1 : Le client réserve en ligne

1. Visite `/book/[slug-salon]`
2. Sélectionne un service
3. Choisit une date et un créneau
4. Remplit le formulaire avec ses informations
5. **Choisit son moyen de notification préféré** parmi les 4 options

### Étape 2 : Sauvegarde en base de données

Le backend enregistre :
```sql
INSERT INTO clients (
  tenant_id,
  first_name,
  last_name,
  email,
  phone,
  preferred_contact_method
) VALUES (
  1,
  'Jean',
  'Dupont',
  'jean@example.com',
  '0612345678',
  'whatsapp'  -- Choix du client
);
```

### Étape 3 : Confirmation client

Page de confirmation affiche :
> ✅ Rendez-vous enregistré !
> Votre rendez-vous sera validé par le salon dans les plus brefs délais.
> Vous serez contacté par **📱 WhatsApp** pour confirmation.

### Étape 4 : Le salon valide le RDV

1. Le salon se connecte au dashboard (`/appointments`)
2. Voit les RDV en attente (statut "pending")
3. Voit le moyen de contact préféré du client
4. Contacte le client via le moyen choisi
5. Valide ou refuse le RDV dans l'interface admin

---

## 📊 Structure des données

### Table clients

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| id | INT | ID unique | 1 |
| tenant_id | INT | ID du salon | 3 |
| first_name | VARCHAR(100) | Prénom | Jean |
| last_name | VARCHAR(100) | Nom | Dupont |
| email | VARCHAR(255) | Email (optionnel) | jean@example.com |
| phone | VARCHAR(20) | Téléphone | 0612345678 |
| **preferred_contact_method** | **ENUM** | **Moyen préféré** | **whatsapp** |
| created_at | TIMESTAMP | Date création | 2025-11-13 10:30:00 |

### Valeurs possibles pour preferred_contact_method

| Valeur | Label affiché | Icône | Usage |
|--------|---------------|-------|-------|
| `email` | Email | 📧 | Notification par email |
| `sms` | SMS | 💬 | Notification par SMS |
| `whatsapp` | WhatsApp | 📱 | Notification via WhatsApp |
| `phone` | Téléphone | 📞 | Appel téléphonique |

---

## 🔧 Installation de la migration

### Méthode 1 : Via MySQL CLI

```bash
mysql -u root -p salonhub_dev < salonhub-backend/database/add_notification_preference.sql
```

### Méthode 2 : Via phpMyAdmin ou autre outil

1. Ouvrir phpMyAdmin
2. Sélectionner la base `salonhub_dev`
3. Aller dans l'onglet "SQL"
4. Copier-coller le contenu du fichier `add_notification_preference.sql`
5. Cliquer sur "Exécuter"

### Méthode 3 : Directement en SQL

```sql
USE salonhub_dev;

ALTER TABLE clients
ADD COLUMN preferred_contact_method ENUM('email', 'sms', 'whatsapp', 'phone') DEFAULT 'email'
COMMENT 'Moyen de contact préféré pour les notifications'
AFTER phone;
```

---

## 🧪 Tester le système

### 1. Appliquer la migration

```bash
cd salonhub-backend/database
mysql -u root -p salonhub_dev < add_notification_preference.sql
```

**Vérifier que la colonne a été ajoutée :**
```sql
DESCRIBE clients;

-- Devrait afficher :
-- | Field                    | Type                                    |
-- |--------------------------|------------------------------------------|
-- | ...                      | ...                                     |
-- | phone                    | varchar(20)                             |
-- | preferred_contact_method | enum('email','sms','whatsapp','phone')  |
-- | ...                      | ...                                     |
```

### 2. Tester la réservation

1. Aller sur `http://localhost:3000/book/[slug-salon]`
2. Sélectionner un service
3. Choisir une date et un créneau
4. Remplir le formulaire
5. **Cliquer sur l'option de notification** (ex: WhatsApp)
6. Confirmer la réservation

### 3. Vérifier en base de données

```sql
-- Voir le dernier client créé avec son choix
SELECT
  id,
  first_name,
  last_name,
  phone,
  email,
  preferred_contact_method
FROM clients
ORDER BY created_at DESC
LIMIT 1;

-- Résultat attendu :
-- | id | first_name | last_name | phone      | email              | preferred_contact_method |
-- |----|------------|-----------|------------|--------------------|--------------------------|
-- | 5  | Jean       | Dupont    | 0612345678 | jean@example.com   | whatsapp                 |
```

### 4. Vérifier dans l'interface admin

1. Se connecter au dashboard
2. Aller dans "Rendez-vous"
3. Voir le RDV en attente
4. Le moyen de contact préféré devrait être affiché

---

## 💡 Utilisation côté salon

### Afficher le moyen de contact dans la liste des RDV

Dans [Appointments.js](salonhub-frontend/src/pages/Appointments.js), vous pouvez afficher le moyen préféré :

```javascript
// Exemple d'affichage dans le tableau
<td>
  {appointment.client_preferred_contact_method === 'email' && '📧 Email'}
  {appointment.client_preferred_contact_method === 'sms' && '💬 SMS'}
  {appointment.client_preferred_contact_method === 'whatsapp' && '📱 WhatsApp'}
  {appointment.client_preferred_contact_method === 'phone' && '📞 Téléphone'}
</td>
```

### Filtrer les RDV par moyen de contact

Vous pouvez ajouter un filtre pour voir tous les clients qui préfèrent WhatsApp par exemple :

```sql
SELECT
  a.id,
  a.appointment_date,
  a.start_time,
  c.first_name,
  c.last_name,
  c.phone,
  c.preferred_contact_method
FROM appointments a
JOIN clients c ON a.client_id = c.id
WHERE a.tenant_id = 1
  AND a.status = 'pending'
  AND c.preferred_contact_method = 'whatsapp'
ORDER BY a.appointment_date, a.start_time;
```

---

## 🚀 Prochaines étapes : Implémentation des notifications

### Phase 1 : Notifications manuelles (Actuel)

Le salon voit le moyen préféré et contacte manuellement le client.

### Phase 2 : Notifications automatiques (À venir)

#### Email
- Utiliser un service comme **SendGrid**, **Mailgun** ou **Nodemailer**
- Template d'email de confirmation
- Envoi automatique après création du RDV

#### SMS
- Utiliser **Twilio**, **Vonage** ou équivalent
- Message court avec détails du RDV
- Envoi automatique

#### WhatsApp
- Utiliser **Twilio WhatsApp API** ou **WhatsApp Business API**
- Message via WhatsApp
- Template pré-approuvé

#### Téléphone
- Rappel manuel par le salon
- Possibilité d'automatiser avec Twilio Voice (appel automatique)

---

## 📝 Exemple de requête API

### Créer un RDV avec choix de notification

```bash
curl -X POST http://localhost:5000/api/public/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "salon_slug": "salon-test",
    "first_name": "Marie",
    "last_name": "Martin",
    "phone": "0623456789",
    "email": "marie@example.com",
    "service_id": 2,
    "appointment_date": "2025-11-20",
    "start_time": "14:00:00",
    "notes": "Première visite",
    "preferred_contact_method": "whatsapp"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "appointment": {
    "id": 10,
    "appointment_date": "2025-11-20",
    "start_time": "14:00:00",
    "end_time": "15:00:00",
    "status": "pending",
    "client_first_name": "Marie",
    "client_last_name": "Martin",
    "client_phone": "0623456789",
    "service_name": "Coupe Femme",
    ...
  },
  "message": "Votre rendez-vous a été enregistré avec succès..."
}
```

---

## 🎨 Personnalisation de l'interface

### Modifier les options disponibles

Dans [BookingClientInfo.js](salonhub-frontend/src/pages/public/BookingClientInfo.js), vous pouvez :

1. **Retirer une option** (ex: téléphone) en supprimant le bouton correspondant
2. **Changer l'option par défaut** :
```javascript
const [formData, setFormData] = useState({
  // ...
  preferred_contact_method: 'whatsapp' // Au lieu de 'email'
});
```

3. **Ajouter une description** pour chaque option

---

## ✨ Résumé

✅ Le client **choisit son moyen de notification** lors de la réservation
✅ Le choix est **sauvegardé en base** (colonne `preferred_contact_method`)
✅ Le salon **voit le moyen préféré** dans le dashboard
✅ Le système **affiche le choix** sur la page de confirmation
✅ Prêt pour **intégration future** avec services de notification automatique

**Prochaine étape :** Implémenter les notifications automatiques via API (Email, SMS, WhatsApp) ! 📬
