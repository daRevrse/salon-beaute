/**
 * Configuration API avec Axios
 * Gestion automatique des tokens JWT et erreurs
 */

import axios from 'axios';

// URL de l'API (à adapter selon environnement)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Instance Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur requête : Ajouter token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur réponse : Gérer erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erreur 401 : Token invalide/expiré → Déconnecter
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Erreur 403 : Accès refusé
      if (error.response.status === 403) {
        console.error('Accès refusé:', error.response.data.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
