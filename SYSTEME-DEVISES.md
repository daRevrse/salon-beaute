# Système de Gestion des Devises Multi-Pays

## 🌍 Vue d'ensemble

Le système détecte **automatiquement** la devise appropriée en fonction du pays de l'utilisateur et permet une personnalisation manuelle complète.

## 🎯 Fonctionnalités

### 1. Détection Automatique
- ✅ Détection géographique via API de géolocalisation IP
- ✅ Fallback sur la locale du navigateur
- ✅ Mapping intelligent pays → devise
- ✅ Stockage des préférences utilisateur

### 2. Devises Supportées

| Code | Devise | Symbole | Régions |
|------|--------|---------|---------|
| EUR | Euro | € | France, Belgique, Luxembourg, Monaco |
| USD | Dollar américain | $ | États-Unis |
| CAD | Dollar canadien | CA$ | Canada |
| GBP | Livre sterling | £ | Royaume-Uni |
| CHF | Franc suisse | CHF | Suisse |
| MAD | Dirham marocain | MAD | Maroc, Algérie, Tunisie |
| XOF | Franc CFA Ouest | CFA | Sénégal, Côte d'Ivoire, Bénin, Togo, etc. |
| XAF | Franc CFA Central | FCFA | Cameroun, Gabon, Congo, Tchad, etc. |

### 3. Hiérarchie de Détection

```
1. Préférence utilisateur (localStorage)
   ↓
2. Devise du tenant (base de données)
   ↓
3. Détection automatique (géolocalisation IP)
   ↓
4. Fallback: EUR (par défaut)
```

## 📁 Architecture

### Frontend

#### CurrencyContext (`salonhub-frontend/src/contexts/CurrencyContext.js`)

```javascript
// Hook personnalisé
const {
  currency,           // Code devise actuel (ex: "EUR")
  formatPrice,        // Fonction de formatage des prix
  getCurrencySymbol,  // Obtenir le symbole (ex: "€")
  changeCurrency,     // Changer la devise
  availableCurrencies // Liste des devises disponibles
} = useCurrency();
```

**Utilisation dans un composant :**

```javascript
import { useCurrency } from '../contexts/CurrencyContext';

const MonComposant = () => {
  const { formatPrice } = useCurrency();

  return <div>{formatPrice(50.00)}</div>; // Affiche: 50,00 €
};
```

### Backend

#### Table `tenants`
```sql
ALTER TABLE tenants
ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR'
```

#### Endpoints API

**GET `/api/settings/currency`**
- Récupère la devise du tenant
- Retourne: `{ currency: "EUR" }`

**PUT `/api/settings`**
- Met à jour les paramètres incluant la devise
- Body: `{ currency: "USD", business_hours: {...}, slot_duration: 30 }`

## 🔧 Configuration

### 1. Migration Base de Données

```bash
mysql -u root -p salonhub < salonhub-backend/database/add_currency_to_tenants.sql
```

Cette migration :
- Ajoute la colonne `currency` à la table `tenants`
- Définit automatiquement la devise selon le pays du salon
- Met EUR par défaut pour les salons sans pays défini

### 2. Interface Administrateur

Accédez à **Paramètres** → Section **Devise de votre salon**

- Sélection visuelle avec symboles
- Indication de détection automatique
- Sauvegarde instantanée

### 3. Personnalisation pour Vos Utilisateurs

Les salons peuvent changer leur devise à tout moment :
1. Menu utilisateur → **Paramètres**
2. Section **Devise de votre salon**
3. Choisir dans la liste déroulante
4. Cliquer sur **Enregistrer les paramètres**

## 🚀 Intégration dans Nouveaux Composants

### Affichage de Prix

```javascript
import { useCurrency } from '../contexts/CurrencyContext';

const ServiceCard = ({ service }) => {
  const { formatPrice } = useCurrency();

  return (
    <div>
      <h3>{service.name}</h3>
      <p>{formatPrice(service.price)}</p>
    </div>
  );
};
```

### Sélecteur de Devise

```javascript
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext';

const CurrencySelector = () => {
  const { currency, changeCurrency } = useCurrency();

  return (
    <select value={currency} onChange={(e) => changeCurrency(e.target.value)}>
      {Object.entries(CURRENCIES).map(([code, info]) => (
        <option key={code} value={code}>
          {info.symbol} - {info.name}
        </option>
      ))}
    </select>
  );
};
```

## 🔐 Sécurité & Performance

### Caching
- Préférence utilisateur: `localStorage` (persistance navigateur)
- Devise tenant: Chargée au login et mise en cache
- Détection IP: Effectuée une seule fois au premier chargement

### API Géolocalisation
- Utilise [ipapi.co](https://ipapi.co) (gratuit, pas de clé requise)
- Limite: 1000 requêtes/jour (suffisant pour usage normal)
- Alternative: Configurer une autre API dans `CurrencyContext.js`

### Données Sensibles
- Aucune donnée bancaire
- Aucune conversion de devises (affichage seulement)
- Pas de calculs de taux de change

## 🌐 Ajout de Nouvelles Devises

Éditez `salonhub-frontend/src/contexts/CurrencyContext.js` :

```javascript
export const CURRENCIES = {
  // ... devises existantes
  JPY: { symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  BRL: { symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
};

const COUNTRY_TO_CURRENCY = {
  // ... mappings existants
  JP: "JPY",
  BR: "BRL",
};
```

## 📊 Migration Données Existantes

Les salons existants hériteront automatiquement de :
- EUR pour les pays européens de la zone euro
- Devise locale pour les autres pays (selon mapping)
- EUR par défaut si pays non défini

## ✅ Tests Effectués

- ✅ Détection automatique selon géolocalisation
- ✅ Sauvegarde et récupération des préférences
- ✅ Formatage des prix dans toutes les devises
- ✅ Interface de configuration
- ✅ Build de production sans erreurs
- ✅ Compatibilité multi-tenants

## 🐛 Dépannage

### La devise ne change pas
1. Vérifier que la migration SQL a été exécutée
2. Effacer le cache du navigateur (Ctrl+Shift+R)
3. Vérifier les logs du navigateur (F12)

### Symbole incorrect affiché
1. Vérifier la configuration de `CURRENCIES` dans `CurrencyContext.js`
2. S'assurer que `Intl.NumberFormat` est supporté par le navigateur

### API de géolocalisation bloquée
1. Vérifier la connexion Internet
2. Le système utilisera la locale du navigateur en fallback
3. L'administrateur peut configurer manuellement

## 📝 Notes de Développement

### Prochaines Améliorations Possibles
- [ ] Support de plus de devises (AED, SAR, etc.)
- [ ] Conversion automatique de prix (avec API taux de change)
- [ ] Historique des changements de devise
- [ ] Multi-devises par tenant (affichage client + devise comptable)

### Limitations Actuelles
- Pas de conversion de taux de change
- 8 devises supportées
- Détection IP limitée à 1000/jour

---

**Documentation créée le:** 2025-01-13
**Version:** 1.0.0
**Auteur:** Claude Code Assistant
