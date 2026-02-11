/**
 * Page Appointments - Purple Dynasty Theme
 * Multi-Sector Adaptive Appointment Management
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/common/DashboardLayout";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";
import { useAppointments } from "../hooks/useAppointments";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import { useClients } from "../hooks/useClients";
import { useServices } from "../hooks/useServices";
import api from "../services/api";
import { getBusinessTypeConfig } from "../utils/businessTypeConfig";
import { useToast } from "../hooks/useToast";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  CalendarDaysIcon,
  PlusIcon,
  ListBulletIcon,
  CalendarIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Appointments = () => {
  const [searchParams] = useSearchParams();
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const businessType = tenant?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const BusinessIcon = config.icon;
  const term = config.terminology;

  const {
    appointments,
    loading,
    createAppointment,
    updateStatus,
    deleteAppointment,
    fetchAppointments,
  } = useAppointments();
  const { clients } = useClients();
  const { services } = useServices();
  const { toast, success, error, hideToast } = useToast();

  const [view, setView] = useState("list");
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterDate, setFilterDate] = useState(searchParams.get("date") || "");
  const [filterStatus, setFilterStatus] = useState("");
  const [staff, setStaff] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [formData, setFormData] = useState({
    client_id: "",
    service_id: "",
    staff_id: "",
    appointment_date: "",
    start_time: "",
    notes: "",
  });

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await api.get("/auth/staff");
        setStaff(response.data.data);
      } catch (err) {
        console.error("Erreur chargement staff:", err);
      }
    };
    loadStaff();
  }, []);

  // Si on arrive avec ?date= depuis une notification, filtrer sur cette date
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setFilterDate(dateParam);
      fetchAppointments({ date: dateParam });
    }
  }, [searchParams]);

  const handleOpenModal = () => {
    setFormData({
      client_id: "",
      service_id: "",
      staff_id: "",
      appointment_date: "",
      start_time: "",
      notes: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "service_id" && value) {
      const selectedService = services.find((s) => s.id === parseInt(value));
      if (selectedService && formData.start_time) {
        updateEndTime(formData.start_time, selectedService.duration);
      }
    }

    if (name === "start_time" && value && formData.service_id) {
      const selectedService = services.find((s) => s.id === parseInt(formData.service_id));
      if (selectedService) {
        updateEndTime(value, selectedService.duration);
      }
    }
  };

  const updateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":");
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes));
    startDate.setMinutes(startDate.getMinutes() + duration);
    const endTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
    setFormData((prev) => ({ ...prev, end_time: endTime }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let appointmentData = { ...formData };

    if (!appointmentData.end_time && appointmentData.service_id && appointmentData.start_time) {
      const selectedService = services.find((s) => s.id === parseInt(appointmentData.service_id));
      if (selectedService) {
        const [hours, minutes] = appointmentData.start_time.split(":");
        const startDate = new Date();
        startDate.setHours(parseInt(hours), parseInt(minutes));
        startDate.setMinutes(startDate.getMinutes() + selectedService.duration);
        appointmentData.end_time = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      }
    }

    const result = await createAppointment(appointmentData);
    if (result.success) {
      success(`${term.appointment} créé avec succès !`);
      handleCloseModal();
    } else {
      error(result.error || "Erreur lors de la création");
    }
  };

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
      success(`Statut mis à jour : ${newStatus}`);
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

  const handleFilterDate = (e) => {
    setFilterDate(e.target.value);
    fetchAppointments({ date: e.target.value, status: filterStatus });
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    fetchAppointments({ date: filterDate, status: status || undefined });
  };

  const handleOpenDetails = (appointment) => setSelectedAppointment(appointment);
  const handleCloseDetails = () => setSelectedAppointment(null);
  const handleUpdateAfterDetails = () => fetchAppointments({ date: filterDate, status: filterStatus || undefined });

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800 border border-amber-200",
      confirmed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200",
      completed: "bg-violet-100 text-violet-800 border border-violet-200",
      no_show: "bg-slate-100 text-slate-800 border border-slate-200",
    };
    const labels = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
      no_show: "Absent",
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStatusActions = (appointment) => {
    const actions = [];
    if (appointment.status === "pending") {
      actions.push(
        <button
          key="confirm"
          onClick={(e) => { e.stopPropagation(); initiateStatusChange(appointment.id, "confirmed"); }}
          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
        >
          Confirmer
        </button>
      );
    }
    if (["pending", "confirmed"].includes(appointment.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={(e) => { e.stopPropagation(); initiateStatusChange(appointment.id, "cancelled"); }}
          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
        >
          Annuler
        </button>
      );
      actions.push(
        <button
          key="complete"
          onClick={(e) => { e.stopPropagation(); initiateStatusChange(appointment.id, "completed"); }}
          className={`${config.textColor} hover:opacity-80 text-sm font-medium transition-colors`}
        >
          Terminer
        </button>
      );
    }
    return actions;
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date} ${a.start_time}`);
    const dateB = new Date(`${b.appointment_date} ${b.start_time}`);
    return dateB - dateA;
  });

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
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                {term.appointments}
              </h1>
            </div>
            <p className="text-slate-500">
              Gérez votre planning et vos {term.appointments.toLowerCase()}
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className={`inline-flex items-center px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow transition-all duration-300`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {term.appointmentNew}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className={`h-5 w-5 ${config.textColor}`} />
            <span className="font-medium text-slate-700">Filtres</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Par date</label>
              <input
                type="date"
                value={filterDate}
                onChange={handleFilterDate}
                className="input-premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Par statut</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "", label: "Tous", style: `bg-gradient-to-r ${config.gradient} text-white` },
                  { value: "pending", label: "En attente", style: "bg-amber-500 text-white" },
                  { value: "confirmed", label: "Confirmés", style: "bg-emerald-500 text-white" },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleFilterStatus(btn.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-300 ${
                      filterStatus === btn.value
                        ? btn.style
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mb-6 flex justify-end">
          <div className="flex rounded-xl border border-slate-200 shadow-soft overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                view === "list"
                  ? `bg-gradient-to-r ${config.gradient} text-white`
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ListBulletIcon className="h-5 w-5 mr-2" />
              Liste
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                view === "calendar"
                  ? `bg-gradient-to-r ${config.gradient} text-white`
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendrier
            </button>
          </div>
        </div>

        {/* List View */}
        {view === "list" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-soft">
            {loading ? (
              <div className="p-12 text-center">
                <div className={`w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin mx-auto`}></div>
                <p className="mt-4 text-slate-500">Chargement...</p>
              </div>
            ) : sortedAppointments.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDaysIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">{term.noAppointments}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Heure</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{term.client}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{term.service}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{term.staffMember}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
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
                            {new Date(apt.appointment_date).toLocaleDateString("fr-FR")}
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
                          {apt.staff_first_name ? `${apt.staff_first_name} ${apt.staff_last_name}` : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(apt.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                            {getStatusActions(apt)}
                            <button
                              onClick={() => initiateDelete(apt.id)}
                              className="text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === "calendar" && (
          <AppointmentCalendar appointments={appointments} onSelectEvent={handleOpenDetails} />
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-soft-xl max-w-md w-full animate-scale-in">
              <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                    <PlusIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-slate-800">{term.appointmentNew}</h3>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <XMarkIcon className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="label-premium">{term.client} *</label>
                  <select name="client_id" required value={formData.client_id} onChange={handleChange} className="input-premium">
                    <option value="">Sélectionner un {term.client.toLowerCase()}</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.first_name} {client.last_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-premium">{term.service} *</label>
                  <select name="service_id" required value={formData.service_id} onChange={handleChange} className="input-premium">
                    <option value="">Sélectionner un {term.service.toLowerCase()}</option>
                    {services.filter((s) => s.is_active).map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min - {formatPrice(service.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-premium">{term.staffMember}</label>
                  <select name="staff_id" value={formData.staff_id} onChange={handleChange} className="input-premium">
                    <option value="">Non assigné</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-premium">Date *</label>
                    <input
                      type="date"
                      name="appointment_date"
                      required
                      value={formData.appointment_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="label-premium">Heure *</label>
                    <input
                      type="time"
                      name="start_time"
                      required
                      value={formData.start_time}
                      onChange={handleChange}
                      className="input-premium"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-premium">Notes</label>
                  <textarea
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
