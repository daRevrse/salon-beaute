/**
 * Training Certificates Management
 * Gestion des certificats de formation
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import {
  PlusIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// Statuts de certificat
const CERTIFICATE_STATUSES = {
  draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
  issued: { label: "Délivré", color: "bg-green-100 text-green-700" },
  revoked: { label: "Révoqué", color: "bg-red-100 text-red-700" },
};

const Certificates = () => {
  const { tenant } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    enrollment_id: "",
    grade: "",
    attendance_percentage: "",
    notes: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
  });

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/training/certificates");
      setCertificates(response.data.data || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      showToast("Erreur lors du chargement des certificats", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await api.get("/training/enrollments");
      // Only show completed enrollments without certificates
      setEnrollments(
        (response.data.data || []).filter(
          (e) => e.status === "completed" && !e.certificate_id
        )
      );
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
    fetchEnrollments();
  }, [fetchCertificates, fetchEnrollments]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        attendance_percentage: formData.attendance_percentage
          ? parseFloat(formData.attendance_percentage)
          : null,
        expiry_date: formData.expiry_date || null,
      };

      await api.post("/training/certificates", payload);
      showToast("Certificat créé avec succès");
      setShowModal(false);
      resetForm();
      fetchCertificates();
      fetchEnrollments();
    } catch (error) {
      console.error("Error creating certificate:", error);
      showToast(error.response?.data?.error || "Erreur lors de la création", "error");
    }
  };

  const updateStatus = async (certificate, status) => {
    try {
      await api.patch(`/training/certificates/${certificate.id}/status`, { status });
      showToast(`Certificat ${status === "issued" ? "délivré" : "révoqué"}`);
      fetchCertificates();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      enrollment_id: "",
      grade: "",
      attendance_percentage: "",
      notes: "",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
    });
  };

  // Filtered certificates
  const filteredCertificates = certificates.filter((certificate) => {
    const matchesSearch =
      (certificate.certificate_number &&
        certificate.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (certificate.client_name &&
        certificate.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (certificate.course_name &&
        certificate.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || certificate.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: certificates.length,
    issued: certificates.filter((c) => c.status === "issued").length,
    draft: certificates.filter((c) => c.status === "draft").length,
    pending: enrollments.length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Certificats
            </h1>
            <p className="text-slate-500 mt-1">
              {certificates.length} certificat{certificates.length > 1 ? "s" : ""} •{" "}
              {stats.issued} délivré{stats.issued > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            disabled={enrollments.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5" />
            Délivrer un Certificat
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
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
                <CheckBadgeIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.issued}</p>
                <p className="text-xs text-slate-500">Délivrés</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.draft}</p>
                <p className="text-xs text-slate-500">Brouillons</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                <p className="text-xs text-slate-500">En attente</p>
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
                placeholder="Rechercher un certificat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(CERTIFICATE_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckBadgeIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucun certificat trouvé
            </h3>
            <p className="text-slate-500 mb-4">
              {enrollments.length > 0
                ? "Délivrez des certificats aux participants ayant terminé leur formation"
                : "Aucun participant n'a encore terminé sa formation"}
            </p>
            {enrollments.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Délivrer un certificat
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className={`bg-white rounded-2xl shadow-soft border-2 overflow-hidden transition-all hover:shadow-soft-lg ${
                  certificate.status === "issued"
                    ? "border-green-200"
                    : certificate.status === "revoked"
                    ? "border-red-200 opacity-60"
                    : "border-slate-200"
                }`}
              >
                {/* Certificate Header */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckBadgeIcon className="h-6 w-6 text-emerald-600" />
                      <span className="font-mono text-sm font-medium text-emerald-700">
                        {certificate.certificate_number}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        CERTIFICATE_STATUSES[certificate.status]?.color
                      }`}
                    >
                      {CERTIFICATE_STATUSES[certificate.status]?.label}
                    </span>
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {certificate.client_name || "Participant"}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {certificate.course_name || "Formation"}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {certificate.grade && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Note</span>
                        <span className="font-medium text-slate-700">{certificate.grade}</span>
                      </div>
                    )}
                    {certificate.attendance_percentage && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Présence</span>
                        <span className="font-medium text-slate-700">
                          {certificate.attendance_percentage}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Délivré le</span>
                      <span className="font-medium text-slate-700">
                        {certificate.issue_date
                          ? new Date(certificate.issue_date).toLocaleDateString("fr-FR")
                          : "-"}
                      </span>
                    </div>
                    {certificate.expiry_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Expire le</span>
                        <span className="font-medium text-slate-700">
                          {new Date(certificate.expiry_date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verification code */}
                  {certificate.verification_code && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Code de vérification</p>
                      <p className="font-mono text-sm font-medium text-slate-600">
                        {certificate.verification_code}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-slate-100 flex justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowPreview(certificate)}
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Aperçu"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Imprimer"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {certificate.status === "draft" && (
                      <button
                        onClick={() => updateStatus(certificate, "issued")}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Délivrer"
                      >
                        <CheckBadgeIcon className="h-4 w-4" />
                      </button>
                    )}
                    {certificate.status === "issued" && (
                      <button
                        onClick={() => updateStatus(certificate, "revoked")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Révoquer"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  Délivrer un Certificat
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Enrollment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Participant *
                  </label>
                  <select
                    required
                    value={formData.enrollment_id}
                    onChange={(e) => setFormData({ ...formData, enrollment_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner un participant</option>
                    {enrollments.map((enrollment) => (
                      <option key={enrollment.id} value={enrollment.id}>
                        {enrollment.client_name} - {enrollment.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade & Attendance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Note
                    </label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="Ex: A, 18/20, Excellent"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Présence (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.attendance_percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, attendance_percentage: e.target.value })
                      }
                      placeholder="Ex: 95"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date de délivrance
                    </label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    placeholder="Commentaires sur la formation..."
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
                    Créer le certificat
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Certificate Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full animate-scale-in">
              {/* Preview Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Aperçu du certificat
                </h2>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircleIcon className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Certificate Preview */}
              <div className="p-8">
                <div className="border-4 border-emerald-200 rounded-xl p-8 bg-gradient-to-br from-white to-emerald-50">
                  <div className="text-center">
                    {/* Logo */}
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AcademicCapIcon className="h-8 w-8 text-white" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">
                      CERTIFICAT DE FORMATION
                    </h1>
                    <p className="text-slate-500 mb-6">Atteste que</p>

                    {/* Recipient */}
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-emerald-200 pb-2 inline-block">
                      {showPreview.client_name}
                    </h2>

                    {/* Course */}
                    <p className="text-slate-600 mb-2">a suivi avec succès la formation</p>
                    <h3 className="text-xl font-semibold text-emerald-700 mb-6">
                      {showPreview.course_name}
                    </h3>

                    {/* Details */}
                    <div className="flex justify-center gap-8 text-sm text-slate-600 mb-6">
                      {showPreview.grade && (
                        <div>
                          <p className="text-xs text-slate-400">Note</p>
                          <p className="font-semibold">{showPreview.grade}</p>
                        </div>
                      )}
                      {showPreview.attendance_percentage && (
                        <div>
                          <p className="text-xs text-slate-400">Présence</p>
                          <p className="font-semibold">{showPreview.attendance_percentage}%</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-400">Délivré le</p>
                        <p className="font-semibold">
                          {showPreview.issue_date
                            ? new Date(showPreview.issue_date).toLocaleDateString("fr-FR")
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Certificate number */}
                    <div className="mt-6 pt-4 border-t border-emerald-100">
                      <p className="text-xs text-slate-400">N° {showPreview.certificate_number}</p>
                      {showPreview.verification_code && (
                        <p className="text-xs text-slate-400 mt-1">
                          Code de vérification: {showPreview.verification_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowPreview(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Télécharger PDF
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

export default Certificates;
