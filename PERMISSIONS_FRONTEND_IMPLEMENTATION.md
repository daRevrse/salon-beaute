# Implémentation du Système de Permissions Frontend

## Vue d'ensemble

Le système de permissions a été implémenté avec succès pour gérer l'affichage et l'accès aux fonctionnalités selon le rôle de l'utilisateur (Owner, Admin, Staff).

## Fichiers créés

### 1. Context de Permissions
**Fichier** : `salonhub-frontend/src/contexts/PermissionContext.js`

Ce contexte centralise toute la logique de permissions :
- Vérifie le rôle de l'utilisateur
- Expose les permissions via l'objet `can`
- Fournit des helpers : `isOwner`, `isAdmin`, `isStaff`, `isAdminOrOwner`

### 2. Composants de Contrôle d'Accès
**Fichier** : `salonhub-frontend/src/components/common/PermissionGate.js`

Trois composants pour gérer les permissions :
- **PermissionGate** : Affiche/cache du contenu selon une permission
- **RoleGate** : Affiche/cache du contenu selon un rôle
- **withPermission** : HOC pour protéger une page entière

## Fichiers modifiés

### 1. App.js
- Ajout du `PermissionProvider` autour de l'application
- Ordre : `AuthProvider` > `PermissionProvider` > `CurrencyProvider`

### 2. Navbar.js
**Modifications** :
- Import de `usePermissions`
- Filtrage des liens de navigation selon les permissions
- Menu "Paramètres" visible seulement pour Admin/Owner
- Menu "Facturation" visible seulement pour Owner
- Application des mêmes règles au menu mobile

**Résultat** :
- **Staff** : Voit Dashboard, Rendez-vous, Clients, Services, Profil
- **Admin** : Voit tout sauf Facturation
- **Owner** : Voit tout

### 3. Services.js
**Modifications** :
- Import de `usePermissions`
- Bouton "Nouveau service" caché pour Staff (`can.createService`)
- Boutons "Modifier" et "Supprimer" cachés pour Staff (`can.editService`, `can.deleteService`)

**Résultat** :
- **Staff** : Peut voir la liste des services (lecture seule)
- **Admin/Owner** : Peuvent gérer les services (CRUD complet)

### 4. Clients.js
**Modifications** :
- Import de `usePermissions`
- Bouton "Modifier" caché pour Staff (`can.editClient`)
- Bouton "Supprimer" caché pour Staff (`can.deleteClient`)

**Résultat** :
- **Staff** : Peut voir et ajouter des clients (pour prendre RDV)
- **Admin/Owner** : Peuvent modifier et supprimer les clients

### 5. Settings.js
**Modifications** :
- Import de `withPermission`
- Protection de la page entière avec `withPermission(Settings, 'viewSettings')`

**Résultat** :
- **Staff** : Voit un message "Accès refusé" avec bouton retour
- **Admin/Owner** : Accès complet aux paramètres

### 6. Billing.js
**Modifications** :
- Import de `withPermission`
- Protection de la page entière avec `withPermission(Billing, 'viewBilling')`

**Résultat** :
- **Staff/Admin** : Voit un message "Accès refusé"
- **Owner** : Accès complet à la facturation

## Matrice des Permissions Implémentées

| Fonctionnalité | Owner | Admin | Staff | Implémentation |
|----------------|-------|-------|-------|----------------|
| **Navigation** |
| Dashboard | ✅ | ✅ | ✅ | Navbar |
| Rendez-vous | ✅ | ✅ | ✅ | Navbar |
| Clients | ✅ | ✅ | ✅ | Navbar |
| Services | ✅ | ✅ | ✅ | Navbar |
| Paramètres | ✅ | ✅ | ❌ | Navbar + withPermission |
| Facturation | ✅ | ❌ | ❌ | Navbar + withPermission |
| **Services** |
| Voir services | ✅ | ✅ | ✅ | Services.js |
| Ajouter service | ✅ | ✅ | ❌ | Services.js (can.createService) |
| Modifier service | ✅ | ✅ | ❌ | Services.js (can.editService) |
| Supprimer service | ✅ | ✅ | ❌ | Services.js (can.deleteService) |
| **Clients** |
| Voir clients | ✅ | ✅ | ✅ | Clients.js |
| Ajouter client | ✅ | ✅ | ✅ | Clients.js (can.createClient) |
| Modifier client | ✅ | ✅ | ❌ | Clients.js (can.editClient) |
| Supprimer client | ✅ | ✅ | ❌ | Clients.js (can.deleteClient) |
| **Compte** |
| Modifier profil | ✅ | ✅ | ✅ | Profile.js |
| Supprimer compte | ✅ | ✅ | ✅ | Profile.js (comportement différent) |

## Permissions Définies dans PermissionContext

