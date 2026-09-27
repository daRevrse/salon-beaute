/**
 * useOnboardingProgress
 *
 * Calcule l'avancement de la configuration initiale du salon à partir des
 * DONNÉES RÉELLES (pas d'un état partiel stocké côté serveur) :
 *  - infos salon : GET /settings/salon  (adresse + téléphone renseignés)
 *  - horaires    : GET /settings        (au moins un jour ouvert valide)
 *  - services    : GET /services        (au moins un service)
 *
 *  - équipe      : GET /auth/staff     (au moins un membre hors propriétaire,
 *                  étape facultative, non comptée dans la progression)
 *
 * "Prêt" = horaires + services : le salon peut recevoir des réservations.
 * L'onboarding est terminé si toutes les étapes sont faites, ou s'il a été
 * marqué complété ET que le salon est prêt (le marquage seul ne masque plus
 * la checklist tant qu'il manque l'essentiel).
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
    teamDone: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [salonRes, settingsRes, servicesRes, staffRes] = await Promise.all([
        api.get("/settings/salon").catch(() => null),
        api.get("/settings").catch(() => null),
        api.get("/services").catch(() => null),
        api.get("/auth/staff").catch(() => null),
      ]);
      const staff = staffRes?.data?.data || [];

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
        teamDone: staff.some((member) => member.role !== "owner"),
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

  const { salonInfoDone, hoursDone, servicesDone, teamDone } = progress;
  const doneCount = [salonInfoDone, hoursDone, servicesDone].filter(
    Boolean
  ).length;
  const totalSteps = 3;
  const allDone = doneCount === totalSteps;
  const ready = hoursDone && servicesDone;

  return {
    loading,
    salonInfoDone,
    hoursDone,
    servicesDone,
    teamDone,
    ready,
    doneCount,
    totalSteps,
    allDone,
    completed: allDone || (completedFlag && ready),
    refresh: load,
  };
}
