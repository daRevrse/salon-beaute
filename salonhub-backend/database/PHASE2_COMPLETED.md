# Phase 2: Restaurant - Implémentation Complète ✅

**Date**: 2026-01-16
**Statut**: ✅ Terminée avec succès

---

## 📋 Récapitulatif

La Phase 2 ajoute le support complet pour les **restaurants** dans le système SalonHub. Les restaurants peuvent désormais gérer:
- Tables et plans de salle
- Menus avec informations diététiques (allergènes, végétarien, vegan, sans gluten)
- Commandes avec gestion financière complète
- Réservations de tables via le système de rendez-vous existant

---

## 🗄️ Base de Données

### Tables créées

#### 1. `restaurant_tables`
Tables physiques du restaurant avec gestion de disponibilité.

```sql
- id: INT(11) PRIMARY KEY
- tenant_id: INT(11) - Isolation multi-tenant
- table_number: VARCHAR(20) - Numéro de table
- table_name: VARCHAR(100) - Nom optionnel (ex: "Terrasse 1")
- capacity: TINYINT UNSIGNED - Nombre de places
- section: VARCHAR(50) - Zone/section (ex: "Terrasse", "Salle principale")
- is_available: TINYINT(1) - Disponibilité temps réel
- is_active: TINYINT(1) - Active/Inactive
- created_at, updated_at
```

**Index**: `tenant_id`, `(tenant_id, is_available, is_active)`, `UNIQUE (tenant_id, table_number, section)`

#### 2. `restaurant_menus`
Carte du restaurant avec informations nutritionnelles et allergènes.

```sql
- id: INT(11) PRIMARY KEY
- tenant_id: INT(11)
- name: VARCHAR(200) - Nom du plat
- description: TEXT - Description
- category: VARCHAR(100) - Catégorie (Entrées, Plats, Desserts, etc.)
- price: DECIMAL(10,2) - Prix
- allergens: TEXT - JSON array des allergènes
- is_vegetarian: TINYINT(1)
- is_vegan: TINYINT(1)
- is_gluten_free: TINYINT(1)
- is_available: TINYINT(1) - Disponibilité (rupture de stock)
- is_active: TINYINT(1)
- image_url: VARCHAR(500)
- display_order: INT(11) - Ordre d'affichage
- created_at, updated_at
```

**Index**: `tenant_id`, `(tenant_id, category, is_active)`, `(tenant_id, is_available)`

#### 3. `restaurant_orders`
Commandes avec suivi financier complet.

```sql
- id: INT(11) PRIMARY KEY
- tenant_id: INT(11)
- order_number: VARCHAR(50) - Numéro unique de commande
- table_id: INT(11) NULL - Table associée
- client_id: INT(11) NULL - Client si connu
- staff_id: INT(11) NULL - Serveur/Staff
- appointment_id: INT(11) NULL - Lien avec réservation
- order_type: ENUM('dine_in', 'takeaway', 'delivery')
- guest_count: TINYINT UNSIGNED - Nombre de convives
- subtotal: DECIMAL(10,2) - Sous-total
- tax_amount: DECIMAL(10,2) - Taxes
- tip_amount: DECIMAL(10,2) - Pourboire
- discount_amount: DECIMAL(10,2) - Remises
- total_amount: DECIMAL(10,2) - Total final
- status: ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')
- payment_status: ENUM('unpaid', 'partial', 'paid', 'refunded')
- payment_method: ENUM('cash', 'card', 'mobile', 'other')
- notes: TEXT
- order_date: DATE
- order_time: TIME
- completed_at: TIMESTAMP NULL
- created_at, updated_at
```

**Index**: `tenant_id`, `(tenant_id, order_date, order_time)`, `(tenant_id, status)`, `(table_id, status)`, `UNIQUE (tenant_id, order_number)`

#### 4. `restaurant_order_items`
Lignes de commande (items individuels).

```sql
- id: INT(11) PRIMARY KEY
- tenant_id: INT(11)
- order_id: INT(11) - Commande parente
- menu_item_id: INT(11) NULL - Item du menu
- menu_item_name: VARCHAR(200) - Nom (snapshot)
- quantity: SMALLINT UNSIGNED - Quantité
- unit_price: DECIMAL(10,2) - Prix unitaire (snapshot)
- subtotal: DECIMAL(10,2) - Sous-total (qty * prix)
- status: ENUM('ordered', 'preparing', 'ready', 'served', 'cancelled')
- special_instructions: TEXT - Instructions spéciales
- created_at, updated_at
```

**Index**: `order_id`, `tenant_id`

### Extension table `appointments`

Ajout de 3 colonnes pour gérer les réservations de tables:

```sql
- table_id: INT(11) NULL - Table réservée
- guest_count: TINYINT UNSIGNED NULL - Nombre de convives
- special_requests: TEXT NULL - Demandes spéciales
```

