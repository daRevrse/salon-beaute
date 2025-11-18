# 🏢 Architecture Multi-Salons - SalonHub

## Vue d'ensemble

Ce document explique l'architecture actuelle (mono-salon) et la migration vers une architecture multi-salons pour le plan Business.

---

## 📊 Architecture actuelle (Mono-Salon)

### Modèle de données actuel

```
┌──────────────┐
│   tenants    │ ← Un salon
│   (salon)    │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────┐
│    users     │ ← Employés du salon
│              │
│ tenant_id FK │ (Lié à UN SEUL salon)
└──────────────┘
```

**Limitation** :
- Un utilisateur ne peut appartenir qu'à **UN SEUL** salon
- Un propriétaire ne peut gérer qu'**UN SEUL** salon
- Incompatible avec le plan Business (multi-salons)

### Cas d'usage actuel

**Exemple** : Marie possède un salon de coiffure

```
Tenant: "Salon Marie"
  ├─ User: Marie (owner)
  ├─ User: Sophie (staff)
  ├─ User: Julie (admin)
  └─ Services, Clients, Appointments...
```

✅ **Fonctionne bien pour** : Starter, Professional (1 salon)
❌ **Problème pour** : Business (plusieurs salons)

---

## 🎯 Architecture Multi-Salons (Plan Business)

### Modèle de données proposé

```
┌──────────────┐                ┌──────────────┐
│    users     │                │   tenants    │
│ (globaux)    │                │   (salons)   │
└──────┬───────┘                └──────┬───────┘
       │                               │
       │           ┌───────────────────┘
       │           │
       │    ┌──────▼──────────┐
       └────►  user_tenants   │ ← Table de liaison
            │                 │
            │ user_id    FK   │
            │ tenant_id  FK   │
            │ role            │
            │ is_primary      │
            └─────────────────┘
```

### Nouvelle structure

#### 1. **Table `users` (modifiée)**

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,  -- ← Email global unique
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email)
);
```

**Changements** :
- ❌ Suppression de `tenant_id` (devient global)
- ❌ Suppression de `role` (déplacé vers `user_tenants`)
- ✅ Email unique globalement (pas par tenant)

#### 2. **Table `user_tenants` (NOUVELLE)**

```sql
CREATE TABLE user_tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,

    -- Rôle spécifique à ce salon
    role ENUM('owner', 'admin', 'staff') DEFAULT 'staff',

    -- Salon principal de l'utilisateur (pour la connexion par défaut)
    is_primary BOOLEAN DEFAULT FALSE,

    -- Horaires de travail spécifiques à ce salon
    working_hours JSON,

    -- Statut dans ce salon
    is_active BOOLEAN DEFAULT TRUE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,

    UNIQUE KEY unique_user_tenant (user_id, tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_role (role)
);
```

**Fonctionnalités** :
- ✅ Un user peut avoir plusieurs salons
- ✅ Rôle différent dans chaque salon
- ✅ Horaires différents par salon
- ✅ Salon principal pour la connexion

### Cas d'usage multi-salons

**Exemple** : Marie possède 3 salons (plan Business)

```
User: Marie (email global unique)
  ├─ Salon Paris (owner, primary)
  │    ├─ Sophie (staff)
  │    └─ Julie (admin)
  ├─ Salon Lyon (owner)
  │    ├─ Marc (staff)
  │    └─ Sophie (staff) ← Même Sophie que Paris !
  └─ Salon Nice (owner)
       └─ Laura (staff)
```

**Avantages** :
- ✅ Marie gère 3 salons avec un seul compte
- ✅ Sophie travaille dans 2 salons (Paris + Lyon)
- ✅ Rôles différents possibles (owner dans un, staff dans un autre)

---

## 🔄 Migration de l'architecture actuelle vers Multi-Salons

### Script de migration SQL

**Créer `database/migration_multi_salon.sql`** :

```sql
-- ==========================================
-- MIGRATION VERS ARCHITECTURE MULTI-SALONS
-- ==========================================

-- Étape 1 : Créer la nouvelle table user_tenants
CREATE TABLE user_tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    role ENUM('owner', 'admin', 'staff') DEFAULT 'staff',
    is_primary BOOLEAN DEFAULT TRUE,
    working_hours JSON,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Étape 2 : Migrer les données existantes
