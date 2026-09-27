/**
 * AppointmentCalendar - Planning des rendez-vous
 *
 *  - Vue Jour par défaut, une colonne par employé (si plusieurs)
 *  - Clic sur un créneau vide : création d'un RDV pré-rempli
 *  - Glisser-déposer : déplacement d'un RDV (heure et/ou employé)
 *
 * Props :
 *  - appointments            : RDV de la période affichée
 *  - staff                   : employés à afficher en colonnes (vue Jour)
 *  - date, view              : date et vue affichées (contrôlées par le parent)
 *  - onNavigate(date)        : changement de date
 *  - onView(view)            : changement de vue
 *  - onSelectEvent(apt)      : ouverture d'un RDV
 *  - onSelectSlot({ date, time, staffId })
 *  - onMoveEvent({ appointment, date, startTime, endTime, staffId })
 *  - canMove(apt)            : le RDV peut-il être déplacé
 *  - minTime, maxTime        : bornes horaires affichées (Date)
 */

import React, { useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "moment/locale/fr";
import {
  STATUS_LABELS,
  toLocalDateTime,
  toDateKey,
  formatTime,
} from "../../utils/appointmentUtils";

moment.locale("fr");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

export const UNASSIGNED_RESOURCE = "unassigned";

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", border: "#f59e0b", text: "#78350f" },
  confirmed: { bg: "#d1fae5", border: "#10b981", text: "#064e3b" },
  completed: { bg: "#ede9fe", border: "#8b5cf6", text: "#4c1d95" },
  cancelled: { bg: "#fee2e2", border: "#f87171", text: "#7f1d1d" },
  no_show: { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" },
};

const MESSAGES = {
  next: "Suivant",
  previous: "Précédent",
  today: "Aujourd'hui",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  date: "Date",
  time: "Heure",
  event: "Rendez-vous",
  allDay: "Journée",
  noEventsInRange: "Aucun rendez-vous sur cette période",
  showMore: (total) => `+${total} de plus`,
};

// Contenu d'un RDV dans le planning
const EventContent = ({ event }) => {
  const apt = event.resource;
  return (
    <div className="leading-tight">
      <div className="font-semibold truncate">
        {apt.client_first_name} {apt.client_last_name}
      </div>
      <div className="truncate opacity-80">{apt.service_name}</div>
      {apt.status !== "confirmed" && (
        <div className="text-[10px] uppercase tracking-wide opacity-70">
          {STATUS_LABELS[apt.status]}
        </div>
      )}
    </div>
  );
};

const AppointmentCalendar = ({
  appointments,
  staff = [],
  date,
  view,
  onNavigate,
  onView,
  onSelectEvent,
  onSelectSlot,
  onMoveEvent,
  canMove = () => false,
  minTime,
  maxTime,
}) => {
  const hasUnassigned = appointments.some(
    (apt) => !apt.staff_id && !["cancelled", "no_show"].includes(apt.status)
  );

  // Colonnes par employé uniquement en vue Jour (lisible) et si plusieurs employés
  const resources = useMemo(() => {
    if (view !== Views.DAY || staff.length < 2) return undefined;
    const columns = staff.map((member) => ({
      id: member.id,
      title: `${member.first_name} ${member.last_name ? `${member.last_name.charAt(0)}.` : ""}`,
    }));
    if (hasUnassigned) columns.push({ id: UNASSIGNED_RESOURCE, title: "Non assigné" });
    return columns;
  }, [view, staff, hasUnassigned]);

  const events = useMemo(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: `${apt.client_first_name} ${apt.client_last_name} - ${apt.service_name}`,
        start: toLocalDateTime(apt.appointment_date, apt.start_time),
        end: toLocalDateTime(apt.appointment_date, apt.end_time),
        allDay: false,
        resourceId: apt.staff_id || UNASSIGNED_RESOURCE,
        resource: apt,
      })),
    [appointments]
  );

  const eventPropGetter = useCallback((event) => {
    const colors = STATUS_COLORS[event.resource.status] || STATUS_COLORS.no_show;
    const faded = ["cancelled", "no_show"].includes(event.resource.status);
    return {
      style: {
        backgroundColor: colors.bg,
        color: colors.text,
        border: "none",
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: "8px",
        fontSize: "12px",
        opacity: faded ? 0.6 : 1,
        textDecoration: event.resource.status === "cancelled" ? "line-through" : "none",
      },
    };
  }, []);

  // Aujourd'hui : ouvrir le planning autour de l'heure actuelle
  const scrollToTime = useMemo(() => {
    const now = new Date();
    if (toDateKey(date) !== toDateKey(now)) return minTime;
    const hour = Math.max(now.getHours() - 1, minTime ? minTime.getHours() : 0);
    return new Date(1970, 0, 1, hour, 0);
  }, [date, minTime]);

  const toStaffId = (resourceId) =>
    resourceId === undefined || resourceId === UNASSIGNED_RESOURCE ? null : resourceId;

  const handleSelectSlot = ({ start, resourceId, action }) => {
    if (!onSelectSlot) return;
    // En vue Mois, un clic sur un jour ouvre ce jour en vue Jour
    if (view === Views.MONTH) {
      onNavigate(start);
      onView(Views.DAY);
      return;
    }
    if (action === "select" || action === "click" || action === "doubleClick") {
      onSelectSlot({ date: toDateKey(start), time: formatTime(start), staffId: toStaffId(resourceId) });
    }
  };

  const handleEventDrop = ({ event, start, end, resourceId }) => {
    if (!onMoveEvent) return;
    onMoveEvent({
      appointment: event.resource,
      date: toDateKey(start),
      startTime: formatTime(start),
      endTime: formatTime(end),
      // Sans colonnes, on garde l'employé actuel
      staffId: resources ? toStaffId(resourceId) : event.resource.staff_id || null,
    });
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-soft appointment-calendar">
      <DnDCalendar
        localizer={localizer}
        events={events}
        date={date}
        view={view}
        views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]}
        onNavigate={onNavigate}
        onView={onView}
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        style={{ height: "calc(100vh - 300px)", minHeight: 560 }}
        step={15}
        timeslots={4}
        min={minTime}
        max={maxTime}
        scrollToTime={scrollToTime}
        selectable={!!onSelectSlot}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => onSelectEvent(event.resource)}
        onEventDrop={handleEventDrop}
        draggableAccessor={(event) => canMove(event.resource)}
        resizable={false}
        eventPropGetter={eventPropGetter}
        components={{ event: EventContent }}
        messages={MESSAGES}
        formats={{
          timeGutterFormat: "HH:mm",
          eventTimeRangeFormat: ({ start, end }) => `${formatTime(start)} – ${formatTime(end)}`,
          agendaTimeRangeFormat: ({ start, end }) => `${formatTime(start)} – ${formatTime(end)}`,
          dayHeaderFormat: "dddd D MMMM",
        }}
        popup
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1 text-xs text-slate-500" aria-label="Légende des statuts">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors.border }} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  );
};

export { Views };
export default AppointmentCalendar;
