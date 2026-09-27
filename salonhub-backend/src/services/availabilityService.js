/**
 * SALONHUB - Service de disponibilités
 *
 * Calcule les créneaux réservables d'une prestation pour une date donnée,
 * en tenant compte de chaque employé :
 *  - employés actifs qui prennent des RDV (users.is_bookable)
 *  - prestations qu'ils réalisent (staff_services ; aucune ligne = toutes)
 *  - leurs horaires (users.working_hours, sinon horaires du salon)
 *  - leurs congés (staff_time_off)
 *  - leurs RDV existants
 *
 * Les RDV sans employé assigné consomment la capacité d'un employé libre.
 * Si le salon n'a aucun employé réservable (ancien fonctionnement), la
 * capacité est d'un seul RDV à la fois pour tout le salon.
 */

const db = require("../config/database");

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DEFAULT_BUSINESS_HOURS = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "09:00", close: "17:00", closed: false },
  sunday: { open: "00:00", close: "00:00", closed: true },
};

const toMinutes = (time) => {
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + (m || 0);
};

const toHHMM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
};

// Accepte "closed", "09:00-18:00" ou { open, close, closed }
const parseDaySchedule = (daySchedule) => {
  if (!daySchedule || daySchedule === "closed") return { closed: true };
  if (typeof daySchedule === "string" && daySchedule.includes("-")) {
    const [open, close] = daySchedule.split("-");
    return { open: open.trim(), close: close.trim(), closed: false };
  }
  return daySchedule;
};

// Plage d'ouverture en minutes, ou null si fermé / incohérent
const getDayWindow = (daySchedule) => {
  const day = parseDaySchedule(daySchedule);
  if (!day || day.closed || !day.open || !day.close) return null;
  const start = toMinutes(day.open);
  const end = toMinutes(day.close);
  if (!(end > start)) return null;
  return { start, end };
};

const intersectWindows = (a, b) => {
  if (!a || !b) return null;
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return end > start ? { start, end } : null;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// Jour de la semaine d'une date "YYYY-MM-DD", indépendant du fuseau du serveur
const getDayName = (date) =>
  DAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];

// Date et heure locales du serveur ("maintenant" pour filtrer les créneaux passés)
const getLocalNow = (now = new Date()) => {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  return { date, minutes: now.getHours() * 60 + now.getMinutes() };
};

const getSchedulingSettings = async (tenantId) => {
  const rows = await db.query(
    `SELECT setting_key, setting_value FROM settings
     WHERE tenant_id = ? AND setting_key IN ('business_hours', 'slot_duration')`,
    [tenantId]
  );

  let businessHours = null;
  let slotDuration = 30;
  rows.forEach((row) => {
    if (row.setting_key === "business_hours") {
      businessHours = parseJson(row.setting_value);
    } else if (row.setting_key === "slot_duration") {
      const parsed = parseInt(row.setting_value, 10);
      if (parsed > 0) slotDuration = parsed;
    }
  });

  return { businessHours: businessHours || DEFAULT_BUSINESS_HOURS, slotDuration };
};

/**
 * Employés réservables du salon, avec les prestations qu'ils réalisent.
 * serviceIds = null signifie "toutes les prestations".
 */
const getBookableStaff = async (tenantId) => {
  let staff;
  let links;
  try {
    staff = await db.query(
      `SELECT id, first_name, last_name, avatar_url, working_hours
       FROM users
       WHERE tenant_id = ? AND is_active = 1 AND is_bookable = 1
       ORDER BY first_name, last_name`,
      [tenantId]
    );
    if (staff.length === 0) return [];

    links = await db.query(
      "SELECT user_id, service_id FROM staff_services WHERE tenant_id = ?",
      [tenantId]
    );
  } catch (error) {
    // Sans la migration 022, on conserve l'ancien fonctionnement (capacité salon)
    if (isMissingSchemaError(error)) {
      console.warn("⚠️ Migration 022_staff_availability non appliquée : disponibilités au niveau du salon");
      return [];
    }
    throw error;
  }
  const servicesByUser = new Map();
  links.forEach(({ user_id, service_id }) => {
    if (!servicesByUser.has(user_id)) servicesByUser.set(user_id, new Set());
    servicesByUser.get(user_id).add(Number(service_id));
  });

  return staff.map((member) => ({
    ...member,
    working_hours: parseJson(member.working_hours),
    serviceIds: servicesByUser.get(member.id) || null,
  }));
};

// Migration 022 non appliquée : colonne ou table absente
const isMissingSchemaError = (error) =>
  ["ER_BAD_FIELD_ERROR", "ER_NO_SUCH_TABLE"].includes(error?.code);

const canPerformService = (member, serviceId) =>
  !member.serviceIds || member.serviceIds.has(Number(serviceId));

