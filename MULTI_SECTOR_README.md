# 🏢 SalonHub - Architecture Multi-Secteur

## Vue d'ensemble

SalonHub est une plateforme SaaS **multi-tenant** et **multi-secteur** qui permet de gérer différents types de business dans une seule application:

- 💇 **Beauty** - Salons de beauté, coiffure, esthétique
- 🍽️ **Restaurant** - Restaurants, cafés, bars
- 📚 **Training** - Centres de formation (à venir)
- 🏥 **Medical** - Cabinets médicaux (à venir)

---

## 📊 Architecture

### Multi-Tenant + Multi-Secteur

```
┌─────────────────────────────────────────────────┐
│                  SALONHUB API                   │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │    Tenant Isolation       │
    │    (req.tenantId)         │
    └─────────────┬─────────────┘
                  │
    ┌─────────────▼─────────────┐
    │   Business Type Detection │
    │   (req.businessType)      │
    └─────────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    ┌───▼────┐      ┌──────▼──────┐
    │ Beauty │      │ Restaurant  │
    │ Routes │      │   Routes    │
    └────────┘      └─────────────┘
        │                   │
        │                   │
    Shared Tables     Restaurant Tables
    - clients         - restaurant_tables
    - services        - restaurant_menus
    - appointments    - restaurant_orders
    - users           - restaurant_order_items
```

### Base de Données

#### Tables Communes (tous secteurs)
- `tenants` - Tenants avec `business_type`
- `users` - Utilisateurs/Staff
- `clients` - Clients
- `appointments` - Rendez-vous (étendu selon business_type)
- `services` - Services génériques

#### Tables Spécifiques Restaurant
- `restaurant_tables` - Tables physiques
- `restaurant_menus` - Carte du restaurant
- `restaurant_orders` - Commandes
- `restaurant_order_items` - Lignes de commande

---

## 🔑 Concepts Clés

### 1. Business Type

Chaque tenant a un `business_type` qui détermine les fonctionnalités disponibles:

```sql
ALTER TABLE tenants
ADD COLUMN business_type ENUM('beauty', 'restaurant', 'training', 'medical')
NOT NULL DEFAULT 'beauty';
```

### 2. Middleware Stack

Toutes les routes protégées utilisent cette stack:

```javascript
router.get('/',
  authMiddleware,           // 1. Vérifier JWT
  tenantMiddleware,         // 2. Extraire tenantId
  businessTypeMiddleware,   // 3. Injecter req.businessType
  requireBusinessType('restaurant'),  // 4. Vérifier accès
  async (req, res) => { ... }
);
```

### 3. Isolation

- **Multi-tenant**: Chaque requête est automatiquement filtrée par `tenant_id`
- **Multi-secteur**: Les routes spécifiques sont bloquées si `business_type` ne correspond pas

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL/MariaDB 10.4+
- npm ou yarn

### Étapes

1. **Cloner le projet**
```bash
git clone <repository>
cd salon-beaute
```

2. **Installer les dépendances**
```bash
cd salonhub-backend
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

4. **Créer la base de données**
```sql
CREATE DATABASE salonhub_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Exécuter les migrations**

Dans phpMyAdmin, exécutez dans cet ordre:

**Option A - Script tout-en-un (recommandé)**:
```bash
database/INSTALL_FINAL_NO_CHECKS.sql
```

**Option B - Scripts séparés**:
```bash
# 1. Migration base (si pas déjà fait)
database/salonhub_dev.sql

# 2. Ajout multi-secteur
database/migrations/001_add_business_type_safe.sql
database/migrations/002_restaurant_tables.sql
```

6. **Démarrer le serveur**
```bash
npm run dev     # Mode développement
npm start       # Mode production
```

Le serveur démarre sur `http://localhost:5000`

---

## 📖 Documentation

### Par Secteur

#### Beauty (Salon de Beauté)
- Documentation: *À venir*
- Routes: `/api/clients`, `/api/services`, `/api/appointments`

#### Restaurant
- Documentation complète: [`database/PHASE2_COMPLETED.md`](salonhub-backend/database/PHASE2_COMPLETED.md)
- Tests API: [`database/RESTAURANT_API_TESTS.md`](salonhub-backend/database/RESTAURANT_API_TESTS.md)
- Routes: `/api/restaurant/*`

#### Training (Formation)
- Statut: 🔜 À venir
- Tables prévues: `training_courses`, `training_sessions`, `training_enrollments`

#### Medical (Médical)
- Statut: 🔜 À venir
- Tables prévues: `medical_patients`, `medical_records`, `medical_prescriptions`

---

## 🛠️ Développement

### Ajouter un Nouveau Secteur

1. **Ajouter le type dans l'ENUM**
```sql
ALTER TABLE tenants
MODIFY COLUMN business_type ENUM('beauty', 'restaurant', 'training', 'medical', 'nouveau_secteur');
```

2. **Créer les tables spécifiques**
```sql
CREATE TABLE nouveau_secteur_table1 ( ... );
CREATE TABLE nouveau_secteur_table2 ( ... );
```

3. **Créer les routes**
```javascript
// src/routes/nouveau-secteur/index.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { tenantMiddleware } = require('../../middleware/tenant');
const { businessTypeMiddleware, requireBusinessType } = require('../../middleware/businessType');

// Toutes les sous-routes
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(businessTypeMiddleware);
router.use(requireBusinessType('nouveau_secteur'));

// Routes spécifiques...

module.exports = router;
```

