import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { unregisterPushNotifications } from '../services/pushNotificationService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync('userData');
      const token = await SecureStore.getItemAsync('userToken');
      const salonsString = await SecureStore.getItemAsync('userSalons');

      if (userDataString && token) {
        const userData = JSON.parse(userDataString);
        setUser(userData);
      }

      if (salonsString) {
        try { setSalons(JSON.parse(salonsString)); } catch {}
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { token, user: userData, salons: userSalons } = response.data.data;

        // Sauvegarder le token et les données utilisateur
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));

        // Stocker les salons
        if (userSalons) {
          await SecureStore.setItemAsync('userSalons', JSON.stringify(userSalons));
          setSalons(userSalons);
        }

        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  };

  const signInWithGoogle = async (idToken, platform = 'web') => {
    try {
      const response = await api.post('/auth/google/login', {
        id_token: idToken,
        platform,
      });

      if (response.data.success) {
        const { token, user: userData, salons: userSalons } = response.data.data;

        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));

        if (userSalons) {
          await SecureStore.setItemAsync('userSalons', JSON.stringify(userSalons));
          setSalons(userSalons);
        }

        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      // Si pas de compte, retourner les infos Google pour l'inscription
      if (error.response?.status === 404 && error.response?.data?.error === 'no_account') {
        return {
          success: false,
          needsRegistration: true,
          googleUser: error.response.data.google_user,
        };
      }
      // Si compte Google-only qui essaie de se connecter en email/mdp
      if (error.response?.data?.error === 'google_only') {
        return {
          success: false,
          error: error.response.data.message,
        };
      }
      console.error('Erreur connexion Google:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur de connexion Google',
      };
    }
  };

  const registerWithGoogle = async (idToken, salonData, platform = 'web') => {
    try {
      const response = await api.post('/auth/google/register', {
        id_token: idToken,
        platform,
        ...salonData,
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;

        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));

        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Erreur inscription Google:', error);
      return {
        success: false,
        error: error.response?.data?.error || "Erreur lors de l'inscription Google",
      };
    }
  };

  // Changer de salon actif (multi-salon)
  const switchSalon = async (targetTenantId) => {
    try {
      const response = await api.post(`/salons/switch/${targetTenantId}`);

      if (response.data.success) {
        const { token, user: switchedUser, tenant: switchedTenant } = response.data.data;

        // Mettre à jour le token et les données
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(switchedUser));

        setUser(switchedUser);
        return { success: true, tenant: switchedTenant };
      }

      return { success: false, error: 'Erreur lors du changement de salon' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors du changement de salon',
      };
    }
  };

  const signOut = async () => {
    try {
      await unregisterPushNotifications();
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('userSalons');
      setUser(null);
      setSalons([]);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        salons,
        loading,
        hasMultipleSalons: salons.length > 1,
        signIn,
        signInWithGoogle,
        registerWithGoogle,
        signOut,
        switchSalon,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
