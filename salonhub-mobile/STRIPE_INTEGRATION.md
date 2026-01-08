# 💳 Intégration Stripe - SalonHub Mobile

## ✅ Installation Complétée

L'intégration Stripe a été ajoutée à l'application mobile SalonHub pour gérer les paiements d'abonnement.

## 📦 Packages Installés

```bash
npm install @stripe/stripe-react-native
```

**Package:** `@stripe/stripe-react-native`
- Version installée automatiquement
- SDK officiel Stripe pour React Native
- Compatible avec Expo

## 🏗️ Architecture

### Fichiers Créés

1. **[src/services/stripeService.js](src/services/stripeService.js)**
   - Service pour gérer les appels API Stripe
   - Fonctions: `createPaymentIntent`, `confirmSubscription`, `getStripePublishableKey`, `getPlanDetails`

2. **[src/screens/PaymentScreen.js](src/screens/PaymentScreen.js)**
   - Écran de paiement avec formulaire de carte
   - Intégration du composant `CardField` de Stripe
   - Gestion du paiement et des erreurs

### Fichiers Modifiés

1. **[src/screens/RegisterScreen.js](src/screens/RegisterScreen.js)**
   - Redirection vers PaymentScreen au lieu de créer le compte directement
   - Passage des données utilisateur à l'écran de paiement

2. **[src/navigation/AppNavigator.js](src/navigation/AppNavigator.js)**
   - Ajout de PaymentScreen dans le stack de navigation auth

## 🎯 Flux d'Inscription avec Paiement

### Avant (sans paiement)
```
Register (Step 1) → Register (Step 2) → Register (Step 3) → API call → Login
```

### Maintenant (avec Stripe)
```
Register (Step 1: Salon)
  ↓
Register (Step 2: Compte)
  ↓
Register (Step 3: Plan)
  ↓
PaymentScreen (Carte bancaire)
  ↓
Stripe Payment
  ↓
API call (créer compte + abonnement)
  ↓
Login
```

## 💳 Écran de Paiement (PaymentScreen)

### Fonctionnalités

1. **Récapitulatif du Plan**
   - Affiche le plan choisi (Essential, Professional, Enterprise)
   - Prix et fonctionnalités
   - Badge "Populaire" pour Professional

2. **Info Période d'Essai**
   - Box avec icône cadeau
   - "14 jours d'essai gratuit"
   - Texte explicatif sur la facturation

3. **Formulaire de Carte Stripe**
   - Composant `CardField` de Stripe
   - Validation automatique
   - Code postal activé
   - Style personnalisé cohérent avec l'app

4. **Boutons d'Action**
   - **Bouton principal**: "Commencer l'essai gratuit"
   - **Bouton secondaire**: "Commencer l'essai sans carte maintenant"

5. **Sécurité**
   - Icône cadenas
   - Texte "Paiement sécurisé par Stripe"
   - Liens vers CGU et politique de confidentialité

### Design

- Couleurs cohérentes avec le reste de l'app (Indigo #6366F1)
- Icons Ionicons
- Ombres et élévations identiques
- ScrollView pour petits écrans
- Bouton retour en haut à gauche

## 🔧 Service Stripe (stripeService.js)

### Fonctions Disponibles

#### 1. `createPaymentIntent(planId)`
Crée un PaymentIntent côté serveur.

```javascript
const result = await createPaymentIntent('professional');
// Returns: { success: true, clientSecret: 'pi_xxx', amount: 2999 }
```

**API Backend requise**: `POST /api/payments/create-payment-intent`

#### 2. `confirmSubscription(planId, paymentMethodId)`
Confirme l'abonnement après le paiement.

```javascript
const result = await confirmSubscription('professional', 'pm_xxx');
// Returns: { success: true, subscription: {...} }
```

**API Backend requise**: `POST /api/payments/confirm-subscription`

#### 3. `getStripePublishableKey()`
Récupère la clé publique Stripe depuis le backend.

```javascript
const result = await getStripePublishableKey();
// Returns: { success: true, publishableKey: 'pk_xxx' }
```

