# 🎉 Migration du Système de Booking - v1 vers SaaS Multi-tenant

## ✅ Ce qui a été fait

### Backend (`salonhub-backend`)

#### 1. Routes publiques créées (`src/routes/public.js`)

**Nouvelles routes API disponibles :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/public/salon/:slug` | Récupérer les infos d'un salon par son slug |
| `GET` | `/api/public/salon/:slug/services` | Lister les services actifs disponibles en ligne |
| `GET` | `/api/public/salon/:slug/settings` | Récupérer les horaires et paramètres du salon |
| `GET` | `/api/public/salon/:slug/availability` | Obtenir les créneaux disponibles (params: service_id, date) |
| `POST` | `/api/public/appointments` | Créer un rendez-vous (réservation client) |

**Fonctionnalités implémentées :**
- ✅ Récupération des salons par slug (URL-friendly)
- ✅ Filtrage des services disponibles pour réservation en ligne
- ✅ Calcul automatique des créneaux disponibles
- ✅ Vérification des conflits horaires
- ✅ Gestion des horaires d'ouverture par jour
- ✅ Création de client automatique si nouveau
- ✅ Rendez-vous créés avec statut "pending" (en attente de validation)
- ✅ Isolation multi-tenant (chaque salon voit uniquement ses données)

#### 2. Intégration dans le serveur (`src/server.js`)

- Routes publiques ajoutées sans authentification
- Documentation mise à jour dans les logs de démarrage
- Endpoint racine mis à jour avec les nouvelles routes

---

### Frontend (`salonhub-frontend`)

#### 1. Hook personnalisé (`src/hooks/usePublicBooking.js`)

**Fonctionnalités :**
- `fetchSalon(slug)` - Charger les infos du salon
- `fetchServices()` - Charger les services disponibles
- `fetchSettings()` - Charger les paramètres (horaires)
- `fetchAvailability(serviceId, date)` - Charger les créneaux disponibles
- `createAppointment(data)` - Créer un rendez-vous
- Gestion du loading, erreurs, état

#### 2. Pages publiques créées (`src/pages/public/`)

**4 pages du workflow de réservation :**

##### a) `BookingLanding.js` - Étape 1
- Affichage des informations du salon
- Grille des services disponibles
- Sélection d'un service
- Design responsive avec Tailwind CSS

##### b) `BookingDateTime.js` - Étape 2
- Sélecteur de date (minimum = aujourd'hui)
- Chargement dynamique des créneaux disponibles
- Grille de créneaux cliquables
- Gestion des jours fermés

##### c) `BookingClientInfo.js` - Étape 3
- Formulaire client (prénom, nom, téléphone, email, notes)
- Validation des champs
- Récapitulatif de la réservation
- Soumission avec création du RDV

##### d) `BookingConfirmation.js` - Étape 4
- Message de succès
- Récapitulatif complet du rendez-vous
- Statut "En attente de validation"
- Bouton pour nouvelle réservation

#### 3. Routing (`src/App.js`)

**Nouvelles routes ajoutées :**
- `/book/:slug` → Landing (sélection service)
- `/book/:slug/datetime` → Sélection date/heure
- `/book/:slug/info` → Formulaire client
- `/book/:slug/confirmation` → Confirmation

---

## 🚀 Comment tester

### 1. Prérequis

**Base de données :**
- Avoir un salon créé dans la table `tenants` avec un `slug` (ex: "salon-test")
- Avoir des services actifs avec `available_for_online_booking = 1`
- (Optionnel) Configurer les horaires dans la table `settings`

**Exemple de slug à utiliser :**
```
slug: salon-test
```

### 2. Démarrer le backend

```bash
cd salonhub-backend
npm install  # si pas encore fait
npm run dev
```

**Vérifier que ces routes apparaissent dans les logs :**
```
🌐 Routes publiques (Booking):
   GET  http://localhost:5000/api/public/salon/:slug
   GET  http://localhost:5000/api/public/salon/:slug/services
   GET  http://localhost:5000/api/public/salon/:slug/availability
   POST http://localhost:5000/api/public/appointments
```

### 3. Démarrer le frontend

```bash
cd salonhub-frontend
npm install  # si pas encore fait
npm start
```

**Le frontend démarre sur :** `http://localhost:3000`

### 4. Tester le workflow booking

