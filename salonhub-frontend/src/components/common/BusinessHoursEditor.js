/**
 * BusinessHoursEditor - Composant partagé d'édition des horaires d'ouverture
 *
 * Utilisé par la page Settings (onglet Horaires) et par l'assistant d'onboarding.
 * Format des horaires : objet { [day]: { open, close, closed } }.
 *
 * Props :
 *  - value : objet business_hours (format objet)
 *  - onChange(updated) : appelé avec le nouvel objet business_hours complet
 *  - slotDuration : durée d'un créneau en minutes
 *  - onSlotDurationChange(minutes) : appelé avec la nouvelle durée
 *  - showSlotDuration : afficher le bloc "Durée des créneaux" (défaut: true)
 *  - config : configuration secteur (couleurs/terminologie) — défaut: beauté
 */

import { ClockIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";

export const DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

// Horaires par défaut (format objet) — utilisable comme état initial
export const DEFAULT_BUSINESS_HOURS = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "09:00", close: "17:00", closed: false },
  sunday: { open: "00:00", close: "00:00", closed: true },
};

/**
 * Normalise des horaires reçus du backend (qui peuvent être au format string
 * "09:00-18:00" / "closed" ou déjà au format objet) vers le format objet.
 */
export const normalizeBusinessHours = (raw) => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BUSINESS_HOURS };

  const result = {};
  for (const { key } of DAYS) {
    const day = raw[key];
    if (!day) {
      result[key] = { ...DEFAULT_BUSINESS_HOURS[key] };
    } else if (typeof day === "string") {
      // Format string : "closed" ou "09:00-18:00"
      if (day === "closed" || day.trim() === "") {
        result[key] = { open: "09:00", close: "18:00", closed: true };
      } else {
        const [open, close] = day.split("-");
        result[key] = {
          open: (open || "09:00").trim(),
          close: (close || "18:00").trim(),
          closed: false,
        };
      }
    } else {
      // Déjà au format objet
      result[key] = {
        open: day.open || "09:00",
        close: day.close || "18:00",
        closed: !!day.closed,
      };
    }
  }
  return result;
};

const BusinessHoursEditor = ({
  value,
  onChange,
  slotDuration = 30,
  onSlotDurationChange,
  showSlotDuration = true,
  config: configProp,
}) => {
  const config = configProp || getBusinessTypeConfig("beauty");
  const term = config.terminology || {};
  const hours = value || DEFAULT_BUSINESS_HOURS;

  const handleDayChange = (day, field, fieldValue) => {
    onChange({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: fieldValue,
      },
    });
  };

  const clientsLabel = (term.clients || "Clients").toLowerCase();

  return (
    <div className="space-y-8">
      {showSlotDuration && (
        <div className="pb-8 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-slate-600" />
            Durée des créneaux
          </h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Durée d'un créneau de réservation
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={slotDuration}
                  onChange={(e) =>
                    onSlotDurationChange?.(
                      Math.max(5, Math.min(480, Number(e.target.value)))
                    )
                  }
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  placeholder="30"
                />
              </div>
              <select
                value={
                  slotDuration >= 60 && slotDuration % 60 === 0
                    ? "hours"
                    : "minutes"
                }
                onChange={(e) => {
                  if (e.target.value === "hours") {
                    onSlotDurationChange?.(
                      Math.max(60, Math.round(slotDuration / 60) * 60)
                    );
                  }
                }}
                className={`px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
              >
                <option value="minutes">minutes</option>
                <option value="hours">heures</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSlotDurationChange?.(mins)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    slotDuration === mins
                      ? `${config.lightBg} ${config.textColor} border-transparent`
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins} min`}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Les {clientsLabel} pourront réserver à des intervalles de{" "}
              {slotDuration >= 60
                ? `${slotDuration / 60} heure(s)`
                : `${slotDuration} minutes`}
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-slate-600" />
          Horaires d'ouverture
        </h3>
        <div className="space-y-4">
          {DAYS.map(({ key, label }) => {
            const day = hours[key] || DEFAULT_BUSINESS_HOURS[key];
            return (
              <div
                key={key}
                className="flex items-center space-x-4 pb-4 border-b border-slate-100 last:border-b-0"
              >
                <div className="w-32">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!day.closed}
                      onChange={(e) =>
                        handleDayChange(key, "closed", !e.target.checked)
                      }
                      className={`h-4 w-4 ${config.textColor} ${config.focusRing} border-slate-300 rounded`}
                    />
                    <span className="ml-2 text-sm font-medium text-slate-700">
                      {label}
                    </span>
                  </label>
                </div>

                {!day.closed ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">
                        Ouverture
                      </label>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) =>
                          handleDayChange(key, "open", e.target.value)
                        }
                        className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">
                        Fermeture
                      </label>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) =>
                          handleDayChange(key, "close", e.target.value)
                        }
                        className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-slate-400 italic">
                    Fermé
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessHoursEditor;
