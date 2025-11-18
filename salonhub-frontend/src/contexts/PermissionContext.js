/**
 * Context de gestion des permissions
 * Gère les permissions selon le rôle de l'utilisateur (Owner, Admin, Staff)
 */

import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions doit être utilisé dans un PermissionProvider');
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
    viewSettings: isAdminOrOwner(), // Voir les paramètres
    editSalonSettings: isAdminOrOwner(),
    editPersonalization: isOwner(),

    // Facturation
    viewBilling: isOwner(),
    manageBilling: isOwner(),

    // Notifications
    sendNotifications: isAdminOrOwner(),
    viewNotificationHistory: isAdminOrOwner(),

    // Compte
    editProfile: true, // Tous
    changePassword: true, // Tous
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
