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

// ---------- Réservation de plusieurs prestations ----------

// "12" ou "12,15" (paramètre ?service=) → [12, 15]
export const parseServiceIds = (value) =>
  [...new Set(String(value || "").split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0))];

/**
 * Prestations enchaînées présentées comme une seule : noms, durée et prix
 * cumulés. Une prestation seule est retournée telle quelle (avec ids).
 */
export const combineServices = (list) => {
  const services = (list || []).filter(Boolean);
  if (services.length === 0) return null;
  if (services.length === 1) return { ...services[0], ids: [services[0].id], items: services };
  const deposits = services.filter((s) => s.requires_deposit === 1 || s.requires_deposit === true);
  return {
    ...services[0],
    ids: services.map((s) => s.id),
    items: services,
    name: services.map((s) => s.name).join(" + "),
    duration: services.reduce((sum, s) => sum + Number(s.duration || 0), 0),
    price: services.reduce((sum, s) => sum + Number(s.price || 0), 0),
    requires_deposit: deposits.length > 0,
    deposit_amount: deposits.reduce((sum, s) => sum + (parseFloat(s.deposit_amount) || 0), 0) || null,
  };
};

export const serviceIdsOf = (service) => (service?.ids?.length ? service.ids : service ? [service.id] : []);
