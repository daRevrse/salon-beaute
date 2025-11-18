/**
 * SALONHUB - Dashboard SuperAdmin
 * Interface principale de gestion système
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

      // Liste des tenants (premiers 10)
      const tenantsResponse = await axios.get(
        `${API_URL}/admin/tenants?limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTenants(tenantsResponse.data.tenants);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
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

      alert("Salon suspendu avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur suspension:", error);
      alert("Erreur lors de la suspension");
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

      alert("Salon réactivé avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur activation:", error);
      alert("Erreur lors de l'activation");
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
                    <span className="text-white font-bold text-xl">👑</span>
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
              icon="🏪"
              color="blue"
            />
            <StatCard
              title="Salons Actifs"
              value={stats.active_tenants}
              icon="✅"
              color="green"
            />
            <StatCard
              title="En essai"
              value={stats.trial_tenants}
              icon="🆓"
              color="yellow"
            />
            <StatCard
              title="Nouveaux (30j)"
              value={stats.new_tenants_30d}
              icon="🆕"
              color="purple"
            />
          </div>
        )}

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
              <h2 className="text-lg font-bold text-gray-900">
                Derniers salons
              </h2>
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
                          <div>👥 {tenant.total_users} users</div>
                          <div>📋 {tenant.total_appointments} RDV</div>
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
                        <button className="text-purple-600 hover:text-purple-900">
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
          </div>
        )}
      </main>
    </div>
  );
}

// Composant StatCard
function StatCard({ title, value, icon, color }) {
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
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

// Composant StatusBadge
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

export default SuperAdminDashboard;
