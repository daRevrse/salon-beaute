/**
 * Hook personnalisé pour gérer le workflow de réservation publique
 * Utilisé par les clients pour prendre rendez-vous en ligne
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const usePublicBooking = (salonSlug) => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger les informations du salon
   */
  const fetchSalon = useCallback(async () => {
    if (!salonSlug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/public/salon/${salonSlug}`);
      setSalon(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement du salon';
      setError(errorMsg);
      console.error('Erreur fetchSalon:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Charger les services disponibles du salon
   */
  const fetchServices = useCallback(async () => {
    if (!salonSlug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/public/salon/${salonSlug}/services`);
      setServices(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des services';
      setError(errorMsg);
      console.error('Erreur fetchServices:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Charger les paramètres du salon (horaires, etc.)
   */
  const fetchSettings = useCallback(async () => {
    if (!salonSlug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/public/salon/${salonSlug}/settings`);
      setSettings(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des paramètres';
      setError(errorMsg);
      console.error('Erreur fetchSettings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Charger les créneaux disponibles pour un service et une date
   */
  const fetchAvailability = useCallback(async (serviceId, date) => {
    if (!salonSlug || !serviceId || !date) {
      setError('Paramètres manquants pour récupérer les disponibilités');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/public/salon/${salonSlug}/availability`,
        {
          params: {
            service_id: serviceId,
            date: date
          }
        }
      );

      const slots = response.data.slots || [];
      setAvailableSlots(slots);
      return { slots, message: response.data.message };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des disponibilités';
      setError(errorMsg);
      setAvailableSlots([]);
      console.error('Erreur fetchAvailability:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Créer un rendez-vous
   */
  const createAppointment = useCallback(async (appointmentData) => {
    if (!salonSlug) {
      setError('Slug du salon manquant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/public/appointments`, {
        salon_slug: salonSlug,
        ...appointmentData
      });

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création du rendez-vous';
      setError(errorMsg);
      console.error('Erreur createAppointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Réinitialiser les créneaux disponibles
   */
  const resetAvailability = useCallback(() => {
    setAvailableSlots([]);
  }, []);

  /**
   * Réinitialiser l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // État
    salon,
    services,
    settings,
    availableSlots,
    loading,
    error,

    // Actions
    fetchSalon,
    fetchServices,
    fetchSettings,
    fetchAvailability,
    createAppointment,
    resetAvailability,
    clearError
  };
};

export default usePublicBooking;
