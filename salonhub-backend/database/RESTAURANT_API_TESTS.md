# Tests API Restaurant - Guide Complet

Ce document contient des exemples de requêtes pour tester toutes les fonctionnalités restaurant.

---

## 🔧 Configuration

### Variables d'environnement
```bash
export API_URL="http://localhost:5000"
export TOKEN="votre_jwt_token_ici"
```

### Obtenir un token JWT

#### 1. Créer un compte restaurant
```bash
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Le Petit Gourmet",
    "business_type": "restaurant",
    "owner_name": "Pierre Durand",
    "email": "pierre@petitgourmet.fr",
    "password": "SecurePass123!",
    "phone": "+33612345678",
    "address": "123 Rue de la Gastronomie, Paris"
  }'
```

**Réponse**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "tenant": {
    "id": 15,
    "business_name": "Le Petit Gourmet",
    "business_type": "restaurant",
    ...
  }
}
```

#### 2. Se connecter (si compte existe déjà)
```bash
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pierre@petitgourmet.fr",
    "password": "SecurePass123!"
  }'
```

**Récupérez le `token` de la réponse et utilisez-le dans toutes les requêtes suivantes.**

---

## 🪑 Tables Restaurant

### Liste des tables
```bash
curl -X GET $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN"
```

### Créer une table
```bash
curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_number": "T01",
    "table_name": "Table Terrasse 1",
    "capacity": 4,
    "section": "Terrasse"
  }'
```

### Créer plusieurs tables (exemples)
```bash
# Terrasse
curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "T02", "table_name": "Table Terrasse 2", "capacity": 2, "section": "Terrasse"}'

curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "T03", "table_name": "Table Terrasse 3", "capacity": 6, "section": "Terrasse"}'

# Salle principale
curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "S01", "table_name": "Table Salle 1", "capacity": 4, "section": "Salle principale"}'

curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "S02", "table_name": "Table Salle 2", "capacity": 2, "section": "Salle principale"}'

# Bar
curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "B01", "table_name": "Bar 1", "capacity": 1, "section": "Bar"}'
```

### Détails d'une table
```bash
curl -X GET $API_URL/api/restaurant/tables/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Mettre à jour une table
```bash
curl -X PUT $API_URL/api/restaurant/tables/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "Grande Table Terrasse",
    "capacity": 8
  }'
```

### Toggle disponibilité d'une table
```bash
# Rendre indisponible
curl -X PATCH $API_URL/api/restaurant/tables/1/availability \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_available": false}'

# Rendre disponible
curl -X PATCH $API_URL/api/restaurant/tables/1/availability \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_available": true}'
```

### Supprimer une table
```bash
curl -X DELETE $API_URL/api/restaurant/tables/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🍽️ Menu

### Liste des items du menu
```bash
# Tous les items
curl -X GET $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN"

# Filtrer par catégorie
curl -X GET "$API_URL/api/restaurant/menus?category=Entrées" \
  -H "Authorization: Bearer $TOKEN"

# Items végétariens
curl -X GET "$API_URL/api/restaurant/menus?vegetarian=true" \
  -H "Authorization: Bearer $TOKEN"

# Items disponibles uniquement
curl -X GET "$API_URL/api/restaurant/menus?available=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Liste des catégories
```bash
curl -X GET $API_URL/api/restaurant/menus/meta/categories \
  -H "Authorization: Bearer $TOKEN"
```

### Créer des items de menu

#### Entrées
```bash
curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salade César",
    "description": "Salade verte, poulet grillé, parmesan, croûtons, sauce césar",
    "category": "Entrées",
    "price": 12.50,
    "allergens": "[\"gluten\", \"dairy\", \"eggs\"]",
    "is_vegetarian": false,
    "is_vegan": false,
    "is_gluten_free": false
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Soupe du Jour",
    "description": "Soupe maison préparée avec des légumes frais de saison",
    "category": "Entrées",
    "price": 8.00,
    "allergens": "[]",
    "is_vegetarian": true,
    "is_vegan": true,
    "is_gluten_free": true
  }'
```

#### Plats
```bash
curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Steak Frites",
    "description": "Entrecôte grillée 300g, frites maison, sauce au poivre",
    "category": "Plats",
    "price": 24.00,
    "allergens": "[\"dairy\"]",
    "is_vegetarian": false,
    "is_vegan": false,
    "is_gluten_free": true
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pâtes Carbonara",
    "description": "Spaghetti, crème, lardons, parmesan, jaune d'\''œuf",
    "category": "Plats",
    "price": 16.50,
    "allergens": "[\"gluten\", \"dairy\", \"eggs\"]",
    "is_vegetarian": false,
    "is_vegan": false,
    "is_gluten_free": false
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Buddha Bowl Vegan",
    "description": "Quinoa, légumes rôtis, avocat, houmous, graines",
    "category": "Plats",
    "price": 18.00,
    "allergens": "[\"sesame\"]",
    "is_vegetarian": true,
    "is_vegan": true,
    "is_gluten_free": true
  }'
```

