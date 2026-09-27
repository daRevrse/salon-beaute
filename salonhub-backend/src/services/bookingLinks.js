/**
 * SALONHUB - Liens client "Gérer mon rendez-vous" et politique de réservation
 *
 *  - jeton de gestion propre à chaque RDV (lien sans compte client)
 *  - réglages du salon : confirmation automatique des réservations en ligne,
 *    délai minimum pour annuler / déplacer en ligne
 *  - export calendrier (.ics)
 */

const crypto = require("crypto");
const db = require("../config/database");

const DEFAULT_NOTICE_HOURS = 2;

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";

// Colonnes ajoutées par migration (024, 025) : on s'adapte sans planter
const columnCache = new Map();
const hasAppointmentColumn = async (column) => {
  if (!columnCache.has(column)) {
    const rows = await db.query("SHOW COLUMNS FROM appointments LIKE ?", [column]);
    columnCache.set(column, rows.length > 0);
  }
  return columnCache.get(column);
};
const hasManageTokenColumn = () => hasAppointmentColumn("manage_token");
const hasBookingGroupColumn = () => hasAppointmentColumn("booking_group");

const generateToken = () => crypto.randomBytes(32).toString("hex");
const generateGroupId = () => crypto.randomUUID();

/**
 * RDV réservés ensemble (même groupe), dans l'ordre de passage.
 * Pour un RDV isolé, retourne ses seules infos d'identifiant.
 */
const getGroupAppointmentIds = async (appointment) => {
  if (!appointment.booking_group || !(await hasBookingGroupColumn())) return [appointment.id];
  const rows = await db.query(
    `SELECT id FROM appointments WHERE tenant_id = ? AND booking_group = ?
     ORDER BY appointment_date, start_time, id`,
    [appointment.tenant_id, appointment.booking_group]
  );
  return rows.length > 0 ? rows.map((row) => row.id) : [appointment.id];
};

/**
 * Jeton de gestion d'un RDV (créé s'il n'existe pas encore).
 * Retourne null si la migration 024 n'est pas appliquée.
 */
const ensureManageToken = async (appointmentId) => {
  if (!(await hasManageTokenColumn())) return null;
  const [row] = await db.query("SELECT manage_token FROM appointments WHERE id = ?", [appointmentId]);
  if (!row) return null;
  if (row.manage_token) return row.manage_token;
  const token = generateToken();
  await db.query(
    "UPDATE appointments SET manage_token = ? WHERE id = ? AND manage_token IS NULL",
    [token, appointmentId]
  );
  const [updated] = await db.query("SELECT manage_token FROM appointments WHERE id = ?", [appointmentId]);
  return updated?.manage_token || null;
};

const getManageUrl = (slug, token) =>
  slug && token ? `${frontendUrl()}/book/${slug}/rdv/${token}` : null;

/**
 * Réglages de réservation en ligne du salon.
 *  - autoConfirm : les réservations en ligne sont confirmées d'office
 *  - noticeHours : délai minimum (heures) pour annuler / déplacer en ligne,
 *                  -1 = non autorisé
 */
const getBookingPolicy = async (tenantId) => {
  const rows = await db.query(
    `SELECT setting_key, setting_value FROM settings
     WHERE tenant_id = ? AND setting_key IN ('auto_confirm_online_bookings', 'client_change_notice_hours')`,
    [tenantId]
  );
  const values = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  const notice = parseInt(values.client_change_notice_hours, 10);
  return {
    autoConfirm: values.auto_confirm_online_bookings === "true" || values.auto_confirm_online_bookings === "1",
    noticeHours: Number.isNaN(notice) ? DEFAULT_NOTICE_HOURS : notice,
  };
};

// Le client peut-il encore annuler / déplacer ce RDV ?
const getChangeDeadline = (appointment, noticeHours) => {
  const [y, m, d] = appointment.date.split("-").map(Number);
  const [h, min] = String(appointment.start_time).split(":").map(Number);
  const start = new Date(y, m - 1, d, h, min || 0);
  return new Date(start.getTime() - Math.max(noticeHours, 0) * 3600 * 1000);
};

const canClientChange = (appointment, noticeHours, now = new Date()) =>
  noticeHours >= 0 &&
  ["pending", "confirmed"].includes(appointment.status) &&
  now <= getChangeDeadline(appointment, noticeHours);

// ---------- Export calendrier ----------
const icsEscape = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

const icsLocal = (date, time) =>
  `${date.replace(/-/g, "")}T${String(time).slice(0, 5).replace(":", "")}00`;

/**
 * Fichier .ics d'un RDV. Heures "flottantes" (sans fuseau) : elles s'affichent
 * à l'heure locale du téléphone, ce qui correspond à un établissement local.
 */
const buildIcs = ({ id, date, start_time, end_time, service_name, salon_name, address, staff_first_name, manageUrl }) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const description = [
    staff_first_name ? `Avec ${staff_first_name}` : null,
    manageUrl ? `Gérer mon rendez-vous : ${manageUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SalonHub//Rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appointment-${id}@salonhub`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsLocal(date, start_time)}`,
    `DTEND:${icsLocal(date, end_time)}`,
    `SUMMARY:${icsEscape(`${service_name} - ${salon_name}`)}`,
    address ? `LOCATION:${icsEscape(address)}` : null,
    description ? `DESCRIPTION:${icsEscape(description)}` : null,
    manageUrl ? `URL:${manageUrl}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(`Rendez-vous ${salon_name}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
};

module.exports = {
  DEFAULT_NOTICE_HOURS,
  hasManageTokenColumn,
  hasBookingGroupColumn,
  generateToken,
  generateGroupId,
  getGroupAppointmentIds,
  ensureManageToken,
  getManageUrl,
  getBookingPolicy,
  getChangeDeadline,
  canClientChange,
  buildIcs,
};
