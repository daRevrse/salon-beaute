# 🔐 Guide des Permissions Frontend - SalonHub

## Vue d'ensemble

Ce document explique comment gérer les permissions et la visibilité des fonctionnalités selon le rôle de l'utilisateur (Owner, Admin, Staff).

---

## ⚠️ Important : Permissions des employés (Staff)

Les employés doivent **obligatoirement** pouvoir :
- ✅ Voir leurs propres rendez-vous (pour savoir quand ils travaillent)
- ✅ Modifier/annuler leurs propres rendez-vous
- ✅ Créer des rendez-vous pour leurs clients
- ✅ Voir la liste des clients (pour prendre RDV)

**Logique de filtrage** :
- **Owner/Admin** → Voient TOUS les rendez-vous du salon
- **Staff** → Voient SEULEMENT les rendez-vous qui leur sont assignés (`staff_id = user.id`)

---

## 📊 Matrice des permissions

| Fonctionnalité | Owner | Admin | Staff |
|----------------|-------|-------|-------|
| **Dashboard** | ✅ Complet | ✅ Complet | ✅ Limité |
| **Rendez-vous** | | | |
| - Voir tous les RDV | ✅ | ✅ | ❌ (seulement les siens) |
| - Voir ses propres RDV | ✅ | ✅ | ✅ |
| - Créer un RDV | ✅ | ✅ | ✅ |
| - Modifier un RDV | ✅ | ✅ | ✅ (seulement les siens) |
| - Annuler un RDV | ✅ | ✅ | ✅ (seulement les siens) |
| **Clients** | | | |
| - Voir la liste | ✅ | ✅ | ✅ |
| - Ajouter un client | ✅ | ✅ | ✅ |
| - Modifier un client | ✅ | ✅ | ❌ |
| - Supprimer un client | ✅ | ✅ | ❌ |
| - Voir statistiques client | ✅ | ✅ | ❌ |
| **Services** | | | |
| - Voir la liste | ✅ | ✅ | ✅ (lecture seule) |
| - Ajouter un service | ✅ | ✅ | ❌ |
| - Modifier un service | ✅ | ✅ | ❌ |
| - Supprimer un service | ✅ | ✅ | ❌ |
| **Équipe** | | | |
| - Voir la liste du staff | ✅ | ✅ | ✅ |
| - Ajouter un employé | ✅ | ✅ | ❌ |
| - Modifier un employé | ✅ | ✅ | ❌ |
| - Supprimer un employé | ✅ | ❌ | ❌ |
| **Paramètres** | | | |
| - Paramètres du salon | ✅ | ✅ (limité) | ❌ |
| - Horaires d'ouverture | ✅ | ✅ | ❌ |
| - Personnalisation | ✅ | ❌ | ❌ |
| **Facturation** | | | |
| - Voir l'abonnement | ✅ | ❌ | ❌ |
| - Gérer l'abonnement | ✅ | ❌ | ❌ |
| - Voir les factures | ✅ | ❌ | ❌ |
| **Notifications** | | | |
| - Envoyer une notification | ✅ | ✅ | ❌ |
| - Voir l'historique | ✅ | ✅ | ❌ |
| **Compte** | | | |
| - Modifier son profil | ✅ | ✅ | ✅ |
| - Changer son mot de passe | ✅ | ✅ | ✅ |
| - Supprimer son compte | ✅ (+ salon) | ✅ | ✅ |

---

## 🎯 Implémentation dans React

### 1. Context de permissions

**Créer `src/contexts/PermissionContext.js`** :