#### Desserts
```bash
curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tiramisu Maison",
    "description": "Mascarpone, biscuits, café, cacao",
    "category": "Desserts",
    "price": 8.50,
    "allergens": "[\"gluten\", \"dairy\", \"eggs\"]",
    "is_vegetarian": true,
    "is_vegan": false,
    "is_gluten_free": false
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tarte Tatin",
    "description": "Tarte aux pommes caramélisées, boule de glace vanille",
    "category": "Desserts",
    "price": 9.00,
    "allergens": "[\"gluten\", \"dairy\", \"eggs\"]",
    "is_vegetarian": true,
    "is_vegan": false,
    "is_gluten_free": false
  }'
```

#### Boissons
```bash
curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vin Rouge - Bordeaux",
    "description": "Verre de Bordeaux AOC",
    "category": "Boissons",
    "price": 6.50,
    "allergens": "[\"sulfites\"]",
    "is_vegetarian": true,
    "is_vegan": false,
    "is_gluten_free": true
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca-Cola",
    "description": "33cl",
    "category": "Boissons",
    "price": 3.50,
    "allergens": "[]",
    "is_vegetarian": true,
    "is_vegan": true,
    "is_gluten_free": true
  }'
```

### Détails d'un item
```bash
curl -X GET $API_URL/api/restaurant/menus/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Mettre à jour un item
```bash
curl -X PUT $API_URL/api/restaurant/menus/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salade César Royale",
    "price": 14.50,
    "description": "Salade verte, poulet grillé, parmesan, croûtons, œuf poché, sauce césar maison"
  }'
```

### Toggle disponibilité (rupture de stock)
```bash
# Marquer indisponible
curl -X PATCH $API_URL/api/restaurant/menus/1/availability \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_available": false}'

# Remettre disponible
curl -X PATCH $API_URL/api/restaurant/menus/1/availability \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_available": true}'
```

### Supprimer un item
```bash
curl -X DELETE $API_URL/api/restaurant/menus/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧾 Commandes

### Liste des commandes
```bash
# Toutes les commandes
curl -X GET $API_URL/api/restaurant/orders \
  -H "Authorization: Bearer $TOKEN"

# Filtrer par statut
curl -X GET "$API_URL/api/restaurant/orders?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# Commandes d'une table spécifique
curl -X GET "$API_URL/api/restaurant/orders?table_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Commandes du jour
curl -X GET "$API_URL/api/restaurant/orders?date=2026-01-16" \
  -H "Authorization: Bearer $TOKEN"

# Commandes impayées
curl -X GET "$API_URL/api/restaurant/orders?payment_status=unpaid" \
  -H "Authorization: Bearer $TOKEN"
```

### Créer une commande

**Important**: Les calculs (subtotal, tax, total) sont automatiques!

```bash
# Commande simple
curl -X POST $API_URL/api/restaurant/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "order_type": "dine_in",
    "guest_count": 2,
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 1,
        "special_instructions": "Sans croûtons"
      },
      {
        "menu_item_id": 3,
        "quantity": 1
      },
      {
        "menu_item_id": 7,
        "quantity": 2
      }
    ],
    "notes": "Client régulier - VIP"
  }'
```

```bash
# Commande avec pourboire
curl -X POST $API_URL/api/restaurant/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 2,
    "order_type": "dine_in",
    "guest_count": 4,
    "items": [
      {"menu_item_id": 2, "quantity": 2},
      {"menu_item_id": 4, "quantity": 2},
      {"menu_item_id": 5, "quantity": 1},
      {"menu_item_id": 8, "quantity": 4}
    ],
    "tip_amount": 10.00,
    "notes": "Anniversaire - prévoir bougie sur le dessert"
  }'
```

```bash
# Commande à emporter
curl -X POST $API_URL/api/restaurant/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "takeaway",
    "guest_count": 1,
    "items": [
      {"menu_item_id": 3, "quantity": 1},
      {"menu_item_id": 9, "quantity": 1}
    ],
    "notes": "À préparer pour 19h30"
  }'
```

**Réponse exemple**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 12,
      "order_number": "ORD-20260116-012",
      "table_id": 1,
      "order_type": "dine_in",
      "guest_count": 2,
      "subtotal": 37.00,
      "tax_amount": 3.70,
      "tip_amount": 0.00,
      "discount_amount": 0.00,
      "total_amount": 40.70,
      "status": "pending",
      "payment_status": "unpaid",
      "order_date": "2026-01-16",
      "order_time": "19:45:23",
      ...
    },
    "items": [
      {
        "id": 45,
        "menu_item_id": 1,
        "menu_item_name": "Salade César",
        "quantity": 1,
        "unit_price": 12.50,
        "subtotal": 12.50,
        "status": "ordered",
        "special_instructions": "Sans croûtons"
      },
      ...
    ]
  }
}
```

### Détails d'une commande
```bash
curl -X GET $API_URL/api/restaurant/orders/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Mettre à jour une commande
```bash
curl -X PUT $API_URL/api/restaurant/orders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discount_amount": 5.00,
    "notes": "Remise fidélité appliquée"
  }'
```