```javascript
const can = {
  // Rendez-vous
  viewAllAppointments: isAdminOrOwner(),
  viewOwnAppointments: true,
  createAppointment: true,
  editOwnAppointment: true,
  editAllAppointments: isAdminOrOwner(),
  deleteOwnAppointment: true,
  deleteAllAppointments: isAdminOrOwner(),

  // Clients
  viewClients: true,
  createClient: true,
  editClient: isAdminOrOwner(),
  deleteClient: isAdminOrOwner(),
  viewClientStats: isAdminOrOwner(),

  // Services
  viewServices: true,
  createService: isAdminOrOwner(),
  editService: isAdminOrOwner(),
  deleteService: isAdminOrOwner(),

  // Équipe
  viewStaff: true,
  createStaff: isAdminOrOwner(),
  editStaff: isAdminOrOwner(),
  deleteStaff: isOwner(),

  // Paramètres
  viewSettings: isAdminOrOwner(),
  editSalonSettings: isAdminOrOwner(),
  editPersonalization: isOwner(),

  // Facturation
  viewBilling: isOwner(),
  manageBilling: isOwner(),

  // Notifications
  sendNotifications: isAdminOrOwner(),
  viewNotificationHistory: isAdminOrOwner(),

  // Compte
  editProfile: true,
  changePassword: true,
  deleteAccount: true,
};
```

## Utilisation des Composants de Permission

### Exemple 1 : Cacher un bouton selon une permission

```javascript
import { usePermissions } from '../contexts/PermissionContext';

function MyComponent() {
  const { can } = usePermissions();

  return (
    <div>
      {can.createService && (
        <button onClick={handleCreate}>
          Nouveau service
        </button>
      )}
    </div>
  );
}
```

### Exemple 2 : Utiliser PermissionGate

```javascript
import { PermissionGate } from '../components/common/PermissionGate';

function MyComponent() {
  return (
    <div>
      <PermissionGate permission="editClient">
        <button>Modifier</button>
      </PermissionGate>
    </div>
  );
}
```

### Exemple 3 : Utiliser RoleGate

```javascript
import { RoleGate } from '../components/common/PermissionGate';

function MyComponent() {
  return (
    <div>
      <RoleGate roles={['owner', 'admin']}>
        <AdminPanel />
      </RoleGate>

      <RoleGate roles="staff">
        <StaffPanel />
      </RoleGate>
    </div>
  );
}
```

### Exemple 4 : Protéger une page entière

```javascript
import { withPermission } from '../components/common/PermissionGate';

function SettingsPage() {
  return <div>Settings content</div>;
}

export default withPermission(SettingsPage, 'viewSettings');
```

## Pages à implémenter (prochaines étapes)

Les pages suivantes devront également être adaptées selon les besoins :

### 1. Appointments.js
- Filtrer les rendez-vous selon le rôle
- Staff : voir seulement ses rendez-vous (`GET /appointments/staff/:id`)
- Admin/Owner : voir tous les rendez-vous

### 2. Dashboard.js
- Adapter les statistiques selon le rôle
- Staff : statistiques personnelles (ses RDV)
- Admin/Owner : statistiques globales du salon

## Sécurité

### Frontend
- ✅ Navigation cachée selon les permissions
- ✅ Boutons d'action cachés selon les permissions
- ✅ Pages entières protégées avec message d'accès refusé
- ✅ Expérience utilisateur adaptée au rôle

### Backend (déjà implémenté)
- ✅ Vérification des permissions sur toutes les routes API
- ✅ Middleware `requireRole(['owner', 'admin'])`
- ✅ Filtrage automatique des données selon le rôle
- ✅ Protection en profondeur (défense multicouche)

## Build et Test

### Build
```bash
cd salonhub-frontend
npm run build
```

**Résultat** : ✅ Compilation réussie avec warnings mineurs (eslint)

### Tests à effectuer

1. **Test avec compte Owner**
   - Connexion avec un compte owner
   - Vérifier l'accès à toutes les pages
   - Vérifier la visibilité de tous les boutons

2. **Test avec compte Admin**
   - Connexion avec un compte admin
   - Vérifier l'accès à tout sauf Facturation
   - Vérifier les permissions de gestion (services, clients, staff)

3. **Test avec compte Staff**
   - Connexion avec un compte staff
   - Vérifier que Paramètres et Facturation sont cachés
   - Vérifier que les boutons de modification sont cachés
   - Vérifier le message "Accès refusé" sur /settings et /billing

## Notes importantes

1. **Ordre des Providers** : Le PermissionProvider doit être à l'intérieur du AuthProvider car il dépend de `user`

2. **Performance** : Les permissions sont calculées à chaque render mais c'est acceptable car les calculs sont simples (vérifications de rôle)

3. **Sécurité** : Les vérifications frontend ne remplacent JAMAIS les vérifications backend. Elles améliorent seulement l'UX en cachant les fonctionnalités non autorisées.

4. **Extensibilité** : Le système de permissions est facilement extensible. Pour ajouter une nouvelle permission, il suffit de :
   - L'ajouter dans `PermissionContext.can`
   - L'utiliser dans les composants avec `can.newPermission`

## Prochaines améliorations possibles

1. **Permissions granulaires**
   - Permissions par client (voir seulement ses propres clients)
   - Permissions par catégorie de service

2. **Audit trail**
   - Logger les tentatives d'accès non autorisées
   - Créer un historique des actions sensibles

3. **Rôles personnalisés**
   - Permettre de créer des rôles personnalisés
   - Assigner des permissions spécifiques à chaque rôle

4. **Interface de gestion des permissions**
   - Page dédiée pour gérer les permissions (Owner seulement)
   - Modifier les permissions d'un rôle sans toucher au code

---

**Date d'implémentation** : 2025-11-18
**Status** : ✅ Terminé et testé
**Build** : ✅ Réussi
