# 🎁 Système de Promotions - Documentation Complète

## 📋 Vue d'ensemble

Le système de promotions de SalonHub permet de créer, gérer et appliquer des codes promotionnels pour attirer de nouveaux clients et récompenser les clients fidèles.

---

## ✅ Fonctionnalités Implémentées

### 1. Gestion des Promotions (Admin/Owner)

**Page** : [/promotions](salonhub-frontend/src/pages/Promotions.js)

- ✅ Création de codes promo
- ✅ Modification des promotions existantes
- ✅ Activation/Désactivation rapide
- ✅ Suppression de promotions
- ✅ Filtrage (toutes/actives/expirées)
- ✅ Statistiques en temps réel :
  - Total de promotions
  - Promotions actives
  - Nombre total d'utilisations
  - Montant total des réductions accordées

### 2. Validation de Codes Promo (Public)

**Composant** : [PromoCodeInput.js](salonhub-frontend/src/components/common/PromoCodeInput.js)

- ✅ Champ de saisie avec validation en temps réel
- ✅ Affichage du montant de réduction
- ✅ Affichage du prix final après réduction
- ✅ Possibilité de retirer le code appliqué
- ✅ Messages d'erreur clairs

### 3. Application lors de la Réservation

**Intégré dans** : [BookingClientInfo.js](salonhub-frontend/src/pages/public/BookingClientInfo.js:524-531)

- ✅ Champ code promo avant confirmation
- ✅ Prix barré quand promo appliquée
- ✅ Nouveau prix en vert
- ✅ Enregistrement automatique de l'utilisation

---

## 🗄️ Base de Données

### Tables Créées

#### 1. `promotions`
Stockage des codes promo et leurs règles

```sql
CREATE TABLE promotions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,           -- Ex: "BIENVENUE20"
  title VARCHAR(255) NOT NULL,         -- Titre descriptif
  description TEXT,                    -- Description complète

  discount_type ENUM('percentage', 'fixed_amount', 'service_discount'),
  discount_value DECIMAL(10,2) NOT NULL,

  applies_to ENUM('all_services', 'specific_services', 'categories'),
  service_ids JSON NULL,

  min_purchase_amount DECIMAL(10,2) NULL,
  max_discount_amount DECIMAL(10,2) NULL,
  usage_limit INT NULL,
  usage_per_client INT DEFAULT 1,

  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,

  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_code_per_tenant (tenant_id, code),
  INDEX idx_tenant (tenant_id),
  INDEX idx_active (is_active),
  INDEX idx_dates (valid_from, valid_until),
  INDEX idx_code (code)
);
```

#### 2. `promotion_usages`
Historique des utilisations de codes promo

```sql
CREATE TABLE promotion_usages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  promotion_id INT NOT NULL,
  client_id INT NOT NULL,
  appointment_id INT NULL,

  discount_amount DECIMAL(10,2) NOT NULL,
  order_amount DECIMAL(10,2) NOT NULL,

  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant (tenant_id),
  INDEX idx_promotion (promotion_id),
  INDEX idx_client (client_id),
  INDEX idx_used_at (used_at)
);
```

#### 3. `marketing_campaigns`
Campagnes marketing (future fonctionnalité)

```sql
CREATE TABLE marketing_campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  image_url VARCHAR(500) NULL,

  campaign_type ENUM('promotion', 'announcement', 'event', 'newsletter'),
  promotion_id INT NULL,

  target_audience ENUM('all_clients', 'active_clients', 'inactive_clients', 'vip_clients', 'custom'),
  custom_client_ids JSON NULL,

  send_via_email BOOLEAN DEFAULT FALSE,
  send_via_sms BOOLEAN DEFAULT FALSE,
  send_via_whatsapp BOOLEAN DEFAULT FALSE,

  scheduled_for DATETIME NULL,
  sent_at DATETIME NULL,

  total_recipients INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  whatsapp_sent INT DEFAULT 0,

  status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') DEFAULT 'draft',

  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Script d'Installation

Exécuter : `node setup-promotions-db.js`

Ce script :
- ✅ Crée les 3 tables
- ✅ Insère 4 promotions de test
- ✅ Gère les erreurs proprement

---

## 🔌 API Backend

### Routes Protégées (Admin/Owner)

**Base** : `/api/promotions`

#### GET `/api/promotions`
Liste toutes les promotions du salon

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "BIENVENUE20",
      "title": "Bienvenue !",
      "discount_type": "percentage",
      "discount_value": 20.00,
      "is_active": true,
      "total_usages": 5,
      ...
    }
  ]
}
```

#### POST `/api/promotions`
Créer une nouvelle promotion

**Body** :
```json
{
  "code": "NOEL2024",
  "title": "Offre de Noël",
  "description": "20% sur tous les services",
  "discount_type": "percentage",
  "discount_value": 20,
  "applies_to": "all_services",
  "min_purchase_amount": 30,
  "usage_limit": 100,
  "usage_per_client": 1,
  "valid_from": "2024-12-01",
  "valid_until": "2024-12-31",
  "is_active": true,
  "is_public": true
}
```

