# Configuration des Horaires - Guide Complet

## 🎯 Objectif

Permettre au salon de **configurer ses horaires d'ouverture** depuis l'interface admin, pour que les clients puissent voir les **créneaux disponibles** lors de la réservation en ligne.

---

## ✅ Ce qui a été ajouté

### Backend

#### 1. Routes Settings ([salonhub-backend/src/routes/settings.js](salonhub-backend/src/routes/settings.js))

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/settings` | Récupérer tous les paramètres du salon |
| `PUT` | `/api/settings` | Mettre à jour les paramètres |
| `GET` | `/api/settings/:key` | Récupérer un paramètre spécifique |

**Paramètres gérés :**
- `business_hours` (JSON) : Horaires par jour de la semaine
- `slot_duration` (number) : Durée d'un créneau en minutes (15, 30 ou 60)

#### 2. Intégration dans server.js

Route ajoutée : `app.use("/api/settings", require("./routes/settings"))`

### Frontend

#### 1. Page Settings ([salonhub-frontend/src/pages/Settings.js](salonhub-frontend/src/pages/Settings.js))

**Fonctionnalités :**
- Configuration des horaires pour chaque jour de la semaine
- Possibilité de marquer un jour comme fermé
- Choix de la durée des créneaux (15, 30 ou 60 minutes)
- Sauvegarde en base de données
- Interface responsive

#### 2. Route ajoutée dans App.js

```javascript
<Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
```

#### 3. Lien dans le Dashboard

Carte "Paramètres" ajoutée dans le dashboard pour accéder rapidement aux réglages.

---

## 📋 Comment configurer les horaires

### Étape 1 : Se connecter au dashboard admin

1. Aller sur `http://localhost:3000/login`
2. Se connecter avec les identifiants du salon

### Étape 2 : Accéder aux paramètres

**Option 1 :** Depuis le dashboard, cliquer sur la carte "Paramètres"

**Option 2 :** Naviguer directement vers `http://localhost:3000/settings`

### Étape 3 : Configurer les horaires

Pour chaque jour de la semaine :

1. **Cocher** la case pour indiquer que le salon est ouvert
2. **Décocher** pour marquer le jour comme fermé
3. **Définir l'heure d'ouverture** (ex: 09:00)
4. **Définir l'heure de fermeture** (ex: 18:00)

**Exemple :**
```
✅ Lundi      : 09:00 → 18:00
✅ Mardi      : 09:00 → 18:00
✅ Mercredi   : 09:00 → 18:00
✅ Jeudi      : 09:00 → 18:00
✅ Vendredi   : 09:00 → 18:00
✅ Samedi     : 09:00 → 17:00
❌ Dimanche   : Fermé
```

### Étape 4 : Configurer la durée des créneaux

Choisir parmi :
- **15 minutes** : Plus de flexibilité, créneaux fréquents
- **30 minutes** : Équilibre (recommandé)
- **60 minutes** : Pour les services longs

### Étape 5 : Enregistrer

Cliquer sur **"Enregistrer les paramètres"**

Un message de confirmation apparaîtra : ✅ "Paramètres enregistrés avec succès !"

---

## 🔄 Comment ça fonctionne

### Côté Admin (Configuration)

1. Le salon configure ses horaires via `/settings`
2. Les données sont enregistrées dans la table `settings` :
   ```sql
   INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
   VALUES
     (1, 'business_hours', '{"monday": {"open": "09:00", "close": "18:00", "closed": false}, ...}', 'json'),
     (1, 'slot_duration', '30', 'number');
   ```

### Côté Client (Réservation)

1. Le client visite `/book/[slug-salon]/datetime`
2. Il sélectionne une date
3. Le frontend appelle `/api/public/salon/:slug/availability?service_id=X&date=Y`
4. Le backend :
   - Récupère les `business_hours` depuis la table `settings`
   - Calcule le jour de la semaine
   - Vérifie si le salon est ouvert ce jour
   - Génère tous les créneaux possibles (ex: 09:00, 09:30, 10:00...)
   - Filtre les créneaux déjà réservés
   - Retourne uniquement les créneaux disponibles
5. Le frontend affiche les créneaux disponibles en grille

---

## 🗄️ Structure des données

### Format business_hours (JSON)

```json
{
  "monday": {
    "open": "09:00",
    "close": "18:00",
    "closed": false
  },
  "tuesday": {
    "open": "09:00",
    "close": "18:00",
    "closed": false
  },
  "wednesday": {
    "open": "09:00",
    "close": "18:00",
    "closed": false
  },
  "thursday": {
    "open": "09:00",
    "close": "18:00",
    "closed": false
  },
  "friday": {
    "open": "09:00",
    "close": "18:00",
    "closed": false
  },
  "saturday": {
    "open": "09:00",
    "close": "17:00",
    "closed": false
  },
  "sunday": {
    "open": "00:00",
    "close": "00:00",
    "closed": true
  }
}
```

### Table settings

