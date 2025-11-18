# Guide Complet du Système de Promotions

## Vue d'ensemble

Système complet de gestion des promotions comprenant :
- 🎫 **Codes promo** (pourcentage ou montant fixe)
- 📢 **Campagnes marketing** (email, SMS, WhatsApp)
- 📊 **Statistiques** et suivi des utilisations
- 🎯 **Ciblage client** personnalisé

---

## 📋 Tables de Base de Données

### Table `promotions`

Stocke tous les codes promo et offres spéciales.

**Champs principaux** :
```sql
- id: Identifiant unique
- tenant_id: ID du salon
- code: Code promo (ex: NOEL2024, BIENVENUE20)
- title: Titre de la promotion
- description: Description détaillée

-- Type de réduction
- discount_type: 'percentage' | 'fixed_amount' | 'service_discount'
- discount_value: Valeur (20 pour 20%, ou 10.00 pour 10€)

-- Applicabilité
- applies_to: 'all_services' | 'specific_services' | 'categories'
- service_ids: JSON des IDs de services (si specific_services)

-- Conditions
- min_purchase_amount: Montant minimum d'achat
- max_discount_amount: Montant maximum de réduction
- usage_limit: Nombre max d'utilisations total
- usage_per_client: Nombre d'utilisations par client (défaut: 1)

-- Période
- valid_from: Date de début
- valid_until: Date de fin

-- Visibilité
- is_active: Actif/Inactif
- is_public: Visible sur la page de réservation publique
```

### Table `promotion_usages`

Enregistre chaque utilisation de code promo.

```sql
- id: Identifiant unique
- tenant_id: ID du salon
- promotion_id: ID de la promotion
- client_id: ID du client
- appointment_id: ID du RDV (nullable)
- discount_amount: Montant de la réduction appliquée
- order_amount: Montant total de la commande
- used_at: Date et heure d'utilisation
```

### Table `marketing_campaigns`

Gère les campagnes marketing et annonces.

```sql
- id: Identifiant unique
- tenant_id: ID du salon
- title: Titre de la campagne
- message: Message à envoyer
- image_url: URL de l'image (nullable)

-- Type
- campaign_type: 'promotion' | 'announcement' | 'event' | 'newsletter'
- promotion_id: ID de la promo associée (nullable)

-- Ciblage
- target_audience: 'all_clients' | 'active_clients' | 'inactive_clients' | 'vip_clients' | 'custom'
- custom_client_ids: JSON des IDs clients (si custom)

-- Canaux
- send_via_email: Envoyer par email
- send_via_sms: Envoyer par SMS
- send_via_whatsapp: Envoyer par WhatsApp

-- Planification
- scheduled_for: Date d'envoi planifiée
- sent_at: Date d'envoi réelle

-- Statistiques
- total_recipients: Nombre de destinataires
- emails_sent, sms_sent, whatsapp_sent: Nombre envoyé par canal

-- Statut
- status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
```

---

## 🔧 Installation

### Étape 1 : Créer les tables

```bash
# Se connecter à MySQL
mysql -u root -p salonhub_dev

# Exécuter le script SQL
source /chemin/vers/salonhub-backend/database/promotions.sql
```

Ou via Node.js :
```bash
cd salonhub-backend
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'votre_password',
    database: 'salonhub_dev'
  });

  const sql = fs.readFileSync('./database/promotions.sql', 'utf8');
  await connection.query(sql);
  console.log('✅ Tables créées !');
  await connection.end();
})();
"
```

### Étape 2 : Route déjà activée

La route `/api/promotions` est déjà enregistrée dans `server.js` ✅

### Étape 3 : Redémarrer le serveur

```bash
cd salonhub-backend
npm run dev
```

---

## 📡 API Endpoints

### 1. Liste des Promotions

**GET** `/api/promotions`

**Query params** (optionnels) :
- `active_only=true` : Uniquement les promotions actives et non expirées
- `public_only=true` : Uniquement les promotions publiques

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "BIENVENUE20",
      "title": "Bienvenue !",
      "description": "20% de réduction sur votre première visite",
      "discount_type": "percentage",
      "discount_value": 20.00,
      "applies_to": "all_services",
      "min_purchase_amount": null,
      "max_discount_amount": null,
      "usage_limit": null,
      "usage_per_client": 1,
      "valid_from": "2025-01-01T00:00:00.000Z",
      "valid_until": "2025-12-31T23:59:59.000Z",
      "is_active": true,
      "is_public": true,
      "total_usages": 15,
      "created_by_name": "Sophie",
      "created_by_lastname": "Martin"
    }
  ]
}
```

### 2. Détails d'une Promotion

**GET** `/api/promotions/:id`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "BIENVENUE20",
    "title": "Bienvenue !",
    ... (tous les champs),
    "usages": [
      {
        "id": 1,
        "client_id": 5,
        "client_first_name": "Marie",
        "client_last_name": "Dupont",
        "discount_amount": 10.00,
        "order_amount": 50.00,
        "used_at": "2025-11-15T14:30:00.000Z"
      }
    ]
  }
}
```

