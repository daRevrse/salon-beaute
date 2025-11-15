import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "moment/locale/fr";

moment.locale("fr");
const localizer = momentLocalizer(moment);

const AppointmentCalendar = ({ appointments, onSelectEvent }) => {
  const events = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.client_first_name} ${apt.client_last_name} - ${apt.service_name}`,
    start: new Date(`${apt.appointment_date.split('T')[0]} ${apt.start_time}`),
    end: new Date(`${apt.appointment_date.split('T')[0]} ${apt.end_time}`),
    allDay: false,
    resource: apt,
  }));

  const eventStyleGetter = (event, start, end, isSelected) => {
    const statusStyles = {
      pending: { backgroundColor: "#fefcbf" }, // yellow-100
      confirmed: { backgroundColor: "#dcfce7" }, // green-100
      cancelled: { backgroundColor: "#fee2e2" }, // red-100
      completed: { backgroundColor: "#e0e7ff" }, // indigo-100
      no_show: { backgroundColor: "#f3f4f6" }, // gray-100
    };

    const style = {
      backgroundColor:
        statusStyles[event.resource.status]?.backgroundColor || "#f3f4f6",
      borderRadius: "5px",
      opacity: 0.8,
      color: "black",
      border: "0px",
      display: "block",
    };
    return {
      style: style,
    };
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={(event) => onSelectEvent(event.resource)}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Suivant",
          previous: "Précédent",
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
          date: "Date",
          time: "Heure",
          event: "Événement",
        }}
      />
    </div>
  );
};

export default AppointmentCalendar;