INSERT INTO user_tenants (user_id, tenant_id, role, is_primary, working_hours, is_active)
SELECT
    id as user_id,
    tenant_id,
    role,
    TRUE as is_primary,  -- Premier salon = salon principal
    working_hours,
    is_active
FROM users;

-- Étape 3 : Créer une nouvelle table users_new sans tenant_id ni role
CREATE TABLE users_new (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Étape 4 : Copier les données vers users_new
INSERT INTO users_new (id, email, password_hash, first_name, last_name, phone, avatar_url, is_active, last_login_at, created_at, updated_at)
SELECT
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    avatar_url,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM users;

-- Étape 5 : Ajouter les contraintes FK sur user_tenants
ALTER TABLE user_tenants
ADD CONSTRAINT fk_user_tenants_user
    FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_user_tenants_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
ADD CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id);

-- Étape 6 : Supprimer l'ancienne table users et renommer users_new
DROP TABLE users;
RENAME TABLE users_new TO users;

-- Étape 7 : Mettre à jour les contraintes FK des autres tables
-- (appointments, client_notifications, etc. qui référencent users.id)
-- Ces contraintes devraient déjà fonctionner car les IDs sont préservés

-- Vérification
SELECT
    u.email,
    t.name as salon,
    ut.role,
    ut.is_primary
FROM users u
JOIN user_tenants ut ON u.id = ut.user_id
JOIN tenants t ON ut.tenant_id = t.id
ORDER BY u.email, ut.is_primary DESC;
```

### Notes de migration

⚠️ **IMPORTANT** :
1. **Sauvegarder** la base de données avant migration
2. **Tester** sur un environnement de développement
3. **Mettre l'application en maintenance** pendant la migration
4. **Vérifier** les données après migration

---

## 🔧 Modifications du code Backend

### 1. Middleware Tenant (modifié)

**Fichier : `src/middleware/tenant.js`**

```javascript
const { query } = require("../config/database");