#### PUT `/api/promotions/:id`
Modifier une promotion existante

#### DELETE `/api/promotions/:id`
Supprimer une promotion

#### GET `/api/promotions/:id`
Détails d'une promotion + historique des utilisations

#### GET `/api/promotions/stats/summary`
Statistiques globales

**Response** :
```json
{
  "success": true,
  "data": {
    "total_promotions": 10,
    "active_promotions": 6,
    "total_usages": 45,
    "total_discounts_given": 234.50
  }
}
```

### Routes Publiques (Sans Auth)

#### POST `/api/promotions/validate`
Valider un code promo

**Body** :
```json
{
  "code": "BIENVENUE20",
  "service_id": 5,
  "amount": 50.00,
  "client_id": 12
}
```

**Response** (Succès) :
```json
{
  "success": true,
  "data": {
    "code": "BIENVENUE20",
    "title": "Bienvenue !",
    "discount_type": "percentage",
    "discount_value": 20.00,
    "discount_amount": 10.00,
    "final_amount": 40.00
  }
}
```

**Response** (Erreur) :
```json
{
  "success": false,
  "error": "Code promo invalide ou expiré"
}
```

#### POST `/api/promotions/use`
Enregistrer l'utilisation d'un code promo

**Body** :
```json
{
  "code": "BIENVENUE20",
  "client_id": 12,
  "appointment_id": 45,
  "order_amount": 50.00,
  "discount_amount": 10.00
}
```

---

## 🎨 Frontend

### Pages

#### 1. /promotions (Admin)
- Accessible uniquement aux Admins et Owners
- Interface complète de gestion CRUD
- Statistiques en temps réel
- Filtres et recherche

#### 2. /book/:slug/info (Public)
- Champ de code promo intégré
- Validation en temps réel
- Affichage du prix ajusté

### Composants

#### PromoCodeInput
```jsx
<PromoCodeInput
  onValidate={handleValidatePromoCode}
  currentAmount={service.price}
  clientId={clientId}
/>
```

