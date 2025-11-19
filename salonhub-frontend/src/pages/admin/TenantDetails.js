/**
 * SALONHUB - Page de détails d'un tenant (Version améliorée)
 * Vue complète avec onglets, utilisateurs et graphiques
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  BuildingStorefrontIcon,
  UsersIcon,
  UserIcon,
  CalendarIcon,
  ScissorsIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../hooks/useToast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const API_URL = process.env.REACT_APP_API_URL;

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

function TenantDetailsImproved() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
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

      // Charger les utilisateurs du tenant
      await loadUsers();
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

  const loadUsers = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/admin/users?tenant_id=${id}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Erreur chargement users:", error);
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

  const exportData = () => {
    const data = {
      tenant,
      stats,
      users,
      export_date: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tenant_${tenant.slug}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success("Données exportées avec succès");
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

  // Données pour les graphiques
  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(usersByRole).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const statsData = [
    { name: "Users", value: stats.total_users },
    { name: "Clients", value: stats.total_clients },
    { name: "Services", value: stats.total_services },
    { name: "RDV", value: stats.total_appointments },
  ];

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
              <div className="flex items-center">
                <BuildingStorefrontIcon className="w-6 h-6 mr-2" />
                <h1 className="text-xl font-bold">Détails du Salon</h1>
              </div>
            </div>
            <button
              onClick={exportData}
              className="flex items-center bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Exporter
            </button>
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
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Réactiver
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  disabled={actionLoading}
                  className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <XCircleIcon className="w-5 h-5 mr-2" />
                  Suspendre
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Supprimer
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoItem icon={EnvelopeIcon} label="Email" value={tenant.email} />
            <InfoItem icon={PhoneIcon} label="Téléphone" value={tenant.phone || "Non renseigné"} />
            <InfoItem icon={MapPinIcon} label="Adresse" value={tenant.address || "Non renseigné"} />
            <InfoItem
              icon={CalendarIcon}
              label="Date de création"
              value={new Date(tenant.created_at).toLocaleDateString("fr-FR")}
            />
            <InfoItem
              icon={GlobeAltIcon}
              label="Timezone"
              value={tenant.timezone || "UTC"}
            />
            <InfoItem
              icon={CurrencyDollarIcon}
              label="Devise"
              value={tenant.currency || "EUR"}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <TabButton
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                icon={ChartBarIcon}
                label="Vue d'ensemble"
              />
              <TabButton
                active={activeTab === "users"}
                onClick={() => setActiveTab("users")}
                icon={UsersIcon}
                label={`Utilisateurs (${users.length})`}
              />
              <TabButton
                active={activeTab === "config"}
                onClick={() => setActiveTab("config")}
                icon={CogIcon}
                label="Configuration"
              />
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={UsersIcon}
                title="Utilisateurs"
                value={stats.total_users}
                color="blue"
              />
              <StatCard
                icon={UserIcon}
                title="Clients"
                value={stats.total_clients}
                color="green"
              />
              <StatCard
                icon={ScissorsIcon}
                title="Services"
                value={stats.total_services}
                color="purple"
              />
              <StatCard
                icon={CalendarIcon}
                title="Rendez-vous"
                value={stats.total_appointments}
                subtitle={`${stats.completed_appointments} complétés`}
                color="indigo"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Users by Role */}
              {pieData.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Répartition des utilisateurs par rôle
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar Chart - Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Statistiques générales
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Utilisateurs du salon ({users.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dernière connexion
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.is_active ? (
                            <span className="flex items-center text-green-600 text-sm">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600 text-sm">
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Inactif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString("fr-FR")
                            : "Jamais"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CogIcon className="w-6 h-6 mr-2" />
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
              <ConfigItem
                label="Tenant ID"
                value={tenant.id}
              />
            </div>
          </div>
        )}
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
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
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
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

function StatCard({ icon: Icon, title, value, color, subtitle }) {
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
        <Icon className="w-8 h-8 opacity-80" />
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

function RoleBadge({ role }) {
  const badges = {
    admin: { color: "bg-purple-100 text-purple-800", label: "Admin" },
    manager: { color: "bg-blue-100 text-blue-800", label: "Manager" },
    staff: { color: "bg-green-100 text-green-800", label: "Staff" },
  };

  const badge = badges[role] || badges.staff;

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-3 font-medium text-sm border-b-2 transition ${
        active
          ? "border-purple-600 text-purple-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </button>
  );
}

export default TenantDetailsImproved;
