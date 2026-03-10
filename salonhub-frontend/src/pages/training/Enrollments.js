/**
 * Training Enrollments Management
 * Gestion des inscriptions aux formations
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ClockIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

// Statuts d'inscription
const ENROLLMENT_STATUSES = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  attended: { label: "Présent", color: "bg-green-100 text-green-700" },
  completed: { label: "Terminée", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
  no_show: { label: "Absent", color: "bg-slate-100 text-slate-700" },
};

// Statuts de paiement
const PAYMENT_STATUSES = {
  unpaid: { label: "Non payé", color: "text-red-600 bg-red-50" },
  partial: { label: "Partiel", color: "text-orange-600 bg-orange-50" },
  paid: { label: "Payé", color: "text-green-600 bg-green-50" },
  refunded: { label: "Remboursé", color: "text-purple-600 bg-purple-50" },
};

const Enrollments = () => {
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    session_id: "",
    client_id: "",
    payment_status: "unpaid",
    amount_paid: "",
    notes: "",
  });

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/training/enrollments");
      setEnrollments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      showToast("Erreur lors du chargement des inscriptions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get("/training/sessions");
      setSessions((response.data.data || []).filter((s) => s.status === "scheduled"));
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get("/clients");
      setClients(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
    fetchSessions();
    fetchClients();
  }, [fetchEnrollments, fetchSessions, fetchClients]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
      };

      await api.post("/training/enrollments", payload);
      showToast("Inscription créée avec succès");
      setShowModal(false);
      resetForm();
      fetchEnrollments();
    } catch (error) {
      console.error("Error creating enrollment:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'inscription", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/training/enrollments/${confirmDelete.id}`);
      showToast("Inscription supprimée");
      setConfirmDelete(null);
      fetchEnrollments();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const updateStatus = async (enrollment, status) => {
    try {
      await api.patch(`/training/enrollments/${enrollment.id}/status`, { status });
      showToast(`Statut mis à jour: ${ENROLLMENT_STATUSES[status].label}`);
      fetchEnrollments();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const updatePaymentStatus = async (enrollment, payment_status) => {
    try {
      await api.patch(`/training/enrollments/${enrollment.id}/payment`, { payment_status });
      showToast(`Paiement: ${PAYMENT_STATUSES[payment_status].label}`);
      fetchEnrollments();
    } catch (error) {
      console.error("Error updating payment:", error);
      showToast("Erreur lors de la mise à jour du paiement", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      session_id: "",
      client_id: "",
      payment_status: "unpaid",
      amount_paid: "",
      notes: "",
    });
  };

  // Filtered enrollments
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      (enrollment.client_name && enrollment.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (enrollment.enrollment_number && enrollment.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (enrollment.course_name && enrollment.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || enrollment.status === filterStatus;
    const matchesSession = !filterSession || enrollment.session_id === parseInt(filterSession);
    const matchesPayment = !filterPayment || enrollment.payment_status === filterPayment;
    return matchesSearch && matchesStatus && matchesSession && matchesPayment;
  });

  // Stats
  const stats = {
    total: enrollments.length,
    confirmed: enrollments.filter((e) => e.status === "confirmed").length,
    pending: enrollments.filter((e) => e.status === "pending").length,
    paid: enrollments.filter((e) => e.payment_status === "paid").length,
    revenue: enrollments
      .filter((e) => e.payment_status === "paid")
      .reduce((sum, e) => sum + parseFloat(e.amount_paid || 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Inscriptions
            </h1>
            <p className="text-slate-500 mt-1">
              {enrollments.length} inscription{enrollments.length > 1 ? "s" : ""} •{" "}
              {stats.confirmed} confirmée{stats.confirmed > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300"
          >
            <PlusIcon className="h-5 w-5" />
            Nouvelle Inscription
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.confirmed}</p>
                <p className="text-xs text-slate-500">Confirmées</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                <p className="text-xs text-slate-500">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.revenue)}</p>
                <p className="text-xs text-slate-500">Revenus</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un participant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Session filter */}
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Toutes les sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.course_name} - {new Date(session.start_date).toLocaleDateString("fr-FR")}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(ENROLLMENT_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Payment filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous les paiements</option>
              {Object.entries(PAYMENT_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enrollments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucune inscription trouvée
            </h3>
            <p className="text-slate-500 mb-4">
              Inscrivez des participants aux sessions
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Nouvelle inscription
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Paiement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-800">
                            {enrollment.client_name || "Client inconnu"}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {enrollment.enrollment_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-700">
                            {enrollment.course_name || "Cours non défini"}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <CalendarDaysIcon className="h-3 w-3" />
                            {enrollment.session_date
                              ? new Date(enrollment.session_date).toLocaleDateString("fr-FR")
                              : "Date non définie"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={enrollment.status}
                          onChange={(e) => updateStatus(enrollment, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                            ENROLLMENT_STATUSES[enrollment.status]?.color || ENROLLMENT_STATUSES.pending.color
                          }`}
                        >
                          {Object.entries(ENROLLMENT_STATUSES).map(([key, { label }]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={enrollment.payment_status}
                          onChange={(e) => updatePaymentStatus(enrollment, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                            PAYMENT_STATUSES[enrollment.payment_status]?.color || PAYMENT_STATUSES.unpaid.color
                          }`}
                        >
                          {Object.entries(PAYMENT_STATUSES).map(([key, { label }]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-emerald-600">
                          {formatPrice(enrollment.amount_paid || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setConfirmDelete(enrollment)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Create */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  Nouvelle Inscription
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Session */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Session *
                  </label>
                  <select
                    required
                    value={formData.session_id}
                    onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner une session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.course_name} - {new Date(session.start_date).toLocaleDateString("fr-FR")}
                        {session.enrolled_count !== undefined && session.max_participants && (
                          ` (${session.enrolled_count}/${session.max_participants})`
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Participant *
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner un participant</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Statut paiement
                    </label>
                    <select
                      value={formData.payment_status}
                      onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {Object.entries(PAYMENT_STATUSES).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Montant payé
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount_paid}
                      onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informations supplémentaires..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-glow transition-all"
                  >
                    Inscrire
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Supprimer l'inscription"
          message={`Êtes-vous sûr de vouloir supprimer l'inscription de "${confirmDelete?.client_name}" ?`}
          confirmText="Supprimer"
          confirmStyle="danger"
        />

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: "", type: "" })}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Enrollments;
