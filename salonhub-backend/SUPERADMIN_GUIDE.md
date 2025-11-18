# 👑 Guide SuperAdmin - SalonHub

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Créer le premier SuperAdmin](#créer-le-premier-superadmin)
4. [Connexion](#connexion)
5. [Fonctionnalités](#fonctionnalités)
6. [API Routes](#api-routes)
7. [Permissions](#permissions)
8. [Sécurité](#sécurité)

---

## Introduction

Le système **SuperAdmin** permet de gérer l'ensemble de la plateforme SaaS SalonHub depuis une interface dédiée. Il offre :

- ✅ Gestion de tous les salons (tenants)
- ✅ Statistiques globales du SaaS
- ✅ Suspension/activation de comptes
- ✅ Logs d'audit complets
- ✅ Gestion des paramètres système
- ✅ Permissions granulaires

---

## Installation

### 1. Créer les tables en base de données

```bash
cd salonhub-backend
node scripts/setup-superadmin-tables.js
```

Cela va créer :
- `super_admins` - Table des administrateurs système
- `admin_activity_logs` - Logs d'audit
- `system_settings` - Paramètres système

### 2. Vérifier que les routes sont activées

Dans `src/server.js`, vérifiez que cette ligne est présente :

```javascript
app.use("/api/admin", require("./routes/admin"));
```

---

## Créer le premier SuperAdmin

### Méthode 1 : Script interactif (RECOMMANDÉ)

```bash
cd salonhub-backend
node scripts/create-superadmin.js
```

Le script vous demandera :
- Email
- Prénom
- Nom
- Mot de passe
- Type de compte (Super Admin ou Admin)

**Exemple :**

```
📧 Email: admin@salonhub.com
👤 Prénom: John
👤 Nom: Doe
🔑 Mot de passe: SuperSecure123!
🎯 Type de compte:
  1. Super Admin (tous les droits - fondateur)
  2. Admin (droits limités)
Choisir (1 ou 2): 1
```

### Méthode 2 : Insertion SQL directe

```sql
-- Générer le hash du mot de passe avec bcrypt (rounds=10)
-- Exemple pour "password123": $2b$10$...

INSERT INTO super_admins
(email, password_hash, first_name, last_name, is_active, is_super, permissions)
VALUES (
  'admin@salonhub.com',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  'John',
  'Doe',
  TRUE,
  TRUE,
  '{"tenants": {"view": true, "create": true, "edit": true, "suspend": true, "delete": true}, "analytics": {"view_global": true, "view_tenant": true, "export": true}, "system": {"view_logs": true, "manage_admins": true, "manage_settings": true}}'
);
```

---

## Connexion

### Frontend

1. Accédez à : `http://localhost:3000/superadmin/login`
2. Entrez vos identifiants
3. Vous serez redirigé vers le dashboard SuperAdmin

### API (pour tester)

```bash
curl -X POST http://localhost:5000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@salonhub.com",
    "password": "votre_mot_de_passe"
  }'
```

**Réponse :**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@salonhub.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_super": true
  }
}
```

---

## Fonctionnalités

### 📊 Dashboard

- Vue d'ensemble du SaaS
- Statistiques globales (total salons, actifs, en essai, etc.)
- Graphiques de croissance

### 🏪 Gestion des Salons (Tenants)

- **Liste tous les salons** avec filtres (statut, plan, recherche)
- **Détails d'un salon** (stats, users, clients, RDV)
- **Suspendre un salon** (blocage d'accès)
- **Réactiver un salon**
- **Supprimer un salon** (DANGER - Super Admin uniquement)

### 📈 Analytics

- Statistiques globales du SaaS
- Répartition par plan d'abonnement
- Croissance mensuelle
- Export de données

### 👥 Gestion des SuperAdmins

- Créer de nouveaux SuperAdmins
- Gérer les permissions
- Voir l'historique de connexion

### 📝 Logs d'activité

- Toutes les actions sont enregistrées
- Audit trail complet
- IP et User-Agent capturés

---

## API Routes

### Authentification

```
POST   /admin/auth/login          # Connexion SuperAdmin
GET    /admin/auth/me             # Infos du SuperAdmin connecté
```

### Gestion Tenants

```
GET    /admin/tenants              # Liste des salons
       ?status=active               # Filtrer par statut
       &plan=professional           # Filtrer par plan
       &search=salon                # Recherche
       &limit=50&offset=0           # Pagination

GET    /admin/tenants/:id          # Détails d'un salon

PUT    /admin/tenants/:id/suspend  # Suspendre un salon
       Body: { "reason": "..." }

PUT    /admin/tenants/:id/activate # Réactiver un salon

DELETE /admin/tenants/:id          # Supprimer définitivement
       Body: { "confirm": "DELETE" }  # Confirmation requise
```

### Analytics

```
GET    /admin/analytics/overview   # Vue d'ensemble du SaaS
```

### Gestion SuperAdmins

```
GET    /admin/superadmins          # Liste des SuperAdmins (Super Admin uniquement)
POST   /admin/superadmins          # Créer un SuperAdmin (Super Admin uniquement)
```

### Logs

```
GET    /admin/activity-logs        # Historique des actions
       ?action=tenant_suspended     # Filtrer par action
       &super_admin_id=1            # Filtrer par admin
       &limit=100&offset=0          # Pagination
```

---

## Permissions

### Super Admin (is_super = true)

**Tous les droits** - Peut tout faire sans restriction.

### Admin Standard

Permissions granulaires définies dans le champ `permissions` (JSON) :

```json
{
  "tenants": {
    "view": true,
    "create": true,
    "edit": true,
    "suspend": true,
    "delete": false       // Réservé aux Super Admins
  },
  "analytics": {
    "view_global": true,
    "view_tenant": true,
    "export": true
  },
  "impersonate": {
    "enabled": true,
    "require_2fa": false
  },
  "billing": {
    "view": true,
    "modify": false
  },
  "system": {
    "view_logs": true,
    "manage_admins": false,    // Réservé aux Super Admins
    "manage_settings": false
  }
}
```

### Vérification de permission dans le code

```javascript
// Middleware pour vérifier une permission
router.get('/tenants',
  superAdminAuth,
  requirePermission('tenants', 'view'),
  async (req, res) => {
    // Route accessible uniquement si permissions.tenants.view = true
  }
);

// Middleware pour Super Admin uniquement
router.delete('/tenants/:id',
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    // Route accessible uniquement aux Super Admins (is_super = true)
  }
);
```

---

## Sécurité

### 🔐 Authentification

- Les tokens SuperAdmin sont marqués avec `type: "superadmin"`
- Un token de salon (`type: undefined`) ne peut pas accéder aux routes SuperAdmin
- Séparation totale entre les authentifications

### 📝 Audit Trail

Toutes les actions sensibles sont loggées :

- Connexion SuperAdmin
- Suspension/activation de salon
- Suppression de salon
- Création de SuperAdmin
- Modification de paramètres système

**Structure du log :**

```javascript
{
  super_admin_id: 1,
  action: "tenant_suspended",
  resource_type: "tenant",
  resource_id: 42,
  description: "Suspension du tenant: Salon ABC",
  metadata: {
    reason: "Non-paiement",
    previous_status: "active"
  },
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  created_at: "2025-11-18 10:30:00"
}
```

### 🚨 Bonnes pratiques

1. **Ne créez qu'un seul Super Admin** (le fondateur)
2. **Utilisez des Admins standards** avec permissions limitées pour le reste de l'équipe
3. **Utilisez des mots de passe forts** (12+ caractères, alphanumériques + symboles)
4. **Surveillez les logs régulièrement** pour détecter des activités suspectes
5. **Ne partagez JAMAIS vos identifiants SuperAdmin**
6. **Activez 2FA** (à implémenter) pour les Super Admins

---

## Exemple d'utilisation

### Scénario 1 : Suspendre un salon non payant

```bash
# 1. Se connecter
TOKEN=$(curl -s -X POST http://localhost:5000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@salonhub.com", "password": "..."}' \
  | jq -r '.token')

# 2. Suspendre le salon ID 42
curl -X PUT http://localhost:5000/admin/tenants/42/suspend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Non-paiement après 30 jours"}'
```

### Scénario 2 : Voir les statistiques globales

```bash
curl -X GET http://localhost:5000/admin/analytics/overview \
  -H "Authorization: Bearer $TOKEN"
```

### Scénario 3 : Créer un nouveau SuperAdmin (équipe support)

```bash
curl -X POST http://localhost:5000/admin/superadmins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "support@salonhub.com",
    "password": "SecurePass123!",
    "first_name": "Support",
    "last_name": "Team",
    "permissions": {
      "tenants": {"view": true, "suspend": true},
      "analytics": {"view_global": true},
      "system": {"view_logs": true}
    }
  }'
```

---

## Support

Pour toute question ou problème :

1. Vérifiez les logs : `salonhub-backend/logs/`
2. Consultez la table `admin_activity_logs`
3. Contactez l'équipe technique

---

**🎉 Félicitations ! Votre système SuperAdmin est maintenant opérationnel.**
