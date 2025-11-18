# 🚀 SuperAdmin - Guide de démarrage rapide

## Installation en 3 étapes

### 1️⃣ Créer les tables en base de données

```bash
cd salonhub-backend
node scripts/setup-superadmin-tables.js
```

**Sortie attendue :**
```
=========================================
🚀 SETUP TABLES SUPERADMIN
=========================================

✅ Table super_admins créée
✅ Table admin_activity_logs créée
✅ Table system_settings créée

✅ SETUP TERMINÉ AVEC SUCCÈS
```

---

### 2️⃣ Créer votre premier SuperAdmin

```bash
node scripts/create-superadmin.js
```

**Remplissez les informations :**

```
📧 Email: admin@salonhub.com
👤 Prénom: Votre prénom
👤 Nom: Votre nom
🔑 Mot de passe: MotDePasseSecurise123!
🎯 Type de compte:
  1. Super Admin (tous les droits - fondateur)
  2. Admin (droits limités)
Choisir (1 ou 2): 1
```

**Sortie attendue :**
```
✅ SUPERADMIN CRÉÉ AVEC SUCCÈS !
   Email: admin@salonhub.com
   Type: SUPER ADMIN (tous les droits)
```

---

### 3️⃣ Se connecter à l'interface SuperAdmin

#### Démarrer le backend

```bash
cd salonhub-backend
npm start
```

#### Démarrer le frontend

```bash
cd salonhub-frontend
npm start
```

#### Accéder au portail SuperAdmin

1. Ouvrez votre navigateur
2. Accédez à : **http://localhost:3000/superadmin/login**
3. Connectez-vous avec vos identifiants
4. Vous êtes redirigé vers le dashboard SuperAdmin 🎉

---

## 📊 Que pouvez-vous faire ?

### Dashboard SuperAdmin

✅ **Vue d'ensemble du SaaS**
- Total de salons
- Salons actifs, en essai, suspendus
- Nouveaux salons (30 derniers jours)
- Statistiques globales (users, clients, RDV)

✅ **Gestion des salons**
- Liste de tous les salons inscrits
- Filtrer par statut, plan, recherche
- Voir les détails de chaque salon
- Suspendre/Réactiver un salon
- Supprimer définitivement un salon (Super Admin uniquement)

✅ **Analytics**
- Statistiques détaillées
- Répartition par plan d'abonnement
- Croissance mensuelle

✅ **Logs d'audit**
- Toutes les actions sont enregistrées
- Historique complet des actions SuperAdmin

---

## 🔐 Sécurité

- Les tokens SuperAdmin sont séparés des tokens salons
- Toutes les actions sont auditées et loggées
- Les Super Admins ont tous les droits
- Les Admins standards ont des permissions limitées

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- **[SUPERADMIN_GUIDE.md](salonhub-backend/SUPERADMIN_GUIDE.md)** - Guide complet
- API Routes
- Permissions
- Exemples d'utilisation

---

## ❓ Problèmes courants

### Le portail SuperAdmin ne s'affiche pas

✅ Vérifiez que le backend tourne sur le port 5000
✅ Vérifiez que le frontend tourne sur le port 3000
✅ Vérifiez que les routes sont activées dans `src/server.js`

### Impossible de se connecter

✅ Vérifiez que le SuperAdmin existe dans la base de données
✅ Vérifiez que `is_active = TRUE`
✅ Vérifiez le mot de passe (sensible à la casse)

### Erreur de permission

✅ Seuls les SuperAdmins peuvent accéder au portail
✅ Vérifiez que le token est bien de type `superadmin`

---

## 🎯 Prochaines étapes

1. Créez des Admins standards pour votre équipe support
2. Explorez les analytics globales
3. Testez la suspension/activation de salons
4. Consultez les logs d'audit

**Bon travail ! 🚀**
