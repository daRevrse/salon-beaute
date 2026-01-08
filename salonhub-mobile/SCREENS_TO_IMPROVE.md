# 📱 Écrans à Améliorer - Version Mobile

Basé sur les captures d'écran de la version web, voici les améliorations à apporter aux écrans mobiles.

---

## 1. 🏠 Dashboard (Déjà corrigé partiellement)

### ✅ Ce qui fonctionne
- Chargement des statistiques via API
- Pull to refresh
- Cards de statistiques

### 🔨 À améliorer
**Référence**: Capture web du Dashboard

#### Ajouts nécessaires:
1. **Bannière d'alerte** (en haut)
   - ⚠️ Configuration requise: Horaires d'ouverture
   - Message: "Vos horaires d'ouverture ne sont pas configurés. Sans cette configuration, vos clients ne pourront PAS réserver en ligne !"
   - Bouton: "Configurer mes horaires maintenant →"
   - Couleur: Rose/Rouge avec icône

2. **Stats supplémentaires** (ligne 2)
   - **Revenu aujourd'hui**: 0,00 F CFA + "RDV complétés" (vert)
   - **Revenu ce mois**: 0,00 F CFA + "0 RDV complétés" (bleu)
   - **Complétés ce mois**: 0 + "Rendez-vous terminés" (vert)
   - **Annulés ce mois**: 0 + "À surveiller" (rouge)

3. **Section "Rendez-vous d'aujourd'hui"**
   - Card avec titre et "Voir tout" en lien
   - Liste des RDV avec:
     - Heure + durée
     - Nom client + téléphone
     - Service + durée
     - Employé
     - Boutons d'actions: Confirmer, Annuler, Terminer, Supprimer
   - État vide: "Aucun rendez-vous prévu pour aujourd'hui"

4. **Section "Services populaires"**
   - Top 3-5 services les plus réservés
   - État vide: "Aucune donnée disponible"

5. **Section "Clients récents"**
   - Liste des 5 derniers clients
   - Avatar + Nom + Email + Date d'inscription
   - Bouton "Voir tout"
   - État vide: "Aucun client"

---

## 2. 📅 Rendez-vous (AppointmentsScreen)

**Référence**: Capture web Rendez-vous

### 🔨 À améliorer

#### Design actuel basique → Design web moderne

1. **Filtres en haut**
   - **Filtre par date**: Input date avec icône calendrier
   - **Filtre par statut**: Boutons pills
     - Tous (actif par défaut)
     - En attente
     - Confirmés
   - Boutons avec fond coloré quand actif

2. **Toggle Vue**
   - Bouton "Liste" (actif) / "Calendrier"
   - Positionné à droite après les filtres

3. **Tableau des rendez-vous**
   Colonnes:
   - **DATE & HEURE**: 08/01/2026 + 15:21 - 16:04
   - **CLIENT**: Nom + Téléphone
   - **SERVICE**: Nom + Durée (ex: "43 min")
   - **EMPLOYÉ**: Nom de l'employé
   - **STATUT**: Badge coloré
     - Jaune: "En attente"
     - Vert: "Confirmé"
     - Bleu: "Complété"
     - Rouge: "Annulé"
   - **ACTIONS**: 4 boutons
     - Confirmer (vert)
     - Annuler (rouge)
     - Terminer (bleu)
     - Supprimer (rouge outline)

