# 🎨 Icônes PWA - Guide rapide

## Icônes requises

Pour que la PWA fonctionne correctement, vous devez ajouter les icônes suivantes dans le dossier `public/` :

### 1. favicon.ico
- **Taille** : 64x64, 32x32, 24x24, 16x16 pixels
- **Format** : ICO
- **Utilisation** : Favicon du site

### 2. logo192.png
- **Taille** : 192x192 pixels
- **Format** : PNG
- **Utilisation** : Icône PWA, notifications

### 3. logo512.png
- **Taille** : 512x512 pixels
- **Format** : PNG
- **Utilisation** : Splash screen, haute résolution

## 🎨 Création des icônes

### Option 1 : Outil en ligne (Recommandé)

Utilisez [RealFaviconGenerator](https://realfavicongenerator.net/) :
1. Uploadez votre logo SVG ou PNG (minimum 512x512)
2. Configurez les options pour chaque plateforme
3. Téléchargez le package complet
4. Extrayez les fichiers dans `public/`

### Option 2 : Avec un outil de design

**Figma / Sketch / Adobe XD** :
1. Créez un carré de 512x512 px
2. Centrez votre logo avec marge de 10%
3. Exportez en PNG :
   - `logo512.png` : 512x512
   - `logo192.png` : 192x192
4. Convertissez en ICO pour le favicon

**Canva** (gratuit) :
1. Créez un design 512x512 px
2. Ajoutez votre logo
3. Téléchargez en PNG
4. Utilisez [ICO Converter](https://icoconvert.com/) pour le favicon

### Option 3 : ImageMagick (ligne de commande)

```bash
# Depuis une image source (logo.png)
convert logo.png -resize 512x512 logo512.png
convert logo.png -resize 192x192 logo192.png
convert logo.png -resize 64x64 favicon.ico
```

## 📐 Bonnes pratiques

### Design

- ✅ Fond transparent ou couleur unie
- ✅ Logo centré avec marge (10-15%)
- ✅ Contraste élevé
- ✅ Éviter les détails fins (illisibles à petite taille)
- ✅ Format carré

### Couleurs

- **Fond transparent** : Recommandé pour s'adapter aux thèmes
- **Fond blanc** : Pour un look professionnel
- **Fond couleur** : Utiliser la couleur principale de la marque

### Exemples

```
✅ BON
┌─────────────┐
│   ┌─────┐   │
│   │ SH  │   │  Logo centré avec marge
│   └─────┘   │
└─────────────┘

❌ MAUVAIS
┌─────────────┐
│┌───────────┐│
││    SH     ││  Pas de marge
│└───────────┘│
└─────────────┘
```

## 🔍 Vérification

### Dans le navigateur

1. Ouvrir Chrome DevTools (F12)
2. Onglet **Application**
3. Section **Manifest**
4. Vérifier que les icônes s'affichent

### Lighthouse Audit

```bash
# Lancer un audit PWA
lighthouse https://votre-site.com --view
```

Vérifier :
- ✅ "Does not register a service worker" = Passed
- ✅ "Web app manifest meets the installability requirements" = Passed

## 🚀 Déploiement

Une fois les icônes ajoutées :

```bash
# Reconstruire l'application
npm run build

# Les icônes seront dans build/
ls build/*.png build/*.ico
```

## 📱 Prévisualisation

### iOS

Les icônes apparaîtront sur l'écran d'accueil :
- Coins arrondis automatiques
- Taille adaptée selon l'appareil

### Android

Les icônes apparaîtront dans le drawer :
- Format carré ou adaptatif
- Badge pour les notifications

### Desktop

Icône dans la barre des tâches ou le dock :
- Favicon pour l'onglet
- Logo PWA pour l'application installée

## 🎯 Templates

### Logo texte simple

```html
<!-- Créer avec HTML/CSS -->
<div style="width: 512px; height: 512px; background: #4f46e5;
            display: flex; align-items: center; justify-content: center;
            border-radius: 20%;">
  <span style="font-size: 200px; color: white; font-weight: bold;">
    SH
  </span>
</div>
```

### Logo avec SVG

```svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#4f46e5" rx="100"/>
  <text x="256" y="320" font-size="200" fill="white"
        text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">
    SH
  </text>
</svg>
```

## ❓ Problèmes courants

### Icône ne s'affiche pas

1. Vérifier le chemin dans `manifest.json`
2. Hard refresh (Ctrl + Shift + R)
3. Vider le cache du Service Worker
4. Réinstaller la PWA

### Icône pixelisée

- Utiliser des tailles exactes (192, 512)
- Format PNG avec transparence
- Résolution suffisante (minimum 512x512 pour la source)

### Icône mal cadrée

- Ajouter 10-15% de marge
- Centrer le logo
- Tester sur différents appareils

---

🎨 **Astuce** : Utilisez la couleur `#4f46e5` (indigo) pour correspondre au thème de SalonHub !
