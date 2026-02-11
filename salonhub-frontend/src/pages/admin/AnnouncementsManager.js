/**
 * SALONHUB - Announcements Manager
 * Interface SuperAdmin pour creer et gerer les annonces aux tenants
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MegaphoneIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

const TARGET_TYPE_LABELS = {
  all: "Tous les tenants",
  plan: "Par plan",
  specific: "Tenants specifiques",
};

const SENT_VIA_LABELS = {
  email: "Email",
  in_app: "In-App",
  both: "Email + In-App",
};

const PLAN_OPTIONS = [
  { value: "essential", label: "Essential" },
  { value: "pro", label: "Pro" },
  { value: "custom", label: "Custom" },
];

function AnnouncementsManager() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_type: "all",
    target_plans: [],
    target_tenant_ids: [],
    sent_via: "both",
  });
  const [tenantIdInput, setTenantIdInput] = useState("");
  const { toast, hideToast, success, error: showError } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("superadmin_token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const token = localStorage.getItem("superadmin_token");
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    loadAnnouncements();
  }, [navigate]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/announcements", {
        headers: getAuthHeaders(),
      });
      setAnnouncements(response.data.announcements || response.data || []);
    } catch (err) {
      console.error("Erreur chargement annonces:", err);
      if (err.response?.status === 403) {
        showError("Acces refuse");
        navigate("/superadmin/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      target_type: "all",
      target_plans: [],
      target_tenant_ids: [],
      sent_via: "both",
    });
    setTenantIdInput("");
    setFormError("");
  };

  const handleTogglePlan = (plan) => {
    setFormData((prev) => {
      const plans = prev.target_plans.includes(plan)
        ? prev.target_plans.filter((p) => p !== plan)
        : [...prev.target_plans, plan];
      return { ...prev, target_plans: plans };
    });
  };

  const handleAddTenantId = () => {
    const id = tenantIdInput.trim();
    if (!id) return;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      setFormError("L'ID tenant doit etre un nombre positif");
      return;
    }
    if (formData.target_tenant_ids.includes(numericId)) {
      setFormError("Ce tenant ID est deja dans la liste");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      target_tenant_ids: [...prev.target_tenant_ids, numericId],
    }));
    setTenantIdInput("");
    setFormError("");
  };

  const handleRemoveTenantId = (id) => {
    setFormData((prev) => ({
      ...prev,
      target_tenant_ids: prev.target_tenant_ids.filter((tid) => tid !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Le titre est requis");
      return;
    }
    if (!formData.content.trim()) {
      setFormError("Le contenu est requis");
      return;
    }
    if (formData.target_type === "plan" && formData.target_plans.length === 0) {
      setFormError("Veuillez selectionner au moins un plan");
      return;
    }
    if (
      formData.target_type === "specific" &&
      formData.target_tenant_ids.length === 0
    ) {
      setFormError("Veuillez ajouter au moins un tenant ID");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        target_type: formData.target_type,
        sent_via: formData.sent_via,
      };

      if (formData.target_type === "plan") {
        payload.target_plans = formData.target_plans;
      }
      if (formData.target_type === "specific") {
        payload.target_tenant_ids = formData.target_tenant_ids;
      }

      await api.post("/admin/announcements", payload, {
        headers: getAuthHeaders(),
      });

      success("Annonce envoyee avec succes");
      setShowCreateForm(false);
      resetForm();
      loadAnnouncements();
    } catch (err) {
      console.error("Erreur creation annonce:", err);
      setFormError(
        err.response?.data?.error || "Erreur lors de l'envoi de l'annonce"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MegaphoneIcon className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-bold">Gestion des Annonces</h1>
                <p className="text-xs text-indigo-200">
                  Communiquez avec vos tenants
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/superadmin/dashboard")}
              className="bg-indigo-800 hover:bg-indigo-900 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              &#8592; Retour au dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Annonces</p>
              <p className="text-4xl font-bold mt-1">{announcements.length}</p>
            </div>
            <MegaphoneIcon className="w-16 h-16 opacity-80" />
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (showCreateForm) {
                resetForm();
              }
              setShowCreateForm(!showCreateForm);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center"
          >
            {showCreateForm ? (
              <XMarkIcon className="w-5 h-5 mr-2" />
            ) : (
              <PlusIcon className="w-5 h-5 mr-2" />
            )}
            {showCreateForm ? "Annuler" : "Nouvelle annonce"}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <PaperAirplaneIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Creer une nouvelle annonce
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Mise a jour importante, Nouvelle fonctionnalite..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Redigez le contenu de votre annonce..."
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                />
              </div>

              {/* Target Type & Sent Via - Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Target Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cible
                  </label>
                  <select
                    value={formData.target_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_type: e.target.value,
                        target_plans: [],
                        target_tenant_ids: [],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Tous les tenants</option>
                    <option value="plan">Par plan</option>
                    <option value="specific">Tenants specifiques</option>
                  </select>
                </div>

                {/* Sent Via */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Methode d'envoi
                  </label>
                  <select
                    value={formData.sent_via}
                    onChange={(e) =>
                      setFormData({ ...formData, sent_via: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="email">Email uniquement</option>
                    <option value="in_app">In-App uniquement</option>
                    <option value="both">Email + In-App</option>
                  </select>
                </div>
              </div>

              {/* Plan Selection (conditional) */}
              {formData.target_type === "plan" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plans cibles *
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {PLAN_OPTIONS.map((plan) => (
                      <label
                        key={plan.value}
                        className={`flex items-center px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                          formData.target_plans.includes(plan.value)
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.target_plans.includes(plan.value)}
                          onChange={() => handleTogglePlan(plan.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">
                          {plan.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.target_plans.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.target_plans.length} plan(s) selectionne(s):{" "}
                      {formData.target_plans
                        .map(
                          (p) =>
                            PLAN_OPTIONS.find((o) => o.value === p)?.label || p
                        )
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Tenant IDs Selection (conditional) */}
              {formData.target_type === "specific" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant IDs *
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={tenantIdInput}
                      onChange={(e) => setTenantIdInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTenantId();
                        }
                      }}
                      placeholder="Entrez un tenant ID"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddTenantId}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                    >
                      Ajouter
                    </button>
                  </div>
                  {formData.target_tenant_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.target_tenant_ids.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
                        >
                          Tenant #{id}
                          <button
                            type="button"
                            onClick={() => handleRemoveTenantId(id)}
                            className="ml-2 text-indigo-500 hover:text-indigo-800 transition"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.target_tenant_ids.length} tenant(s) selectionne(s)
                  </p>
                </div>
              )}

              {/* Form Error */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      Envoyer l'annonce
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Historique des annonces
            </h3>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-16">
              <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune annonce pour le moment</p>
              <p className="text-gray-400 text-sm mt-1">
                Cliquez sur "Nouvelle annonce" pour en creer une
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cible
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Methode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinataires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <tr
                      key={announcement.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs">
                          {announcement.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {announcement.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            announcement.target_type === "all"
                              ? "bg-green-100 text-green-800"
                              : announcement.target_type === "plan"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {TARGET_TYPE_LABELS[announcement.target_type] ||
                            announcement.target_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            announcement.sent_via === "email"
                              ? "bg-purple-100 text-purple-800"
                              : announcement.sent_via === "in_app"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {SENT_VIA_LABELS[announcement.sent_via] ||
                            announcement.sent_via}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {announcement.recipients_count != null
                          ? announcement.recipients_count
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(announcement.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 text-xs font-semibold">
                              {announcement.admin_first_name?.[0] || "A"}
                              {announcement.admin_last_name?.[0] || ""}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm text-gray-900">
                              {announcement.admin_first_name || ""}{" "}
                              {announcement.admin_last_name || "Admin"}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
}

export default AnnouncementsManager;
