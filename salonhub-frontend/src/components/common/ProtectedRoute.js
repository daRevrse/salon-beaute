/**
 * ProtectedRoute
 * Redirige vers login si non authentifié
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireOwner = false }) => {
  const { user, loading } = useAuth();

  // Attendre chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Pas connecté → Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier rôle admin si requis
  if (requireAdmin && user.role !== 'admin' && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  // Vérifier rôle owner si requis
  if (requireOwner && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