**API Backend requise**: `GET /api/payments/config`

#### 4. `getPlanDetails(planId)`
Retourne les détails d'un plan (local, pas d'API call).

```javascript
const plan = getPlanDetails('professional');
// Returns: { id, name, price, priceId, features }
```

## 🔑 Configuration Requise

### 1. Backend - Endpoints à Créer

Le backend doit fournir ces endpoints:

```javascript
// 1. Récupérer la config Stripe
GET /api/payments/config
Response: {
  success: true,
  data: {
    publishableKey: "pk_live_xxx" // ou pk_test_xxx
  }
}

// 2. Créer un PaymentIntent
POST /api/payments/create-payment-intent
Body: { plan: "professional" }
Response: {
  success: true,
  data: {
    clientSecret: "pi_xxx_secret_xxx",
    amount: 2999 // en centimes
  }
}

// 3. Confirmer l'abonnement et créer le compte
POST /api/payments/confirm-subscription
Body: {
  plan: "professional",
  paymentMethodId: "pm_xxx",
  // + données utilisateur de l'inscription
}
Response: {
  success: true,
  data: {
    subscription: {...},
    user: {...}
  }
}
```

### 2. Stripe Dashboard

Dans le Stripe Dashboard, créer les Price IDs pour chaque plan:

```javascript
// À mettre à jour dans stripeService.js, fonction getPlanDetails()
essential: {
  priceId: 'price_xxxxxxxxxxxxx', // Essential 9.99€/mois
}
professional: {
  priceId: 'price_xxxxxxxxxxxxx', // Professional 29.99€/mois
}
enterprise: {
  priceId: 'price_xxxxxxxxxxxxx', // Enterprise 69.99€/mois
}
```

### 3. Variables d'Environnement Backend

```env
STRIPE_SECRET_KEY=sk_test_xxx  # ou sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # ou pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## 🧪 Mode Test

Pour tester l'intégration, utiliser les cartes de test Stripe:

### Cartes de Test Valides
- **Succès**: `4242 4242 4242 4242`
- **Authentification requise**: `4000 0025 0000 3155`
- **Carte déclinée**: `4000 0000 0000 9995`

### Autres Infos Test
- **Date d'expiration**: N'importe quelle date future (ex: 12/34)
- **CVC**: N'importe quel 3 chiffres (ex: 123)
- **Code postal**: N'importe quel code valide (ex: 75001)

## 🔄 Flux Complet avec Paiement

### 1. Utilisateur remplit l'inscription (3 étapes)
- Step 1: Informations du salon
- Step 2: Compte utilisateur
- Step 3: Choix du plan

### 2. Clic sur "Continuer vers le paiement"
- Navigation vers PaymentScreen
- Passage des `userData` et `planId` en paramètres

### 3. PaymentScreen s'affiche
- Récupération de la clé publique Stripe
- Affichage du récapitulatif du plan
- Formulaire de carte

### 4. Utilisateur entre sa carte
- Validation en temps réel par Stripe
- `cardComplete` passe à `true`

### 5. Clic sur "Commencer l'essai gratuit"
- Appel `createPaymentIntent` → récupère `clientSecret`
- Appel `confirmPayment` avec le clientSecret
- Stripe traite le paiement

### 6. Paiement réussi
- Alert de confirmation
- Création du compte via API backend
- Redirection vers LoginScreen

### Alternative: "Commencer sans carte"
- Alert de confirmation
- Création du compte en mode essai (sans paiement)
- Redirection vers LoginScreen

## 🎨 Composants Stripe Utilisés

### StripeProvider
Wrapper principal pour activer Stripe dans l'app.

```jsx
<StripeProvider publishableKey={publishableKey}>
  {/* Contenu de l'app */}
</StripeProvider>
```

### CardField
Composant de formulaire de carte tout-en-un.

```jsx
<CardField
  postalCodeEnabled={true}
  placeholders={{ number: '4242 4242 4242 4242' }}
  cardStyle={styles.card}
  style={styles.cardField}
  onCardChange={(cardDetails) => {
    setCardComplete(cardDetails.complete);
  }}