**FK**: `table_id` → `restaurant_tables(id)` ON DELETE SET NULL
**Index**: `(table_id, appointment_date, start_time)`

---

## 🛣️ Routes API

### Base: `/api/restaurant`

Toutes les routes nécessitent:
- `authMiddleware` - Authentification JWT
- `tenantMiddleware` - Isolation multi-tenant
- `businessTypeMiddleware` - Injection du type de business
- `requireBusinessType('restaurant')` - Accès réservé aux restaurants

### Tables (`/api/restaurant/tables`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste toutes les tables du restaurant |
| GET | `/:id` | Détails d'une table spécifique |
| POST | `/` | Créer une nouvelle table |
| PUT | `/:id` | Mettre à jour une table |
| PATCH | `/:id/availability` | Toggle disponibilité (rapide) |
| DELETE | `/:id` | Supprimer une table |

**Exemple création**:
```json
POST /api/restaurant/tables
{
  "table_number": "T01",
  "table_name": "Table terrasse 1",
  "capacity": 4,
  "section": "Terrasse"
}
```

### Menus (`/api/restaurant/menus`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste tous les items (avec filtres) |
| GET | `/meta/categories` | Liste des catégories uniques |
| GET | `/:id` | Détails d'un item |
| POST | `/` | Créer un item de menu |
| PUT | `/:id` | Mettre à jour un item |
| PATCH | `/:id/availability` | Toggle disponibilité |
| DELETE | `/:id` | Supprimer un item |

**Query params**:
- `category` - Filtrer par catégorie
- `available` - Filtrer par disponibilité (true/false)
- `vegetarian` - Filtrer végétarien (true/false)
- `vegan` - Filtrer vegan (true/false)
- `gluten_free` - Filtrer sans gluten (true/false)

**Exemple création**:
```json
POST /api/restaurant/menus
{
  "name": "Salade César",
  "description": "Salade verte, poulet grillé, parmesan, croûtons, sauce césar",
  "category": "Entrées",
  "price": 12.50,
  "allergens": ["gluten", "dairy", "eggs"],
  "is_vegetarian": false,
  "is_vegan": false,
  "is_gluten_free": false,
  "image_url": "/uploads/menus/caesar-salad.jpg"
}
```

### Commandes (`/api/restaurant/orders`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste toutes les commandes (avec filtres) |
| GET | `/:id` | Détails d'une commande avec items |
| POST | `/` | Créer une nouvelle commande |
| PUT | `/:id` | Mettre à jour une commande |
| PATCH | `/:id/status` | Changer le statut |
| PATCH | `/:id/payment-status` | Mettre à jour statut paiement |
| DELETE | `/:id` | Annuler une commande |

**Query params**:
- `status` - Filtrer par statut
- `payment_status` - Filtrer par statut paiement
- `table_id` - Filtrer par table
- `date` - Filtrer par date (YYYY-MM-DD)

**Exemple création** (calculs automatiques):
```json
POST /api/restaurant/orders
{
  "table_id": 5,
  "order_type": "dine_in",
  "guest_count": 4,
  "items": [
    {
      "menu_item_id": 12,
      "quantity": 2,
      "special_instructions": "Sans oignons"
    },
    {
      "menu_item_id": 8,
      "quantity": 1
    }
  ],
  "tip_amount": 5.00,
  "notes": "Anniversaire - prévoir bougie"
}
```

