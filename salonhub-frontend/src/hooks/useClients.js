/**
 * Hook useClients
 * Gestion complète des clients (CRUD)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const CLIENTS_PAGE_SIZE = 50;

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: CLIENTS_PAGE_SIZE, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Dernière recherche / page : réappliquées après création / modification / suppression
  const lastQueryRef = useRef({ search: '', offset: 0 });
  // Seule la réponse de la dernière requête est appliquée (recherche tapée rapidement)
  const requestIdRef = useRef(0);

  // Charger les clients (paginés). Sans argument, recharge la dernière recherche.
  const fetchClients = useCallback(async (searchQuery, { offset = 0 } = {}) => {
    const queryState =
      searchQuery === undefined ? lastQueryRef.current : { search: searchQuery, offset };
    lastQueryRef.current = queryState;
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);
      
      const params = { limit: CLIENTS_PAGE_SIZE, offset: queryState.offset };
      if (queryState.search) params.search = queryState.search;
      const response = await api.get('/clients', { params });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      if (requestId !== requestIdRef.current) return { success: true, data, stale: true };

      setClients(data);
      setPagination(
        response.data?.pagination || { total: data.length, limit: CLIENTS_PAGE_SIZE, offset: queryState.offset, hasMore: false }
      );
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des clients';
      if (requestId === requestIdRef.current) setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [setClients, setLoading, setError]);

  // Changer de page en conservant la recherche courante
  const goToOffset = useCallback(
    (offset) => fetchClients(lastQueryRef.current.search, { offset: Math.max(0, offset) }),
    [fetchClients]
  );

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
    pagination,
    goToOffset,
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
