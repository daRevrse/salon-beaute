import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger utilisateur au démarrage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedTenant = localStorage.getItem('tenant');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const parsedTenant = JSON.parse(storedTenant);

          setUser(parsedUser);
          setTenant(parsedTenant);

          // Vérifier que le token est toujours valide et récupérer données fraîches
          const response = await api.get('/auth/me');
          const freshUser = response.data.data;
          setUser(freshUser);

          // Mettre à jour le tenant avec le business_type du user si différent
          if (freshUser.business_type && freshUser.business_type !== parsedTenant?.business_type) {
            const updatedTenant = { ...parsedTenant, business_type: freshUser.business_type };
            localStorage.setItem('tenant', JSON.stringify(updatedTenant));
            setTenant(updatedTenant);
          }
        } catch (err) {
          console.error('Token invalide:', err);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Inscription
  const register = async (data) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/register', data);
      
      const { token, user: newUser, tenant: newTenant } = response.data.data;
      
      // Sauvegarder
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('tenant', JSON.stringify(newTenant));
      
      setUser(newUser);
      setTenant(newTenant);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Connexion
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user: loggedUser, tenant: userTenant } = response.data.data;
      
      // Sauvegarder
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('tenant', JSON.stringify(userTenant));
      
      setUser(loggedUser);
      setTenant(userTenant);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Email ou mot de passe incorrect';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    setTenant(null);
    setError(null);
  };

  // Mettre à jour profil
  const updateProfile = async (data) => {
    try {
      await api.put('/auth/me', data);
      
      // Récupérer profil mis à jour
      const response = await api.get('/auth/me');
      const updatedUser = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Erreur lors de la mise à jour' 
      };
    }
  };

  // Changer mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Erreur lors du changement de mot de passe' 
      };
    }
  };

  // Rafraîchir les données du salon
  const refreshTenant = useCallback(async () => {
    try {
      const response = await api.get('/settings/salon');

      if (response.data.success && response.data.data) {
        const newTenantData = response.data.data;

        // Préserver le business_type actuel si non présent dans la réponse
        const currentTenant = JSON.parse(localStorage.getItem('tenant') || '{}');
        const updatedTenant = {
          ...currentTenant,
          ...newTenantData,
          business_type: newTenantData.business_type || currentTenant.business_type || 'beauty'
        };

        localStorage.setItem('tenant', JSON.stringify(updatedTenant));
        setTenant(updatedTenant);

        return { success: true, data: updatedTenant };
      }

      return { success: false, error: 'Aucune donnée reçue' };
    } catch (err) {
      console.error("Erreur rafraîchissement tenant:", err);
      return {
        success: false,
        error: err.response?.data?.error || 'Erreur lors de la mise à jour des données du salon'
      };
    }
  }, []);

  // Rafraîchir les données d'abonnement
  const refreshSubscription = useCallback(async () => {
    try {
      const response = await api.get('/settings/subscription');

      if (response.data.success && response.data.data) {
        const subscriptionData = response.data.data;
        const currentTenant = JSON.parse(localStorage.getItem('tenant') || '{}');

        const updatedTenant = {
          ...currentTenant,
          subscription_status: subscriptionData.status,
          subscription_plan: subscriptionData.plan,
          trial_ends_at: subscriptionData.trial_ends_at,
          subscription_started_at: subscriptionData.subscription_started_at,
        };

        localStorage.setItem('tenant', JSON.stringify(updatedTenant));
        setTenant(updatedTenant);

        return { success: true, data: subscriptionData };
      }

      return { success: false, error: 'Aucune donnée reçue' };
    } catch (err) {
      console.error("Erreur rafraîchissement abonnement:", err);
      return {
        success: false,
        error: err.response?.data?.error || 'Erreur lors de la mise à jour des données d\'abonnement'
      };
    }
  }, []);

  // Rafraîchir les données de l'utilisateur
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');

      if (response.data.success && response.data.data) {
        const updatedUser = response.data.data;

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        return { success: true, data: updatedUser };
      }

      return { success: false, error: 'Aucune donnée reçue' };
    } catch (err) {
      console.error("Erreur rafraîchissement user:", err);
      return {
        success: false,
        error: err.response?.data?.error || 'Erreur lors de la mise à jour des données utilisateur'
      };
    }
  }, []);

  // Mettre à jour l'utilisateur (utilisé après modification de profil)
  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  // Calculer si l'abonnement est actif (trial valide ou active)
  const isSubscriptionActive = () => {
    if (!tenant) return false;
    if (tenant.subscription_status === 'active') return true;
    if (tenant.subscription_status === 'trial' && tenant.trial_ends_at) {
      return new Date(tenant.trial_ends_at) > new Date();
    }
    return false;
  };

  // Calculer les jours restants du trial
  const getTrialDaysRemaining = () => {
    if (!tenant || tenant.subscription_status !== 'trial' || !tenant.trial_ends_at) return null;
    const trialEnd = new Date(tenant.trial_ends_at);
    const now = new Date();
    if (trialEnd <= now) return 0;
    return Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const value = {
    user,
    tenant,
    loading,
    error,
    isAuthenticated: !!user,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
    isSubscriptionActive: isSubscriptionActive(),
    trialDaysRemaining: getTrialDaysRemaining(),
    register,
    login,
    logout,
    updateProfile,
    updateUser,
    changePassword,
    refreshTenant,
    refreshUser,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
