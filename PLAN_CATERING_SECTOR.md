# Plan : Ajout du secteur "Services Traiteurs" (`catering`)

> **Date de création** : 2026-02-11
> **Statut** : En attente d'implémentation

---

## Etat actuel

Le système supporte 4 types de business définis dans un ENUM MySQL :
```sql
ENUM('beauty', 'restaurant', 'training', 'medical')
```
Ces types sont hardcodés dans 6+ fichiers à travers 3 sous-projets.

---

## 1. Backend (`salonhub-backend`)

| Fichier | Modification |
|---|---|
| `database/migrations/` (nouveau) | Migration SQL : `ALTER TABLE tenants MODIFY business_type ENUM('beauty','restaurant','training','medical','catering')` |
| `src/routes/auth.js:82` | Ajouter `'catering'` dans `validBusinessTypes` |
| `src/routes/google-auth.js:296` | Ajouter `'catering'` dans `validBusinessTypes` |
| `src/routes/catering/` (nouveau dossier) | Routes spécifiques traiteur : `public.js`, `events.js`, `menus.js`, `quotes.js` |
| `src/server.js` | Monter les nouvelles routes catering |

### Tables spécifiques à créer (migration SQL)

- `catering_menus` - Formules/menus proposés (buffet, cocktail, repas assis, etc.)
- `catering_menu_items` - Plats/produits dans chaque menu
- `catering_events` - Evénements clients (mariage, séminaire, anniversaire, etc.)
- `catering_quotes` - Devis avec statut (draft, sent, accepted, rejected)
- `catering_quote_items` - Lignes de devis détaillées

---

## 2. Landing Page (`landing-page`)

| Fichier | Modification |
|---|---|
| `search.js` | Ajouter `catering: "Service Traiteur"` dans `TYPE_NAMES` et icône `fa-concierge-bell` dans `TYPE_ICONS` |
| `styles.css` | Ajouter thème `body.theme-traiteur` (couleur proposée : `#dc2626` rouge/warm) + classes `.sector-traiteur` |
| `index.html` | Ajouter 5e carte secteur dans la section "Use Cases" |
| `recherche.html` | Ajouter filtre chip `<button data-type="catering">` |
| `service-traiteur.html` (nouveau) | Page dédiée (template basé sur `restaurant.html`) |

---

## 3. Frontend (`salonhub-frontend`)

- Ajouter option "Service Traiteur" dans le formulaire d'inscription
- Ecrans de gestion spécifiques (menus, events, devis) si nécessaire

---

## 4. Mobile (`salonhub-mobile`)

- Ajouter option "Service Traiteur" dans l'onboarding/inscription
- Ecrans de gestion spécifiques si nécessaire

---

## Ordre d'implémentation suggéré

1. Migration DB + backend routes
2. Landing page (secteur card + page dédiée + search)
3. Frontend (inscription + gestion)
4. Mobile (inscription + gestion)
