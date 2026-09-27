/**
 * Utilitaires partagés pour les rendez-vous (libellés, dates, heures)
 */

export const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Terminé",
  no_show: "Absent",
};

export const STATUS_BADGE_STYLES = {
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border border-red-200",
  completed: "bg-violet-100 text-violet-800 border border-violet-200",
  no_show: "bg-slate-100 text-slate-700 border border-slate-200",
};

/**
 * Date "YYYY-MM-DD" d'un RDV.
 * L'API renvoie les colonnes DATE en ISO (minuit du fuseau du serveur, ex.
 * "2026-09-27T23:00:00.000Z" pour un serveur en UTC+1). Décaler de 12 h avant
 * de lire la date UTC retrouve le bon jour quel que soit ce fuseau (±12 h).
 */
export const getDateKey = (value) => {
  if (!value) return "";
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return str.slice(0, 10);
  return new Date(parsed.getTime() + 12 * 3600 * 1000).toISOString().slice(0, 10);
};

// Date locale (sans décalage UTC) au format "YYYY-MM-DD"
export const toDateKey = (date) => getDateKey(date);

// Objet Date local construit à partir d'une date de RDV et d'une heure "HH:MM[:SS]"
export const toLocalDateTime = (dateValue, time) => {
  const [y, m, d] = getDateKey(dateValue).split("-").map(Number);
  const [h, min] = String(time || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, min || 0);
};

export const formatTime = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

// "HH:MM" + durée en minutes -> "HH:MM"
export const addMinutesToTime = (time, minutes) => {
  const [h, m] = String(time).split(":").map(Number);
  const total = h * 60 + (m || 0) + Number(minutes || 0);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

// Le RDV a-t-il déjà commencé ? (pour proposer "Absent")
export const hasStarted = (appointment, now = new Date()) =>
  toLocalDateTime(appointment.appointment_date, appointment.start_time) <= now;

export const formatLongDate = (value) =>
  toLocalDateTime(value, "00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
