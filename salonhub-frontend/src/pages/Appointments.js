/**
 * Page Appointments
 * Gestion des rendez-vous
 */

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAppointments } from "../hooks/useAppointments";
import { useClients } from "../hooks/useClients";
import { useServices } from "../hooks/useServices";
import api from "../services/api";

const Appointments = () => {
  const { formatPrice } = useCurrency();
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

  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [staff, setStaff] = useState([]);

  const [formData, setFormData] = useState({
    client_id: "",
    service_id: "",
    staff_id: "",
    appointment_date: "",
    start_time: "",
    notes: "",
  });

  // Charger le staff
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

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Si service change, calculer end_time automatiquement
    if (name === "service_id" && value) {
      const selectedService = services.find((s) => s.id === parseInt(value));
      if (selectedService && formData.start_time) {
        const [hours, minutes] = formData.start_time.split(":");
        const startDate = new Date();
        startDate.setHours(parseInt(hours), parseInt(minutes));
        startDate.setMinutes(startDate.getMinutes() + selectedService.duration);

        const endTime = `${String(startDate.getHours()).padStart(
          2,
          "0"
        )}:${String(startDate.getMinutes()).padStart(2, "0")}`;
        setFormData((prev) => ({
          ...prev,
          end_time: endTime,
        }));
      }
    }

    // Calculer end_time quand start_time change
    if (name === "start_time" && value && formData.service_id) {
      const selectedService = services.find(
        (s) => s.id === parseInt(formData.service_id)
      );
      if (selectedService) {
        const [hours, minutes] = value.split(":");
        const startDate = new Date();
        startDate.setHours(parseInt(hours), parseInt(minutes));
        startDate.setMinutes(startDate.getMinutes() + selectedService.duration);

        const endTime = `${String(startDate.getHours()).padStart(
          2,
          "0"
        )}:${String(startDate.getMinutes()).padStart(2, "0")}`;
        setFormData((prev) => ({
          ...prev,
          end_time: endTime,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculer end_time si pas déjà fait
    let appointmentData = { ...formData };

    if (
      !appointmentData.end_time &&
      appointmentData.service_id &&
      appointmentData.start_time
    ) {
      const selectedService = services.find(
        (s) => s.id === parseInt(appointmentData.service_id)
      );
      if (selectedService) {
        const [hours, minutes] = appointmentData.start_time.split(":");
        const startDate = new Date();
        startDate.setHours(parseInt(hours), parseInt(minutes));
        startDate.setMinutes(startDate.getMinutes() + selectedService.duration);

        appointmentData.end_time = `${String(startDate.getHours()).padStart(
          2,
          "0"
        )}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      }
    }

    const result = await createAppointment(appointmentData);

    if (result.success) {
      handleCloseModal();
    } else {
      alert(result.error + (result.message ? "\n" + result.message : ""));
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    let reason = null;
    if (newStatus === "cancelled") {
      reason = prompt("Raison de l'annulation (optionnel):");
    }

    const result = await updateStatus(id, newStatus, reason);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      const result = await deleteAppointment(id);
      if (!result.success) {
        alert(result.error);
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

  const handleOpenDetails = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseDetails = () => {
    setSelectedAppointment(null);
  };

  const handleUpdateAfterDetails = () => {
    fetchAppointments({ date: filterDate, status: filterStatus || undefined });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border border-green-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200",
      completed: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      no_show: "bg-gray-100 text-gray-800 border border-gray-200",
    };

    const labels = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
      no_show: "Absent",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}
      >
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
          onClick={() => handleStatusChange(appointment.id, "confirmed")}
          className="text-green-600 hover:text-green-900 text-sm"
        >
          Confirmer
        </button>
      );
    }

    if (["pending", "confirmed"].includes(appointment.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => handleStatusChange(appointment.id, "cancelled")}
          className="text-red-600 hover:text-red-900 text-sm"
        >
          Annuler
        </button>
      );

      actions.push(
        <button
          key="complete"
          onClick={() => handleStatusChange(appointment.id, "completed")}
          className="text-indigo-600 hover:text-indigo-900 text-sm"
        >
          Terminer
        </button>
      );
    }

    return actions;
  };

  // Trier par date et heure
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date} ${a.start_time}`);
    const dateB = new Date(`${b.appointment_date} ${b.start_time}`);
    return dateB - dateA;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
            <p className="mt-2 text-gray-600">Gérez votre planning et vos réservations</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nouveau rendez-vous
          </button>
        </div>
        {/* Filtres */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={handleFilterDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par statut
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterStatus("")}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    !filterStatus
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => handleFilterStatus("pending")}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    filterStatus === "pending"
                      ? "bg-yellow-600 text-white border-yellow-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => handleFilterStatus("confirmed")}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    filterStatus === "confirmed"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Confirmés
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun rendez-vous trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOpenDetails(apt)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(apt.appointment_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apt.start_time.substring(0, 5)} -{" "}
                          {apt.end_time.substring(0, 5)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apt.client_first_name} {apt.client_last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apt.client_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apt.service_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apt.service_duration} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apt.staff_first_name
                          ? `${apt.staff_first_name} ${apt.staff_last_name}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          {getStatusActions(apt)}
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="text-red-600 hover:text-red-900"
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

        {/* Modal Création */}
        {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Nouveau rendez-vous
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client *
                </label>
                <select
                  name="client_id"
                  required
                  value={formData.client_id}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service *
                </label>
                <select
                  name="service_id"
                  required
                  value={formData.service_id}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner un service</option>
                  {services
                    .filter((s) => s.is_active)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min - {formatPrice(service.price)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employé (optionnel)
                </label>
                <select
                  name="staff_id"
                  value={formData.staff_id}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Non assigné</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  name="appointment_date"
                  required
                  value={formData.appointment_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Heure de début *
                </label>
                <input
                  type="time"
                  name="start_time"
                  required
                  value={formData.start_time}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Demandes spéciales..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Création..." : "Créer le rendez-vous"}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Modal Détails Rendez-vous */}
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
