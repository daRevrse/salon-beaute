# SalonHub Landing Page

Une landing page moderne et responsive pour SalonHub by FlowKraft - Solution SaaS de gestion pour salons de beauté.

## 📁 Structure du projet

```
landing/
├── index.html           # Page HTML principale
├── styles.css          # Styles CSS (séparés pour meilleure organisation)
├── script.js           # JavaScript (animations et interactions)
├── logo_fk_black.png   # Logo FlowKraft (version noire)
├── logo_fk_white.png   # Logo FlowKraft (version blanche)
├── 1.jpg               # Image dashboard
├── 2.jpg               # Image hero
├── 3.jpg               # Image planning
└── README.md           # Ce fichier
```

## 🎨 Caractéristiques

### Structure de la page

1. **Header / Navigation**
   - Logo cliquable
   - Navigation sticky avec effet au scroll
   - Liens vers les sections principales

2. **Hero Section**
   - Titre accrocheur
   - Description du produit
   - Formulaire de capture d'email
   - Image illustrative

3. **Features Section**
   - 4 fonctionnalités principales avec icônes
   - Animations au scroll
   - Design en grille responsive

4. **Image Showcase**
   - Présentation visuelle du produit
   - 2 images de démonstration

5. **Pricing Section**
   - 3 plans tarifaires (Starter, Pro, Business)
   - Card "Pro" mise en avant
   - Boutons d'action

6. **CTA Section** ✨ NOUVEAU
   - Call-to-Action principal
   - 2 boutons d'action (Commencer / Démo)
   - Design gradient attractif

7. **Footer**
   - 5 colonnes d'informations
   - Liens sociaux
   - Newsletter
   - Badges App Store / Google Play
   - Informations légales

### Fonctionnalités JavaScript

- **Animations au scroll** : Fade-in des éléments
- **Header sticky** : Avec effet d'ombre au scroll
- **Smooth scroll** : Navigation fluide entre sections
- **Validation de formulaire** : Vérification des emails
- **Système de notifications** : Toast messages élégants
- **Lazy loading** : Optimisation du chargement des images
- **Console branding** : Message de bienvenue développeur

### Design & UX

- **Responsive** : Adapté à tous les écrans (mobile, tablette, desktop)
- **Animations fluides** : Transitions CSS soignées
- **Accessibilité** : Labels ARIA, attributs alt, contraste optimisé
- **Performance** : Code optimisé, assets légers

## 🎨 Palette de couleurs

```css
--violet: #764BA2    /* Couleur principale */
--noir: #1a1a1a      /* Texte principal */
--gris: #f5f5f7      /* Arrière-plans */
--blanc: #ffffff     /* Fond principal */
```

## 🚀 Utilisation

1. Ouvrez simplement `index.html` dans un navigateur
2. Tous les fichiers CSS et JS sont liés automatiquement
3. Assurez-vous que les images sont présentes dans le dossier

## 📱 Responsive Breakpoints

- **Desktop** : > 1024px
- **Tablet** : 768px - 1024px
- **Mobile** : < 768px
- **Small Mobile** : < 480px

## 🔧 Personnalisation

### Modifier les couleurs

Éditez les variables CSS dans `styles.css` :

```css
:root {
    --violet: #votrecouleur;
    --noir: #votrecouleur;
    --gris: #votrecouleur;
    --blanc: #votrecouleur;
}
```

### Ajouter des sections

1. Ajoutez le HTML dans `index.html`
2. Créez les styles correspondants dans `styles.css`
3. Ajoutez les interactions dans `script.js` si nécessaire

## 🌟 Améliorations apportées

### Par rapport à l'ancienne version :

✅ **Séparation des fichiers** : CSS et JS externalisés pour une meilleure organisation
✅ **Section CTA ajoutée** : Zone dédiée pour convertir les visiteurs
✅ **Code nettoyé** : Suppression des redondances et optimisation
✅ **Commentaires structurés** : Sections clairement identifiées
✅ **Accessibilité améliorée** : Attributs ARIA et labels
✅ **Système de notifications** : Feedback utilisateur élégant
✅ **Smooth scroll** : Navigation plus fluide
✅ **Performance** : Lazy loading des images

## 📝 Notes techniques

- **Font Awesome 6.4.0** : Utilisé pour les icônes
- **Pas de dépendances** : Pure HTML/CSS/JS (vanilla)
- **Compatible IE11+** : Avec polyfills si nécessaire
- **SEO optimisé** : Meta tags et structure sémantique

## 📞 Support

Pour toute question ou support :
- Email : contact@flowkraftagency.com
- Téléphone : +33 1 23 45 67 89

---

**Développé par FlowKraft Agency** © 2025
