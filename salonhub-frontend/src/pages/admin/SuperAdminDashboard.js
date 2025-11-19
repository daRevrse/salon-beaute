/**
 * SALONHUB - Dashboard SuperAdmin
 * Interface principale de gestion système
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BuildingStorefrontIcon,
  UsersIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  PauseCircleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

// Composants utilitaires
function StatCard({ title, value, IconComponent, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg p-6 text-white`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <IconComponent className="w-12 h-12 opacity-80" />
      </div>
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
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        styles[status] || styles.cancelled
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function PlanBar({ plan, count, total }) {
  const percentage = ((count / total) * 100).toFixed(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{plan}</span>
        <span className="text-sm text-gray-500">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-purple-600 h-2.5 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function MonthBar({ month, count }) {
  const maxCount = 50;
  const percentage = Math.min((count / maxCount) * 100, 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{month}</span>
        <span className="text-sm text-gray-500">{count} nouveaux</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function StatusCard({ label, count, color, IconComponent }) {
  const colorClasses = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${colorClasses[color]} transition hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
        <IconComponent className="w-10 h-10" />
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [planDistribution, setPlanDistribution] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast, hideToast, success, error: showError } = useToast();

  // Récupérer le token
  const getToken = () => localStorage.getItem("superadmin_token");

  // Vérifier l'authentification
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    const storedAdmin = localStorage.getItem("superadmin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }

    loadData();
  }, [navigate]);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      // Analytics globales
      const statsResponse = await axios.get(
        `${API_URL}/admin/analytics/overview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStats(statsResponse.data.stats);
      setPlanDistribution(statsResponse.data.plan_distribution || []);
      setMonthlyGrowth(statsResponse.data.monthly_growth || []);

      // Liste des tenants (premiers 20)
      await loadTenants();
    } catch (error) {
      console.error("Erreur chargement données:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les tenants avec filtres
  const loadTenants = async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams({
        limit: "20",
        offset: "0",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await axios.get(
        `${API_URL}/admin/tenants?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTenants(response.data.tenants);
    } catch (error) {
      console.error("Erreur chargement tenants:", error);
    }
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("superadmin");
    navigate("/superadmin/login");
  };

  // Suspendre un tenant
  const handleSuspendTenant = async (tenantId) => {
    if (!window.confirm("Voulez-vous vraiment suspendre ce salon ?")) {
      return;
    }

    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/admin/tenants/${tenantId}/suspend`,
        { reason: "Suspension manuelle par SuperAdmin" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      success("Salon suspendu avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur suspension:", error);
      showError("Erreur lors de la suspension");
    }
  };

  // Activer un tenant
  const handleActivateTenant = async (tenantId) => {
    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/admin/tenants/${tenantId}/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      success("Salon réactivé avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur activation:", error);
      showError("Erreur lors de l'activation");
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">SuperAdmin Portal</h1>
                    <p className="text-xs text-purple-200">SalonHub System</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {admin?.first_name} {admin?.last_name}
                </p>
                <p className="text-xs text-purple-200">
                  {admin?.is_super ? "Super Admin" : "Admin"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Salons"
              value={stats.total_tenants}
              IconComponent={BuildingStorefrontIcon}
              color="blue"
            />
            <StatCard
              title="Salons Actifs"
              value={stats.active_tenants}
              IconComponent={CheckCircleIcon}
              color="green"
            />
            <StatCard
              title="En essai"
              value={stats.trial_tenants}
              IconComponent={SparklesIcon}
              color="yellow"
            />
            <StatCard
              title="Nouveaux (30j)"
              value={stats.new_tenants_30d}
              IconComponent={SparklesIcon}
              color="purple"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => navigate("/superadmin/admins")}
            className="bg-white hover:bg-gray-50 rounded-lg shadow p-4 transition flex items-center justify-between group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">SuperAdmins</p>
                <p className="text-sm text-gray-500">Gérer les admins</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </button>

          <button
            onClick={() => navigate("/superadmin/logs")}
            className="bg-white hover:bg-gray-50 rounded-lg shadow p-4 transition flex items-center justify-between group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Logs d'activité</p>
                <p className="text-sm text-gray-500">Historique des actions</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </button>

          <button
            onClick={() => navigate("/superadmin/users")}
            className="bg-white hover:bg-gray-50 rounded-lg shadow p-4 transition flex items-center justify-between group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <UsersIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Utilisateurs</p>
                <p className="text-sm text-gray-500">Voir tous les users</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </button>

          <button
            onClick={() => navigate("/superadmin/password-resets")}
            className="bg-white hover:bg-gray-50 rounded-lg shadow p-4 transition flex items-center justify-between group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                <KeyIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Mots de passe</p>
                <p className="text-sm text-gray-500">Réinitialisations</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </button>

          <button
            onClick={() => setActiveTab("tenants")}
            className="bg-white hover:bg-gray-50 rounded-lg shadow p-4 transition flex items-center justify-between group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <BuildingStorefrontIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Tous les salons</p>
                <p className="text-sm text-gray-500">Voir la liste complète</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "overview"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab("tenants")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "tenants"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Salons
              </button>
            </nav>
          </div>
        </div>

        {/* Tenants List */}
        {activeTab === "tenants" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Gestion des Salons
                </h2>
                <div className="text-sm text-gray-500">
                  {tenants.length} salon(s)
                </div>
              </div>

              {/* Filtres et recherche */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadTenants();
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="trial">Essai</option>
                  <option value="suspended">Suspendu</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <button
                  onClick={loadTenants}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Rechercher
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            /{tenant.slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {tenant.subscription_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={tenant.subscription_status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {tenant.total_users} users
                          </div>
                          <div className="flex items-center">
                            <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                            {tenant.total_appointments} RDV
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {tenant.subscription_status === "suspended" ? (
                          <button
                            onClick={() => handleActivateTenant(tenant.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Activer
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendTenant(tenant.id)}
                            className="text-red-600 hover:text-red-900 mr-3"
                          >
                            Suspendre
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/superadmin/tenants/${tenant.id}`)
                          }
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* Statistiques globales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Statistiques globales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_users}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_clients}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total RDV</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_appointments}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">RDV Complétés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed_appointments}
                  </p>
                </div>
              </div>
            </div>

            {/* Répartition par plan */}
            {planDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Répartition par plan d'abonnement
                </h3>
                <div className="space-y-3">
                  {planDistribution.map((plan) => (
                    <PlanBar
                      key={plan.subscription_plan}
                      plan={plan.subscription_plan}
                      count={plan.count}
                      total={stats.total_tenants}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Croissance mensuelle */}
            {monthlyGrowth.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Nouveaux salons (12 derniers mois)
                </h3>
                <div className="space-y-2">
                  {monthlyGrowth.slice(0, 6).map((month) => (
                    <MonthBar
                      key={month.month}
                      month={month.month}
                      count={month.new_tenants}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Statuts d'abonnement */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Répartition par statut
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatusCard
                  label="Actifs"
                  count={stats.active_tenants}
                  color="green"
                  IconComponent={CheckCircleIcon}
                />
                <StatusCard
                  label="Essai"
                  count={stats.trial_tenants}
                  color="blue"
                  IconComponent={SparklesIcon}
                />
                <StatusCard
                  label="Suspendus"
                  count={stats.suspended_tenants || 0}
                  color="red"
                  IconComponent={PauseCircleIcon}
                />
                <StatusCard
                  label="Nouveaux (30j)"
                  count={stats.new_tenants_30d}
                  color="purple"
                  IconComponent={ChartBarIcon}
                />
              </div>
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
    </div>
  );
}

export default SuperAdminDashboard;