### 3. Créer une Promotion

**POST** `/api/promotions`

**Body** :
```json
{
  "code": "NOEL2024",
  "title": "Offre Noël 2024",
  "description": "15% sur tous les services",
  "discount_type": "percentage",
  "discount_value": 15,
  "applies_to": "all_services",
  "min_purchase_amount": null,
  "max_discount_amount": 50,
  "usage_limit": 100,
  "usage_per_client": 1,
  "valid_from": "2024-12-01",
  "valid_until": "2024-12-31",
  "is_active": true,
  "is_public": true
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Promotion créée avec succès",
  "data": {
    "id": 5
  }
}
```

### 4. Modifier une Promotion

**PUT** `/api/promotions/:id`

**Body** : (champs à modifier uniquement)
```json
{
  "discount_value": 20,
  "valid_until": "2025-01-15"
}
```

### 5. Supprimer une Promotion

**DELETE** `/api/promotions/:id`

### 6. Valider un Code Promo

**POST** `/api/promotions/validate`

**Body** :
```json
{
  "code": "BIENVENUE20",
  "client_id": 5,
  "order_amount": 50.00,
  "service_ids": [1, 3]
}
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "promotion_id": 1,
    "code": "BIENVENUE20",
    "title": "Bienvenue !",
    "discount_type": "percentage",
    "discount_value": 20,
    "discount_amount": 10.00,
    "final_amount": 40.00
  }
}
```

**Erreurs possibles** :
```json
// Code invalide
{
  "success": false,
  "error": "Code promo invalide ou expiré"
}

// Montant minimum non atteint
{
  "success": false,
  "error": "Montant minimum de 30€ requis"
}

// Déjà utilisé
{
  "success": false,
  "error": "Vous avez déjà utilisé ce code promo"
}

// Limite atteinte
{
  "success": false,
  "error": "Ce code promo a atteint sa limite d'utilisation"
}
```

### 7. Enregistrer l'Utilisation

**POST** `/api/promotions/use`

**Body** :
```json
{
  "promotion_id": 1,
  "client_id": 5,
  "appointment_id": 42,
  "discount_amount": 10.00,
  "order_amount": 50.00
}
```

### 8. Statistiques

**GET** `/api/promotions/stats/summary`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "total_promotions": 5,
    "active_promotions": 3,
    "total_usages": 127,
    "total_discounts_given": 1250.50
  }
}
```

---

## 💻 Exemples d'Utilisation

### Exemple 1 : Promotion 20% sur tous les services

```javascript
const promo = {
  code: "BIENVENUE20",
  title: "Bienvenue chez nous !",
  description: "20% de réduction sur votre première visite",
  discount_type: "percentage",
  discount_value: 20,
  applies_to: "all_services",
  usage_per_client: 1,
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  is_active: true,
  is_public: true
};

