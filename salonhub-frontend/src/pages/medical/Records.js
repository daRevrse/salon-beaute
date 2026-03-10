/**
 * Medical Records Management
 * Gestion des consultations/dossiers médicaux
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
  ClockIcon,
  UserIcon,
  HeartIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

// Types de visite
const VISIT_TYPES = {
  consultation: { label: "Consultation", color: "bg-blue-100 text-blue-700" },
  follow_up: { label: "Suivi", color: "bg-green-100 text-green-700" },
  emergency: { label: "Urgence", color: "bg-red-100 text-red-700" },
  preventive: { label: "Préventif", color: "bg-purple-100 text-purple-700" },
  procedure: { label: "Acte médical", color: "bg-orange-100 text-orange-700" },
};

const Records = () => {
  const { tenant, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPatient, setFilterPatient] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    visit_date: new Date().toISOString().split("T")[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    visit_type: "consultation",
    chief_complaint: "",
    history_of_present_illness: "",
    physical_examination: "",
    vital_signs: {
      blood_pressure: "",
      heart_rate: "",
      temperature: "",
      weight: "",
      height: "",
    },
    diagnosis: "",
    treatment_plan: "",
    notes: "",
    follow_up_required: false,
    follow_up_date: "",
  });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/medical/records");
      setRecords(response.data.data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      showToast("Erreur lors du chargement des dossiers", "error");
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
    fetchRecords();
    fetchPatients();
  }, [fetchRecords, fetchPatients]);

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
        vital_signs: JSON.stringify(formData.vital_signs),
        follow_up_date: formData.follow_up_required ? formData.follow_up_date : null,
      };

      if (editingRecord) {
        await api.put(`/medical/records/${editingRecord.id}`, payload);
        showToast("Dossier mis à jour avec succès");
      } else {
        await api.post("/medical/records", payload);
        showToast("Dossier créé avec succès");
      }
      setShowModal(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error("Error saving record:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      visit_date: new Date().toISOString().split("T")[0],
      visit_time: new Date().toTimeString().slice(0, 5),
      visit_type: "consultation",
      chief_complaint: "",
      history_of_present_illness: "",
      physical_examination: "",
      vital_signs: {
        blood_pressure: "",
        heart_rate: "",
        temperature: "",
        weight: "",
        height: "",
      },
      diagnosis: "",
      treatment_plan: "",
      notes: "",
      follow_up_required: false,
      follow_up_date: "",
    });
    setEditingRecord(null);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    let vitalSigns = {
      blood_pressure: "",
      heart_rate: "",
      temperature: "",
      weight: "",
      height: "",
    };
    try {
      if (record.vital_signs) {
        vitalSigns = typeof record.vital_signs === "string"
          ? JSON.parse(record.vital_signs)
          : record.vital_signs;
      }
    } catch (e) {
      console.error("Error parsing vital signs:", e);
    }

    setFormData({
      patient_id: record.patient_id || "",
      visit_date: record.visit_date ? record.visit_date.split("T")[0] : "",
      visit_time: record.visit_time || "",
      visit_type: record.visit_type || "consultation",
      chief_complaint: record.chief_complaint || "",
      history_of_present_illness: record.history_of_present_illness || "",
      physical_examination: record.physical_examination || "",
      vital_signs: vitalSigns,
      diagnosis: record.diagnosis || "",
      treatment_plan: record.treatment_plan || "",
      notes: record.notes || "",
      follow_up_required: record.follow_up_required || false,
      follow_up_date: record.follow_up_date ? record.follow_up_date.split("T")[0] : "",
    });
    setShowModal(true);
  };

  // Filtered records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      (record.patient_name && record.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.record_number && record.record_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !filterType || record.visit_type === filterType;
    const matchesPatient = !filterPatient || record.patient_id === parseInt(filterPatient);
    return matchesSearch && matchesType && matchesPatient;
  });

  // Group by date
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const date = record.visit_date
      ? new Date(record.visit_date).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date non définie";
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const parseVitalSigns = (vitalSigns) => {
    if (!vitalSigns) return null;
    try {
      return typeof vitalSigns === "string" ? JSON.parse(vitalSigns) : vitalSigns;
    } catch {
      return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Dossiers Médicaux
            </h1>
            <p className="text-slate-500 mt-1">
              {records.length} consultation{records.length > 1 ? "s" : ""} enregistrée{records.length > 1 ? "s" : ""}
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
            Nouvelle Consultation
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
                placeholder="Rechercher (patient, diagnostic, n° dossier)..."
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

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Tous les types</option>
              {Object.entries(VISIT_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardDocumentListIcon className="h-8 w-8 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucun dossier trouvé
            </h3>
            <p className="text-slate-500 mb-4">
              Créez votre première consultation
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
            >
              Nouvelle consultation
            </button>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([date, dateRecords]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 capitalize">
                <CalendarDaysIcon className="h-5 w-5 text-cyan-500" />
                {date}
              </h2>
              <div className="space-y-3">
                {dateRecords.map((record) => {
                  const vitalSigns = parseVitalSigns(record.vital_signs);
                  return (
                    <div
                      key={record.id}
                      className="bg-white rounded-2xl shadow-soft border border-slate-200 p-4 hover:shadow-soft-lg transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Time & Patient */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center min-w-[60px]">
                            <div className="text-lg font-bold text-cyan-600">
                              {record.visit_time ? record.visit_time.substring(0, 5) : "--:--"}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-800">
                                {record.patient_name || "Patient inconnu"}
                              </h3>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${VISIT_TYPES[record.visit_type]?.color || VISIT_TYPES.consultation.color}`}>
                                {VISIT_TYPES[record.visit_type]?.label || "Consultation"}
                              </span>
                              {record.follow_up_required && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                  Suivi requis
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {record.record_number}
                            </p>
                            {record.chief_complaint && (
                              <p className="text-sm text-slate-600 mt-1">
                                <span className="font-medium">Motif:</span> {record.chief_complaint}
                              </p>
                            )}
                            {record.diagnosis && (
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Diagnostic:</span> {record.diagnosis}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Vital Signs Summary */}
                        {vitalSigns && (
                          <div className="flex gap-3 text-xs">
                            {vitalSigns.blood_pressure && (
                              <div className="text-center p-2 bg-red-50 rounded-lg">
                                <p className="text-red-400">TA</p>
                                <p className="font-bold text-red-600">{vitalSigns.blood_pressure}</p>
                              </div>
                            )}
                            {vitalSigns.heart_rate && (
                              <div className="text-center p-2 bg-pink-50 rounded-lg">
                                <p className="text-pink-400">FC</p>
                                <p className="font-bold text-pink-600">{vitalSigns.heart_rate}</p>
                              </div>
                            )}
                            {vitalSigns.temperature && (
                              <div className="text-center p-2 bg-orange-50 rounded-lg">
                                <p className="text-orange-400">T°</p>
                                <p className="font-bold text-orange-600">{vitalSigns.temperature}°</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowDetailModal(record)}
                            className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  {editingRecord ? "Modifier la consultation" : "Nouvelle consultation"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Patient & Visit Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.visit_date}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Heure *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.visit_time}
                      onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Visit Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type de visite *
                  </label>
                  <select
                    required
                    value={formData.visit_type}
                    onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {Object.entries(VISIT_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motif de consultation
                  </label>
                  <textarea
                    value={formData.chief_complaint}
                    onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                    placeholder="Raison principale de la visite..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Vital Signs */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1">
                    <HeartIcon className="h-4 w-4 text-red-500" />
                    Signes vitaux
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Tension artérielle
                      </label>
                      <input
                        type="text"
                        value={formData.vital_signs.blood_pressure}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, blood_pressure: e.target.value },
                          })
                        }
                        placeholder="120/80"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Fréquence cardiaque
                      </label>
                      <input
                        type="text"
                        value={formData.vital_signs.heart_rate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, heart_rate: e.target.value },
                          })
                        }
                        placeholder="72 bpm"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Température (°C)
                      </label>
                      <input
                        type="text"
                        value={formData.vital_signs.temperature}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, temperature: e.target.value },
                          })
                        }
                        placeholder="37.0"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Poids (kg)
                      </label>
                      <input
                        type="text"
                        value={formData.vital_signs.weight}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, weight: e.target.value },
                          })
                        }
                        placeholder="70"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Taille (cm)
                      </label>
                      <input
                        type="text"
                        value={formData.vital_signs.height}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, height: e.target.value },
                          })
                        }
                        placeholder="175"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Examination */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Examen physique
                  </label>
                  <textarea
                    value={formData.physical_examination}
                    onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
                    placeholder="Observations de l'examen clinique..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Diagnostic
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="Diagnostic établi..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plan de traitement
                  </label>
                  <textarea
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                    placeholder="Traitement prescrit, recommandations..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Follow-up */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.follow_up_required}
                      onChange={(e) =>
                        setFormData({ ...formData, follow_up_required: e.target.checked })
                      }
                      className="h-4 w-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-slate-700">Suivi requis</span>
                  </label>
                  {formData.follow_up_required && (
                    <input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                      className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes complémentaires..."
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
                    {editingRecord ? "Mettre à jour" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-semibold text-slate-800">
                      Consultation
                    </h2>
                    <p className="text-sm text-cyan-600 font-mono">
                      {showDetailModal.record_number}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="p-2 hover:bg-white/50 rounded-lg"
                  >
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Patient & Date */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{showDetailModal.patient_name}</p>
                      <p className="text-xs text-slate-500">
                        {showDetailModal.visit_date
                          ? new Date(showDetailModal.visit_date).toLocaleDateString("fr-FR")
                          : "-"}{" "}
                        à {showDetailModal.visit_time?.substring(0, 5) || "--:--"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${VISIT_TYPES[showDetailModal.visit_type]?.color}`}>
                    {VISIT_TYPES[showDetailModal.visit_type]?.label}
                  </span>
                </div>

                {/* Vital Signs */}
                {showDetailModal.vital_signs && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Signes vitaux</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(parseVitalSigns(showDetailModal.vital_signs) || {}).map(([key, value]) => {
                        if (!value) return null;
                        const labels = {
                          blood_pressure: "TA",
                          heart_rate: "FC",
                          temperature: "T°",
                          weight: "Poids",
                          height: "Taille",
                        };
                        return (
                          <div key={key} className="text-center p-2 bg-cyan-50 rounded-lg">
                            <p className="text-xs text-cyan-500">{labels[key]}</p>
                            <p className="font-bold text-cyan-700">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Content sections */}
                {showDetailModal.chief_complaint && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Motif</h3>
                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3">
                      {showDetailModal.chief_complaint}
                    </p>
                  </div>
                )}

                {showDetailModal.physical_examination && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Examen physique</h3>
                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                      {showDetailModal.physical_examination}
                    </p>
                  </div>
                )}

                {showDetailModal.diagnosis && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Diagnostic</h3>
                    <p className="text-slate-600 bg-yellow-50 rounded-lg p-3">
                      {showDetailModal.diagnosis}
                    </p>
                  </div>
                )}

                {showDetailModal.treatment_plan && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Plan de traitement</h3>
                    <p className="text-slate-600 bg-green-50 rounded-lg p-3 whitespace-pre-wrap">
                      {showDetailModal.treatment_plan}
                    </p>
                  </div>
                )}

                {showDetailModal.follow_up_required && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-sm text-orange-700 font-medium">
                      📅 Suivi prévu le{" "}
                      {showDetailModal.follow_up_date
                        ? new Date(showDetailModal.follow_up_date).toLocaleDateString("fr-FR")
                        : "date à définir"}
                    </p>
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

export default Records;