**URL à visiter :**
```
http://localhost:3000/book/salon-test
```
*(Remplacer `salon-test` par le slug de votre salon)*

**Workflow complet :**

1. **Page d'accueil** :
   - Voir les services disponibles
   - Cliquer sur un service

2. **Sélection date/heure** :
   - Choisir une date (aujourd'hui ou après)
   - Voir les créneaux disponibles
   - Cliquer sur un créneau

3. **Informations client** :
   - Remplir le formulaire (prénom, nom, téléphone obligatoires)
   - Email et notes optionnels
   - Cliquer sur "Confirmer la réservation"

4. **Confirmation** :
   - Voir le message de succès
   - Vérifier le récapitulatif
   - Prendre un autre RDV si souhaité

### 5. Vérifier en base de données

**Après avoir créé un rendez-vous, vérifier :**

```sql
-- Nouveau client créé (si téléphone pas encore dans la base)
SELECT * FROM clients WHERE tenant_id = <id_salon> ORDER BY created_at DESC LIMIT 1;

-- Nouveau rendez-vous créé avec statut "pending"
SELECT * FROM appointments WHERE tenant_id = <id_salon> ORDER BY created_at DESC LIMIT 1;
```

**Le rendez-vous doit avoir :**
- `status = 'pending'` (en attente de validation)
- `booking_source = 'website'`
- `booked_by = 'client'`

---

## 📋 Données de test à créer

### 1. Créer un salon de test

```sql
INSERT INTO tenants (name, slug, email, phone, address, city, subscription_status)
VALUES (
  'Salon Beauté Test',
  'salon-test',
  'contact@salon-test.fr',
  '01 23 45 67 89',
  '123 Rue de la Beauté',
  'Paris',
  'active'
);
```

### 2. Créer des services de test

```sql
-- Récupérer l'ID du tenant créé
SET @tenant_id = LAST_INSERT_ID();

INSERT INTO services (tenant_id, name, description, duration, price, category, is_active, available_for_online_booking)
VALUES
  (@tenant_id, 'Coupe Femme', 'Coupe et brushing', 60, 45, 'Coiffure', 1, 1),
  (@tenant_id, 'Coupe Homme', 'Coupe classique', 30, 25, 'Coiffure', 1, 1),
  (@tenant_id, 'Coloration', 'Coloration complète', 120, 80, 'Couleur', 1, 1),
  (@tenant_id, 'Manucure', 'Soin des mains et pose vernis', 45, 30, 'Ongles', 1, 1);
```

### 3. Configurer les horaires (optionnel)

```sql
INSERT INTO settings (tenant_id, setting_key, setting_value, value_type)
VALUES
  (@tenant_id, 'slot_duration', '30', 'number'),
  (@tenant_id, 'business_hours', '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "17:00", "closed": false},
    "sunday": {"open": "00:00", "close": "00:00", "closed": true}
  }', 'json');
```

---

## 🔍 Tests API avec Postman/cURL

### Test 1: Récupérer un salon

```bash
curl http://localhost:5000/api/public/salon/salon-test
```

**Réponse attendue :**
```json
{
  "id": 1,
  "name": "Salon Beauté Test",
  "slug": "salon-test",
  "phone": "01 23 45 67 89",
  "address": "123 Rue de la Beauté",
  "city": "Paris",
  "subscription_status": "active"
}
```

### Test 2: Récupérer les services

```bash
curl http://localhost:5000/api/public/salon/salon-test/services
```

**Réponse attendue :**
```json
[
  {
    "id": 1,
    "name": "Coupe Femme",
    "description": "Coupe et brushing",
    "duration": 60,
    "price": 45,
    "category": "Coiffure"
  },
  ...
]
```

### Test 3: Récupérer les créneaux disponibles

```bash
curl "http://localhost:5000/api/public/salon/salon-test/availability?service_id=1&date=2025-11-15"
```

**Réponse attendue :**
```json
{
  "slots": [
    {"time": "09:00", "datetime": "2025-11-15 09:00:00", "available": true},
    {"time": "09:30", "datetime": "2025-11-15 09:30:00", "available": true},
    {"time": "10:00", "datetime": "2025-11-15 10:00:00", "available": true},
    ...
  ]
}
```

### Test 4: Créer un rendez-vous

```bash
curl -X POST http://localhost:5000/api/public/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "salon_slug": "salon-test",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "0612345678",
    "email": "jean.dupont@example.com",
    "service_id": 1,
    "appointment_date": "2025-11-15",
    "start_time": "10:00:00",
    "notes": "Première visite"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "appointment_date": "2025-11-15",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "status": "pending",
    ...
  },
  "message": "Votre rendez-vous a été enregistré avec succès..."
}
```

---

## 🎯 Points clés de la migration

### Différences v1 → SaaS

| Aspect | v1 (SQLite) | SaaS (MySQL) |
|--------|-------------|--------------|
| Base de données | SQLite (fichier) | MySQL (serveur) |
| Architecture | Single-tenant | Multi-tenant |
| Identification salon | Config fixe | Slug dynamique (:slug) |
| Isolation | N/A | Par tenant_id |
| Tables | `rendez_vous`, `clients` | `appointments`, `clients` |
| Champs | `date_heure` | `appointment_date`, `start_time`, `end_time` |
| API | `/api/public/*` | `/api/public/salon/:slug/*` |

### Adaptations effectuées

✅ **Requêtes SQL** : Converties de SQLite vers MySQL
✅ **tenant_id** : Ajouté partout pour isolation multi-tenant
✅ **Slug routing** : Salon identifié par slug au lieu de config fixe
✅ **Nommage** : Tables et champs adaptés au schéma SaaS existant
✅ **Horaires** : Gestion via table `settings` (JSON) au lieu de table dédiée
✅ **Statuts** : Harmonisés avec le schéma existant (pending, confirmed, etc.)

---

## 🐛 Dépannage

### Problème : "Salon non trouvé"

**Cause :** Le slug n'existe pas ou le salon n'est pas actif

**Solution :**
```sql
-- Vérifier les salons actifs
SELECT id, name, slug, subscription_status FROM tenants WHERE subscription_status IN ('trial', 'active');
```

### Problème : "Aucun service disponible"

**Cause :** Pas de service avec `available_for_online_booking = 1`

**Solution :**
```sql
-- Activer les services pour réservation en ligne
UPDATE services
SET available_for_online_booking = 1, is_active = 1
WHERE tenant_id = <id_salon>;
```

### Problème : "Aucun créneau disponible"

**Causes possibles :**
1. Jour fermé dans business_hours
2. Heure de fin du service dépasse la fermeture
3. Tous les créneaux déjà réservés

**Solution :**
```sql
-- Vérifier les horaires configurés
SELECT * FROM settings WHERE tenant_id = <id_salon> AND setting_key = 'business_hours';

-- Vérifier les RDV existants
SELECT * FROM appointments WHERE tenant_id = <id_salon> AND appointment_date = '2025-11-15';
```

### Problème : CORS error

**Cause :** Frontend et backend sur des ports différents

**Solution :**
Vérifier que `.env` du backend contient :
```
FRONTEND_URL=http://localhost:3000
```

---

## 📝 Prochaines étapes

### Améliorations possibles

1. **Notifications** :
   - Envoyer SMS/Email de confirmation au client
   - Notifier le salon d'un nouveau RDV pending

2. **Gestion des jours fermés** :
   - Créer une table pour les congés exceptionnels
   - Bloquer les réservations ces jours-là

3. **Multi-employés** :
   - Permettre de sélectionner un employé
   - Calculer les disponibilités par employé

4. **Paiement en ligne** :
   - Intégrer Stripe pour acompte/paiement
   - Confirmer automatiquement si paiement effectué

5. **Rappels automatiques** :
   - Email/SMS 24h avant le RDV
   - Demande de confirmation

6. **Annulation client** :
   - Lien unique pour annuler un RDV
   - Libérer le créneau automatiquement

7. **Widget embarquable** :
   - Créer un widget JavaScript
   - Intégrer le booking dans n'importe quel site

---

## ✨ Conclusion

Le système de booking public a été **migré avec succès** de v1 (SQLite, single-tenant) vers le SaaS (MySQL, multi-tenant).

**Ce qui fonctionne :**
- ✅ Réservation en ligne sans authentification
- ✅ Workflow complet en 4 étapes
- ✅ Calcul des disponibilités
- ✅ Gestion des conflits horaires
- ✅ Isolation multi-tenant
- ✅ Interface responsive

**URL de test :**
```
http://localhost:3000/book/salon-test
```

Pour toute question ou problème, vérifier les logs du backend et les messages d'erreur dans la console du navigateur.

Bon booking ! 🎉