```javascript
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return Array.isArray(roles)
      ? roles.includes(user.role)
      : user.role === roles;
  };

  // Vérifier si l'utilisateur est le propriétaire
  const isOwner = () => hasRole('owner');

  // Vérifier si l'utilisateur est admin ou owner
  const isAdminOrOwner = () => hasRole(['owner', 'admin']);

  // Vérifier si l'utilisateur est staff simple
  const isStaff = () => hasRole('staff');

  // Permissions spécifiques
  const can = {
    // Rendez-vous
    viewAllAppointments: isAdminOrOwner(), // Voir TOUS les RDV du salon
    viewOwnAppointments: true, // Voir ses propres RDV (tous les rôles)
    createAppointment: true, // Tous les rôles
    editOwnAppointment: true, // Modifier ses propres RDV (tous les rôles)
    editAllAppointments: isAdminOrOwner(), // Modifier n'importe quel RDV
    deleteOwnAppointment: true, // Annuler ses propres RDV (tous les rôles)
    deleteAllAppointments: isAdminOrOwner(), // Annuler n'importe quel RDV

    // Clients
    viewClients: true, // Tous les rôles
    createClient: true, // Tous les rôles
    editClient: isAdminOrOwner(),
    deleteClient: isAdminOrOwner(),
    viewClientStats: isAdminOrOwner(),

    // Services
    viewServices: true, // Tous les rôles
    createService: isAdminOrOwner(),
    editService: isAdminOrOwner(),
    deleteService: isAdminOrOwner(),

    // Équipe
    viewStaff: true, // Tous les rôles
    createStaff: isAdminOrOwner(),
    editStaff: isAdminOrOwner(),
    deleteStaff: isOwner(),

    // Paramètres
    editSalonSettings: isAdminOrOwner(),
    editPersonalization: isOwner(),

    // Facturation
    viewBilling: isOwner(),
    manageBilling: isOwner(),

    // Notifications
    sendNotifications: isAdminOrOwner(),
    viewNotificationHistory: isAdminOrOwner(),

    // Compte
    deleteAccount: true, // Tous (mais comportement différent)
  };

  const value = {
    user,
    hasRole,
    isOwner: isOwner(),
    isAdmin: hasRole('admin'),
    isStaff: isStaff(),
    isAdminOrOwner: isAdminOrOwner(),
    can,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
```

### 2. Composants de contrôle d'accès

**Créer `src/components/PermissionGate.js`** :

```javascript
import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';

// Composant pour cacher/afficher selon les permissions
export const PermissionGate = ({ children, permission, fallback = null }) => {
  const { can } = usePermissions();

  if (!can[permission]) {
    return fallback;
  }

  return <>{children}</>;
};

// Composant pour afficher selon le rôle
export const RoleGate = ({ children, roles, fallback = null }) => {
  const { hasRole } = usePermissions();

  if (!hasRole(roles)) {
    return fallback;
  }

  return <>{children}</>;
};

// HOC pour protéger une page entière
export const withPermission = (Component, permission) => {
  return (props) => {
    const { can } = usePermissions();

    if (!can[permission]) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
```

### 3. Hook personnalisé pour les permissions

**Créer `src/hooks/useAccessControl.js`** :

```javascript
import { usePermissions } from '../contexts/PermissionContext';

export const useAccessControl = () => {
  const permissions = usePermissions();

  // Fonction pour désactiver un bouton selon les permissions
  const getButtonProps = (permission) => {
    const hasPermission = permissions.can[permission];

    return {
      disabled: !hasPermission,
      className: hasPermission ? '' : 'opacity-50 cursor-not-allowed',
      title: hasPermission ? '' : 'Vous n\'avez pas la permission pour cette action'
    };
  };

  // Fonction pour filtrer une liste selon les permissions
  const filterByPermission = (items, permission) => {
    if (permissions.can[permission]) {
      return items;
    }
    return [];
  };

  return {
    ...permissions,
    getButtonProps,
    filterByPermission,
  };
};
```

---

## 💻 Exemples d'utilisation

### Exemple 1 : Page de rendez-vous avec filtrage par rôle

```javascript
import { usePermissions } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

function AppointmentsPage() {
  const { can } = usePermissions();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    // Si staff : charger seulement ses RDV
    // Si admin/owner : charger tous les RDV
    const endpoint = can.viewAllAppointments
      ? '/api/appointments' // Tous les RDV du salon
      : `/api/appointments/staff/${user.id}`; // Seulement les siens

    const response = await fetch(endpoint);
    const data = await response.json();
    setAppointments(data);
  };

  return (
    <div>
      <h1>Rendez-vous</h1>

      {/* Afficher le filtre seulement pour owner/admin */}
      {can.viewAllAppointments && (
        <div className="filters">
          <select onChange={(e) => filterByStaff(e.target.value)}>
            <option value="all">Tous les employés</option>
            <option value="me">Mes rendez-vous</option>
            {/* Liste des autres employés */}
          </select>
        </div>
      )}

      {/* Liste des RDV */}
      {appointments.map(apt => (
        <AppointmentCard
          key={apt.id}
          appointment={apt}
          canEdit={can.editAllAppointments || apt.staff_id === user.id}
          canDelete={can.deleteAllAppointments || apt.staff_id === user.id}
        />
      ))}
    </div>
  );
}
```

