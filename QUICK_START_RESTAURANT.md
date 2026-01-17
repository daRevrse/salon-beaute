# 🚀 Quick Start - Restaurant (5 minutes)

## Prérequis
- ✅ Serveur backend démarré (`npm start` déjà lancé)
- ✅ Base de données migrée (tables restaurant créées)
- ✅ Port 5000 accessible

---

## Étape 1: Créer un Compte Restaurant (30 secondes)

Ouvrez un terminal et exécutez:

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"business_name\": \"Le Petit Bistrot\", \"business_type\": \"restaurant\", \"owner_name\": \"Jean Martin\", \"email\": \"jean@petitbistrot.fr\", \"password\": \"Test123456!\"}"
```

**Réponse attendue**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "tenant": {
    "id": 10,
    "business_type": "restaurant",
    ...
  }
}
```

📋 **COPIEZ LE TOKEN** de la réponse - vous en aurez besoin!

---

## Étape 2: Créer des Tables (1 minute)

Remplacez `VOTRE_TOKEN` par le token obtenu:

```bash
# Table 1
curl -X POST http://localhost:5000/api/restaurant/tables ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"table_number\": \"T01\", \"table_name\": \"Terrasse 1\", \"capacity\": 4, \"section\": \"Terrasse\"}"

# Table 2
curl -X POST http://localhost:5000/api/restaurant/tables ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"table_number\": \"S01\", \"table_name\": \"Salle 1\", \"capacity\": 2, \"section\": \"Salle principale\"}"

# Table 3
curl -X POST http://localhost:5000/api/restaurant/tables ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"table_number\": \"S02\", \"table_name\": \"Salle 2\", \"capacity\": 6, \"section\": \"Salle principale\"}"
```

### Vérifier les tables créées:
```bash
curl -X GET http://localhost:5000/api/restaurant/tables ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## Étape 3: Ajouter des Plats au Menu (1 minute)

```bash
# Entrée
curl -X POST http://localhost:5000/api/restaurant/menus ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Salade César\", \"description\": \"Salade, poulet, parmesan, croûtons\", \"category\": \"Entrées\", \"price\": 12.50, \"allergens\": \"[\\\"gluten\\\", \\\"dairy\\\"]\"}"

# Plat principal
curl -X POST http://localhost:5000/api/restaurant/menus ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Steak Frites\", \"description\": \"Entrecôte 300g, frites maison\", \"category\": \"Plats\", \"price\": 24.00, \"allergens\": \"[]\"}"

# Dessert
curl -X POST http://localhost:5000/api/restaurant/menus ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Tarte Tatin\", \"description\": \"Tarte aux pommes caramélisées\", \"category\": \"Desserts\", \"price\": 8.50, \"allergens\": \"[\\\"gluten\\\", \\\"dairy\\\", \\\"eggs\\\"]\"}"

# Boisson
curl -X POST http://localhost:5000/api/restaurant/menus ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Vin Rouge Bordeaux\", \"description\": \"Verre 15cl\", \"category\": \"Boissons\", \"price\": 6.50, \"allergens\": \"[\\\"sulfites\\\"]\"}"
```

### Vérifier le menu:
```bash
curl -X GET http://localhost:5000/api/restaurant/menus ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## Étape 4: Créer une Commande (1 minute)

**Important**: Notez les IDs des items de menu de l'étape précédente (1, 2, 3, 4...)

```bash
curl -X POST http://localhost:5000/api/restaurant/orders ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"table_id\": 1, \"order_type\": \"dine_in\", \"guest_count\": 2, \"items\": [{\"menu_item_id\": 1, \"quantity\": 1}, {\"menu_item_id\": 2, \"quantity\": 2}, {\"menu_item_id\": 3, \"quantity\": 1}], \"tip_amount\": 5.00, \"notes\": \"Client VIP\"}"
```

**Réponse attendue** (calculs automatiques):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORD-20260116-001",
      "table_id": 1,
      "subtotal": 69.00,      // 12.50 + (24.00 × 2) + 8.50
      "tax_amount": 6.90,     // 10% de 69.00
      "tip_amount": 5.00,
      "total_amount": 80.90,  // 69 + 6.90 + 5
      "status": "pending",
      "payment_status": "unpaid",
      ...
    },
    "items": [ ... ]
  }
}
```

### Vérifier les commandes:
```bash
curl -X GET http://localhost:5000/api/restaurant/orders ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## Étape 5: Gérer le Cycle de Vie d'une Commande (1 minute)

