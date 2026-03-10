/**
 * Training Courses Management
 * Gestion des cours/formations
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
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

// Niveaux de cours
const LEVELS = {
  beginner: { label: "Débutant", color: "bg-green-100 text-green-700" },
  intermediate: { label: "Intermédiaire", color: "bg-yellow-100 text-yellow-700" },
  advanced: { label: "Avancé", color: "bg-orange-100 text-orange-700" },
  expert: { label: "Expert", color: "bg-red-100 text-red-700" },
};

// Modes de cours
const MODES = {
  in_person: { label: "Présentiel", icon: "🏫" },
  online: { label: "En ligne", icon: "💻" },
  hybrid: { label: "Hybride", icon: "🔄" },
};

const Courses = () => {
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    level: "beginner",
    mode: "in_person",
    duration_hours: "",
    max_participants: "",
    price: "",
    instructor_id: "",
    prerequisites: "",
    objectives: "",
    is_active: true,
  });

  // Catégories prédéfinies
  const categories = [
    "Développement personnel",
    "Management",
    "Informatique",
    "Langues",
    "Marketing",
    "Finance",
    "Ressources humaines",
    "Santé & Sécurité",
    "Technique",
    "Commercial",
  ];

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/training/courses");
      setCourses(response.data.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      showToast("Erreur lors du chargement des cours", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      // Fetch staff members who can be instructors
      const response = await api.get("/users");
      setInstructors(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, [fetchCourses, fetchInstructors]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        duration_hours: parseInt(formData.duration_hours) || null,
        max_participants: parseInt(formData.max_participants) || null,
        price: parseFloat(formData.price) || 0,
        instructor_id: formData.instructor_id || null,
      };

      if (editingCourse) {
        await api.put(`/training/courses/${editingCourse.id}`, payload);
        showToast("Cours mis à jour avec succès");
      } else {
        await api.post("/training/courses", payload);
        showToast("Cours créé avec succès");
      }
      setShowModal(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/training/courses/${confirmDelete.id}`);
      showToast("Cours supprimé avec succès");
      setConfirmDelete(null);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const toggleStatus = async (course) => {
    try {
      await api.patch(`/training/courses/${course.id}/status`, {
        is_active: !course.is_active,
      });
      showToast(`Cours ${course.is_active ? "désactivé" : "activé"}`);
      fetchCourses();
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Erreur lors du changement de statut", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      level: "beginner",
      mode: "in_person",
      duration_hours: "",
      max_participants: "",
      price: "",
      instructor_id: "",
      prerequisites: "",
      objectives: "",
      is_active: true,
    });
    setEditingCourse(null);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || "",
      category: course.category || "",
      level: course.level || "beginner",
      mode: course.mode || "in_person",
      duration_hours: course.duration_hours ? course.duration_hours.toString() : "",
      max_participants: course.max_participants ? course.max_participants.toString() : "",
      price: course.price ? course.price.toString() : "",
      instructor_id: course.instructor_id || "",
      prerequisites: course.prerequisites || "",
      objectives: course.objectives || "",
      is_active: course.is_active !== false,
    });
    setShowModal(true);
  };

  // Filtered courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = !filterLevel || course.level === filterLevel;
    const matchesMode = !filterMode || course.mode === filterMode;
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "active" && course.is_active) ||
      (filterStatus === "inactive" && !course.is_active);
    return matchesSearch && matchesLevel && matchesMode && matchesStatus;
  });

  // Group courses by category
  const coursesByCategory = filteredCourses.reduce((acc, course) => {
    const category = course.category || "Autres";
    if (!acc[category]) acc[category] = [];
    acc[category].push(course);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              Catalogue des Cours
            </h1>
            <p className="text-slate-500 mt-1">
              {courses.length} cours •{" "}
              {courses.filter((c) => c.is_active).length} actif{courses.filter((c) => c.is_active).length > 1 ? "s" : ""}
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
            Nouveau Cours
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
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Level filter */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous les niveaux</option>
              {Object.entries(LEVELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Mode filter */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous les modes</option>
              {Object.entries(MODES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
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
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : Object.keys(coursesByCategory).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucun cours trouvé
            </h3>
            <p className="text-slate-500 mb-4">
              Créez votre premier cours de formation
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Créer un cours
            </button>
          </div>
        ) : (
          Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-4 w-4 text-emerald-600" />
                </span>
                {category}
                <span className="text-sm font-normal text-slate-400">
                  ({categoryCourses.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`bg-white rounded-2xl shadow-soft border-2 overflow-hidden transition-all hover:shadow-soft-lg ${
                      course.is_active
                        ? "border-slate-200 hover:border-emerald-300"
                        : "border-slate-200 opacity-60"
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 line-clamp-1">
                            {course.name}
                          </h3>
                          {course.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                        {course.is_active ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <CheckCircleIcon className="h-3 w-3" />
                            Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            <XCircleIcon className="h-3 w-3" />
                            Inactif
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVELS[course.level]?.color || LEVELS.beginner.color}`}>
                          {LEVELS[course.level]?.label || "Débutant"}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {MODES[course.mode]?.icon} {MODES[course.mode]?.label || "Présentiel"}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {course.duration_hours && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <ClockIcon className="h-4 w-4" />
                            <span>{course.duration_hours}h</span>
                          </div>
                        )}
                        {course.max_participants && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>Max {course.max_participants}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instructor */}
                    {course.instructor_name && (
                      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          Formateur: <span className="font-medium text-slate-700">{course.instructor_name}</span>
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-600">
                        {course.price ? formatPrice(course.price) : "Gratuit"}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleStatus(course)}
                          className={`p-2 rounded-lg transition-colors ${
                            course.is_active
                              ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                              : "text-emerald-600 bg-emerald-50"
                          }`}
                          title={course.is_active ? "Désactiver" : "Activer"}
                        >
                          {course.is_active ? (
                            <XCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(course)}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(course)}
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
            </div>
          ))
        )}

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  {editingCourse ? "Modifier le cours" : "Nouveau cours"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom du cours *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Introduction au management"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le contenu du cours..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Category & Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Niveau *
                    </label>
                    <select
                      required
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {Object.entries(LEVELS).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mode & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mode *
                    </label>
                    <select
                      required
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {Object.entries(MODES).map(([key, { label, icon }]) => (
                        <option key={key} value={key}>
                          {icon} {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Durée (heures)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                      placeholder="Ex: 8"
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
                      placeholder="Ex: 20"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Prix
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00 (gratuit si vide)"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
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

                {/* Prerequisites */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Prérequis
                  </label>
                  <textarea
                    value={formData.prerequisites}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    placeholder="Connaissances ou compétences requises..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Objectives */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Objectifs pédagogiques
                  </label>
                  <textarea
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Ce que les participants apprendront..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    Cours actif (visible dans le catalogue)
                  </label>
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
                    {editingCourse ? "Mettre à jour" : "Créer"}
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
          title="Supprimer le cours"
          message={`Êtes-vous sûr de vouloir supprimer le cours "${confirmDelete?.name}" ? Cette action supprimera également toutes les sessions associées.`}
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

export default Courses;
