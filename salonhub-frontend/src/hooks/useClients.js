/**
 * Hook useClients
 * Gestion complète des clients (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger tous les clients
  const fetchClients = useCallback(async (searchQuery = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await api.get('/clients', { params });
      
      if (response.data && Array.isArray(response.data.data)) {
        setClients(response.data.data);
      } else {
        setClients([]);
      }
      
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des clients';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [setClients, setLoading, setError]);

  // Charger au montage
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Récupérer un client par ID
  const getClient = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/clients/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Client introuvable';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Créer un client
  const createClient = async (clientData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/clients', clientData);
      
      // Recharger la liste
      await fetchClients();
      
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Modifier un client
  const updateClient = async (id, clientData) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.put(`/clients/${id}`, clientData);
      
      // Recharger la liste
      await fetchClients();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la modification';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un client
  const deleteClient = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/clients/${id}`);
      
      // Recharger la liste
      await fetchClients();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la suppression';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    loading,
    error,
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
  };
};

export default useClients;