**Réponse** (calculs effectués):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 42,
      "order_number": "ORD-20260116-042",
      "subtotal": 45.50,      // Calculé automatiquement
      "tax_amount": 4.55,     // 10% du subtotal
      "tip_amount": 5.00,
      "total_amount": 55.05,  // subtotal + tax + tip
      "status": "pending",
      "payment_status": "unpaid",
      ...
    },
    "items": [...]
  }
}
```

---

## 🔐 Middleware & Sécurité

### 1. `businessTypeMiddleware` (`src/middleware/businessType.js`)

Injecte automatiquement le `business_type` du tenant dans `req.businessType`.

```javascript
const businessTypeMiddleware = async (req, res, next) => {
  // Requête SQL pour récupérer business_type
  req.businessType = tenant.business_type; // 'beauty', 'restaurant', etc.
  next();
};
```

### 2. `requireBusinessType(types)`

Restreint l'accès aux routes selon le type de business.

```javascript
const requireBusinessType = (allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.businessType)) {
      return res.status(403).json({
        error: 'Cette fonctionnalité est réservée aux restaurants'
      });
    }
    next();
  };
};
```

**Utilisation**:
```javascript
router.get('/',
  authMiddleware,
  tenantMiddleware,
  businessTypeMiddleware,
  requireBusinessType('restaurant'),  // Bloque si pas restaurant
  async (req, res) => { ... }
);
```

### 3. Helper `isBusinessType(type, types)`

Pour logique conditionnelle dans le code.

```javascript
if (isBusinessType(req.businessType, ['restaurant', 'training'])) {
  // Logique spécifique restaurant/formation
}
```

---

## 📝 Fichiers Modifiés

### Backend

1. **`src/server.js`**
   - Ajout: `app.use('/api/restaurant', require('./routes/restaurant'))`

2. **`src/routes/auth.js`**
   - Ajout du paramètre `business_type` dans `/register`
   - Retour de `business_type` dans `/login` et `/me`

### Nouveaux Fichiers

1. **`src/middleware/businessType.js`** - Middleware de détection/restriction business type
2. **`src/routes/restaurant/index.js`** - Router principal restaurant
3. **`src/routes/restaurant/tables.js`** - CRUD tables
4. **`src/routes/restaurant/menus.js`** - CRUD menus
5. **`src/routes/restaurant/orders.js`** - CRUD commandes
6. **`database/migrations/001_add_business_type.sql`** - Migration business_type
7. **`database/migrations/001_add_business_type_safe.sql`** - Version safe avec checks
8. **`database/migrations/002_restaurant_tables.sql`** - Migration tables restaurant
9. **`database/INSTALL_FINAL_NO_CHECKS.sql`** - ✅ Script d'installation final (utilisé)

---

## ✅ Tests de Validation

### 1. Test de connexion

```bash
curl http://localhost:5000/health
```

**Attendu**: `{ "status": "OK", ... }`

### 2. Test création tenant restaurant

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Le Gourmet",
    "business_type": "restaurant",
    "owner_name": "Jean Dupont",
    "email": "jean@legourmet.fr",
    "password": "SecurePass123!"
  }'
```

### 3. Test accès routes restaurant (avec token)

```bash
curl http://localhost:5000/api/restaurant/tables \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Attendu**: Liste des tables (vide si nouveau restaurant)

### 4. Test restriction business_type

Si vous êtes un salon de beauté et tentez d'accéder à `/api/restaurant/tables`:

**Attendu**: `403 Forbidden` avec message explicite

---

## 🚀 Prochaines Étapes

### Phase 3: Training (Formations)
- Tables: `training_courses`, `training_sessions`, `training_enrollments`, `training_certificates`
- Support des formations en ligne et présentielles
- Gestion des formateurs et étudiants
- Certification et suivi de progression

### Phase 4: Medical (Médical)
- Tables: `medical_patients`, `medical_records`, `medical_prescriptions`, `medical_appointments`
- Dossiers médicaux sécurisés
- Historique médical
- Conformité HIPAA/RGPD renforcée

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs serveur: `npm run dev` (mode développement)
2. Vérifier la base de données: les 4 tables `restaurant_*` doivent exister
3. Vérifier que `tenants.business_type` = `'restaurant'` pour le tenant testé

---

## 📚 Documentation Technique

### Architecture

```
┌─────────────────────────────────────────────┐
│           Client (Frontend/Mobile)          │
└─────────────────┬───────────────────────────┘
                  │ HTTP/JWT
┌─────────────────▼───────────────────────────┐
│           authMiddleware (JWT)              │
│           tenantMiddleware (req.tenantId)   │
│           businessTypeMiddleware            │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │ requireBusinessType│
        │   ('restaurant')   │
        └─────────┬──────────┘
                  │
    ┌─────────────▼─────────────┐
    │    Restaurant Routes      │
    │  - tables.js              │
    │  - menus.js               │
    │  - orders.js              │
    └─────────────┬─────────────┘
                  │
    ┌─────────────▼─────────────┐
    │      MySQL Database       │
    │  - restaurant_tables      │
    │  - restaurant_menus       │
    │  - restaurant_orders      │
    │  - restaurant_order_items │
    └───────────────────────────┘
```

### Flux de Commande

1. **Client crée commande** → POST `/api/restaurant/orders`
2. **Backend récupère les items** du menu avec prix actuels
3. **Backend calcule automatiquement**:
   - `subtotal` = Σ(quantity × unit_price)
   - `tax_amount` = subtotal × 0.10 (10%)
   - `total_amount` = subtotal + tax_amount + tip_amount - discount_amount
4. **Backend génère** `order_number` unique (format: `ORD-YYYYMMDD-XXX`)
5. **Backend insère** commande + items dans une transaction
6. **Backend retourne** commande complète avec items

### Gestion des Snapshots

Les prix et noms sont "snapshottés" dans `restaurant_order_items`:
- `menu_item_name` - Nom du plat au moment de la commande
- `unit_price` - Prix au moment de la commande

**Avantage**: Si le menu change plus tard, les anciennes commandes restent exactes.

---

**Date de finalisation**: 2026-01-16
**Développeur**: Assistant Claude
**Version**: 1.0.0
