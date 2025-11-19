/**
 * SALONHUB - Page de détails d'un tenant
 * Vue complète des informations et statistiques d'un salon
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function TenantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    loadTenantData();
  }, [id, navigate]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const response = await axios.get(`${API_URL}/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTenant(response.data.tenant);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Erreur chargement tenant:", error);
      if (error.response?.status === 404) {
        showError("Salon non trouvé");
        setTimeout(() => navigate("/superadmin/dashboard"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      showError("Veuillez entrer une raison pour la suspension");
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();
      await axios.put(
        `${API_URL}/admin/tenants/${id}/suspend`,
        { reason: suspendReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      success("Salon suspendu avec succès");
      setShowSuspendModal(false);
      setSuspendReason("");
      loadTenantData();
    } catch (error) {
      console.error("Erreur suspension:", error);
      showError("Erreur lors de la suspension");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActionLoading(true);
      const token = getToken();
      await axios.put(
        `${API_URL}/admin/tenants/${id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      success("Salon réactivé avec succès");
      loadTenantData();
    } catch (error) {
      console.error("Erreur activation:", error);
      showError("Erreur lors de l'activation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const token = getToken();
      await axios.delete(`${API_URL}/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { confirm: "DELETE" },
      });

      success("Salon supprimé définitivement");
      setShowDeleteModal(false);
      setTimeout(() => navigate("/superadmin/dashboard"), 2000);
    } catch (error) {
      console.error("Erreur suppression:", error);
      showError("Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/superadmin/dashboard")}
                className="text-white hover:text-gray-200 transition"
              >
                ← Retour
              </button>
              <h1 className="text-xl font-bold">Détails du Salon</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tenant Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {tenant.name}
              </h2>
              <p className="text-gray-500 text-sm mb-4">/{tenant.slug}</p>

              <div className="flex items-center space-x-4">
                <StatusBadge status={tenant.subscription_status} />
                <PlanBadge plan={tenant.subscription_plan} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {tenant.subscription_status === "suspended" ? (
                <button
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  Réactiver
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  disabled={actionLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  Suspendre
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Email" value={tenant.email} />
            <InfoItem label="Téléphone" value={tenant.phone || "Non renseigné"} />
            <InfoItem label="Adresse" value={tenant.address || "Non renseigné"} />
            <InfoItem
              label="Date de création"
              value={new Date(tenant.created_at).toLocaleDateString("fr-FR")}
            />
            <InfoItem
              label="Fin de période d'essai"
              value={
                tenant.trial_ends_at
                  ? new Date(tenant.trial_ends_at).toLocaleDateString("fr-FR")
                  : "N/A"
              }
            />
            <InfoItem
              label="Fin d'abonnement"
              value={
                tenant.subscription_ends_at
                  ? new Date(tenant.subscription_ends_at).toLocaleDateString("fr-FR")
                  : "N/A"
              }
            />
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Utilisateurs"
              value={stats.total_users}
              icon="👥"
              color="blue"
            />
            <StatCard
              title="Clients"
              value={stats.total_clients}
              icon="👤"
              color="green"
            />
            <StatCard
              title="Services"
              value={stats.total_services}
              icon="✂️"
              color="purple"
            />
            <StatCard
              title="Rendez-vous"
              value={stats.total_appointments}
              icon="📅"
              color="indigo"
              subtitle={`${stats.completed_appointments} complétés`}
            />
          </div>
        )}

        {/* Settings & Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Configuration & Paramètres
          </h3>

          <div className="space-y-3">
            <ConfigItem
              label="Booking public URL"
              value={`${window.location.origin}/booking/${tenant.slug}`}
            />
            <ConfigItem
              label="Plan d'abonnement"
              value={tenant.subscription_plan}
            />
            <ConfigItem
              label="Statut d'abonnement"
              value={tenant.subscription_status}
            />
            <ConfigItem
              label="Timezone"
              value={tenant.timezone || "UTC"}
            />
            <ConfigItem
              label="Devise"
              value={tenant.currency || "EUR"}
            />
          </div>
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

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowSuspendModal(false)}
          ></div>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Suspendre le salon
              </h3>
              <p className="text-gray-600 mb-4">
                Vous êtes sur le point de suspendre le salon "{tenant.name}".
                Veuillez entrer la raison de la suspension.
              </p>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Raison de la suspension..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendReason("");
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={actionLoading || !suspendReason.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
                >
                  {actionLoading ? "Suspension..." : "Suspendre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer définitivement le salon"
        message={`⚠️ ATTENTION: Cette action est IRRÉVERSIBLE ! Le salon "${tenant?.name}" et toutes ses données (utilisateurs, clients, rendez-vous) seront supprimés définitivement. Êtes-vous absolument certain ?`}
        confirmText="Oui, supprimer définitivement"
        cancelText="Non, annuler"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
}

// Composants utilitaires
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}

function ConfigItem({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg p-6 text-white`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm opacity-90">{title}</p>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-800",
    trial: "bg-blue-100 text-blue-800",
    suspended: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const labels = {
    active: "Actif",
    trial: "Essai",
    suspended: "Suspendu",
    cancelled: "Annulé",
  };

  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full ${
        styles[status] || styles.cancelled
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function PlanBadge({ plan }) {
  return (
    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
      {plan}
    </span>
  );
}

export default TenantDetails;