/>
```

### useConfirmPayment
Hook pour confirmer un paiement.

```javascript
const { confirmPayment } = useConfirmPayment();

const { error, paymentIntent } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});
```

## 📱 Gestion des Erreurs

### Erreurs Stripe
- Carte déclinée → Alert avec message Stripe
- Carte expirée → Validation automatique du CardField
- Fonds insuffisants → Alert avec message Stripe

### Erreurs Réseau
- Timeout → Alert "Erreur de connexion au serveur"
- Backend indisponible → Alert avec message d'erreur

### Erreurs Utilisateur
- Carte incomplète → Alert "Veuillez remplir les informations de carte"
- Navigation arrière → Retour à RegisterScreen (données conservées)

## 🔐 Sécurité

### Ce qui est Sécurisé ✅
- Aucune donnée de carte stockée sur le serveur
- Toutes les données de carte transitent par Stripe uniquement
- HTTPS obligatoire
- PaymentIntent utilisé (recommandation Stripe)

### Ce qui N'est PAS dans l'App ❌
- Clé secrète Stripe (uniquement côté backend)
- Détails complets de carte (tokenisés par Stripe)
- Numéros de carte en clair

## 📊 Données Envoyées au Backend

Après un paiement réussi, le backend reçoit:

```javascript
POST /api/payments/confirm-subscription
{
  // Plan
  plan: "professional",

  // Payment Method ID (depuis Stripe)
  paymentMethodId: "pm_xxxxxxxxxxxxx",

  // Données utilisateur (depuis RegisterScreen)
  salonName: "Salon Beauté Paris",
  salonEmail: "contact@salon.fr",
  salonPhone: "01 23 45 67 89",
  salonAddress: "123 Rue de la Paix",
  salonCity: "Paris",
  salonPostalCode: "75001",
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie@example.com",
  password: "hashedPassword"
}
```

## 🚀 Prochaines Étapes

### Backend à Implémenter
1. ✅ Créer les 3 endpoints Stripe
2. ✅ Créer les Products/Prices dans Stripe Dashboard
3. ✅ Configurer les webhooks Stripe
4. ✅ Gérer la période d'essai (14 jours)
5. ✅ Créer le compte utilisateur après paiement réussi

### Fonctionnalités Futures
- Gestion des webhooks Stripe (payment succeeded, failed, etc.)
- Écran de gestion d'abonnement dans Settings
- Changement de plan
- Annulation d'abonnement
- Historique de paiements
- Reçus par email

## 🎯 Avantages de cette Intégration

1. **Sécurité Maximale**
   - Données de carte jamais stockées
   - Conformité PCI-DSS automatique via Stripe

2. **UX Optimale**
   - Formulaire de carte natif Stripe
   - Validation en temps réel
   - Messages d'erreur clairs

3. **Flexibilité**
   - Option d'essai sans carte
   - Changement de plan facile (futur)
   - Support multi-devises (futur)

4. **Maintenance Facile**
   - Code modulaire et réutilisable
   - Service Stripe isolé
   - Documentation complète

## 📝 Notes Importantes

### Environnement de Test
- Utiliser `pk_test_xxx` pendant le développement
- Passer à `pk_live_xxx` en production
- Ne JAMAIS commiter les clés dans Git

### Période d'Essai
- 14 jours gratuits sur tous les plans
- Aucune carte requise SI l'utilisateur clique "Commencer sans carte"
- Carte requise pour activer l'essai avec paiement automatique après

### Compatibilité
- ✅ iOS (nécessite configuration Stripe dans Info.plist)
- ✅ Android (fonctionne out-of-the-box)
- ✅ Expo Go (fonctionne avec SDK)

## 🔗 Ressources

- [Documentation Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Cartes de test Stripe](https://stripe.com/docs/testing)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)

---

**✨ L'intégration Stripe est maintenant complète côté mobile!**

Le backend doit maintenant implémenter les endpoints nécessaires pour finaliser le flux de paiement.
