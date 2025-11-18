# Intégration de la Suppression de Compte - Frontend

## Vue d'ensemble

La fonctionnalité de suppression de compte a été intégrée au frontend dans la page de profil utilisateur (`/profile`), dans l'onglet "Sécurité".

## Fichiers modifiés

### 1. `salonhub-frontend/src/pages/Profile.js`

**Modifications apportées :**

- Import des nouveaux icônes : `ExclamationTriangleIcon`, `TrashIcon`
- Ajout des états pour gérer la suppression :
  ```javascript
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: "",
    confirmation_text: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  ```

- Ajout de la fonction `handleDeleteAccount` pour gérer la suppression
- Réorganisation de l'onglet "Sécurité" en deux sections :
  1. Changement de mot de passe
  2. Zone dangereuse - Suppression de compte

- Ajout d'un modal de confirmation avec :
  - Avertissements clairs sur les conséquences
  - Champ de confirmation du nom du salon (pour les propriétaires uniquement)
  - Champ de saisie du mot de passe
  - Boutons d'annulation et de confirmation

### 2. `salonhub-frontend/src/contexts/AuthContext.js`

**Modifications apportées :**

- Ajout de la fonction `updateUser` pour mettre à jour les données utilisateur dans le contexte
- Export de `updateUser` dans les valeurs du contexte

## Fonctionnement

### Pour les propriétaires (role = "owner")

1. L'utilisateur clique sur "Supprimer mon compte" dans l'onglet Sécurité
2. Un modal s'ouvre avec :
   - Une liste des conséquences (suppression du salon, clients, services, etc.)
   - Un champ pour taper le nom du salon (confirmation type GitHub)
   - Un champ pour le mot de passe
3. Après validation :
   - Le backend supprime tout le tenant (salon + toutes données associées)
   - L'utilisateur est déconnecté
   - Redirection vers la page de connexion

### Pour les employés/admins (role = "admin" ou "staff")

1. L'utilisateur clique sur "Supprimer mon compte"
2. Un modal s'ouvre avec :
   - Une liste des conséquences (suppression du compte uniquement)
   - Un champ pour le mot de passe (pas de confirmation du nom du salon)
3. Après validation :
   - Le backend supprime uniquement le compte utilisateur
   - L'utilisateur est déconnecté
   - Redirection vers la page de connexion

## API Backend

**Route utilisée :** `DELETE /api/auth/account`

**Payload :**
```json
{
  "password": "mot_de_passe_utilisateur",
  "confirmation_text": "Nom du Salon" // Requis uniquement pour les propriétaires
}
```

**Réponse en cas de succès :**
```json
{
  "success": true,
  "message": "Message de confirmation...",
  "deleted": {
    "type": "owner" | "admin" | "staff",
    "tenant_deleted": true | false,
    ...
  }
}
```

## Sécurité

### Validations côté frontend

- Vérification que le mot de passe est fourni
- Pour les propriétaires : vérification que le nom du salon correspond exactement

### Validations côté backend

- Vérification du mot de passe de l'utilisateur
- Pour les propriétaires :
  - Vérification que le nom du salon correspond exactement
  - Vérification qu'il n'y a pas d'abonnement actif (doit être annulé avant)
- Suppression en cascade via les contraintes FK de la base de données

## Messages et UX

### Avertissements

Les utilisateurs voient clairement :
- **Propriétaires** : "La suppression de votre compte entraînera la suppression définitive de votre salon et de toutes les données associées"
- **Employés** : "La suppression de votre compte est définitive et irréversible"

### Confirmation

- Le modal affiche une liste détaillée de ce qui sera supprimé
- Le bouton de suppression est rouge et indique "Supprimer définitivement"
- État de chargement pendant la suppression

### Messages de succès

- Message personnalisé selon le rôle
- Déconnexion automatique
- Redirection vers la page de connexion

## Test

Pour tester la fonctionnalité :

1. **En tant que propriétaire :**
   - Se connecter avec un compte propriétaire
   - Aller sur la page Profil > Onglet Sécurité
   - Cliquer sur "Supprimer mon compte"
   - Entrer le nom exact du salon
   - Entrer le mot de passe
   - Valider

2. **En tant qu'employé :**
   - Se connecter avec un compte employé
   - Aller sur la page Profil > Onglet Sécurité
   - Cliquer sur "Supprimer mon compte"
   - Entrer le mot de passe (pas besoin du nom du salon)
   - Valider

## Améliorations futures possibles

1. Envoyer un email de confirmation après suppression
2. Ajouter un délai de grâce (soft delete) avant suppression définitive
3. Permettre l'export des données avant suppression
4. Ajouter un captcha pour plus de sécurité
5. Historiser les suppressions dans une table d'audit
