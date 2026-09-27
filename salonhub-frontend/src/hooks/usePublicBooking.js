/**
 * Hook personnalisé pour gérer le workflow de réservation publique
 * Utilisé par les clients pour prendre rendez-vous en ligne
 */

import { useState, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

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
      let errorMsg;
      if (err.response?.status === 403) {
        // Subscription expired or inactive
        errorMsg = err.response?.data?.message || "Cette page de réservation n'est pas disponible actuellement.";
      } else {
        errorMsg = err.response?.data?.error || "Erreur lors du chargement du salon";
      }
      setError(errorMsg);
      console.error("Erreur fetchSalon:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Charger les services disponibles du salon
   */
  // silent : chargement en arrière-plan, sans toucher à l'indicateur de chargement
  const fetchServices = useCallback(async ({ silent = false } = {}) => {
    if (!salonSlug) return;

    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/public/salon/${salonSlug}/services`
      );
      setServices(response.data);
      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Erreur lors du chargement des services";
      setError(errorMsg);
      console.error("Erreur fetchServices:", err);
      throw err;
    } finally {
      if (!silent) setLoading(false);
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
      const response = await axios.get(
        `${API_URL}/public/salon/${salonSlug}/settings`
      );
      setSettings(response.data);
      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Erreur lors du chargement des paramètres";
      setError(errorMsg);
      console.error("Erreur fetchSettings:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [salonSlug]);

  /**
   * Charger les créneaux disponibles pour un service et une date
   */
  const fetchAvailability = useCallback(
    async (serviceId, date, staffId = null, excludeToken = null) => {
      // serviceId : un identifiant, ou une liste pour plusieurs prestations à la suite
      const ids = Array.isArray(serviceId) ? serviceId : [serviceId];
      if (!salonSlug || !ids[0] || !date) {
        setError("Paramètres manquants pour récupérer les disponibilités");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${API_URL}/public/salon/${salonSlug}/availability`,
          {
            params: {
              ...(ids.length > 1 ? { service_ids: ids.join(",") } : { service_id: ids[0] }),
              date: date,
              ...(staffId ? { staff_id: staffId } : {}),
              // Déplacement d'un RDV : son propre créneau reste proposé
              ...(excludeToken ? { exclude: excludeToken } : {}),
            },
          }
        );

        const slots = response.data.slots || [];
        setAvailableSlots(slots);
        return { slots, message: response.data.message };
      } catch (err) {
        const errorMsg =
          err.response?.data?.error ||
          "Erreur lors du chargement des disponibilités";
        setError(errorMsg);
        setAvailableSlots([]);
        console.error("Erreur fetchAvailability:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [salonSlug]
  );

  /**
   * Professionnels proposés pour une prestation (liste vide si le salon
   * ne gère pas de disponibilités par employé)
   */
  const fetchStaff = useCallback(
    async (serviceId) => {
      const ids = Array.isArray(serviceId) ? serviceId : [serviceId];
      if (!salonSlug || !ids[0]) return [];
      try {
        const response = await axios.get(
          `${API_URL}/public/salon/${salonSlug}/staff`,
          { params: ids.length > 1 ? { service_ids: ids.join(",") } : { service_id: ids[0] } }
        );
        return response.data.staff || [];
      } catch (err) {
        console.error("Erreur fetchStaff:", err);
        return [];
      }
    },
    [salonSlug]
  );

  /**
   * Créer un rendez-vous
   */
  const createAppointment = useCallback(
    async (appointmentData) => {
      if (!salonSlug) {
        setError("Slug du salon manquant");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.post(`${API_URL}/public/appointments`, {
          salon_slug: salonSlug,
          ...appointmentData,
        });

        return response.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error ||
          "Erreur lors de la création du rendez-vous";
        setError(errorMsg);
        console.error("Erreur createAppointment:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [salonSlug]
  );

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
    fetchStaff,
    createAppointment,
    resetAvailability,
    clearError,
  };
};

export default usePublicBooking;
