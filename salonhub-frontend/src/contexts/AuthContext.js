import React, { createContext, useContext, useState, useEffect } from 'react';
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
          setUser(JSON.parse(storedUser));
          setTenant(JSON.parse(storedTenant));
          
          // Vérifier que le token est toujours valide
          const response = await api.get('/auth/me');
          setUser(response.data.data);
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
  const refreshTenant = async () => {
    try {
      const response = await api.get('/settings/salon');

      if (response.data.success && response.data.data) {
        const updatedTenant = response.data.data;

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
  };

  // Rafraîchir les données de l'utilisateur
  const refreshUser = async () => {
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
  };

  const value = {
    user,
    tenant,
    loading,
    error,
    isAuthenticated: !!user,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    refreshTenant,
    refreshUser,
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