### Changer le statut d'une commande
```bash
# Confirmer
curl -X PATCH $API_URL/api/restaurant/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'

# En préparation
curl -X PATCH $API_URL/api/restaurant/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing"}'

# Prête
curl -X PATCH $API_URL/api/restaurant/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'

# Servie
curl -X PATCH $API_URL/api/restaurant/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "served"}'

# Terminée
curl -X PATCH $API_URL/api/restaurant/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Mettre à jour le statut de paiement
```bash
# Paiement partiel
curl -X PATCH $API_URL/api/restaurant/orders/1/payment-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "partial",
    "payment_method": "card"
  }'

# Payée
curl -X PATCH $API_URL/api/restaurant/orders/1/payment-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "paid",
    "payment_method": "cash"
  }'
```

### Annuler une commande
```bash
curl -X DELETE $API_URL/api/restaurant/orders/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Scénarios de Test Complets

### Scénario 1: Setup Initial d'un Restaurant

```bash
# 1. Créer le compte
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Chez Antoine",
    "business_type": "restaurant",
    "owner_name": "Antoine Martin",
    "email": "antoine@chezantoine.fr",
    "password": "SecurePass123!"
  }'

# Récupérer le TOKEN de la réponse

# 2. Créer 3 tables
curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "1", "capacity": 4, "section": "Principale"}'

curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "2", "capacity": 2, "section": "Principale"}'

curl -X POST $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "3", "capacity": 6, "section": "Terrasse"}'

# 3. Ajouter 3 plats au menu
curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger Maison",
    "category": "Plats",
    "price": 15.00,
    "allergens": "[\"gluten\", \"dairy\"]"
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita",
    "category": "Plats",
    "price": 12.00,
    "allergens": "[\"gluten\", \"dairy\"]"
  }'

curl -X POST $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tarte au Citron",
    "category": "Desserts",
    "price": 7.00,
    "allergens": "[\"gluten\", \"dairy\", \"eggs\"]"
  }'

# 4. Vérifier la configuration
curl -X GET $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $TOKEN"

curl -X GET $API_URL/api/restaurant/menus \
  -H "Authorization: Bearer $TOKEN"
```

### Scénario 2: Service d'une Table

```bash
# 1. Client arrive à la table 1
# 2. Prendre la commande
curl -X POST $API_URL/api/restaurant/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "order_type": "dine_in",
    "guest_count": 2,
    "items": [
      {"menu_item_id": 1, "quantity": 2},
      {"menu_item_id": 3, "quantity": 1}
    ]
  }'

# Récupérer l'ID de la commande (par exemple: 5)

# 3. Confirmer la commande
curl -X PATCH $API_URL/api/restaurant/orders/5/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'

# 4. Cuisine prépare
curl -X PATCH $API_URL/api/restaurant/orders/5/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing"}'

# 5. Plats prêts
curl -X PATCH $API_URL/api/restaurant/orders/5/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'

# 6. Plats servis
curl -X PATCH $API_URL/api/restaurant/orders/5/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "served"}'

# 7. Client paie
curl -X PATCH $API_URL/api/restaurant/orders/5/payment-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "paid",
    "payment_method": "card"
  }'

# 8. Terminer la commande
curl -X PATCH $API_URL/api/restaurant/orders/5/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

---

## 🔍 Vérifications

### Vérifier que business_type est bien "restaurant"
```bash
curl -X GET $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Cherchez dans la réponse:
```json
{
  "tenant": {
    "business_type": "restaurant"  // ← Doit être "restaurant"
  }
}
```

### Test d'accès refusé (salon de beauté)

Créez un compte salon:
```bash
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Beauty Salon",
    "business_type": "beauty",
    "owner_name": "Marie Dubois",
    "email": "marie@beautysalon.fr",
    "password": "SecurePass123!"
  }'
```

Essayez d'accéder aux routes restaurant avec ce token:
```bash
curl -X GET $API_URL/api/restaurant/tables \
  -H "Authorization: Bearer $BEAUTY_TOKEN"
```

**Attendu**: `403 Forbidden`
```json
{
  "success": false,
  "error": "Access Denied",
  "message": "This feature is only available for restaurant businesses"
}
```

---

## 📊 Collection Postman

Pour importer dans Postman, créez une collection avec:

**Variables**:
- `base_url`: `http://localhost:5000`
- `token`: (votre JWT)

Et créez des dossiers:
- 🔐 Auth (Register, Login)
- 🪑 Tables (CRUD + Toggle)
- 🍽️ Menus (CRUD + Toggle + Filters)
- 🧾 Orders (CRUD + Status + Payment)

---

**Bon testing!** 🚀