// Nouveau middleware pour le multi-tenant
exports.tenantMiddleware = async (req, res, next) => {
  try {
    // Récupérer le tenant_id depuis :
    // 1. Header X-Tenant-ID (prioritaire)
    // 2. Query param ?tenant_id=
    // 3. Salon principal de l'utilisateur (fallback)

    let tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;

    if (!tenantId) {
      // Récupérer le salon principal de l'utilisateur
      const [userTenant] = await query(
        `SELECT tenant_id FROM user_tenants
         WHERE user_id = ? AND is_primary = TRUE
         LIMIT 1`,
        [req.user.id]
      );

      if (!userTenant) {
        return res.status(403).json({
          success: false,
          error: "Aucun salon associé à votre compte"
        });
      }

      tenantId = userTenant.tenant_id;
    }

    // Vérifier que l'utilisateur a accès à ce tenant
    const [access] = await query(
      `SELECT role, is_active FROM user_tenants
       WHERE user_id = ? AND tenant_id = ?`,
      [req.user.id, tenantId]
    );

    if (!access || !access.is_active) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé à ce salon"
      });
    }

    // Ajouter le tenant et le rôle au request
    req.tenantId = parseInt(tenantId);
    req.userRole = access.role;

    next();
  } catch (error) {
    console.error("Erreur tenant middleware:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
};

// Middleware pour vérifier les permissions
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        error: "Rôle non défini"
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: "Permission refusée",
        message: `Cette action nécessite l'un des rôles suivants : ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
```

### 2. Nouvelles routes pour gérer les salons

**Créer `src/routes/salons.js`** :

```javascript
const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");

// Appliquer le middleware d'authentification
router.use(authMiddleware);

// ==========================================
// GET - Liste des salons de l'utilisateur
// ==========================================
router.get("/my-salons", async (req, res) => {
  try {
    const salons = await query(
      `SELECT
        t.id, t.name, t.slug, t.email, t.phone,
        t.subscription_plan, t.subscription_status,
        ut.role, ut.is_primary, ut.is_active
      FROM user_tenants ut
      JOIN tenants t ON ut.tenant_id = t.id
      WHERE ut.user_id = ? AND ut.is_active = TRUE
      ORDER BY ut.is_primary DESC, t.name`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: salons
    });
  } catch (error) {
    console.error("Erreur récupération salons:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// PUT - Changer le salon principal
// ==========================================
router.put("/set-primary/:tenant_id", async (req, res) => {
  try {
    const { tenant_id } = req.params;

    // Vérifier que l'utilisateur a accès à ce salon
    const [access] = await query(
      "SELECT id FROM user_tenants WHERE user_id = ? AND tenant_id = ?",
      [req.user.id, tenant_id]
    );

    if (!access) {
      return res.status(404).json({
        success: false,
        error: "Salon introuvable"
      });
    }

    // Transaction : retirer primary de tous, puis définir le nouveau
    await query("UPDATE user_tenants SET is_primary = FALSE WHERE user_id = ?", [req.user.id]);
    await query("UPDATE user_tenants SET is_primary = TRUE WHERE user_id = ? AND tenant_id = ?", [req.user.id, tenant_id]);

    res.json({
      success: true,
      message: "Salon principal mis à jour"
    });
  } catch (error) {
    console.error("Erreur changement salon principal:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

module.exports = router;
```

**Enregistrer dans `server.js`** :

```javascript
const salonsRoutes = require("./routes/salons");
app.use("/api/salons", salonsRoutes);
```

---

## 🎯 Implémentation Frontend

### 1. Sélecteur de salon

**Composant `SalonSwitcher.js`** :

```javascript
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const SalonSwitcher = () => {
  const [salons, setSalons] = useState([]);
  const [currentSalon, setCurrentSalon] = useState(null);

  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    const response = await api.get('/salons/my-salons');
    setSalons(response.data);

    // Trouver le salon principal
    const primary = response.data.find(s => s.is_primary);
    setCurrentSalon(primary || response.data[0]);
  };

  const switchSalon = (salon) => {
    setCurrentSalon(salon);

    // Stocker le tenant_id actuel
    localStorage.setItem('current_tenant_id', salon.id);

    // Recharger la page pour appliquer le changement
    window.location.reload();
  };

  if (salons.length <= 1) return null; // Cacher si mono-salon

  return (
    <div className="salon-switcher">
      <select
        value={currentSalon?.id}
        onChange={(e) => {
          const salon = salons.find(s => s.id === parseInt(e.target.value));
          switchSalon(salon);
        }}
        className="form-select"
      >
        {salons.map(salon => (
          <option key={salon.id} value={salon.id}>
            {salon.name} {salon.is_primary && '⭐'}
            {salon.role === 'owner' && ' (Propriétaire)'}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 2. Intercepteur API pour envoyer le tenant_id

**Modifier `src/services/api.js`** :

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Ajouter le tenant_id aux requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('current_tenant_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

export default api;
```

---

## 📋 Checklist de migration

### Préparation
- [ ] Sauvegarder la base de données
- [ ] Tester le script de migration en local
- [ ] Vérifier les dépendances (contraintes FK)
- [ ] Informer les utilisateurs de la maintenance

### Migration Backend
- [ ] Exécuter le script SQL de migration
- [ ] Vérifier les données migrées
- [ ] Modifier le middleware tenant
- [ ] Créer les nouvelles routes salons
- [ ] Mettre à jour les routes existantes
- [ ] Tester les API

### Migration Frontend
- [ ] Créer le composant SalonSwitcher
- [ ] Modifier l'intercepteur API
- [ ] Ajouter la gestion du tenant_id actif
- [ ] Tester le changement de salon
- [ ] Mettre à jour la navigation

### Tests
- [ ] Tester avec un compte mono-salon
- [ ] Tester avec un compte multi-salons
- [ ] Vérifier l'isolation des données
- [ ] Tester les permissions par salon

---

## 🎯 Conclusion

### Architecture actuelle
✅ **Convient pour** : Plans Starter et Professional (1 salon)
❌ **Limitation** : Impossible de gérer plusieurs salons

### Architecture multi-salons
✅ **Supporte** : Plan Business (plusieurs salons)
✅ **Permet** : Un utilisateur dans plusieurs salons
✅ **Flexible** : Rôles différents par salon

### Décision recommandée

**Option 1** : Garder l'architecture actuelle si :
- Vous ne proposez pas de plan Business
- Vous voulez une architecture simple
- La multi-location n'est pas prévue

**Option 2** : Migrer vers multi-salons si :
- Vous proposez un plan Business
- Vous voulez permettre la gestion de plusieurs salons
- Vous voulez permettre aux employés de travailler dans plusieurs salons

---

**FlowKraft Agency - SalonHub**
Version 1.0 - Novembre 2025