| Colonne | Type | Description |
|---------|------|-------------|
| id | INT | ID auto-incrémenté |
| tenant_id | INT | ID du salon |
| setting_key | VARCHAR(100) | Clé du paramètre |
| setting_value | TEXT | Valeur (JSON, string, number) |
| setting_type | ENUM | Type : 'string', 'number', 'boolean', 'json' |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Dernière modification |

---

## 🧪 Tester le système complet

### 1. Configurer les horaires

```bash
# Se connecter au dashboard
http://localhost:3000/login

# Aller dans Paramètres
http://localhost:3000/settings

# Configurer les horaires et sauvegarder
```

### 2. Vérifier en base de données

```sql
-- Voir les paramètres enregistrés
SELECT * FROM settings WHERE tenant_id = 1;

-- Devrait retourner :
-- | id | tenant_id | setting_key    | setting_value        | setting_type |
-- |----|-----------|----------------|----------------------|--------------|
-- | 1  | 1         | business_hours | {"monday": {...}}    | json         |
-- | 2  | 1         | slot_duration  | 30                   | number       |
```

### 3. Tester la réservation client

```bash
# Aller sur la page de réservation
http://localhost:3000/book/[slug-salon]

# Sélectionner un service
# Choisir une date (ex: demain, un lundi)
# Vérifier que les créneaux affichés correspondent aux horaires configurés
```

**Exemple :**
- Si configuré : Lundi 09:00 → 18:00
- Durée créneau : 30 min
- Service choisi : 60 min (Coupe)
- Créneaux affichés : 09:00, 09:30, 10:00, 10:30 ... 17:00

---

## 🛠️ API de test

### Récupérer les paramètres (Admin)

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/settings
```

**Réponse :**
```json
{
  "business_hours": {
    "monday": { "open": "09:00", "close": "18:00", "closed": false },
    ...
  },
  "slot_duration": 30
}
```

### Mettre à jour les paramètres (Admin)

```bash
curl -X PUT \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_hours": {
      "monday": { "open": "08:00", "close": "19:00", "closed": false },
      ...
    },
    "slot_duration": 30
  }' \
  http://localhost:5000/api/settings
```

### Récupérer les créneaux disponibles (Public)

```bash
curl "http://localhost:5000/api/public/salon/[slug]/availability?service_id=1&date=2025-11-18"
```

**Réponse :**
```json
{
  "slots": [
    { "time": "09:00", "datetime": "2025-11-18 09:00:00", "available": true },
    { "time": "09:30", "datetime": "2025-11-18 09:30:00", "available": true },
    ...
  ]
}
```

---

## 💡 Valeurs par défaut

Si aucun paramètre n'est configuré, le système utilise ces valeurs par défaut :

**Horaires :**
- Lundi à Vendredi : 09:00 → 18:00
- Samedi : 09:00 → 17:00
- Dimanche : Fermé

**Durée créneau :** 30 minutes

---

## 🐛 Résolution de problèmes

### Problème : "Horaires non configurés"

**Cause :** Les horaires ne sont pas encore sauvegardés en base

**Solution :**
1. Aller sur `/settings`
2. Configurer les horaires
3. Cliquer sur "Enregistrer"

### Problème : "Aucun créneau disponible"

**Causes possibles :**
1. Le jour sélectionné est marqué comme fermé
2. Tous les créneaux sont déjà réservés
3. Le service dure trop longtemps par rapport à l'heure de fermeture

**Solution :**
1. Vérifier les horaires dans `/settings`
2. Vérifier les rendez-vous existants dans `/appointments`
3. Ajuster les horaires ou choisir une autre date

### Problème : Les logs montrent `businessHours: {}` ou `undefined`

**Cause :** Les horaires ne sont pas en base ou mal formatés

**Solution :**
```sql
-- Vérifier les données
SELECT setting_value FROM settings
WHERE setting_key = 'business_hours' AND tenant_id = <ID>;

-- Si vide, créer via l'interface ou manuellement :
INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
VALUES (1, 'business_hours', '{"monday": {"open": "09:00", "close": "18:00", "closed": false}, ...}', 'json');
```

---

## ✨ Prochaines améliorations possibles

1. **Horaires spéciaux** : Permettre des horaires différents pour certaines dates (ex: jours fériés)
2. **Horaires par employé** : Chaque employé a ses propres disponibilités
3. **Pauses** : Bloquer des créneaux (ex: pause déjeuner 12h-14h)
4. **Fermetures exceptionnelles** : Marquer des jours fermés ponctuellement
5. **Import/Export** : Sauvegarder et réutiliser des configurations

---

## 📝 Résumé

✅ Le salon peut **configurer ses horaires** via `/settings`
✅ Les horaires sont **sauvegardés en base** (table `settings`)
✅ Les clients voient **uniquement les créneaux disponibles** selon ces horaires
✅ Le système calcule **automatiquement** les créneaux en fonction :
  - Des horaires configurés
  - De la durée du service
  - Des rendez-vous déjà réservés

**Prochaine étape :** Tester le workflow complet de A à Z ! 🎉
