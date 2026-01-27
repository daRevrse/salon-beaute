/**
 * Medical Patients Management
 * Gestion des dossiers patients
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

// Types de sang
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Genres
const GENDERS = {
  male: "Homme",
  female: "Femme",
  other: "Autre",
  prefer_not_to_say: "Non précisé",
};

const Patients = () => {
  const { tenant } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    blood_type: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    insurance_provider: "",
    insurance_number: "",
    social_security_number: "",
    notes: "",
  });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/medical/patients");
      setPatients(response.data.data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      showToast("Erreur lors du chargement des patients", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };

      if (editingPatient) {
        await api.put(`/medical/patients/${editingPatient.id}`, payload);
        showToast("Patient mis à jour avec succès");
      } else {
        await api.post("/medical/patients", payload);
        showToast("Patient créé avec succès");
      }
      setShowModal(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      console.error("Error saving patient:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/medical/patients/${confirmDelete.id}`);
      showToast("Patient supprimé avec succès");
      setConfirmDelete(null);
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "male",
      blood_type: "",
      email: "",
      phone: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
      insurance_provider: "",
      insurance_number: "",
      social_security_number: "",
      notes: "",
    });
    setEditingPatient(null);
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      date_of_birth: patient.date_of_birth ? patient.date_of_birth.split("T")[0] : "",
      gender: patient.gender || "male",
      blood_type: patient.blood_type || "",
      email: patient.email || "",
      phone: patient.phone || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      emergency_contact_relation: patient.emergency_contact_relation || "",
      insurance_provider: patient.insurance_provider || "",
      insurance_number: patient.insurance_number || "",
      social_security_number: patient.social_security_number || "",
      notes: patient.notes || "",
    });
    setShowModal(true);
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filtered patients
  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (patient.patient_number && patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGender = !filterGender || patient.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Dossiers Patients
            </h1>
            <p className="text-slate-500 mt-1">
              {patients.length} patient{patients.length > 1 ? "s" : ""} enregistré{patients.length > 1 ? "s" : ""}
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
            Nouveau Patient
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un patient (nom, n°, téléphone, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Gender filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Tous les genres</option>
              {Object.entries(GENDERS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartIcon className="h-8 w-8 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucun patient trouvé
            </h3>
            <p className="text-slate-500 mb-4">
              Créez votre premier dossier patient
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
            >
              Créer un dossier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden hover:shadow-soft-lg transition-all"
              >
                {/* Patient Header */}
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-cyan-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                      {patient.first_name?.charAt(0)}
                      {patient.last_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-xs text-cyan-600 font-mono">
                        {patient.patient_number}
                      </p>
                    </div>
                    {patient.blood_type && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                        {patient.blood_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Patient Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                    <span>
                      {patient.date_of_birth
                        ? `${new Date(patient.date_of_birth).toLocaleDateString("fr-FR")} (${calculateAge(patient.date_of_birth)} ans)`
                        : "Date de naissance non renseignée"}
                    </span>
                  </div>
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <PhoneIcon className="h-4 w-4 text-slate-400" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  {patient.emergency_contact_name && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-1 text-xs text-red-600 font-medium mb-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        Contact d'urgence
                      </div>
                      <p className="text-sm text-slate-700">
                        {patient.emergency_contact_name}
                        {patient.emergency_contact_relation && (
                          <span className="text-slate-400"> ({patient.emergency_contact_relation})</span>
                        )}
                      </p>
                      {patient.emergency_contact_phone && (
                        <p className="text-sm text-slate-500">{patient.emergency_contact_phone}</p>
                      )}
                    </div>
                  )}

                  {/* Insurance */}
                  {patient.insurance_provider && (
                    <div className="text-xs text-slate-500">
                      Assurance: {patient.insurance_provider}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-slate-100 flex justify-between">
                  <button
                    onClick={() => setShowDetailModal(patient)}
                    className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-800 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Voir dossier
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(patient)}
                      className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(patient)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  {editingPatient ? "Modifier le patient" : "Nouveau patient"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Identity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* DOB & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Genre *
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      {Object.entries(GENDERS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Blood type & SSN */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Groupe sanguin
                    </label>
                    <select
                      value={formData.blood_type}
                      onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Non renseigné</option>
                      {BLOOD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      N° Sécurité sociale
                    </label>
                    <input
                      type="text"
                      value={formData.social_security_number}
                      onChange={(e) => setFormData({ ...formData, social_security_number: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Adresse
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Contact d'urgence
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Relation
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_relation}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                        placeholder="Ex: Conjoint, Parent..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mutuelle/Assurance
                    </label>
                    <input
                      type="text"
                      value={formData.insurance_provider}
                      onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      N° Adhérent
                    </label>
                    <input
                      type="text"
                      value={formData.insurance_number}
                      onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                    placeholder="Informations complémentaires..."
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
                    {editingPatient ? "Mettre à jour" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-teal-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {showDetailModal.first_name?.charAt(0)}
                    {showDetailModal.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-slate-800">
                      {showDetailModal.first_name} {showDetailModal.last_name}
                    </h2>
                    <p className="text-sm text-cyan-600 font-mono">
                      {showDetailModal.patient_number}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="ml-auto p-2 hover:bg-white/50 rounded-lg"
                  >
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Âge</p>
                    <p className="text-lg font-bold text-slate-800">
                      {calculateAge(showDetailModal.date_of_birth) || "-"} ans
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Genre</p>
                    <p className="text-lg font-bold text-slate-800">
                      {GENDERS[showDetailModal.gender] || "-"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-xs text-red-500">Groupe sanguin</p>
                    <p className="text-lg font-bold text-red-700">
                      {showDetailModal.blood_type || "-"}
                    </p>
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Coordonnées</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    {showDetailModal.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneIcon className="h-4 w-4 text-slate-400" />
                        <span>{showDetailModal.phone}</span>
                      </div>
                    )}
                    {showDetailModal.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                        <span>{showDetailModal.email}</span>
                      </div>
                    )}
                    {showDetailModal.address && (
                      <div className="text-sm text-slate-600">
                        {showDetailModal.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                {showDetailModal.emergency_contact_name && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Contact d'urgence
                    </h3>
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="font-medium text-slate-800">
                        {showDetailModal.emergency_contact_name}
                        {showDetailModal.emergency_contact_relation && (
                          <span className="text-slate-400 font-normal"> ({showDetailModal.emergency_contact_relation})</span>
                        )}
                      </p>
                      {showDetailModal.emergency_contact_phone && (
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                          <PhoneIcon className="h-3 w-3" />
                          {showDetailModal.emergency_contact_phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Insurance */}
                {showDetailModal.insurance_provider && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Assurance</h3>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="font-medium text-slate-800">
                        {showDetailModal.insurance_provider}
                      </p>
                      {showDetailModal.insurance_number && (
                        <p className="text-sm text-slate-500">
                          N° {showDetailModal.insurance_number}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {showDetailModal.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Notes</h3>
                    <div className="bg-yellow-50 rounded-xl p-4 text-sm text-slate-700">
                      {showDetailModal.notes}
                    </div>
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
                <button
                  onClick={() => {
                    setShowDetailModal(null);
                    openEditModal(showDetailModal);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Supprimer le patient"
          message={`Êtes-vous sûr de vouloir supprimer le dossier de "${confirmDelete?.first_name} ${confirmDelete?.last_name}" ? Cette action supprimera également tout l'historique médical associé.`}
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

export default Patients;
