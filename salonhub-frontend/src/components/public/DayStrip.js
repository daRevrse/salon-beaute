/**
 * DayStrip - Bandeau de choix du jour (pages publiques)
 *
 * Affiche les N prochains jours (jours fermés grisés) et un champ
 * « Autre date » pour aller au-delà.
 */

import { useMemo } from "react";
import { usePublicTheme } from "../../contexts/PublicThemeContext";
import { getDayHours, getDayKey, hasBusinessHours } from "../../utils/publicSalon";

export const DAYS_AHEAD = 14;

export const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Les N prochains jours, avec l'indication "fermé" selon les horaires du salon
export const useUpcomingDays = (businessHours, count = DAYS_AHEAD) =>
  useMemo(() => {
    const start = new Date();
    const withHours = hasBusinessHours(businessHours);
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const closed = withHours && !getDayHours(businessHours, getDayKey(date));
      return { key: toDateKey(date), date, closed };
    });
  }, [businessHours, count]);

const DayStrip = ({ days, selectedDate, onSelect, label = "Choix du jour" }) => {
  const { dynamicStyles } = usePublicTheme();
  const today = toDateKey(new Date());
  const isOtherDate = selectedDate && !days.some((d) => d.key === selectedDate);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="radiogroup" aria-label={label}>
        {days.map((day) => {
          const isSelected = day.key === selectedDate;
          const weekday = day.date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
          const month = day.date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
          return (
            <button
              key={day.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${day.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${day.closed ? " (fermé)" : ""}`}
              disabled={day.closed}
              onClick={() => onSelect(day.key)}
              className={`flex-shrink-0 w-16 py-2.5 rounded-2xl border-2 text-center transition-all ${
                day.closed
                  ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                  : isSelected
                  ? "shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              style={isSelected ? dynamicStyles.activeOption : {}}
            >
              <span className="block text-xs capitalize">{day.key === today ? "Auj." : weekday}</span>
              <span className="block text-lg font-bold leading-tight">{day.date.getDate()}</span>
              <span className="block text-[11px] capitalize">{day.closed ? "Fermé" : month}</span>
            </button>
          );
        })}
      </div>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        Autre date :
        <input
          type="date"
          value={isOtherDate ? selectedDate : ""}
          min={today}
          onChange={(e) => e.target.value && onSelect(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white"
        />
      </label>
    </>
  );
};

export default DayStrip;