const response = await api.post('/promotions', promo);
```

### Exemple 2 : Réduction de 10€ sur services spécifiques

```javascript
const promo = {
  code: "COUPE10",
  title: "10€ de réduction sur les coupes",
  discount_type: "fixed_amount",
  discount_value: 10,
  applies_to: "specific_services",
  service_ids: [1, 2, 5], // IDs des services de coupe
  min_purchase_amount: 20, // Minimum 20€
  valid_from: "2025-01-01",
  valid_until: "2025-06-30",
  is_active: true,
  is_public: true
};
```

### Exemple 3 : Offre VIP limitée

```javascript
const promo = {
  code: "VIP50",
  title: "Offre VIP - 50% sur le 5ème RDV",
  discount_type: "percentage",
  discount_value: 50,
  applies_to: "all_services",
  usage_limit: 50, // Maximum 50 utilisations total
  usage_per_client: 1,
  max_discount_amount: 30, // Max 30€ de réduction
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  is_active: true,
  is_public: false // Code privé
};
```

### Exemple 4 : Validation dans le frontend

```javascript
// Lors de la réservation
const validatePromoCode = async (code) => {
  try {
    const response = await api.post('/promotions/validate', {
      code: code,
      client_id: currentClient.id,
      order_amount: totalAmount,
      service_ids: selectedServices.map(s => s.id)
    });

    if (response.data.success) {
      const { discount_amount, final_amount } = response.data.data;

      // Appliquer la réduction
      setDiscount(discount_amount);
      setTotal(final_amount);

      alert(`Code promo appliqué ! Réduction de ${discount_amount}€`);
    }
  } catch (error) {
    alert(error.response.data.error);
  }
};
```

### Exemple 5 : Enregistrer l'utilisation après paiement

```javascript
// Après confirmation du RDV
const savePromoUsage = async () => {
  if (appliedPromo) {
    await api.post('/promotions/use', {
      promotion_id: appliedPromo.promotion_id,
      client_id: client.id,
      appointment_id: newAppointment.id,
      discount_amount: appliedDiscount,
      order_amount: totalAmount
    });
  }
};
```

---

## 🎨 Interface Frontend (À Créer)

### Page de Gestion des Promotions

**Emplacement** : `/promotions`

**Fonctionnalités** :
- ✅ Liste des promotions actives/inactives
- ✅ Créer une nouvelle promotion
- ✅ Modifier une promotion
- ✅ Activer/Désactiver
- ✅ Supprimer
- ✅ Voir les statistiques d'utilisation
- ✅ Historique des utilisations

**Composants nécessaires** :
1. `PromotionsList.js` - Liste des promotions
2. `PromotionForm.js` - Formulaire de création/édition
3. `PromotionCard.js` - Carte d'affichage d'une promo
4. `PromotionStats.js` - Statistiques
5. `PromoCodeInput.js` - Champ de saisie code promo (réservation)

### Intégration dans la Réservation Publique

**Page** : `/book/:slug`

```jsx
<PromoCodeInput
  onValidate={(code) => validatePromoCode(code)}
  currentAmount={totalAmount}
/>
```

---

## 📊 Cas d'Usage Courants

### 1. Promotion de Bienvenue
```
Code: BIENVENUE20
Réduction: 20%
Applicable: Tous les services
Usage: 1 fois par client
Public: Oui
```

### 2. Offre Saisonnière
```
Code: NOEL2024
Réduction: 15%
Applicable: Tous les services
Période: 01/12/2024 - 31/12/2024
Public: Oui
```

### 3. Promotion Fidélité
```
Code: FIDELE10
Réduction: 10€
Applicable: Tous les services
Minimum: 30€
Usage: 5 fois par client
Public: Non (envoyé par email)
```

### 4. Flash Sale
```
Code: FLASH50
Réduction: 50%
Applicable: Services spécifiques
Limite: 20 utilisations
Période: 1 journée
Public: Oui
```

---

## 🔐 Permissions

### Owner
- ✅ Créer, modifier, supprimer des promotions
- ✅ Voir les statistiques
- ✅ Envoyer des campagnes marketing

### Admin
- ✅ Créer, modifier des promotions
- ✅ Voir les statistiques
- ✅ Envoyer des campagnes marketing

### Staff
- ✅ Appliquer un code promo lors d'une réservation
- ❌ Créer/modifier des promotions
- ❌ Voir les statistiques

---

## ✅ Checklist d'Implémentation

### Backend ✅
- [x] Tables créées (`promotions.sql`)
- [x] Routes API créées (`promotions.js`)
- [x] Route enregistrée dans `server.js`
- [ ] Tests des endpoints

### Frontend (À faire)
- [ ] Page de gestion des promotions (`/promotions`)
- [ ] Composant `PromotionsList`
- [ ] Composant `PromotionForm`
- [ ] Composant `PromoCodeInput` (réservation publique)
- [ ] Intégration dans le process de réservation
- [ ] Statistiques dans le dashboard

### Marketing (À faire)
- [ ] Route campagnes marketing
- [ ] Système d'envoi en masse
- [ ] Templates d'emails/WhatsApp pour promos
- [ ] Planification d'envois

---

## 🚀 Prochaines Améliorations

1. **Promotions automatiques** : Appliquer automatiquement selon conditions
2. **Promotions par catégorie** : Par type de service (coupes, couleurs, etc.)
3. **Promotions Happy Hour** : Réductions par créneau horaire
4. **Programme de fidélité** : Points cumulés, récompenses
5. **Promotions de parrainage** : Réduction pour parrain et filleul
6. **A/B Testing** : Tester plusieurs versions de promotions
7. **Analytics avancées** : ROI, taux de conversion, etc.

---

**Date** : 2025-11-18
**Status** : ✅ Backend implémenté - Frontend à créer
**Version** : 1.0
