/**
 * Medical Prescriptions Management
 * Gestion des ordonnances médicales
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import {
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Statuts d'ordonnance
const PRESCRIPTION_STATUSES = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  completed: { label: "Terminée", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
  expired: { label: "Expirée", color: "bg-slate-100 text-slate-700" },
};

const Prescriptions = () => {
  const { tenant, user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPatient, setFilterPatient] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    record_id: "",
    prescription_date: new Date().toISOString().split("T")[0],
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "",
    refills_allowed: 0,
    instructions: "",
    expiry_date: "",
    notes: "",
  });

  // Common frequencies
  const frequencies = [
    "1 fois par jour",
    "2 fois par jour",
    "3 fois par jour",
    "Toutes les 4 heures",
    "Toutes les 6 heures",
    "Toutes les 8 heures",
    "Toutes les 12 heures",
    "Au coucher",
    "Le matin",
    "Avant les repas",
    "Après les repas",
    "Si nécessaire",
  ];

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/medical/prescriptions");
      setPrescriptions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      showToast("Erreur lors du chargement des ordonnances", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await api.get("/medical/patients");
      setPatients(response.data.data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
  }, [fetchPrescriptions, fetchPatients]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        doctor_id: user.id,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        refills_allowed: parseInt(formData.refills_allowed) || 0,
        record_id: formData.record_id || null,
        expiry_date: formData.expiry_date || null,
      };

      await api.post("/medical/prescriptions", payload);
      showToast("Ordonnance créée avec succès");
      setShowModal(false);
      resetForm();
      fetchPrescriptions();
    } catch (error) {
      console.error("Error creating prescription:", error);
      showToast(error.response?.data?.error || "Erreur lors de la création", "error");
    }
  };

  const updateStatus = async (prescription, status) => {
    try {
      await api.patch(`/medical/prescriptions/${prescription.id}/status`, { status });
      showToast(`Statut mis à jour: ${PRESCRIPTION_STATUSES[status].label}`);
      fetchPrescriptions();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      record_id: "",
      prescription_date: new Date().toISOString().split("T")[0],
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
      refills_allowed: 0,
      instructions: "",
      expiry_date: "",
      notes: "",
    });
  };

  // Filtered prescriptions
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      (prescription.patient_name && prescription.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prescription.prescription_number && prescription.prescription_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prescription.medication_name && prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || prescription.status === filterStatus;
    const matchesPatient = !filterPatient || prescription.patient_id === parseInt(filterPatient);
    return matchesSearch && matchesStatus && matchesPatient;
  });

  // Stats
  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter((p) => p.status === "active").length,
    completed: prescriptions.filter((p) => p.status === "completed").length,
    expiring: prescriptions.filter((p) => {
      if (!p.expiry_date || p.status !== "active") return false;
      const expiry = new Date(p.expiry_date);
      const today = new Date();
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Ordonnances
            </h1>
            <p className="text-slate-500 mt-1">
              {prescriptions.length} ordonnance{prescriptions.length > 1 ? "s" : ""} •{" "}
              {stats.active} active{stats.active > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300"
          >
            <PlusIcon className="h-5 w-5" />
            Nouvelle Ordonnance
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
                <p className="text-xs text-slate-500">Actives</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
                <p className="text-xs text-slate-500">Terminées</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <CalendarDaysIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.expiring}</p>
                <p className="text-xs text-slate-500">Expirent bientôt</p>
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
                placeholder="Rechercher (patient, médicament, n° ordonnance)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Patient filter */}
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Tous les patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(PRESCRIPTION_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucune ordonnance trouvée
            </h3>
            <p className="text-slate-500 mb-4">
              Créez votre première ordonnance
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
            >
              Nouvelle ordonnance
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className={`bg-white rounded-2xl shadow-soft border-2 p-4 hover:shadow-soft-lg transition-all ${
                  prescription.status === "active"
                    ? "border-green-200"
                    : prescription.status === "cancelled"
                    ? "border-red-200 opacity-60"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Prescription Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {prescription.prescription_number}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${PRESCRIPTION_STATUSES[prescription.status]?.color}`}>
                        {PRESCRIPTION_STATUSES[prescription.status]?.label}
                      </span>
                      {prescription.refills_allowed > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <ArrowPathIcon className="h-3 w-3" />
                          {prescription.refills_used}/{prescription.refills_allowed} renouvellements
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-800">
                      {prescription.medication_name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {prescription.dosage} • {prescription.frequency}
                      {prescription.duration && ` • ${prescription.duration}`}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Patient: <span className="font-medium">{prescription.patient_name}</span>
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-slate-500">
                    <p className="flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {prescription.prescription_date
                        ? new Date(prescription.prescription_date).toLocaleDateString("fr-FR")
                        : "-"}
                    </p>
                    {prescription.expiry_date && (
                      <p className="text-xs mt-1">
                        Expire: {new Date(prescription.expiry_date).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDetailModal(prescription)}
                      className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Imprimer"
                    >
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                    {prescription.status === "active" && (
                      <button
                        onClick={() => updateStatus(prescription, "completed")}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marquer comme terminée"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                {prescription.instructions && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Instructions:</span> {prescription.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Create */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  Nouvelle Ordonnance
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Patient */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Patient *
                  </label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.patient_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prescription Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date de prescription *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.prescription_date}
                      onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Medication */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Médicament *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    placeholder="Ex: Paracétamol 500mg"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Dosage & Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Posologie *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="Ex: 1 comprimé"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fréquence *
                    </label>
                    <select
                      required
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Sélectionner</option>
                      {frequencies.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration & Quantity */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Durée
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="Ex: 7 jours"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="Ex: 20"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Renouvellements
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={formData.refills_allowed}
                      onChange={(e) => setFormData({ ...formData, refills_allowed: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Instructions de prise, précautions..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes pour le pharmacien ou le patient..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl hover:shadow-glow transition-all"
                  >
                    Créer l'ordonnance
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-semibold text-slate-800">
                      Ordonnance
                    </h2>
                    <p className="text-sm text-cyan-600 font-mono">
                      {showDetailModal.prescription_number}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="p-2 hover:bg-white/50 rounded-lg"
                  >
                    <XCircleIcon className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${PRESCRIPTION_STATUSES[showDetailModal.status]?.color}`}>
                    {PRESCRIPTION_STATUSES[showDetailModal.status]?.label}
                  </span>
                  <span className="text-sm text-slate-500">
                    {showDetailModal.prescription_date
                      ? new Date(showDetailModal.prescription_date).toLocaleDateString("fr-FR")
                      : "-"}
                  </span>
                </div>

                {/* Patient */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Patient</p>
                  <p className="font-medium text-slate-800">{showDetailModal.patient_name}</p>
                </div>

                {/* Medication Details */}
                <div className="border-2 border-cyan-100 rounded-xl p-4">
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">
                    {showDetailModal.medication_name}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Posologie:</span> {showDetailModal.dosage}</p>
                    <p><span className="text-slate-500">Fréquence:</span> {showDetailModal.frequency}</p>
                    {showDetailModal.duration && (
                      <p><span className="text-slate-500">Durée:</span> {showDetailModal.duration}</p>
                    )}
                    {showDetailModal.quantity && (
                      <p><span className="text-slate-500">Quantité:</span> {showDetailModal.quantity}</p>
                    )}
                  </div>
                </div>

                {/* Refills */}
                {showDetailModal.refills_allowed > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                      <ArrowPathIcon className="h-4 w-4" />
                      Renouvellements: {showDetailModal.refills_used || 0} / {showDetailModal.refills_allowed}
                    </p>
                  </div>
                )}

                {/* Instructions */}
                {showDetailModal.instructions && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Instructions</h3>
                    <p className="text-slate-600 bg-yellow-50 rounded-lg p-3">
                      {showDetailModal.instructions}
                    </p>
                  </div>
                )}

                {/* Expiry */}
                {showDetailModal.expiry_date && (
                  <div className="text-sm text-slate-500 text-center">
                    Expire le: {new Date(showDetailModal.expiry_date).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors">
                  <PrinterIcon className="h-4 w-4" />
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        )}

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

export default Prescriptions;