### Exemple 2 : Carte de rendez-vous avec permissions conditionnelles

```javascript
function AppointmentCard({ appointment, canEdit, canDelete }) {
  return (
    <div className="appointment-card">
      <h3>{appointment.service_name}</h3>
      <p>Client: {appointment.client_name}</p>
      <p>Date: {appointment.date} à {appointment.time}</p>
      <p>Employé: {appointment.staff_name}</p>

      <div className="actions">
        {/* Bouton édition - affiché si permission */}
        {canEdit && (
          <button onClick={() => editAppointment(appointment.id)}>
            Modifier
          </button>
        )}

        {/* Bouton annulation - affiché si permission */}
        {canDelete && (
          <button onClick={() => cancelAppointment(appointment.id)}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
```

### Exemple 3 : Cacher un bouton selon les permissions

```javascript
import { PermissionGate } from '../components/PermissionGate';

function ServicesList() {
  return (
    <div>
      <h1>Services</h1>

      {/* Bouton visible seulement pour Owner et Admin */}
      <PermissionGate permission="createService">
        <button onClick={() => openCreateModal()}>
          Ajouter un service
        </button>
      </PermissionGate>

      {/* Liste des services */}
      <ServiceList />
    </div>
  );
}
```

### Exemple 4 : Désactiver un bouton avec tooltip

```javascript
import { useAccessControl } from '../hooks/useAccessControl';

function ClientCard({ client }) {
  const { can, getButtonProps } = useAccessControl();

  return (
    <div className="card">
      <h3>{client.name}</h3>

      {/* Bouton édition - désactivé pour staff */}
      <button
        {...getButtonProps('editClient')}
        onClick={() => editClient(client.id)}
      >
        Modifier
      </button>

      {/* Bouton suppression - désactivé pour staff et admin */}
      <button
        {...getButtonProps('deleteClient')}
        onClick={() => deleteClient(client.id)}
        className="btn-danger"
      >
        Supprimer
      </button>
    </div>
  );
}
```

### Exemple 5 : Navigation conditionnelle

```javascript
import { usePermissions } from '../contexts/PermissionContext';
import { Link } from 'react-router-dom';

function Sidebar() {
  const { can, isOwner } = usePermissions();

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/appointments">Rendez-vous</Link>
      <Link to="/clients">Clients</Link>
      <Link to="/services">Services</Link>

      {/* Lien visible seulement pour Owner et Admin */}
      {can.viewStaff && (
        <Link to="/team">Équipe</Link>
      )}

      {/* Lien visible seulement pour Owner */}
      {isOwner && (
        <Link to="/billing">Facturation</Link>
      )}

      <Link to="/settings">Paramètres</Link>
    </nav>
  );
}
```

### Exemple 6 : Protéger une route entière

```javascript
import { withPermission } from '../components/PermissionGate';

function BillingPage() {
  return (
    <div>
      <h1>Facturation</h1>
      {/* Contenu de la page */}
    </div>
  );
}

// Exporter avec protection
export default withPermission(BillingPage, 'viewBilling');
```

### Exemple 7 : Affichage conditionnel dans le dashboard

```javascript
import { RoleGate } from '../components/PermissionGate';
import { usePermissions } from '../contexts/PermissionContext';

function Dashboard() {
  const { isAdminOrOwner, isStaff } = usePermissions();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Statistiques complètes pour Owner/Admin */}
      <RoleGate roles={['owner', 'admin']}>
        <div className="stats-grid">
          <StatCard title="Revenus du mois" value="2 450 €" />
          <StatCard title="Nouveaux clients" value="12" />
          <StatCard title="Rendez-vous" value="87" />
          <StatCard title="Taux de remplissage" value="78%" />
        </div>
      </RoleGate>

      {/* Vue simplifiée pour Staff */}
      <RoleGate roles="staff">
        <div className="stats-grid">
          <StatCard title="Mes rendez-vous aujourd'hui" value="5" />
          <StatCard title="Mes rendez-vous cette semaine" value="23" />
        </div>
      </RoleGate>

      {/* Calendrier adapté selon le rôle */}
      {isAdminOrOwner ? (
        <CalendarAllStaff />
      ) : (
        <CalendarMyAppointments />
      )}
    </div>
  );
}
```

