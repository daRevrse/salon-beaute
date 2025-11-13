/**
 * Hook useAppointments
 * Gestion complète des rendez-vous (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger tous les rendez-vous
  const fetchAppointments = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/appointments', { params: filters });
      
      setAppointments(response.data.data);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

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