4. **Bouton "+ Nouveau rendez-vous"**
   - Position: En haut à droite
   - Couleur: Indigo (#6366F1)

---

## 3. 👥 Clients (ClientsScreen)

**Référence**: Capture web Clients

### 🔨 À améliorer

1. **Barre de recherche**
   - Placeholder: "Rechercher un client (nom, email, téléphone)..."
   - Icône loupe à gauche
   - Full width en haut

2. **Tableau des clients**
   Colonnes:
   - **NOM**: Avatar circulaire + Nom complet
   - **EMAIL**: Icône mail + adresse
   - **TÉLÉPHONE**: Numéro
   - **CRÉÉ LE**: Date d'inscription

3. **Card client** (au clic)
   - Avatar grand
   - Nom complet
   - Email + Téléphone
   - Statistiques:
     - Total RDV
     - Complétés
     - À venir
   - Boutons: Modifier, Supprimer

4. **Bouton "+ Nouveau client"**
   - Position: En haut à droite
   - Couleur: Indigo (#6366F1)

---

## 4. ✂️ Services (ServicesScreen)

**Référence**: Capture web Services

### 🔨 À améliorer

1. **Onglets de catégories**
   - "Tous" (actif)
   - "Dolores Nihil Aperia"
   - Autres catégories dynamiques
   - Style: Pills avec fond violet quand actif

2. **Cards de services**
   - Image/Photo du service en haut
   - Nom du service (ex: "Bethany Brady")
   - Catégorie avec icône (ex: "Dolores Nihil Aperia")
   - Description courte: "Ab nemo sint nostrum"
   - **Prix en gros**: "315 516,76 F CFA" (violet)
   - **Durée**: Icône horloge + "43 min"
   - Boutons:
     - "Modifier" (outline)
     - "Supprimer" (rouge texte)

3. **Grid layout**
   - 1 colonne sur mobile
   - Cards avec ombres légères
   - Spacing cohérent

4. **Bouton "+ Nouveau service"**
   - Position: En haut à droite
   - Couleur: Violet (#8B5CF6)

---

## 5. 🏷️ Promotions (À ajouter)

**Référence**: Capture web Promotions

### 🆕 Nouvel écran à créer

**Position**: Dans Settings → Section "Promotions"

#### Structure:

1. **Stats en haut (4 cards)**
   - **Total Promotions**: 0 (violet)
   - **Actives**: 0 (vert)
   - **Utilisations**: 0 (bleu)
   - **Réductions**: 0,00 F CFA (orange)

2. **Onglets**
   - Toutes (actif)
   - Actives
   - Expirées

3. **État vide**
   - Icône étiquette grise
   - "Aucune promotion"
   - "Créez votre première promotion pour attirer plus de clients"
   - Bouton "+ Créer une promotion" (centré)

4. **Liste des promotions** (quand il y en a)
   - Code promo
   - Description
   - Réduction (% ou montant)
   - Dates validité
   - Nombre d'utilisations
   - Statut (badge)
   - Actions: Modifier, Désactiver, Supprimer

5. **Bouton "+ Nouvelle promotion"**
   - Position: En haut à droite
   - Couleur: Violet (#8B5CF6)

---

## 6. ⚙️ Paramètres (SettingsScreen)

**Référence**: Capture web Paramètres

### 🔨 À améliorer

#### Structure actuelle → Structure web

**Version web a 2 écrans:**

### A. Page profil utilisateur
- Header avec fond dégradé violet
  - Avatar circulaire
  - Nom utilisateur
  - Email
  - Téléphone ou "Non renseigné"
  - Stats: Total RDV | Complétés | À venir
- Onglets:
  - **Informations personnelles**
    - Photo de profil (upload)
    - Prénom, Nom
    - Email, Téléphone
    - Boutons: Annuler, Enregistrer
  - **Sécurité**
    - Changer mot de passe
  - **Statistiques**
    - Graphiques de performance

### B. Paramètres du salon
**5 onglets:**

1. **📋 Général** (Identité du salon)
   - Logo du salon (upload, carré, icône)
   - Bannière du salon (upload, large, pour page réservation)
   - Nom du salon
   - URL de réservation: http://localhost:3000/book/dbz + Bouton "Copier"
   - Boutons: Annuler, Enregistrer

2. **💳 Facturation**
   - Informations de facturation
   - Méthodes de paiement
   - Historique des factures

3. **🕐 Horaires**
   - Configuration des horaires d'ouverture par jour
   - Lundi à Dimanche
   - Ouvert/Fermé toggle
   - Horaires de début/fin
   - Bouton "Enregistrer les horaires"

4. **👥 Staff**
   - Liste des employés
   - Ajouter un employé
   - Gérer les permissions

5. **🔔 Notifications**
   - Paramètres de notifications
   - Email, SMS, Push
   - Types de notifications à recevoir

### Structure mobile à adopter:

**SettingsScreen** → Liste de navigation vers:
1. Mon profil
2. Paramètres du salon
   - Général
   - Facturation
   - Horaires
   - Staff
   - Notifications
3. Promotions (nouvel écran)
4. Aide & Support
5. Déconnexion

---

## 🎨 Design System Mobile

### Couleurs
```javascript
primary: '#6366F1',      // Indigo
success: '#10B981',      // Vert
warning: '#F59E0B',      // Orange/Jaune
danger: '#EF4444',       // Rouge
info: '#3B82F6',         // Bleu
purple: '#8B5CF6',       // Violet
gray: {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  600: '#4B5563',
  700: '#374151',
  900: '#111827',
}
```

### Composants réutilisables à créer

1. **StatCard** (déjà existant, à améliorer)
   - Icône + couleur
   - Valeur grande
   - Titre
   - Sous-titre
   - onPress optionnel
   - Bordure gauche colorée

2. **FilterButton**
   - Text + Badge count optionnel
   - État actif/inactif
   - Couleurs dynamiques

3. **ActionButton**
   - Icône + Text
   - Variantes: primary, success, danger, outline
   - Tailles: sm, md, lg

4. **StatusBadge**
   - Text avec background coloré
   - Variantes: pending, confirmed, completed, cancelled
   - Border radius pill

5. **SearchBar**
   - Input avec icône loupe
   - Clear button quand texte présent
   - Placeholder personnalisable

6. **EmptyState**
   - Icône grise
   - Titre
   - Description
   - Bouton CTA optionnel

7. **AlertBanner**
   - Icône + Message
   - Bouton d'action
   - Couleurs: warning, error, info, success
   - Dismissable optionnel

---

## 📋 Priorités d'Implémentation

### Phase 1: Critiques (à faire maintenant)
1. ✅ Dashboard - Correction des appels API (FAIT)
2. 🔨 Dashboard - Ajout bannière horaires d'ouverture
3. 🔨 Dashboard - Sections RDV du jour + Clients récents
4. 🔨 AppointmentsScreen - Design complet avec filtres et tableau
5. 🔨 SettingsScreen - Structure avec navigation vers sous-écrans

### Phase 2: Importantes
1. 🔨 ServicesScreen - Cards avec images et catégories
2. 🔨 ClientsScreen - Recherche et tableau amélioré
3. 🔨 Paramètres Salon - Tous les onglets (Général, Horaires, Staff, etc.)
4. 🔨 Profil Utilisateur - Page dédiée avec onglets

### Phase 3: Nice to have
1. 🔨 PromotionsScreen - Nouvel écran complet
2. 🔨 Statistiques avancées
3. 🔨 Vue calendrier pour les RDV
4. 🔨 Notifications push

---

## 🚀 Prochaines Étapes

1. Créer les composants réutilisables (StatCard amélioré, FilterButton, etc.)
2. Améliorer le Dashboard avec les sections manquantes
3. Refaire l'écran Rendez-vous avec le design web
4. Restructurer Settings avec navigation
5. Ajouter l'écran Promotions

**Note**: Tous les écrans doivent utiliser le même design system (couleurs, typographie, spacing) que la version web pour une cohérence parfaite.
