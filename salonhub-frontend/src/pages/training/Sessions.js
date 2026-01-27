/**
 * Training Sessions Management
 * Gestion des sessions de formation
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
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

// Statuts de session
const SESSION_STATUSES = {
  scheduled: { label: "Planifiée", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Terminée", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

const Sessions = () => {
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    course_id: "",
    instructor_id: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    room: "",
    max_participants: "",
    price_override: "",
    status: "scheduled",
    notes: "",
  });

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/training/sessions");
      setSessions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      showToast("Erreur lors du chargement des sessions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get("/training/courses");
      setCourses((response.data.data || []).filter((c) => c.is_active));
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setInstructors(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchCourses();
    fetchInstructors();
  }, [fetchSessions, fetchCourses, fetchInstructors]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        max_participants: parseInt(formData.max_participants) || null,
        price_override: formData.price_override ? parseFloat(formData.price_override) : null,
        instructor_id: formData.instructor_id || null,
      };

      if (editingSession) {
        await api.put(`/training/sessions/${editingSession.id}`, payload);
        showToast("Session mise à jour avec succès");
      } else {
        await api.post("/training/sessions", payload);
        showToast("Session créée avec succès");
      }
      setShowModal(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      console.error("Error saving session:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/training/sessions/${confirmDelete.id}`);
      showToast("Session supprimée avec succès");
      setConfirmDelete(null);
      fetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const updateStatus = async (session, status) => {
    try {
      await api.patch(`/training/sessions/${session.id}/status`, { status });
      showToast(`Statut mis à jour: ${SESSION_STATUSES[status].label}`);
      fetchSessions();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      instructor_id: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      location: "",
      room: "",
      max_participants: "",
      price_override: "",
      status: "scheduled",
      notes: "",
    });
    setEditingSession(null);
  };

  const openEditModal = (session) => {
    setEditingSession(session);
    setFormData({
      course_id: session.course_id || "",
      instructor_id: session.instructor_id || "",
      start_date: session.start_date ? session.start_date.split("T")[0] : "",
      end_date: session.end_date ? session.end_date.split("T")[0] : "",
      start_time: session.start_time || "",
      end_time: session.end_time || "",
      location: session.location || "",
      room: session.room || "",
      max_participants: session.max_participants ? session.max_participants.toString() : "",
      price_override: session.price_override ? session.price_override.toString() : "",
      status: session.status || "scheduled",
      notes: session.notes || "",
    });
    setShowModal(true);
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      (session.course_name && session.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.session_number && session.session_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.location && session.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || session.status === filterStatus;
    const matchesCourse = !filterCourse || session.course_id === parseInt(filterCourse);
    return matchesSearch && matchesStatus && matchesCourse;
  });

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const date = session.start_date ? new Date(session.start_date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) : "Date non définie";
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const formatTime = (time) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Sessions de Formation
            </h1>
            <p className="text-slate-500 mt-1">
              {sessions.length} session{sessions.length > 1 ? "s" : ""} •{" "}
              {sessions.filter((s) => s.status === "scheduled").length} planifiée{sessions.filter((s) => s.status === "scheduled").length > 1 ? "s" : ""}
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
            Nouvelle Session
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
                placeholder="Rechercher une session..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Course filter */}
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous les cours</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
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
              {Object.entries(SESSION_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : Object.keys(groupedSessions).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucune session trouvée
            </h3>
            <p className="text-slate-500 mb-4">
              Planifiez votre première session de formation
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Créer une session
            </button>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([date, dateSessions]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 capitalize">
                <CalendarDaysIcon className="h-5 w-5 text-emerald-500" />
                {date}
              </h2>
              <div className="space-y-3">
                {dateSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl shadow-soft border border-slate-200 p-4 hover:shadow-soft-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Time & Course */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 text-center">
                          <div className="text-lg font-bold text-emerald-600">
                            {formatTime(session.start_time)}
                          </div>
                          {session.end_time && (
                            <div className="text-sm text-slate-400">
                              → {formatTime(session.end_time)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-800">
                              {session.course_name || "Cours non défini"}
                            </h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SESSION_STATUSES[session.status]?.color || SESSION_STATUSES.scheduled.color}`}>
                              {SESSION_STATUSES[session.status]?.label || "Planifiée"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            {session.session_number && (
                              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {session.session_number}
                              </span>
                            )}
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4" />
                                {session.location}
                                {session.room && ` - ${session.room}`}
                              </span>
                            )}
                            {session.instructor_name && (
                              <span>👤 {session.instructor_name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Participants & Price */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-slate-600">
                            <UserGroupIcon className="h-4 w-4" />
                            <span className="font-medium">
                              {session.enrolled_count || 0}
                              {session.max_participants && `/${session.max_participants}`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">inscrits</p>
                        </div>
                        {(session.price_override || session.course_price) && (
                          <div className="text-right">
                            <span className="text-lg font-bold text-emerald-600">
                              {formatPrice(session.price_override || session.course_price)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {session.status === "scheduled" && (
                          <button
                            onClick={() => updateStatus(session, "in_progress")}
                            className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Démarrer"
                          >
                            <ClockIcon className="h-5 w-5" />
                          </button>
                        )}
                        {session.status === "in_progress" && (
                          <button
                            onClick={() => updateStatus(session, "completed")}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            title="Terminer"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(session)}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(session)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  {editingSession ? "Modifier la session" : "Nouvelle session"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cours *
                  </label>
                  <select
                    required
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner un cours</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Formateur
                  </label>
                  <select
                    value={formData.instructor_id}
                    onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner un formateur</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.first_name} {instructor.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Heure de début *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Heure de fin
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ex: Paris, En ligne..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Salle
                    </label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="Ex: Salle A, Zoom..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Max participants & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Participants max
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                      placeholder="Laisser vide = illimité"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Prix (surcharge)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_override}
                      onChange={(e) => setFormData({ ...formData, price_override: e.target.value })}
                      placeholder="Vide = prix du cours"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {Object.entries(SESSION_STATUSES).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
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
                    {editingSession ? "Mettre à jour" : "Créer"}
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
          title="Supprimer la session"
          message={`Êtes-vous sûr de vouloir supprimer cette session ? Les inscriptions associées seront également supprimées.`}
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

export default Sessions;