---

## 🗑️ Suppression de compte - UI Frontend

### Composant de confirmation (style GitHub)

**Créer `src/components/DeleteAccountModal.js`** :

```javascript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';

export const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { user, deleteAccount, logout } = useAuth();
  const { isOwner } = usePermissions();

  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const salonName = user?.tenant?.name || '';

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        password,
      };

      // Pour les owners, ajouter la confirmation du nom du salon
      if (isOwner) {
        payload.confirmation_text = confirmationText;
      }

      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error);
      }

      // Déconnexion et redirection
      logout();
      window.location.href = '/goodbye'; // Page de confirmation
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canDelete = password && (!isOwner || confirmationText === salonName);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        {/* Header */}
        <div className="modal-header bg-red-50 border-b border-red-200">
          <h2 className="text-2xl font-bold text-red-700">
            ⚠️ Supprimer {isOwner ? 'votre salon' : 'votre compte'}
          </h2>
        </div>

        {/* Body */}
        <div className="modal-body p-6 space-y-6">
          {/* Avertissement */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Attention : Cette action est irréversible !
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {isOwner ? (
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Votre salon "{salonName}" sera définitivement supprimé</li>
                      <li>Tous les comptes de vos employés seront supprimés</li>
                      <li>Tous vos clients seront supprimés</li>
                      <li>Tous vos services seront supprimés</li>
                      <li>Tous vos rendez-vous seront supprimés</li>
                      <li>Toutes vos données seront perdues</li>
                    </ul>
                  ) : (
                    <p>Votre compte sera supprimé et vous ne pourrez plus accéder à la plateforme.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            {/* Confirmation du nom (Owner seulement) */}
            {isOwner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez le nom de votre salon :{' '}
                  <span className="font-bold text-red-600">{salonName}</span>
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={salonName}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                    confirmationText && confirmationText !== salonName
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {confirmationText && confirmationText !== salonName && (
                  <p className="mt-1 text-sm text-red-600">
                    Le nom ne correspond pas
                  </p>
                )}
              </div>
            )}

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmez avec votre mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Suppression...' : isOwner ? 'Supprimer le salon' : 'Supprimer mon compte'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Intégration dans la page Paramètres

```javascript
import { useState } from 'react';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { usePermissions } from '../contexts/PermissionContext';

function SettingsPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isOwner } = usePermissions();

  return (
    <div className="settings-page">
      {/* ... autres paramètres ... */}

      {/* Zone dangereuse */}
      <div className="danger-zone mt-8 border-2 border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-700 mb-2">
          Zone dangereuse
        </h3>
        <p className="text-gray-600 mb-4">
          {isOwner
            ? "La suppression de votre salon entraînera la perte définitive de toutes vos données."
            : "La suppression de votre compte est définitive."}
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {isOwner ? 'Supprimer le salon' : 'Supprimer mon compte'}
        </button>
      </div>

      {/* Modal de suppression */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
```

---

## 📋 Checklist d'implémentation

### Phase 1 : Context et hooks
- [ ] Créer `PermissionContext.js`
- [ ] Créer `PermissionGate.js`
- [ ] Créer `useAccessControl.js`
- [ ] Intégrer le `PermissionProvider` dans `App.js`

### Phase 2 : Navigation
- [ ] Adapter le menu de navigation selon les rôles
- [ ] Cacher les liens non autorisés
- [ ] Rediriger si accès non autorisé

### Phase 3 : Pages et composants
- [ ] Protéger les pages sensibles (facturation, équipe)
- [ ] Adapter les dashboards selon les rôles
- [ ] Désactiver les boutons non autorisés

### Phase 4 : Suppression de compte
- [ ] Créer `DeleteAccountModal.js`
- [ ] Intégrer dans la page Paramètres
- [ ] Créer une page de confirmation `/goodbye`
- [ ] Tester les différents scénarios

### Phase 5 : Tests
- [ ] Tester avec compte Owner
- [ ] Tester avec compte Admin
- [ ] Tester avec compte Staff
- [ ] Vérifier que les routes API respectent les permissions

---

**FlowKraft Agency - SalonHub**
Version 1.0 - Novembre 2025
