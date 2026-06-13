/**
 * useOnboardingProgress
 *
 * Calcule l'avancement de la configuration initiale du salon à partir des
 * DONNÉES RÉELLES (pas d'un état partiel stocké côté serveur) :
 *  - infos salon : GET /settings/salon  (adresse + téléphone renseignés)
 *  - horaires    : GET /settings        (au moins un jour ouvert valide)
 *  - services    : GET /services        (au moins un service)
 *
 * L'onboarding est considéré comme terminé si toutes les étapes sont faites
 * OU si tenant.onboarding_status === 'completed'.
 */

import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  DAYS,
  normalizeBusinessHours,
} from "../components/common/BusinessHoursEditor";

// Au moins un jour ouvert avec des horaires cohérents
const hasValidBusinessHours = (rawHours) => {
  if (!rawHours) return false;
  const hours = normalizeBusinessHours(rawHours);
  return DAYS.some(({ key }) => {
    const day = hours[key];
    return (
      day &&
      !day.closed &&
      day.open &&
      day.close &&
      day.open !== day.close &&
      !(day.open === "00:00" && day.close === "00:00")
    );
  });
};

export default function useOnboardingProgress() {
  const { tenant } = useAuth();
  const completedFlag = tenant?.onboarding_status === "completed";

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    salonInfoDone: false,
    hoursDone: false,
    servicesDone: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [salonRes, settingsRes, servicesRes] = await Promise.all([
        api.get("/settings/salon").catch(() => null),
        api.get("/settings").catch(() => null),
        api.get("/services").catch(() => null),
      ]);

      const salon = salonRes?.data?.data || {};
      const settings = settingsRes?.data || {};
      const services = servicesRes?.data?.data || [];

      setProgress({
        salonInfoDone: Boolean(
          (salon.address && salon.address.trim()) &&
            (salon.phone && String(salon.phone).trim())
        ),
        hoursDone: hasValidBusinessHours(settings.business_hours),
        servicesDone: Array.isArray(services) && services.length > 0,
      });
    } catch (err) {
      console.error("Erreur calcul progression onboarding:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { salonInfoDone, hoursDone, servicesDone } = progress;
  const doneCount = [salonInfoDone, hoursDone, servicesDone].filter(
    Boolean
  ).length;
  const totalSteps = 3;
  const allDone = doneCount === totalSteps;

  return {
    loading,
    salonInfoDone,
    hoursDone,
    servicesDone,
    doneCount,
    totalSteps,
    allDone,
    // L'onboarding est terminé si tout est fait OU marqué complété côté serveur
    completed: completedFlag || allDone,
    refresh: load,
  };
}
