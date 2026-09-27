/**
 * Hook useAppointments
 * Gestion complète des rendez-vous (CRUD)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const APPOINTMENTS_PAGE_SIZE = 50;

// Retire les filtres vides pour ne pas envoyer "status=" ou "date=" à l'API
const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );

export const useAppointments = (initialFilters = {}) => {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: APPOINTMENTS_PAGE_SIZE, offset: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Derniers filtres utilisés : réappliqués après création / modification / suppression
  const lastParamsRef = useRef({ limit: APPOINTMENTS_PAGE_SIZE, offset: 0, ...initialFilters });
  // Seule la réponse de la dernière requête est appliquée (évite les réponses dans le désordre)
  const requestIdRef = useRef(0);

  // Charger les rendez-vous (paginés). Sans argument, recharge avec les derniers filtres.
  const fetchAppointments = useCallback(async (filters) => {
    const params =
      filters === undefined
        ? lastParamsRef.current
        : { limit: APPOINTMENTS_PAGE_SIZE, offset: 0, ...filters };
    lastParamsRef.current = params;
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/appointments', { params: cleanParams(params) });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      if (requestId !== requestIdRef.current) return { success: true, data, stale: true };

      setAppointments(data);
      setPagination(
        response.data?.pagination || { total: data.length, limit: params.limit, offset: params.offset }
      );
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement';
      if (requestId === requestIdRef.current) setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [setAppointments, setLoading, setError]);

  // Changer de page en conservant les filtres courants
  const goToOffset = useCallback(
    (offset) => fetchAppointments({ ...lastParamsRef.current, offset: Math.max(0, offset) }),
    [fetchAppointments]
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Rendez-vous du jour
  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments/today');
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un rendez-vous par ID
  const getAppointment = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Rendez-vous introuvable';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Créer un rendez-vous
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/appointments', appointmentData);
      
      await fetchAppointments();
      
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création';
      const message = err.response?.data?.message;
      setError(errorMsg);
      return { success: false, error: errorMsg, message };
    } finally {
      setLoading(false);
    }
  };

  // Modifier un rendez-vous
  const updateAppointment = async (id, appointmentData) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.put(`/appointments/${id}`, appointmentData);
      
      await fetchAppointments();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la modification';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut
  const updateStatus = async (id, status, cancellationReason = null) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.patch(`/appointments/${id}/status`, { 
        status, 
        cancellation_reason: cancellationReason 
      });
      
      await fetchAppointments();
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un rendez-vous
  const deleteAppointment = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/appointments/${id}`);
      
      await fetchAppointments();
      
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
    appointments,
    pagination,
    goToOffset,
    loading,
    error,
    fetchAppointments,
    fetchTodayAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
  };
};

export default useAppointments;
