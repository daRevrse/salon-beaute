/**
 * SlotGrid - Créneaux disponibles regroupés par moment de la journée
 */

import { usePublicTheme } from "../../contexts/PublicThemeContext";

const SLOT_GROUPS = [
  { label: "Matin", test: (h) => h < 12 },
  { label: "Après-midi", test: (h) => h >= 12 && h < 18 },
  { label: "Soir", test: (h) => h >= 18 },
];

const SlotGrid = ({ slots, onSelect, selectedTime = null }) => {
  const { dynamicStyles } = usePublicTheme();

  const groups = SLOT_GROUPS.map((group) => ({
    label: group.label,
    slots: slots.filter((slot) => group.test(Number(slot.time.split(":")[0]))),
  })).filter((group) => group.slots.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{group.label}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {group.slots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => onSelect(slot)}
                  aria-pressed={selectedTime !== null ? isSelected : undefined}
                  className={`px-3 py-3 border rounded-xl text-center font-medium shadow-soft hover:shadow-md focus:outline-none focus:ring-2 transition-all ${
                    isSelected ? "" : "text-slate-900"
                  }`}
                  style={
                    isSelected
                      ? dynamicStyles.activeOption
                      : { ...dynamicStyles.primaryBg, ...dynamicStyles.primaryBorderLight }
                  }
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SlotGrid;