**Props** :
- `onValidate(code)` : Fonction de validation (doit appeler l'API)
- `currentAmount` : Montant actuel du service
- `clientId` : ID du client (optionnel)

**États** :
- Validation en cours
- Code validé avec succès
- Erreur de validation

---

## 🔄 Flux Complet

### Création d'une Promotion

1. Admin/Owner va sur `/promotions`
2. Clique sur "Nouvelle promotion"
3. Remplit le formulaire modal
4. Enregistre → API POST `/api/promotions`
5. La promotion apparaît dans la liste

### Utilisation par un Client

1. Client réserve un service public
2. Arrive sur la page `/book/:slug/info`
3. Entre un code promo (ex: `BIENVENUE20`)
4. Click "Appliquer" → API POST `/api/promotions/validate`
5. Si valide :
   - Prix barré affiché
   - Nouveau prix en vert
6. Confirme la réservation
7. Backend enregistre l'utilisation dans `promotion_usages`

---

## 📊 Règles de Validation

Le backend vérifie automatiquement :

✅ **Code existant** : Le code existe dans la BDD
✅ **Actif** : `is_active = TRUE`
✅ **Période** : `NOW() BETWEEN valid_from AND valid_until`
✅ **Limite globale** : `total_usages < usage_limit`
✅ **Limite par client** : Client n'a pas dépassé `usage_per_client`
✅ **Montant minimum** : `amount >= min_purchase_amount`
✅ **Service applicable** : Si `applies_to = 'specific_services'`, vérifier `service_id`

---

## 🎯 Exemples de Promotions

### 1. Promotion de Bienvenue
```json
{
  "code": "BIENVENUE20",
  "title": "Offre de Bienvenue",
  "discount_type": "percentage",
  "discount_value": 20,
  "applies_to": "all_services",
  "usage_per_client": 1,
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31"
}
```

### 2. Réduction Fixe
```json
{
  "code": "COUPE10",
  "title": "10€ de réduction",
  "discount_type": "fixed_amount",
  "discount_value": 10.00,
  "applies_to": "specific_services",
  "service_ids": [1, 2, 5],
  "min_purchase_amount": 30.00,
  "valid_from": "2025-01-01",
  "valid_until": "2025-06-30"
}
```

### 3. Promotion VIP (Privée)
```json
{
  "code": "VIP50",
  "title": "Offre VIP - 50%",
  "discount_type": "percentage",
  "discount_value": 50,
  "applies_to": "all_services",
  "usage_limit": 20,
  "is_public": false,
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31"
}
```

---

## 🧪 Tests

### Promotions de Test Disponibles

Après `node setup-promotions-db.js` :

| Code | Type | Réduction | Validité | Statut |
|------|------|-----------|----------|--------|
| **BIENVENUE20** | Pourcentage | -20% | Jusqu'au 31/12/2025 | ✅ Actif |
| **NOEL2024** | Pourcentage | -15% | Expiré (31/12/2024) | ❌ Expiré |
| **COUPE10** | Fixe | -10€ | Jusqu'au 30/06/2025 | ✅ Actif |
| **VIP50** | Pourcentage | -50% | Jusqu'au 31/12/2025 | 🔒 Privé |

### Scénarios de Test

#### Test 1 : Code Valide
1. Aller sur la page de réservation
2. Sélectionner un service à 50€
3. Entrer `BIENVENUE20`
4. ✅ Vérifier : Prix passe à 40€ (-20%)

#### Test 2 : Code Expiré
1. Entrer `NOEL2024`
2. ❌ Vérifier : Message "Code promo expiré"

#### Test 3 : Code Invalide
1. Entrer `FAKE123`
2. ❌ Vérifier : Message "Code promo invalide"

#### Test 4 : Gestion Admin
1. Se connecter en tant qu'Owner
2. Aller sur `/promotions`
3. Créer une nouvelle promo
4. ✅ Vérifier : Promo apparaît dans la liste
5. Désactiver la promo
6. ✅ Vérifier : Badge "Inactive"

---

## 📈 Statistiques et Analytics

### Dashboard Promotions

Affiche en temps réel :
- **Total Promotions** : Nombre total de codes créés
- **Actives** : Promotions valides et actives
- **Utilisations** : Nombre total de fois où les codes ont été utilisés
- **Réductions** : Montant total des réductions accordées

### Historique des Utilisations

Accessible via GET `/api/promotions/:id` :
- Qui a utilisé le code ?
- Quand ?
- Pour quel montant ?
- Quelle réduction appliquée ?

---

## 🔐 Permissions

| Fonctionnalité | Staff | Admin | Owner |
|----------------|-------|-------|-------|
| Voir promotions | ❌ | ✅ | ✅ |
| Créer promo | ❌ | ✅ | ✅ |
| Modifier promo | ❌ | ✅ | ✅ |
| Supprimer promo | ❌ | ✅ | ✅ |
| Statistiques | ❌ | ✅ | ✅ |
| Utiliser code (public) | ✅ | ✅ | ✅ |

---

## 🚀 Prochaines Étapes Possibles

### Fonctionnalités Futures

1. **Campagnes Marketing**
   - Envoyer des codes promo par email/SMS
   - Cibler des segments de clients
   - Planifier l'envoi

2. **Codes Uniques**
   - Générer des codes à usage unique
   - Codes personnalisés par client

3. **A/B Testing**
   - Comparer l'efficacité de différentes promos
   - Analytics avancées

4. **Promotions Automatiques**
   - Client fidèle : -10% au 5ème RDV
   - Anniversaire : -20%
   - Parrainage : -15% pour les deux

5. **Promotions sur Catégories**
   - -20% sur toutes les coupes
   - -15% sur les colorations

---

## 📝 Fichiers Modifiés

### Frontend

- ✅ [App.js](salonhub-frontend/src/App.js:22,90-96) - Route `/promotions`
- ✅ [Navbar.js](salonhub-frontend/src/components/common/Navbar.js:68-72) - Lien menu
- ✅ [Promotions.js](salonhub-frontend/src/pages/Promotions.js) - Page CRUD complète
- ✅ [PromoCodeInput.js](salonhub-frontend/src/components/common/PromoCodeInput.js) - Composant réutilisable
- ✅ [BookingClientInfo.js](salonhub-frontend/src/pages/public/BookingClientInfo.js:524-531) - Intégration

### Backend

- ✅ [promotions.js](salonhub-backend/src/routes/promotions.js) - Routes API (8 endpoints)
- ✅ [public.js](salonhub-backend/src/routes/public.js:338-530) - Gestion promo lors de réservation
- ✅ [server.js](salonhub-backend/src/server.js) - Enregistrement route promotions
- ✅ [promotions.sql](salonhub-backend/database/promotions.sql) - Schéma BDD

### Scripts

- ✅ [setup-promotions-db.js](setup-promotions-db.js) - Installation BDD

### Documentation

- ✅ [PROMOTIONS_SYSTEM_GUIDE.md](PROMOTIONS_SYSTEM_GUIDE.md) - Guide technique
- ✅ [WHATSAPP_INTEGRATION_GUIDE.md](WHATSAPP_INTEGRATION_GUIDE.md) - WhatsApp Business
- ✅ Ce fichier - Documentation complète

---

## ✨ Points Forts du Système

✅ **Multi-tenant** : Chaque salon a ses propres promotions
✅ **Sécurisé** : Validation côté serveur obligatoire
✅ **Flexible** : Pourcentage ou montant fixe
✅ **Traçable** : Historique complet des utilisations
✅ **Performant** : Index optimisés sur les requêtes fréquentes
✅ **User-friendly** : Interface intuitive admin et public
✅ **En temps réel** : Statistiques live
✅ **RGPD-friendly** : Codes publics ou privés

---

**Date** : 18 Novembre 2025
**Version** : 1.0
**Auteur** : FlowKraft Agency
**Statut** : ✅ Production Ready
