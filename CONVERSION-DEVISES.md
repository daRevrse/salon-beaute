# 💱 Système de Conversion de Devises en Temps Réel

## 🎯 Vue d'ensemble

Le système convertit **automatiquement** les prix des services selon les taux de change réels, permettant aux clients de voir les prix dans leur devise locale avec une conversion précise.

### Exemple
- Un service coûte **50,00 €** dans un salon français
- Un client américain voit **$54.25 USD** (conversion selon taux réel)
- Un client britannique voit **£42.85 GBP** (conversion selon taux réel)

## 🏗️ Architecture

### Backend

#### 1. Service de Conversion (`salonhub-backend/src/services/currencyService.js`)

```javascript
const currencyService = require('./services/currencyService');

// Convertir un montant
const converted = await currencyService.convertCurrency(50, 'EUR', 'USD');
// Résultat: 54.25

// Obtenir le taux de change
const rate = await currencyService.getExchangeRate('EUR', 'USD');
// Résultat: 1.085
```

**Fonctionnalités:**
- ✅ Cache automatique (24h) des taux de change
- ✅ API gratuite exchangerate-api.com (1500 requêtes/mois)
- ✅ Fallback intelligent si API indisponible
- ✅ Rafraîchissement automatique quotidien

#### 2. Routes API (`salonhub-backend/src/routes/currency.js`)

**Endpoints disponibles:**

```bash
# Récupérer tous les taux de change
GET /api/currency/rates
Response: {
  success: true,
  data: {
    base: "EUR",
    rates: {
      USD: 1.085,
      GBP: 0.857,
      CAD: 1.456,
      ...
    },
    timestamp: 1704067200000
  }
}

# Convertir un montant
GET /api/currency/convert?amount=50&from=EUR&to=USD
Response: {
  success: true,
  data: {
    original: { amount: 50, currency: "EUR" },
    converted: { amount: 54.25, currency: "USD" },
    rate: 1.085,
    timestamp: 1704067200000
  }
}

# Obtenir le taux entre deux devises
GET /api/currency/rate/EUR/USD
Response: {
  success: true,
  data: {
    from: "EUR",
    to: "USD",
    rate: 1.085,
    timestamp: 1704067200000
  }
}

# Rafraîchir le cache (admin)
POST /api/currency/refresh
Response: {
  success: true,
  message: "Cache des taux de change rafraîchi",
  ...
}
```

### Frontend

#### CurrencyContext Amélioré

```javascript
import { useCurrency } from '../contexts/CurrencyContext';

const MonComposant = () => {
  const {
    formatPrice,           // Formater avec conversion auto
    convertPrice,          // Convertir uniquement
    salonBaseCurrency,     // Devise du salon
    setSalonBaseCurrency,  // Définir la devise du salon
    currency,              // Devise affichée à l'utilisateur
    exchangeRates          // Tous les taux disponibles
  } = useCurrency();

  // Exemple 1: Formatage avec conversion automatique
  // Prix stocké en EUR, converti et affiché dans la devise de l'utilisateur
  const priceFormatted = formatPrice(50); // "54,25 $" si currency = USD

  // Exemple 2: Conversion manuelle
  const convertedAmount = convertPrice(50, 'EUR', 'USD'); // 54.25

  return <div>{priceFormatted}</div>;
};
```

## 🔄 Flux de Conversion

```
1. Salon configure sa devise (ex: EUR) dans Settings
   ↓
2. Prix stockés en devise du salon (50 EUR)
   ↓
3. Client visite le site depuis USA
   ↓
4. Détection automatique: currency = USD
   ↓
5. CurrencyContext charge les taux de change
   ↓
6. formatPrice(50) convertit: 50 EUR → 54.25 USD
   ↓
7. Affichage: "$54.25"
```

## 📊 Exemple Complet

### Page Publique de Réservation

```javascript
// BookingLanding.js
import { useCurrency } from '../../contexts/CurrencyContext';
import usePublicBooking from '../../hooks/usePublicBooking';

const BookingLanding = () => {
  const { formatPrice, setSalonBaseCurrency } = useCurrency();
  const { salon, services, fetchSalon, fetchServices } = usePublicBooking(slug);

  useEffect(() => {
    const loadData = async () => {
      // 1. Charger les infos du salon
      const salonData = await fetchSalon();

      // 2. Définir la devise de base pour les conversions
      if (salonData?.currency) {
        setSalonBaseCurrency(salonData.currency);
      }

      // 3. Charger les services
      await fetchServices();
    };

    loadData();
  }, []);

  return (
    <div>
      {services.map(service => (
        <div key={service.id}>
          <h3>{service.name}</h3>
          {/* Prix converti automatiquement */}
          <p>{formatPrice(service.price)}</p>
        </div>
      ))}
    </div>
  );
};
```

## 🛠️ Configuration et Installation

### 1. Installer le package node-fetch (backend)

```bash
cd salonhub-backend
npm install node-fetch
```

### 2. Vérifier les imports dans server.js

Le fichier `salonhub-backend/src/server.js` doit inclure:

```javascript
// Routes currency (publiques - taux de change)
app.use("/api/currency", require("./routes/currency"));
```

### 3. Exécuter la migration SQL

```bash
mysql -u root -p salonhub < salonhub-backend/database/add_currency_to_tenants.sql
```

### 4. Redémarrer le backend

```bash
cd salonhub-backend
npm start
```

### 5. Tester l'API

