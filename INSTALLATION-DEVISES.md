# 🚀 Installation du Système de Devises

## Étapes Rapides

### 1. Migration Base de Données ⚡

```bash
# Depuis le dossier racine du projet
mysql -u root -p salonhub < salonhub-backend/database/add_currency_to_tenants.sql
```

**Entrez votre mot de passe MySQL quand demandé.**

✅ Cette commande va :
- Ajouter la colonne `currency` à la table `tenants`
- Détecter automatiquement la devise selon le pays de chaque salon
- Configurer EUR par défaut pour les salons sans pays

### 2. Vérification (Optionnel)

```bash
# Vérifier que la colonne a été ajoutée
mysql -u root -p salonhub -e "DESCRIBE tenants;"

# Vérifier les devises attribuées
mysql -u root -p salonhub -e "SELECT name, country, currency FROM tenants;"
```

### 3. Redémarrer le Backend

```bash
cd salonhub-backend
npm start
```

### 4. Tester le Frontend

```bash
cd salonhub-frontend
npm start
```

Accédez à: `http://localhost:3000`

## 🧪 Test du Système

### Test 1: Affichage Automatique
1. Connectez-vous à votre compte salon
2. Allez sur la page **Services**
3. Les prix doivent s'afficher dans la devise détectée (ex: `50,00 €`)

### Test 2: Configuration Manuelle
1. Menu utilisateur → **Paramètres**
2. Section **Devise de votre salon**
3. Changez la devise (ex: USD)
4. Sauvegardez
5. Retournez sur **Services**
6. Les prix doivent maintenant s'afficher en USD (ex: `$50.00`)

### Test 3: Persistance
1. Rechargez la page (F5)
2. La devise sélectionnée doit être conservée
3. Fermez et rouvrez le navigateur
4. La devise doit toujours être la même

## ✅ Checklist Post-Installation

- [ ] Migration SQL exécutée sans erreurs
- [ ] Backend redémarré
- [ ] Frontend compile sans warnings critiques
- [ ] Les prix s'affichent correctement
- [ ] Le sélecteur de devise est visible dans Paramètres
- [ ] Le changement de devise fonctionne
- [ ] La devise est persistée après rechargement

## 🎯 Configuration par Pays

Le système détecte automatiquement la devise selon ces mappings :

| Pays | Code | Devise |
|------|------|--------|
| France, Belgique, Luxembourg | FR, BE, LU | EUR |
| Suisse | CH | CHF |
| États-Unis | US | USD |
| Canada | CA | CAD |
| Royaume-Uni | GB | GBP |
| Maroc, Algérie, Tunisie | MA, DZ, TN | MAD |
| Sénégal, Côte d'Ivoire, etc. | SN, CI, ... | XOF |
| Cameroun, Gabon, etc. | CM, GA, ... | XAF |

## 🔧 Personnalisation

### Changer la Devise par Défaut

Éditez `salonhub-frontend/src/contexts/CurrencyContext.js` ligne 52 :

```javascript
return "EUR"; // Changez en "USD", "GBP", etc.
```

### Ajouter une Nouvelle Devise

1. Éditez `CURRENCIES` dans `CurrencyContext.js`
2. Ajoutez le mapping pays dans `COUNTRY_TO_CURRENCY`
3. Redémarrez le frontend

## 📞 Support

En cas de problème :
1. Vérifiez les logs du navigateur (F12 → Console)
2. Vérifiez les logs du backend terminal
3. Consultez [SYSTEME-DEVISES.md](./SYSTEME-DEVISES.md) pour la documentation complète

---

**Temps d'installation estimé:** 5 minutes ⏱️
