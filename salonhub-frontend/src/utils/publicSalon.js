/**
 * Utilitaires des pages publiques d'un établissement (horaires, adresse)
 */

export const WEEK_DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

const JS_DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const parseHoursObject = (hours) => {
  if (!hours) return null;
  if (typeof hours === "string") {
    try {
      return JSON.parse(hours);
    } catch (e) {
      return null;
    }
  }
  return hours;
};

// { open, close } d'un jour, ou null si fermé. Accepte "09:00-18:00", "closed" ou un objet.
export const getDayHours = (businessHours, dayKey) => {
  const hours = parseHoursObject(businessHours);
  const day = hours?.[dayKey];
  if (!day || day === "closed") return null;
  if (typeof day === "string") {
    const [open, close] = day.split("-").map((t) => t.trim());
    return open && close ? { open, close } : null;
  }
  if (day.closed || !day.open || !day.close || day.open === day.close) return null;
  return { open: day.open, close: day.close };
};

export const getDayKey = (date) => JS_DAY_KEYS[date.getDay()];

export const getWeekSchedule = (businessHours) =>
  WEEK_DAYS.map(({ key, label }) => ({ key, label, hours: getDayHours(businessHours, key) }));

export const hasBusinessHours = (businessHours) => !!parseHoursObject(businessHours);

export const getMapsUrl = (salon) => {
  const query = [salon?.address, salon?.postal_code, salon?.city].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
};

export const getPhoneHref = (phone) => (phone ? `tel:${String(phone).replace(/[^\d+]/g, "")}` : null);

// Dernière confirmation de réservation (sessionStorage) : survit au rafraîchissement
export const confirmationStorageKey = (slug) => `booking-confirmation-${slug}`;