```bash
# Vérifier que l'endpoint fonctionne
curl http://localhost:5000/api/currency/rates

# Tester une conversion
curl "http://localhost:5000/api/currency/convert?amount=50&from=EUR&to=USD"
```

## 🧪 Tests

### Test 1: Conversion EUR → USD

```bash
# Salon configuré en EUR, service à 50€
# Client depuis USA

Étapes:
1. Aller sur /book/mon-salon
2. Vérifier que les prix s'affichent en USD (ex: $54.25)
3. Comparer avec le taux officiel EUR/USD du jour
```

### Test 2: Même Devise (Pas de Conversion)

```bash
# Salon en EUR, client en France

Étapes:
1. Aller sur /book/mon-salon
2. Les prix doivent s'afficher en EUR sans conversion
3. 50 EUR → 50,00 €
```

### Test 3: Changement Manuel de Devise

```bash
Étapes:
1. Se connecter comme admin
2. Aller dans Paramètres
3. Changer la devise du salon de EUR à USD
4. Vérifier que les prix sont désormais stockés et affichés en USD
```

## ⚙️ API de Taux de Change

### Fournisseur: exchangerate-api.com

**Avantages:**
- ✅ Gratuit (1500 requêtes/mois)
- ✅ Pas de clé API requise
- ✅ Taux mis à jour quotidiennement
- ✅ Couvre toutes les devises majeures

**Limites:**
- ⚠️ 1500 requêtes/mois (largement suffisant avec le cache)
- ⚠️ Base EUR uniquement (pas un problème, on fait les conversions)

### Alternative

Si vous dépassez la limite, vous pouvez utiliser:

**fixer.io** (nécessite une clé API gratuite)

```javascript
// Modifier currencyService.js
const API_URL = `https://api.fixer.io/latest?access_key=VOTRE_CLE_API&base=EUR`;
```

## 🔐 Sécurité

### Données Stockées

- ✅ **Prix**: Stockés dans la devise du salon (pas de conversion en base)
- ✅ **Devise salon**: Stockée dans `tenants.currency`
- ✅ **Préférence utilisateur**: localStorage navigateur
- ✅ **Taux de change**: Cache mémoire backend (24h)

### Pas de Données Sensibles

- ❌ Aucune donnée bancaire
- ❌ Aucune transaction financière
- ❌ Aucun compte client créé
- ✅ Uniquement affichage de prix convertis

## 📈 Performance

### Cache Intelligent

```javascript
// Les taux sont chargés 1 fois toutes les 24h
// Toutes les conversions utilisent le cache en mémoire

Premier chargement:    ~200ms (API externe)
Conversions suivantes:  <1ms (cache)
```

### Optimisations

1. **Taux chargés globalement** (pas par service)
2. **Un seul appel API par jour** (cache 24h)
3. **Conversions côté client** (pas de surcharge serveur)
4. **Fallback élégant** si API indisponible

## 🐛 Dépannage

### Les prix ne se convertissent pas

**Causes possibles:**
1. API de taux de change indisponible
   - **Solution**: Vérifier `http://localhost:5000/api/currency/rates`

2. Devise du salon non définie
   - **Solution**: Aller dans Paramètres → Définir la devise

3. Cache navigateur
   - **Solution**: Vider localStorage et recharger

### Taux de change incorrects

1. Vérifier la date du cache: `GET /api/currency/rates`
2. Forcer le rafraîchissement: `POST /api/currency/refresh`
3. Comparer avec les taux officiels du jour

### Erreur "exchangeRates is null"

**Cause**: L'API n'a pas encore chargé les taux

**Solution**: Ajouter un état de chargement

```javascript
const { formatPrice, exchangeRates } = useCurrency();

if (!exchangeRates) {
  return <div>Chargement des taux...</div>;
}
```

## 📝 Notes de Développement

### Ajouter une Nouvelle Devise

1. Ajouter dans `CURRENCIES` (CurrencyContext.js)
2. Ajouter le mapping pays dans `COUNTRY_TO_CURRENCY`
3. Redémarrer le frontend

### Changer de Fournisseur de Taux

Modifier `currencyService.js`:

```javascript
// Remplacer
const API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';

// Par (exemple fixer.io)
const API_URL = 'https://api.fixer.io/latest?access_key=VOTRE_CLE';
```

### Ajouter des Frais de Conversion

```javascript
// Dans convertPrice (CurrencyContext.js)
const convertPrice = (amount, fromCurrency, toCurrency) => {
  // ... conversion existante
  const converted = amount * (toRate / fromRate);

  // Ajouter 2% de frais si différentes devises
  const withFees = fromCurrency !== toCurrency
    ? converted * 1.02
    : converted;

  return Math.round(withFees * 100) / 100;
};
```

## ✅ Checklist Post-Installation

- [ ] Backend démarre sans erreur
- [ ] Endpoint `/api/currency/rates` accessible
- [ ] Migration SQL exécutée
- [ ] Salon a une devise configurée
- [ ] Prix sur pages publiques se convertissent
- [ ] Changement de devise dans Settings fonctionne
- [ ] Taux de change mis à jour quotidiennement

## 📞 Support

En cas de problème:
1. Vérifier les logs backend (terminal)
2. Vérifier la console navigateur (F12)
3. Tester les endpoints API manuellement
4. Consulter [SYSTEME-DEVISES.md](./SYSTEME-DEVISES.md) pour la base

---

**Version:** 2.0.0 (avec conversion temps réel)
**Date:** 2025-01-13
**Auteur:** Claude Code Assistant
