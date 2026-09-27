/**
 * Page Appointments - Purple Dynasty Theme
 * Multi-Sector Adaptive Appointment Management
 *
 * Deux vues :
 *  - Planning (par défaut) : jour par défaut, une colonne par employé,
 *    clic sur un créneau libre pour créer, glisser-déposer pour déplacer
 *  - Liste : historique paginé, filtrable par date et statut
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import DashboardLayout from "../components/common/DashboardLayout";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";
import { useAppointments, APPOINTMENTS_PAGE_SIZE } from "../hooks/useAppointments";
import AppointmentCalendar, { Views } from "../components/appointments/AppointmentCalendar";
import ClientPicker from "../components/clients/ClientPicker";
import Pagination from "../components/common/Pagination";
import { usePermissions } from "../contexts/PermissionContext";
import { useServices } from "../hooks/useServices";
import api from "../services/api";
import { getBusinessTypeConfig } from "../utils/businessTypeConfig";
import {
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
  getDateKey,
  toDateKey,
  toLocalDateTime,
  addMinutesToTime,
  hasStarted,
  formatLongDate,
} from "../utils/appointmentUtils";
import { useToast } from "../hooks/useToast";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  CalendarDaysIcon,
  PlusIcon,
  ListBulletIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PLANNING_LIMIT = 500;

const EMPTY_FORM = {
  service_id: "",
  staff_id: "",
  appointment_date: "",
  start_time: "",
  notes: "",
};

// Période chargée pour la vue du planning
const getRange = (calendarView, date) => {
  const m = moment(date);
  if (calendarView === Views.DAY) return [m.clone(), m.clone()];
  if (calendarView === Views.WEEK) return [m.clone().startOf("week"), m.clone().endOf("week")];
  if (calendarView === Views.MONTH) {
    return [m.clone().startOf("month").startOf("week"), m.clone().endOf("month").endOf("week")];
  }
  return [m.clone(), m.clone().add(30, "days")]; // Liste (agenda) : 30 jours
};

// Bornes horaires du planning à partir des horaires d'ouverture
const getPlanningBounds = (businessHours) => {
  let min = 8 * 60;
  let max = 20 * 60;
  const days = Object.values(businessHours || {}).filter(
    (day) => day && typeof day === "object" && !day.closed && day.open && day.close
  );
  if (days.length > 0) {
    const toMin = (t) => Number(t.split(":")[0]) * 60 + Number(t.split(":")[1] || 0);
    min = Math.min(...days.map((d) => toMin(d.open)));
    max = Math.max(...days.map((d) => toMin(d.close)));
  }
  // Heures pleines, avec au moins une demi-heure de marge de chaque côté
  min = Math.max(0, Math.floor((min - 30) / 60) * 60);
  max = Math.min(24 * 60, Math.ceil((max + 30) / 60) * 60);
  const at = (minutes) => new Date(1970, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return { minTime: at(min), maxTime: at(max === 24 * 60 ? max - 1 : max) };
};

const parseDateParam = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const Appointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenant, user } = useAuth();
  const { formatPrice } = useCurrency();
  const businessType = tenant?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  const {
    appointments,
    pagination,
    goToOffset,
    loading,
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
    fetchAppointments,
  } = useAppointments({}, { autoLoad: false });
  const { services } = useServices();
  const { can, isStaff } = usePermissions();
  const { toast, success, error, info, hideToast } = useToast();

  // Vue : liste si on arrive filtré par statut (ex. "Valider" du dashboard), sinon planning
  const [view, setView] = useState(searchParams.get("status") ? "list" : "planning");
  const [calendarView, setCalendarView] = useState(Views.DAY);
  const [calendarDate, setCalendarDate] = useState(parseDateParam(searchParams.get("date")));
  const [filterDate, setFilterDate] = useState(searchParams.get("date") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");

  const [staff, setStaff] = useState([]);
  const [businessHours, setBusinessHours] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const activeStaff = useMemo(() => staff.filter((member) => member.is_active), [staff]);
  // Colonnes du planning : employés actifs qui prennent des RDV
  const planningStaff = useMemo(
    () => activeStaff.filter((member) => member.is_bookable !== 0 && member.is_bookable !== false),
    [activeStaff]
  );
  const isMultiStaff = activeStaff.length > 1;
  const { minTime, maxTime } = useMemo(() => getPlanningBounds(businessHours), [businessHours]);
  const today = toDateKey(new Date());

  useEffect(() => {
    // La liste des employés n'est accessible qu'au propriétaire et aux responsables
    if (isStaff) return;
    api
      .get("/auth/staff")
      .then((response) => setStaff(response.data.data || []))
      .catch((err) => console.error("Erreur chargement staff:", err));
  }, [isStaff]);

  useEffect(() => {
    api
      .get("/settings")
      .then((response) => setBusinessHours(response.data?.business_hours || null))
      .catch(() => setBusinessHours(null));
  }, []);

  // ---------- Chargement des données ----------
  const [rangeStart, rangeEnd] = useMemo(() => {
    const [start, end] = getRange(calendarView, calendarDate);
    return [start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")];
  }, [calendarView, calendarDate]);

  useEffect(() => {
    if (view !== "planning") return;
    fetchAppointments({
      start_date: rangeStart,
      end_date: rangeEnd,
      status: filterStatus,
      limit: PLANNING_LIMIT,
    });
  }, [view, rangeStart, rangeEnd, filterStatus, fetchAppointments]);

  useEffect(() => {
    if (view !== "list") return;
    fetchAppointments({ date: filterDate, status: filterStatus, limit: APPOINTMENTS_PAGE_SIZE });
  }, [view, filterDate, filterStatus, fetchAppointments]);

  // Paramètres d'URL : ?date= (notification), ?status= (dashboard "Valider"), ?new=1 (création rapide)
  const isFirstUrlSync = useRef(true);
  useEffect(() => {
    const dateParam = searchParams.get("date") || "";
    const statusParam = searchParams.get("status") || "";

    if (searchParams.get("new") === "1") {
      openCreateModal();
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }

    if (isFirstUrlSync.current) {
      isFirstUrlSync.current = false;
      return;
    }
    setFilterDate(dateParam);
    setFilterStatus(statusParam);
    if (dateParam) setCalendarDate(parseDateParam(dateParam));
    setView(statusParam ? "list" : "planning");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---------- Création ----------
  function openCreateModal(prefill = {}) {
    setSelectedClient(null);
    setFormData({ ...EMPTY_FORM, ...prefill });
    setShowModal(true);
  }

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedService = services.find((s) => s.id === parseInt(formData.service_id, 10));
  const plannedEnd =
    selectedService && formData.start_time
      ? addMinutesToTime(formData.start_time, selectedService.duration)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      error(`Sélectionnez ou créez un ${term.client.toLowerCase()}`);
      return;
    }
    const result = await createAppointment({
      ...formData,
      client_id: selectedClient.id,
      end_time: plannedEnd,
    });
    if (result.success) {
      success(`${term.appointment} créé avec succès !`);
      handleCloseModal();
    } else {
      error(result.error || "Erreur lors de la création");
    }
  };

  const handleSelectSlot = ({ date, time, staffId }) => {
    if (date < today) {
      info("Impossible de créer un rendez-vous dans le passé");
      return;
    }
    openCreateModal({
      appointment_date: date,
      start_time: time,
      staff_id: staffId ? String(staffId) : "",
    });
  };

  // ---------- Déplacement (glisser-déposer) ----------
  const canMove = useCallback(
    (apt) =>
      ["pending", "confirmed"].includes(apt.status) &&
      (!isStaff || apt.staff_id === user?.id),
    [isStaff, user]
  );

  const handleMoveEvent = async ({ appointment, date, startTime, endTime, staffId }) => {
    const sameDate = getDateKey(appointment.appointment_date) === date;
    const sameTime = appointment.start_time?.substring(0, 5) === startTime;
    const sameStaff = (appointment.staff_id || null) === (staffId || null);
    if (sameDate && sameTime && sameStaff) return;

    const result = await updateAppointment(appointment.id, {
      appointment_date: date,
      start_time: startTime,
      end_time: endTime,
      staff_id: staffId,
    });
    if (result.success) {
      const member = staff.find((m) => m.id === staffId);
      success(
        `${term.appointment} déplacé au ${formatLongDate(date)} à ${startTime}` +
          (member && !sameStaff ? ` avec ${member.first_name}` : "")
      );
    } else {
      error(result.error || "Impossible de déplacer ce rendez-vous");
    }
  };

  // ---------- Statuts ----------
  const initiateStatusChange = (id, newStatus) => {
    if (newStatus === "cancelled") {
      setAppointmentToCancel(id);
      setCancelReason("");
      setShowCancelModal(true);
    } else {
      handleStatusChange(id, newStatus);
    }
  };

  const handleStatusChange = async (id, newStatus, reason = null) => {
    const result = await updateStatus(id, newStatus, reason);
    if (result.success) {
      success(`Statut mis à jour : ${STATUS_LABELS[newStatus] || newStatus}`);
      if (showCancelModal) setShowCancelModal(false);
    } else {
      error(result.error || "Impossible de mettre à jour le statut");
    }
  };

  const handleConfirmCancel = () => {
    if (appointmentToCancel) {
      handleStatusChange(appointmentToCancel, "cancelled", cancelReason);
    }
  };

  const initiateDelete = (id) => {
    setAppointmentToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (appointmentToDelete) {
      const result = await deleteAppointment(appointmentToDelete);
      if (result.success) {
        success(`${term.appointment} supprimé`);
        setShowDeleteConfirm(false);
        setAppointmentToDelete(null);
      } else {
        error(result.error || "Erreur lors de la suppression");
      }
    }
  };

  const handleOpenDetails = (appointment) => setSelectedAppointment(appointment);
  const handleCloseDetails = () => setSelectedAppointment(null);
  const handleUpdateAfterDetails = () => fetchAppointments();

  const getStatusBadge = (status) => (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_BADGE_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );

  // Mêmes règles que la fiche détaillée :
  // confirmer exige le droit, et un employé assigné quand l'équipe compte plusieurs membres
  const getStatusActions = (appointment) => {
    const actions = [];
    const linkClass = "text-sm font-medium transition-colors";
    if (appointment.status === "pending" && can.canConfirmAppointments) {
      const needsAssignment = !isStaff && isMultiStaff && !appointment.staff_id;
      actions.push(
        <button
          key="confirm"
          onClick={() =>
            needsAssignment
              ? handleOpenDetails(appointment)
              : initiateStatusChange(appointment.id, "confirmed")
          }
          title={needsAssignment ? `Assignez un ${term.staffMember.toLowerCase()} avant de confirmer` : undefined}
          className={`${linkClass} text-emerald-600 hover:text-emerald-800`}
        >
          {needsAssignment ? "Assigner" : "Confirmer"}
        </button>
      );
    }
    if (appointment.status === "confirmed") {
      actions.push(
        <button
          key="complete"
          onClick={() => initiateStatusChange(appointment.id, "completed")}
          className={`${linkClass} ${config.textColor} hover:opacity-80`}
        >
          Terminer
        </button>
      );
      if (hasStarted(appointment)) {
        actions.push(
          <button
            key="no_show"
            onClick={() => initiateStatusChange(appointment.id, "no_show")}
            className={`${linkClass} text-slate-500 hover:text-slate-700`}
          >
            Absent
          </button>
        );
      }
    }
    if (["pending", "confirmed"].includes(appointment.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => initiateStatusChange(appointment.id, "cancelled")}
          className={`${linkClass} text-red-600 hover:text-red-800`}
        >
          Annuler
        </button>
      );
    }
    return actions;
  };

  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      toLocalDateTime(b.appointment_date, b.start_time) -
      toLocalDateTime(a.appointment_date, a.start_time)
  );

  const viewButtonClass = (active) =>
    `flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
      active ? `bg-gradient-to-r ${config.gradient} text-white` : "bg-white text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={`Supprimer ${term.appointment.toLowerCase()}`}
        message={`Êtes-vous sûr de vouloir supprimer ce ${term.appointment.toLowerCase()} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        type="danger"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                {isStaff ? "Mon planning" : term.appointments}
              </h1>
            </div>
            <p className="text-slate-500">
              {isStaff
                ? `Vos ${term.appointments.toLowerCase()} assignés`
                : view === "planning"
                ? `Cliquez sur un créneau libre pour créer un ${term.appointment.toLowerCase()}, glissez-le pour le déplacer`
                : `Gérez votre planning et vos ${term.appointments.toLowerCase()}`}
            </p>
          </div>
          <button
            onClick={() => openCreateModal({ appointment_date: view === "planning" ? toDateKey(calendarDate) : "" })}
            className={`inline-flex items-center px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow transition-all duration-300`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {term.appointmentNew}
          </button>
        </div>

        {/* Filtres + choix de la vue */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {view === "list" && (
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Filtrer par date"
                className={`px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
              />
            )}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
              {[
                { value: "", label: "Tous", active: `${config.lightBg} ${config.textColor} ${config.lightBorderColor}` },
                { value: "pending", label: "En attente", active: "bg-amber-50 text-amber-700 border-amber-200" },
                { value: "confirmed", label: "Confirmés", active: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { value: "completed", label: "Terminés", active: "bg-violet-50 text-violet-700 border-violet-200" },
                { value: "cancelled", label: "Annulés", active: "bg-red-50 text-red-700 border-red-200" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilterStatus(btn.value)}
                  aria-pressed={filterStatus === btn.value}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap border transition-colors ${
                    filterStatus === btn.value
                      ? btn.active
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex rounded-xl border border-slate-200 shadow-soft overflow-hidden self-end lg:self-auto">
            <button onClick={() => setView("planning")} className={viewButtonClass(view === "planning")}>
              <CalendarIcon className="h-5 w-5 mr-2" />
              Planning
            </button>
            <button onClick={() => setView("list")} className={viewButtonClass(view === "list")}>
              <ListBulletIcon className="h-5 w-5 mr-2" />
              Liste
            </button>
          </div>
        </div>

        {/* Planning */}
        {view === "planning" && (
          <AppointmentCalendar
            appointments={appointments}
            staff={isStaff ? [] : planningStaff}
            date={calendarDate}
            view={calendarView}
            onNavigate={setCalendarDate}
            onView={setCalendarView}
            onSelectEvent={handleOpenDetails}
            onSelectSlot={handleSelectSlot}
            onMoveEvent={handleMoveEvent}
            canMove={canMove}
            minTime={minTime}
            maxTime={maxTime}
          />
        )}

        {/* Liste */}
        {view === "list" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-soft">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin mx-auto"></div>
                <p className="mt-4 text-slate-500">Chargement...</p>
              </div>
            ) : sortedAppointments.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDaysIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">{term.noAppointments}</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-450px)] min-h-[400px] relative">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date & Heure</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">{term.client}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">{term.service}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">{term.staffMember}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Statut</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {sortedAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleOpenDetails(apt)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-800">
                            {toLocalDateTime(apt.appointment_date, "00:00").toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-sm text-slate-500">
                            {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-9 w-9 rounded-lg ${config.lightBg} flex items-center justify-center mr-3`}>
                              <span className={`${config.textColor} font-semibold text-sm`}>
                                {apt.client_first_name?.charAt(0)}{apt.client_last_name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                {apt.client_first_name} {apt.client_last_name}
                              </div>
                              <div className="text-xs text-slate-400">{apt.client_phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-800">{apt.service_name}</div>
                          <div className="text-xs text-slate-400">{apt.service_duration} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {apt.staff_first_name ? `${apt.staff_first_name} ${apt.staff_last_name}` : "Non assigné"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(apt.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                            {getStatusActions(apt)}
                            {can.deleteAllAppointments && (
                              <button
                                onClick={() => initiateDelete(apt.id)}
                                className="text-red-600 hover:text-red-800 font-medium transition-colors"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              total={pagination.total}
              limit={pagination.limit}
              offset={pagination.offset}
              onChange={goToOffset}
              itemLabel={term.appointments.toLowerCase()}
            />
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="new-appointment-title" className="relative bg-white rounded-2xl shadow-soft-xl max-w-md w-full animate-scale-in">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                    <PlusIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 id="new-appointment-title" className="font-display text-lg font-semibold text-slate-800">{term.appointmentNew}</h3>
                </div>
                <button onClick={handleCloseModal} aria-label="Fermer" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <XMarkIcon className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="label-premium">{term.client} *</label>
                  <ClientPicker value={selectedClient} onChange={setSelectedClient} term={term} />
                </div>

                <div>
                  <label className="label-premium" htmlFor="new-apt-service">{term.service} *</label>
                  <select id="new-apt-service" name="service_id" required value={formData.service_id} onChange={handleChange} className="input-premium">
                    <option value="">Sélectionner un {term.service.toLowerCase()}</option>
                    {services.filter((s) => s.is_active).map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min - {formatPrice(service.price)})
                      </option>
                    ))}
                  </select>
                </div>

                {isStaff ? (
                  <p className="text-sm text-slate-500">
                    Ce {term.appointment.toLowerCase()} vous sera assigné.
                  </p>
                ) : (
                  <div>
                    <label className="label-premium" htmlFor="new-apt-staff">{term.staffMember}</label>
                    <select id="new-apt-staff" name="staff_id" value={formData.staff_id} onChange={handleChange} className="input-premium">
                      <option value="">Premier disponible</option>
                      {activeStaff.map((member) => (
                        <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-premium" htmlFor="new-apt-date">Date *</label>
                    <input
                      id="new-apt-date"
                      type="date"
                      name="appointment_date"
                      required
                      value={formData.appointment_date}
                      onChange={handleChange}
                      min={today}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="label-premium" htmlFor="new-apt-time">Heure *</label>
                    <input
                      id="new-apt-time"
                      type="time"
                      name="start_time"
                      required
                      step="300"
                      value={formData.start_time}
                      onChange={handleChange}
                      className="input-premium"
                    />
                  </div>
                </div>
                {plannedEnd && (
                  <p className="text-sm text-slate-500 -mt-2">Fin prévue : {plannedEnd}</p>
                )}

                <div>
                  <label className="label-premium" htmlFor="new-apt-notes">Notes</label>
                  <textarea
                    id="new-apt-notes"
                    name="notes"
                    rows="2"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="Demandes spéciales..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn-premium-secondary">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading} className="btn-premium">
                    {loading ? "Création..." : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-soft-xl max-w-md w-full animate-scale-in">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-display text-lg font-semibold text-red-600 flex items-center gap-2">
                  <span>⚠️</span> {term.appointmentCancel}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Voulez-vous indiquer une raison pour l'annulation ?
                </p>
              </div>
              <div className="p-6">
                <label className="label-premium">Raison (optionnel)</label>
                <textarea
                  rows="3"
                  className="input-premium"
                  placeholder="Ex: Client malade, imprévu..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowCancelModal(false)} className="btn-premium-secondary">
                  Retour
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Confirmer l'annulation
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedAppointment && (
          <AppointmentDetails
            appointment={selectedAppointment}
            onClose={handleCloseDetails}
            onUpdate={handleUpdateAfterDetails}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