// Plusieurs prestations enchaînées : l'employé doit toutes les réaliser
const canPerformAll = (member, serviceIds) =>
  serviceIds.every((id) => canPerformService(member, id));

// Une prestation (serviceId) ou plusieurs (serviceIds), sans doublon, dans l'ordre
const toServiceIdList = (serviceId, serviceIds) => {
  const raw = Array.isArray(serviceIds) && serviceIds.length > 0 ? serviceIds : [serviceId];
  return [...new Set(raw.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
};

const toIdList = (value) =>
  (Array.isArray(value) ? value : [value]).map(Number).filter((id) => id > 0);

/**
 * Prestations actives du salon, dans l'ordre demandé (null si l'une manque).
 */
const getServicesInOrder = async (tenantId, serviceIds) => {
  if (serviceIds.length === 0) return null;
  const rows = await db.query(
    `SELECT id, name, duration, price, slot_duration FROM services
     WHERE tenant_id = ? AND is_active = 1 AND id IN (${serviceIds.map(() => "?").join(", ")})`,
    [tenantId, ...serviceIds]
  );
  const byId = new Map(rows.map((row) => [Number(row.id), row]));
  const ordered = serviceIds.map((id) => byId.get(id));
  return ordered.every(Boolean) ? ordered : null;
};

/**
 * Employés proposés au client pour une ou plusieurs prestations (étape "Avec qui ?").
 */
const getStaffForService = async (tenantId, serviceIdOrIds) => {
  const serviceIds = toServiceIdList(null, toIdList(serviceIdOrIds));
  const staff = await getBookableStaff(tenantId);
  return staff.filter((member) => canPerformAll(member, serviceIds));
};

/**
 * Prépare le contexte de calcul d'une journée, pour une prestation ou
 * plusieurs prestations enchaînées (durée cumulée, même employé).
 * Retourne null si une prestation n'existe pas.
 */
const buildDayContext = async ({
  tenantId,
  serviceId,
  serviceIds = null,
  date,
  excludeAppointmentId = null,
}) => {
  const ids = toServiceIdList(serviceId, serviceIds);
  const services = await getServicesInOrder(tenantId, ids);
  if (!services) return null;
  const totalDuration = services.reduce((sum, service) => sum + Number(service.duration), 0);

  const { businessHours, slotDuration } = await getSchedulingSettings(tenantId);
  const dayName = getDayName(date);
  const salonWindow = getDayWindow(businessHours[dayName]);

  const allStaff = await getBookableStaff(tenantId);
  const legacyMode = allStaff.length === 0;

  const timeOff = legacyMode
    ? []
    : await db.query(
        `SELECT user_id FROM staff_time_off
         WHERE tenant_id = ? AND start_date <= ? AND end_date >= ?`,
        [tenantId, date, date]
      );
  const offIds = new Set(timeOff.map((row) => row.user_id));

  // Employés en mesure de réaliser la (les) prestation(s) ce jour-là, avec leur plage horaire
  const candidates = allStaff
    .filter((member) => canPerformAll(member, ids))
    .filter((member) => !offIds.has(member.id))
    .map((member) => {
      const ownWindow = member.working_hours
        ? getDayWindow(member.working_hours[dayName])
        : salonWindow;
      return { ...member, window: intersectWindows(salonWindow, ownWindow) };
    })
    .filter((member) => member.window);

  let appointmentsSql = `SELECT id, staff_id, start_time, end_time
     FROM appointments
     WHERE tenant_id = ? AND appointment_date = ?
       AND status NOT IN ('cancelled', 'no_show')`;
  const params = [tenantId, date];
  // RDV déplacé (ou groupe de RDV enchaînés) : ne bloque pas ses propres créneaux
  const excluded = excludeAppointmentId ? toIdList(excludeAppointmentId) : [];
  if (excluded.length > 0) {
    appointmentsSql += ` AND id NOT IN (${excluded.map(() => "?").join(", ")})`;
    params.push(...excluded);
  }
  const appointments = await db.query(appointmentsSql, params);

  const busyByStaff = new Map();
  const unassigned = [];
  appointments.forEach((apt) => {
    const interval = {
      start: toMinutes(apt.start_time),
      end: toMinutes(apt.end_time),
    };
    if (apt.staff_id) {
      if (!busyByStaff.has(apt.staff_id)) busyByStaff.set(apt.staff_id, []);
      busyByStaff.get(apt.staff_id).push(interval);
    } else {
      unassigned.push(interval);
    }
  });

  return {
    date,
    services,
    duration: totalDuration,
    step: Number(services[0].slot_duration) || slotDuration || 30,
    salonWindow,
    legacyMode,
    candidates,
    appointments: appointments.map((apt) => ({
      start: toMinutes(apt.start_time),
      end: toMinutes(apt.end_time),
    })),
    busyByStaff,
    unassigned,
  };
};

/**
 * Évalue un créneau [start, start + durée) et retourne les employés libres.
 * - legacy : { available, staffIds: [] }
 * - sinon  : available si au moins un employé libre reste après avoir
 *            réservé une place aux RDV non assignés qui chevauchent.
 */
const evaluateSlot = (ctx, start, staffId = null) => {
  const end = start + ctx.duration;

  if (!ctx.salonWindow || start < ctx.salonWindow.start || end > ctx.salonWindow.end) {
    return { available: false, staffIds: [] };
  }

  if (ctx.legacyMode) {
    const conflict = ctx.appointments.some((apt) =>
      overlaps(start, end, apt.start, apt.end)
    );
    return { available: !conflict, staffIds: [] };
  }

  const free = ctx.candidates.filter((member) => {
    if (start < member.window.start || end > member.window.end) return false;
    const busy = ctx.busyByStaff.get(member.id) || [];
    return !busy.some((interval) => overlaps(start, end, interval.start, interval.end));
  });

  const unassignedOverlap = ctx.unassigned.filter((interval) =>
    overlaps(start, end, interval.start, interval.end)
  ).length;

  const capacity = free.length - unassignedOverlap;
  const freeIds = free.map((member) => member.id);

  if (staffId) {
    const requested = Number(staffId);
    const available = capacity > 0 && freeIds.includes(requested);
    return { available, staffIds: available ? [requested] : [] };
  }

  return { available: capacity > 0, staffIds: capacity > 0 ? freeIds : [] };
};

/**
 * Créneaux disponibles pour une prestation et une date.
 * options.includePast : inclure les créneaux déjà passés (usage back-office)
 */
const getAvailableSlots = async ({
  tenantId,
  serviceId,
  serviceIds = null,
  date,
  staffId = null,
  includePast = false,
  excludeAppointmentId = null,
  now = new Date(),
}) => {
  const ctx = await buildDayContext({ tenantId, serviceId, serviceIds, date, excludeAppointmentId });
  if (!ctx) return { error: "SERVICE_NOT_FOUND" };

  if (!ctx.salonWindow) {
    return { slots: [], message: "Fermé ce jour" };
  }
  if (staffId && !ctx.legacyMode && !ctx.candidates.some((m) => m.id === Number(staffId))) {
    return { slots: [], message: "Ce professionnel n'est pas disponible ce jour" };
  }

  const localNow = getLocalNow(now);
  if (!includePast && date < localNow.date) {
    return { slots: [], message: "Date passée" };
  }
  const minStart = !includePast && date === localNow.date ? localNow.minutes : -1;

  const slots = [];
  for (
    let start = ctx.salonWindow.start;
    start + ctx.duration <= ctx.salonWindow.end;
    start += ctx.step
  ) {
    if (start <= minStart) continue;
    const { available } = evaluateSlot(ctx, start, staffId);
    if (available) {
      const time = toHHMM(start);
      slots.push({ time, datetime: `${date} ${time}:00`, available: true });
    }
  }

  return { slots };
};

/**
 * Choisit l'employé qui prendra un RDV (réservation en ligne ou back-office).
 *
 * Retourne :
 *  - { available: false }                        créneau indisponible
 *  - { available: true, staffId: null }          salon sans employé réservable
 *  - { available: true, staffId }                employé retenu
 *
 * Sans préférence, l'employé le moins chargé ce jour-là est retenu.
 */
const findStaffForSlot = async ({
  tenantId,
  serviceId,
  serviceIds = null,
  date,
  startTime,
  staffId = null,
  includePast = false,
  excludeAppointmentId = null,
  now = new Date(),
}) => {
  const ctx = await buildDayContext({
    tenantId,
    serviceId,
    serviceIds,
    date,
    excludeAppointmentId,
  });
  if (!ctx) return { available: false, error: "SERVICE_NOT_FOUND" };

  const start = toMinutes(startTime);
  if (!includePast) {
    const localNow = getLocalNow(now);
    if (date < localNow.date || (date === localNow.date && start <= localNow.minutes)) {
      return { available: false, reason: "PAST" };
    }
  }

  const { available, staffIds } = evaluateSlot(ctx, start, staffId);
  if (!available) return { available: false };
  if (ctx.legacyMode) return { available: true, staffId: null };

  const load = (id) => (ctx.busyByStaff.get(id) || []).length;
  const [chosen] = [...staffIds].sort((a, b) => load(a) - load(b) || a - b);
  return { available: true, staffId: chosen };
};

module.exports = {
  DEFAULT_BUSINESS_HOURS,
  toServiceIdList,
  getServicesInOrder,
  getStaffForService,
  getAvailableSlots,
  findStaffForSlot,
  // exportés pour les tests
  _internals: { getDayWindow, evaluateSlot, getDayName, toMinutes, toHHMM },
};
