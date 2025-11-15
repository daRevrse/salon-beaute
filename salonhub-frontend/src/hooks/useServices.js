/**
 * Hook useServices
 * Gestion complète des services (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger tous les services
  const fetchServices = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/services', { params: filters });
      
      if (response.data && Array.isArray(response.data.data)) {
        setServices(response.data.data);
      } else {
        setServices([]);
      }
      
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des services';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [setServices, setLoading, setError]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Récupérer un service par ID
  const getService = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Service introuvable';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Créer un service
  const createService = async (serviceData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/services', serviceData);
      
      await fetchServices();
      
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Modifier un service
  const updateService = async (id, serviceData) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.put(`/services/${id}`, serviceData);
      
      await fetchServices();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la modification';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un service
  const deleteService = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/services/${id}`);
      
      await fetchServices();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la suppression';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Toggle actif/inactif
  const toggleService = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.patch(`/services/${id}/toggle`);
      
      await fetchServices();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    fetchServices,
    getService,
    createService,
    updateService,
    deleteService,
    toggleService,
  };
};

export default useServices;