Remplacez `ORDER_ID` par l'ID de la commande créée (probablement 1):

### Confirmer la commande
```bash
curl -X PATCH http://localhost:5000/api/restaurant/orders/ORDER_ID/status ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"confirmed\"}"
```

### En préparation
```bash
curl -X PATCH http://localhost:5000/api/restaurant/orders/ORDER_ID/status ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"preparing\"}"
```

### Prête à servir
```bash
curl -X PATCH http://localhost:5000/api/restaurant/orders/ORDER_ID/status ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"ready\"}"
```

### Servie
```bash
curl -X PATCH http://localhost:5000/api/restaurant/orders/ORDER_ID/status ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"served\"}"
```

### Paiement
```bash
curl -X PATCH http://localhost:5000/api/restaurant/orders/ORDER_ID/payment-status ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"payment_status\": \"paid\", \"payment_method\": \"card\"}"
```

### Terminer
```bash
curl -X PATCH http://localhost:5000/api/restaurant/orders/ORDER_ID/status ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"completed\"}"
```

---

## ✅ Félicitations!

Vous avez testé avec succès:
- ✅ Création de compte restaurant
- ✅ Gestion des tables
- ✅ Gestion du menu
- ✅ Création de commandes avec calculs automatiques
- ✅ Cycle de vie complet d'une commande

---

## 🔍 Tests Avancés

### Filtrer le menu par catégorie
```bash
curl -X GET "http://localhost:5000/api/restaurant/menus?category=Plats" ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Voir les catégories disponibles
```bash
curl -X GET http://localhost:5000/api/restaurant/menus/meta/categories ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Filtrer les commandes par table
```bash
curl -X GET "http://localhost:5000/api/restaurant/orders?table_id=1" ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Voir les commandes en attente
```bash
curl -X GET "http://localhost:5000/api/restaurant/orders?status=pending" ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Rendre une table indisponible
```bash
curl -X PATCH http://localhost:5000/api/restaurant/tables/1/availability ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"is_available\": false}"
```

---

## 🛑 Test de Sécurité Multi-Secteur

### Créer un salon de beauté
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"business_name\": \"Beauty Salon\", \"business_type\": \"beauty\", \"owner_name\": \"Marie Dubois\", \"email\": \"marie@beautysalon.fr\", \"password\": \"Test123456!\"}"
```

### Essayer d'accéder aux routes restaurant avec le token du salon
```bash
curl -X GET http://localhost:5000/api/restaurant/tables ^
  -H "Authorization: Bearer TOKEN_DU_SALON"
```

**Résultat attendu**: `403 Forbidden`
```json
{
  "success": false,
  "error": "Access Denied",
  "message": "This feature is only available for restaurant businesses"
}
```

✅ **Parfait!** Le système bloque correctement les accès non autorisés.

---

## 📚 Documentation Complète

- **Architecture**: [MULTI_SECTOR_README.md](../MULTI_SECTOR_README.md)
- **Phase 2 Complète**: [PHASE2_COMPLETED.md](../salonhub-backend/database/PHASE2_COMPLETED.md)
- **Tests API Détaillés**: [RESTAURANT_API_TESTS.md](../salonhub-backend/database/RESTAURANT_API_TESTS.md)

---

## 🚀 Prochaines Étapes

1. **Frontend Mobile/Web**:
   - Interface de gestion des tables
   - Prise de commande tactile
   - Vue cuisine temps réel
   - Tableau de bord restaurant

2. **Features Avancées**:
   - QR Code pour menu digital
   - Paiement en ligne
   - Réservations en ligne
   - Programme de fidélité

3. **Nouveaux Secteurs**:
   - Phase 3: Training (Formations)
   - Phase 4: Medical (Cabinets médicaux)

---

**Temps total**: ~5 minutes ⏱️
**Status**: ✅ Restaurant fonctionnel!
