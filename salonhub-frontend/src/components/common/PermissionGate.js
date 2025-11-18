/**
 * Composants pour gérer les permissions et l'affichage conditionnel
 */

import React from 'react';
import { usePermissions } from '../../contexts/PermissionContext';

/**
 * Composant pour cacher/afficher selon les permissions
 * @param {ReactNode} children - Contenu à afficher si permission accordée
 * @param {string} permission - Nom de la permission à vérifier
 * @param {ReactNode} fallback - Contenu à afficher si permission refusée
 */
export const PermissionGate = ({ children, permission, fallback = null }) => {
  const { can } = usePermissions();

  if (!can[permission]) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Composant pour afficher selon le rôle
 * @param {ReactNode} children - Contenu à afficher si rôle correspond
 * @param {string|array} roles - Rôle(s) autorisé(s)
 * @param {ReactNode} fallback - Contenu à afficher si rôle ne correspond pas
 */
export const RoleGate = ({ children, roles, fallback = null }) => {
  const { hasRole } = usePermissions();

  if (!hasRole(roles)) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * HOC pour protéger une page entière
 * @param {Component} Component - Composant à protéger
 * @param {string} permission - Permission requise
 */
export const withPermission = (Component, permission) => {
  return (props) => {
    const { can } = usePermissions();

    if (!can[permission]) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default PermissionGate;
