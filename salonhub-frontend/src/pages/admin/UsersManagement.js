/**
 * SALONHUB - Gestion des utilisateurs (tous tenants)
 * Interface pour gérer tous les utilisateurs de tous les salons
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [stats, setStats] = useState(null);
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    loadUsers();
    loadStats();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (roleFilter) {
        params.append("role", roleFilter);
      }

      if (tenantFilter) {
        params.append("tenant_id", tenantFilter);
      }

      const response = await axios.get(
        `${API_URL}/admin/users?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Erreur chargement users:", error);
      showError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(response.data.stats);
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  const handleSearch = () => {
    loadUsers();
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: "bg-purple-100 text-purple-800", label: "Admin" },
      manager: { color: "bg-blue-100 text-blue-800", label: "Manager" },
      staff: { color: "bg-green-100 text-green-800", label: "Staff" },
    };

    const badge = badges[role] || badges.staff;

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}
      >
        {badge.label}
      </span>
    );
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/superadmin/dashboard")}
                className="text-white hover:text-gray-200 transition"
              >
                ← Retour
              </button>
              <div className="flex items-center">
                <UsersIcon className="w-6 h-6 mr-2" />
                <h1 className="text-xl font-bold">Gestion des Utilisateurs</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Utilisateurs</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_users}</p>
                </div>
                <UsersIcon className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Utilisateurs affichés</p>
                  <p className="text-3xl font-bold mt-1">{users.length}</p>
                </div>
                <CheckCircleIcon className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Salons</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.total_tenants}
                  </p>
                </div>
                <CheckCircleIcon className="w-12 h-12 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">
              Filtres de recherche
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Rechercher par nom, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center justify-center"
              >
                <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Liste des utilisateurs ({users.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500"
                    >
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
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.tenant_name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tenant ID: {user.tenant_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_active ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            Actif
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircleIcon className="w-5 h-5 mr-1" />
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString(
                              "fr-FR"
                            )
                          : "Jamais"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            navigate(`/superadmin/tenants/${user.tenant_id}`)
                          }
                          className="text-purple-600 hover:text-purple-900 flex items-center justify-end"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Voir salon
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                À propos de la gestion des utilisateurs
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Cette interface vous permet de voir tous les utilisateurs de
                tous les salons. Pour gérer spécifiquement les utilisateurs d'un
                salon, accédez à la page de détails du salon.
              </p>
            </div>
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
    </div>
  );
}

export default UsersManagement;
