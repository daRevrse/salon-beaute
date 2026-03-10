# SalonHub — Plan de Mises à Niveau

> Document créé le 2026-03-08 — Référence pour l'implémentation des fonctionnalités API Developer et Multi-Salon.

---

## Table des matières

1. [Contexte](#contexte)
2. [Axe 1 — Clés API](#axe-1--clés-api)
3. [Axe 2 — Multi-Salon](#axe-2--multi-salon)
4. [Axe 3 — Sécurité & Robustesse](#axe-3--sécurité--robustesse)
5. [Axe 4 — Plan Developer](#axe-4--plan-developer)
6. [Webhooks — Explication détaillée](#webhooks--explication-détaillée)
7. [Ordre d'implémentation](#ordre-dimplémentation)
8. [Suivi d'avancement](#suivi-davancement)

---

## Contexte

### Clés API — État actuel

| Composant | Statut | Détails |
|-----------|--------|---------|
| Table `api_keys` | ✅ Fait | Migration 011 — hash bcrypt, scopes JSON, rate limit, expiration |
| Routes CRUD `/api/api-keys` | ✅ Fait | POST/GET/PATCH/DELETE avec gating plan Developer/Custom |
| Middleware `apiKey.js` | ✅ Fait | Auth via `Bearer sk_live_...`, rate limit 5000 req/jour, vérif plan |
| Intégration dans `auth.js` | ✅ Fait | Auto-délégation si token commence par `sk_live_` |
| Plans Stripe | ✅ Fait | Developer à 14.99€ avec "API & webhooks" dans les features |
| Documentation landing page | ✅ Fait | Quickstart, intégrations (JS/PHP/Python/cURL), OpenAPI spec |
| **UI frontend** | ❌ Manque | Pas d'onglet pour voir/créer/gérer les clés API |
| **Enforcement scopes** | ❌ Manque | Scopes stockés mais jamais vérifiés par route |
| **Webhooks** | ❌ Manque | Promis dans le plan Developer mais non implémenté |

### Multi-Salon — État actuel

Architecture actuelle : **1 utilisateur = 1 salon (tenant)**

- `users.tenant_id` est une FK fixe vers UN seul tenant
- Le JWT contient UN seul `tenant_id`
- Le `tenantMiddleware` injecte ce tenant_id unique dans toutes les requêtes
- **Impossible** pour un utilisateur d'accéder aux données d'un autre salon
- Le plan Custom promet "Multi-salons" mais rien n'est implémenté

---

## Axe 1 — Clés API

### 1.1 UI gestion clés API (frontend)

**Objectif** : Onglet "Développeur" dans Settings du dashboard.

**Fonctionnalités** :
- Afficher les clés existantes (masquées sauf le préfixe `sk_live_xxxx...`)
- Créer une nouvelle clé (modal qui affiche la clé UNE seule fois)
- Activer/désactiver une clé (toggle)
- Supprimer une clé (confirmation)
- Voir les scopes attribués à chaque clé
- Voir l'usage (requêtes restantes / 5000)

**Effort** : Moyen

---

### 1.2 Enforcement des scopes

**Objectif** : Middleware `checkScope()` qui vérifie que la clé API a le scope requis pour chaque route.

**Comportement** :
- `checkScope('clients:read')` sur `GET /api/clients`
- `checkScope('clients:write')` sur `POST/PUT/DELETE /api/clients`
- Si la requête vient d'un utilisateur (JWT classique) → passe toujours
- Si la requête vient d'une clé API → vérifie les scopes

**Routes concernées** :
| Route | Scope requis |
|-------|-------------|
| `GET /api/clients` | `clients:read` |
| `POST/PUT/DELETE /api/clients` | `clients:write` |
| `GET /api/services` | `services:read` |
| `POST/PUT/DELETE /api/services` | `services:write` |
| `GET /api/appointments` | `appointments:read` |
| `POST/PUT/DELETE /api/appointments` | `appointments:write` |
| `GET /api/settings` | `settings:read` |
| `PUT /api/settings` | `settings:write` |

**Effort** : Faible

---

### 1.3 Dashboard d'usage API

**Objectif** : Compteur de requêtes/jour par clé, graphique d'utilisation.

**Fonctionnalités** :
- Nombre de requêtes aujourd'hui / 5000
- Graphique des 30 derniers jours
- Alerte quand on approche du rate limit (80%, 95%)
- Répartition par endpoint

**Effort** : Moyen

---

### 1.4 Système de Webhooks (backend)

**Objectif** : Permettre aux utilisateurs de recevoir des notifications HTTP automatiques.

**Fonctionnalités** :
- Table `webhooks` : url, events[], secret, active, tenant_id
- Table `webhook_logs` : webhook_id, event, payload, status_code, response_time, created_at
- Envoi POST avec payload JSON signé (HMAC-SHA256)
- Retry automatique : 3 tentatives (immédiat, 5min, 30min)
- Timeout : 10 secondes par appel

**Événements supportés** :
| Événement | Déclencheur |
|-----------|-------------|
| `appointment.created` | Nouveau RDV pris |
| `appointment.updated` | RDV modifié |
| `appointment.cancelled` | RDV annulé |
| `client.created` | Nouveau client enregistré |
| `client.updated` | Client modifié |
| `service.created` | Nouveau service créé |
| `service.updated` | Service modifié |
| `payment.received` | Paiement reçu |

**Effort** : Élevé

---

### 1.5 UI webhooks (frontend)

**Objectif** : Interface dans l'onglet Développeur pour gérer les webhooks.

**Fonctionnalités** :
- Créer un webhook (URL + sélection d'événements)
- Afficher le secret (une seule fois à la création)
- Activer/désactiver un webhook
- Voir les logs de livraison (succès/échec, status code, temps de réponse)
- Bouton "Test" pour envoyer un événement fictif

**Effort** : Moyen

---

### 1.6 Page documentation API intégrée

**Objectif** : Page dans le dashboard montrant les endpoints disponibles.

**Fonctionnalités** :
- Liste des endpoints avec méthodes HTTP
- Exemples de requêtes/réponses
- Filtrage par scope
- Snippets de code (JS, PHP, Python, cURL)

**Effort** : Faible

---

## Axe 2 — Multi-Salon

### 2.1 Migration DB

**Objectif** : Table pivot `user_salons` pour relation many-to-many.

**Schema** :
```sql
CREATE TABLE user_salons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tenant_id INT NOT NULL,
  role ENUM('owner', 'admin', 'staff') NOT NULL DEFAULT 'staff',
  is_primary BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tenant (user_id, tenant_id)
);
```

**Migration des données existantes** :
```sql
INSERT INTO user_salons (user_id, tenant_id, role, is_primary)
SELECT id, tenant_id, role, TRUE FROM users;
```

**Effort** : Moyen

---

### 2.2 Adapter l'auth

**Objectif** : Le login retourne la liste des salons de l'utilisateur.

**Changements** :
- `POST /api/auth/login` → retourne `{ user, salons: [...], activeSalon }` au lieu de `{ user, tenant }`
- JWT contient toujours `tenant_id` (le salon actif) mais le client connaît la liste
- `POST /api/salons/switch/:tenantId` → vérifie que l'utilisateur appartient à ce salon, réémet un JWT avec le nouveau `tenant_id`
- `GET /api/auth/me` → retourne aussi `salons[]`

**Effort** : Moyen

---

### 2.3 Endpoints salon CRUD

**Objectif** : Gérer ses salons via l'API.

**Routes** :
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/salons` | Liste mes salons |
| `POST` | `/api/salons` | Créer un nouveau salon |
| `GET` | `/api/salons/:id` | Détails d'un salon |
| `PUT` | `/api/salons/:id` | Modifier un salon |
| `DELETE` | `/api/salons/:id` | Supprimer un salon (owner only) |
| `POST` | `/api/salons/:id/switch` | Changer de salon actif |

**Effort** : Moyen

---

### 2.4 Système d'invitation

**Objectif** : Inviter un staff/admin à rejoindre un salon.

**Schema** :
```sql
CREATE TABLE salon_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);
```

**Routes** :
- `POST /api/salons/:id/invite` — envoyer une invitation par email
- `GET /api/invitations/:token` — voir les détails de l'invitation
- `POST /api/invitations/:token/accept` — accepter l'invitation

**Effort** : Moyen

---

### 2.5 Frontend : Salon switcher

**Objectif** : Dropdown dans le header du dashboard.

**Comportement** :
- Affiche le logo + nom du salon actif dans le header
- Clic → dropdown avec la liste des salons
- Clic sur un salon → appel `POST /api/salons/switch/:id` → nouveau JWT → reload des données
- Option "+ Créer un salon" en bas du dropdown (si plan Custom)

**Effort** : Moyen

---

### 2.6 Mobile : Salon switcher

**Objectif** : Même logique que le frontend, adaptée au mobile.

**Changements** :
- `AuthContext` gère `salons[]` + `activeSalon`
- Sélecteur de salon dans le header ou drawer
- Switch → nouveau token stocké dans SecureStore → refresh des données

**Effort** : Moyen

---

### 2.7 Dashboard agrégé

**Objectif** : Vue consolidée pour les owners multi-salons.

**Fonctionnalités** :
- CA total de tous les salons combiné
- Nombre total de RDV (aujourd'hui, semaine, mois)
- Comparaison entre salons (graphique)
- Classement des salons par performance

**Effort** : Élevé

---

### 2.8 Gating par plan

**Objectif** : Multi-salon réservé au plan Custom.

**Règles** :
- Plans Starter / Pro / Developer → 1 seul salon
- Plan Custom → salons illimités (ou selon contrat)
- Trial → 1 seul salon
- Tentative de créer un 2ème salon → message "Passez au plan Custom"

**Effort** : Faible

---

## Axe 3 — Sécurité & Robustesse

### 3.1 Permissions croisées rôle/salon

**Objectif** : Un staff invité dans un salon n'a que les permissions de son rôle DANS ce salon.

**Règle** : Le rôle vient de `user_salons.role`, pas de `users.role`.

**Effort** : Faible

---

### 3.2 Audit log

**Objectif** : Traçabilité de toutes les actions.

**Schema** :
```sql
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT,
  api_key_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  source ENUM('web', 'mobile', 'api') DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Effort** : Moyen

---

### 3.3 Webhook security (HMAC)

**Objectif** : Signature de chaque payload webhook.

**Mécanisme** :
- Chaque webhook a un `secret` généré à la création
- Header `X-SalonHub-Signature: sha256=HMAC(secret, payload)`
- Le client vérifie la signature avant de traiter le payload
- Protection contre les attaques man-in-the-middle et la falsification

**Effort** : Faible

---

## Axe 4 — Plan Developer

### 4.1 Affichage conditionnel onglet Dev

**Objectif** : L'onglet "Développeur" n'apparaît que si le plan est Developer ou Custom.

**Condition** : `subscription_plan IN ('developer', 'custom') OR is_trial = true`

**Effort** : Faible

---

### 4.2 Page Développeur mobile

**Objectif** : Écran dans les Settings du mobile pour voir ses clés API.

**Fonctionnalités** :
- Lecture seule — voir les clés existantes
- Copier une clé (préfixe masqué)
- Lien vers le dashboard web pour les actions avancées

**Effort** : Moyen

---

### 4.3 Sandbox / Test mode

**Objectif** : Clés de test pour les développeurs.

**Fonctionnalités** :
- Clés `sk_test_...` qui fonctionnent sur des données fictives
- Données sandbox isolées du production
- Permet de tester les intégrations sans risque

**Effort** : Élevé

---

## Webhooks — Explication détaillée

### Qu'est-ce qu'un Webhook ?

Un webhook est un **appel HTTP automatique** que le serveur SalonHub envoie vers une URL externe **quand un événement se produit**. Au lieu que le client interroge l'API en boucle (polling), c'est le serveur qui notifie le client instantanément.

### Comparaison Polling vs Webhook

```
SANS webhook (polling) :              AVEC webhook :

Client → GET /appointments (rien)     [Nouveau RDV créé]
Client → GET /appointments (rien)         ↓
Client → GET /appointments (rien)     SalonHub → POST https://client.com/webhook
Client → GET /appointments (1 RDV!)       { event: "appointment.created", data: {...} }

❌ Gaspillage de requêtes              ✅ Notification instantanée
❌ Délai de détection                  ✅ Temps réel
❌ Consomme du rate limit              ✅ 0 requête API consommée
```

### Exemple concret SalonHub

**Scénario** : Un salon a un site web qui affiche les créneaux disponibles en temps réel.

1. Le propriétaire configure un webhook dans SalonHub :
   - **URL** : `https://monsalon.com/api/salonhub-webhook`
   - **Événements** : `appointment.created`, `appointment.cancelled`
   - **Secret** : `whsec_abc123...` (généré automatiquement)

2. Un client prend un RDV via l'app SalonHub :

```json
POST https://monsalon.com/api/salonhub-webhook
Headers:
  Content-Type: application/json
  X-SalonHub-Signature: sha256=a1b2c3d4...
  X-SalonHub-Event: appointment.created

Body:
{
  "event": "appointment.created",
  "timestamp": "2026-03-08T14:30:00Z",
  "data": {
    "appointment_id": 456,
    "service": "Coupe + Brushing",
    "date": "2026-03-10",
    "time": "10:00",
    "duration": 60,
    "staff": "Marie",
    "client": {
      "name": "Sophie Martin",
      "email": "sophie@email.com"
    }
  }
}
```

3. Le site web reçoit ce payload et met à jour ses créneaux disponibles — **sans jamais appeler l'API SalonHub**.

### Autres cas d'usage

- **Sync CRM externe** : Quand un client est créé → envoyer vers Hubspot/Salesforce
- **Notifications Slack** : Quand un RDV est annulé → message dans un channel Slack
- **Comptabilité** : Quand un paiement est reçu → écriture dans le logiciel comptable
- **SMS externe** : Quand un RDV est confirmé → déclencher un SMS via Twilio

---

## Ordre d'implémentation

### Phase 1 — Quick wins (débloque le plan Developer)

| # | Tâche | Effort | Dépendances |
|---|-------|--------|-------------|
| 1.2 | Enforcement des scopes | Faible | Aucune |
| 1.1 | UI gestion clés API | Moyen | Aucune |
| 4.1 | Affichage conditionnel par plan | Faible | 1.1 |

### Phase 2 — Webhooks (compléter la promesse Developer)

| # | Tâche | Effort | Dépendances |
|---|-------|--------|-------------|
| 1.4 | Système de webhooks (backend) | Élevé | Aucune |
| 3.3 | Webhook security (HMAC) | Faible | 1.4 |
| 1.5 | UI webhooks | Moyen | 1.4 |

### Phase 3 — Multi-Salon (gros chantier)

| # | Tâche | Effort | Dépendances |
|---|-------|--------|-------------|
| 2.1 | Migration DB | Moyen | Aucune |
| 2.2 | Adapter l'auth | Moyen | 2.1 |
| 2.3 | Endpoints CRUD salons | Moyen | 2.1 |
| 2.8 | Gating par plan | Faible | 2.3 |
| 2.5 | Frontend salon switcher | Moyen | 2.2, 2.3 |
| 2.6 | Mobile salon switcher | Moyen | 2.2, 2.3 |

### Phase 4 — Polish & Avancé

| # | Tâche | Effort | Dépendances |
|---|-------|--------|-------------|
| 1.3 | Dashboard usage API | Moyen | 1.1 |
| 1.6 | Documentation API intégrée | Faible | 1.1 |
| 2.4 | Système d'invitations | Moyen | 2.1 |
| 2.7 | Dashboard agrégé | Élevé | 2.5 |
| 3.1 | Permissions croisées | Faible | 2.1 |
| 3.2 | Audit log | Moyen | Aucune |
| 4.2 | Page Développeur mobile | Moyen | 1.1 |
| 4.3 | Sandbox / Test mode | Élevé | 1.2 |

---

## Suivi d'avancement

| # | Tâche | Statut | Date |
|---|-------|--------|------|
| 1.1 | UI gestion clés API | ✅ Fait | 2026-03-08 |
| 1.2 | Enforcement des scopes | ✅ Fait | 2026-03-08 |
| 1.3 | Dashboard usage API | ⬜ À faire | — |
| 1.4 | Système de webhooks (backend) | ✅ Fait | 2026-03-08 |
| 1.5 | UI webhooks (frontend) | ✅ Fait | 2026-03-08 |
| 1.6 | Documentation API | ⬜ À faire | — |
| 2.1 | Migration DB multi-salon | ✅ Fait | 2026-03-08 |
| 2.2 | Auth multi-salon | ✅ Fait | 2026-03-08 |
| 2.3 | Endpoints CRUD salons | ✅ Fait | 2026-03-08 |
| 2.4 | Invitations | ✅ Fait | 2026-03-08 |
| 2.5 | Frontend salon switcher | ✅ Fait | 2026-03-08 |
| 2.6 | Mobile salon switcher | ✅ Fait | 2026-03-08 |
| 2.7 | Dashboard agrégé | ⬜ À faire | — |
| 2.8 | Gating par plan | ✅ Fait | 2026-03-08 |
| 3.1 | Permissions croisées | ⬜ À faire | — |
| 3.2 | Audit log | ⬜ À faire | — |
| 3.3 | Webhook security (HMAC) | ✅ Fait | 2026-03-08 |
| 4.1 | Affichage conditionnel | ✅ Fait | 2026-03-08 |
| 4.2 | Page Dev mobile | ⬜ À faire | — |
| 4.3 | Sandbox mode | ⬜ À faire | — |