4. **Enregistrer dans server.js**
```javascript
app.use('/api/nouveau-secteur', require('./routes/nouveau-secteur'));
```

### Étendre une Table Partagée

Si un secteur a besoin de colonnes supplémentaires dans une table commune (comme `appointments`):

```sql
-- Ajouter colonnes conditionnelles
ALTER TABLE appointments
ADD COLUMN custom_field VARCHAR(255) NULL;

-- Ces colonnes seront NULL pour les autres secteurs
```

**Bonne pratique**: Préfixer les colonnes par le secteur si elles sont spécifiques:
```sql
ALTER TABLE appointments
ADD COLUMN restaurant_table_id INT(11) NULL;
ADD COLUMN medical_diagnosis_id INT(11) NULL;
```

---

## 🧪 Tests

### Test Multi-Tenant

1. Créer 2 restaurants différents
2. Se connecter avec le restaurant A
3. Créer une table
4. Se connecter avec le restaurant B
5. Essayer d'accéder à la table du restaurant A

**Résultat attendu**: Aucune table visible (isolation parfaite)

### Test Multi-Secteur

1. Créer un compte restaurant
2. Créer un compte salon
3. Avec le token restaurant → Accéder à `/api/restaurant/tables` ✅
4. Avec le token salon → Accéder à `/api/restaurant/tables` ❌ 403

---

## 📂 Structure des Fichiers

```
salon-beaute/
├── salonhub-backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── tenant.js
│   │   │   └── businessType.js          # 🆕 Multi-secteur
│   │   ├── routes/
│   │   │   ├── auth.js                  # ✏️ Modifié (business_type)
│   │   │   ├── clients.js               # Commun
│   │   │   ├── services.js              # Commun
│   │   │   ├── appointments.js          # Commun (étendu)
│   │   │   └── restaurant/              # 🆕 Secteur Restaurant
│   │   │       ├── index.js
│   │   │       ├── tables.js
│   │   │       ├── menus.js
│   │   │       └── orders.js
│   │   ├── server.js                    # ✏️ Modifié (routes restaurant)
│   │   └── ...
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_add_business_type_safe.sql
│   │   │   └── 002_restaurant_tables.sql
│   │   ├── INSTALL_FINAL_NO_CHECKS.sql  # 🆕 Installation rapide
│   │   ├── PHASE2_COMPLETED.md          # 🆕 Documentation Phase 2
│   │   └── RESTAURANT_API_TESTS.md      # 🆕 Tests API Restaurant
│   └── ...
├── MULTI_SECTOR_README.md               # 🆕 Ce fichier
└── ...
```

---

## 🔒 Sécurité

### Isolation Multi-Tenant

Chaque query doit inclure le `tenant_id`:
```javascript
// ❌ MAUVAIS - Pas de filtrage tenant
const [rows] = await query('SELECT * FROM restaurant_tables');

// ✅ BON - Filtrage par tenant
const [rows] = await query(
  'SELECT * FROM restaurant_tables WHERE tenant_id = ?',
  [req.tenantId]
);
```

### Restriction Business Type

Routes sectorielles protégées:
```javascript
// Automatique avec requireBusinessType()
router.use(requireBusinessType('restaurant'));

// Manuel si besoin
if (req.businessType !== 'restaurant') {
  return res.status(403).json({ error: 'Access Denied' });
}
```

---

## 📈 Roadmap

### ✅ Phase 1: Beauty (Complète)
- Multi-tenant de base
- Gestion clients, services, rendez-vous
- Paiements Stripe

### ✅ Phase 2: Restaurant (Complète)
- Tables et plan de salle
- Menu avec allergènes
- Commandes et paiements
- Réservations de tables

### 🔜 Phase 3: Training (Prévue)
- Cours et sessions
- Inscriptions
- Formateurs
- Certificats

### 🔜 Phase 4: Medical (Prévue)
- Patients
- Dossiers médicaux
- Prescriptions
- Conformité HIPAA/RGPD

---

## 🤝 Contribution

Pour contribuer:
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouveau-secteur`)
3. Commit les changements (`git commit -m 'Add nouveau secteur'`)
4. Push vers la branche (`git push origin feature/nouveau-secteur`)
5. Créer une Pull Request

---

## 📞 Support

- Issues: [GitHub Issues]
- Email: support@salonhub.com
- Documentation: Ce README + docs spécifiques par secteur

---

## 📄 Licence

[À définir]

---

## 🎯 Quick Start - Restaurant

```bash
# 1. Installer et démarrer
npm install
npm run dev

# 2. Créer un compte restaurant
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Mon Restaurant",
    "business_type": "restaurant",
    "owner_name": "Votre Nom",
    "email": "email@example.com",
    "password": "SecurePass123!"
  }'

# 3. Récupérer le token de la réponse

# 4. Créer une table
curl -X POST http://localhost:5000/api/restaurant/tables \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table_number": "1", "capacity": 4, "section": "Terrasse"}'

# 5. Ajouter un plat
curl -X POST http://localhost:5000/api/restaurant/menus \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger Maison",
    "category": "Plats",
    "price": 15.00
  }'

# 6. Créer une commande
curl -X POST http://localhost:5000/api/restaurant/orders \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "order_type": "dine_in",
    "guest_count": 2,
    "items": [{"menu_item_id": 1, "quantity": 2}]
  }'
```

**C'est tout!** Vous avez un restaurant fonctionnel 🎉

---

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-16
**Auteur**: SalonHub Team
