/**
 * HoursStep - Étape 2 : horaires d'ouverture + durée des créneaux
 * GET/PUT /settings — étape clé (la réservation en ligne en dépend).
 */

import { useState, useEffect } from "react";
import api from "../../../services/api";
import BusinessHoursEditor, {
  DEFAULT_BUSINESS_HOURS,
  normalizeBusinessHours,
} from "../../../components/common/BusinessHoursEditor";
import StepFooter from "./StepFooter";

const HoursStep = ({ config, onNext, onSkip, onBack }) => {
  const [businessHours, setBusinessHours] = useState(DEFAULT_BUSINESS_HOURS);
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/settings")
      .then((res) => {
        if (!active) return;
        const settings = res.data || {};
        if (settings.business_hours) {
          setBusinessHours(normalizeBusinessHours(settings.business_hours));
        }
        if (settings.slot_duration) {
          setSlotDuration(Number(settings.slot_duration));
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put("/settings", {
        business_hours: businessHours,
        slot_duration: slotDuration,
      });
      onNext();
    } catch (err) {
      setError(
        err.response?.data?.error || "Erreur lors de l'enregistrement des horaires"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-xl text-slate-800 mb-1">
          Vos horaires d'ouverture
        </h2>
        <p className="text-sm text-slate-500">
          Indispensable pour que vos clients puissent réserver en ligne. Nous
          avons pré-rempli des horaires courants — ajustez-les.
        </p>
      </div>

      {error && (
        <div className="alert-error-premium mb-5">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <BusinessHoursEditor
        value={businessHours}
        onChange={setBusinessHours}
        slotDuration={slotDuration}
        onSlotDurationChange={setSlotDuration}
        config={config}
      />

      <StepFooter
        onBack={onBack}
        onSkip={onSkip}
        onContinue={handleContinue}
        saving={saving}
      />
    </div>
  );
};

export default HoursStep;
