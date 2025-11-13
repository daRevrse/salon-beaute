# SalonHub Backend API

Backend multi-tenant pour la gestion de salons de beauté avec Node.js, Express et MySQL.

## Fonctionnalités

- **Multi-tenant** : Isolation complète des données par salon
- **Authentification JWT** : Sécurisation des routes
- **Gestion des utilisateurs** : Owner, Admin, Staff
- **Clients** : CRUD complet avec historique
- **Services** : Gestion des prestations et catégories
- **Rendez-vous** : Planification avec détection de conflits
- **API RESTful** : Routes organisées et documentées

## Installation

### Prérequis

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm ou yarn

### Configuration

1. **Cloner et installer les dépendances**

```bash
cd salonhub-backend
npm install
```

2. **Configurer les variables d'environnement**

```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos paramètres :

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=salonhub

JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=7d
```

3. **Créer la base de données**

```bash
mysql -u root -p < database/schema.sql
```

Ou manuellement dans MySQL :

```sql
source database/schema.sql;
```

4. **Démarrer le serveur**

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarrera sur `http://localhost:5000`

## Architecture

```
salonhub-backend/
├── database/
│   └── schema.sql              # Schéma MySQL complet
├── src/
│   ├── config/
│   │   └── database.js         # Configuration MySQL
│   ├── middleware/
│   │   ├── auth.js             # Authentification JWT
│   │   └── tenant.js           # Isolation multi-tenant
│   ├── routes/
│   │   ├── auth.js             # Routes authentification
│   │   ├── clients.js          # Routes clients
│   │   ├── services.js         # Routes services
│   │   └── appointments.js     # Routes rendez-vous
│   └── server.js               # Point d'entrée
├── .env.example                # Template configuration
├── .gitignore
├── package.json
└── README.md
```

## API Documentation

### Routes Publiques

#### Santé du serveur
```
GET /health
```

#### Inscription (nouveau salon)
```
POST /api/auth/register
Content-Type: application/json

{
  "business_name": "Mon Salon",
  "subdomain": "mon-salon",
  "first_name": "Marie",
  "last_name": "Dupont",
  "email": "marie@example.com",
  "password": "motdepasse123",
  "phone": "0123456789"
}

Response: 201 Created
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... },
    "tenant": { ... }
  }
}
```

#### Connexion
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "marie@example.com",
  "password": "motdepasse123"
}

Response: 200 OK
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... },
    "tenant": { ... }
  }
}
```

### Routes Protégées

Toutes les routes suivantes nécessitent un token JWT dans le header :

```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Auth - Profil utilisateur

```
GET /api/auth/me
GET /api/auth/staff
POST /api/auth/staff
PUT /api/auth/staff/:id
PUT /api/auth/me
PUT /api/auth/change-password
DELETE /api/auth/staff/:id
```

#### Clients

```
GET    /api/clients              # Liste des clients
GET    /api/clients/:id          # Détails d'un client
GET    /api/clients/:id/appointments  # Historique RDV
POST   /api/clients              # Créer un client
PUT    /api/clients/:id          # Modifier un client
DELETE /api/clients/:id          # Supprimer un client
```

#### Services

```
GET    /api/services             # Liste des services
GET    /api/services/:id         # Détails d'un service
GET    /api/services/meta/categories  # Catégories
POST   /api/services             # Créer un service
PUT    /api/services/:id         # Modifier un service
PATCH  /api/services/:id/toggle  # Activer/Désactiver
DELETE /api/services/:id         # Supprimer un service
```

#### Rendez-vous

```
GET    /api/appointments         # Liste des RDV
GET    /api/appointments/today   # RDV du jour
GET    /api/appointments/:id     # Détails d'un RDV
GET    /api/appointments/availability/slots  # Créneaux disponibles
POST   /api/appointments         # Créer un RDV
PUT    /api/appointments/:id     # Modifier un RDV
PATCH  /api/appointments/:id/status  # Changer le statut
DELETE /api/appointments/:id     # Supprimer un RDV
```

## Exemples d'utilisation

### Créer un client

```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Sophie",
    "last_name": "Martin",
    "email": "sophie@example.com",
    "phone": "0612345678"
  }'
```

### Créer un rendez-vous

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "service_id": 1,
    "staff_id": 1,
    "appointment_date": "2025-11-20",
    "start_time": "10:00:00",
    "end_time": "11:00:00"
  }'
```

## Sécurité

- **JWT** : Tokens expirables (7 jours par défaut)
- **Bcrypt** : Hashage des mots de passe (10 rounds)
- **Isolation multi-tenant** : Chaque salon ne peut accéder qu'à ses données
- **Validation** : Contrôles sur toutes les entrées utilisateur
- **CORS** : Configuré pour autoriser uniquement le frontend

## Gestion des erreurs

Format standard des réponses d'erreur :

```json
{
  "success": false,
  "error": "Type d'erreur",
  "message": "Description détaillée"
}
```

Codes HTTP utilisés :
- `200` : Succès
- `201` : Création réussie
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Accès refusé
- `404` : Ressource introuvable
- `409` : Conflit (ex: email déjà utilisé)
- `500` : Erreur serveur

## Développement

### Structure des middlewares

1. **authMiddleware** : Vérifie le JWT et injecte `req.user`
2. **tenantMiddleware** : Extrait le `tenant_id` et l'injecte dans `req.tenantId`
3. **roleMiddleware** : Vérifie les permissions (owner, admin, staff)

### Ajouter une nouvelle route

```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// Appliquer les middlewares
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', async (req, res) => {
  try {
    const data = await query(
      'SELECT * FROM ma_table WHERE tenant_id = ?',
      [req.tenantId]
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
```

## Base de données

Le schéma MySQL complet se trouve dans `database/schema.sql`.

### Tables principales

- **tenants** : Salons (multi-tenant)
- **users** : Utilisateurs (owner, admin, staff)
- **clients** : Clients des salons
- **services** : Prestations proposées
- **appointments** : Rendez-vous

Toutes les tables incluent `tenant_id` pour l'isolation multi-tenant.

## Scripts disponibles

```bash
npm start       # Démarrer en production
npm run dev     # Démarrer en développement (nodemon)
```

## Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Email : support@salonhub.com

## Licence

UNLICENSED - FlowKraft Agency
