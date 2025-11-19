/**
 * SALONHUB - Logs d'activité SuperAdmin
 * Historique des actions des administrateurs système
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  PauseCircleIcon,
  CheckCircleIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function ActivityLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    super_admin_id: "",
  });
  const { toast, hideToast, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    loadLogs();
  }, [navigate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
      });

      if (filters.action) {
        params.append("action", filters.action);
      }

      if (filters.super_admin_id) {
        params.append("super_admin_id", filters.super_admin_id);
      }

      const response = await axios.get(
        `${API_URL}/admin/activity-logs?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLogs(response.data.logs);
    } catch (error) {
      console.error("Erreur chargement logs:", error);
      if (error.response?.status === 403) {
        showError("Accès refusé");
        navigate("/superadmin/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    loadLogs();
  };

  const getActionBadge = (action) => {
    const badges = {
      login: { color: "bg-blue-100 text-blue-800", Icon: LockClosedIcon, label: "Connexion" },
      logout: { color: "bg-gray-100 text-gray-800", Icon: ArrowRightOnRectangleIcon, label: "Déconnexion" },
      tenant_suspended: { color: "bg-orange-100 text-orange-800", Icon: PauseCircleIcon, label: "Suspension tenant" },
      tenant_activated: { color: "bg-green-100 text-green-800", Icon: CheckCircleIcon, label: "Activation tenant" },
      tenant_deleted: { color: "bg-red-100 text-red-800", Icon: TrashIcon, label: "Suppression tenant" },
      superadmin_created: { color: "bg-purple-100 text-purple-800", Icon: ShieldCheckIcon, label: "Création SuperAdmin" },
    };

    const badge = badges[action] || { color: "bg-gray-100 text-gray-800", Icon: ClipboardDocumentListIcon, label: action };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.color} inline-flex items-center`}>
        <badge.Icon className="w-4 h-4 mr-1" />
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
              <h1 className="text-xl font-bold">Logs d'Activité</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Actions</p>
                <p className="text-3xl font-bold mt-1">{logs.length}</p>
              </div>
              <ChartBarIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Aujourd'hui</p>
                <p className="text-3xl font-bold mt-1">
                  {logs.filter(log => {
                    const logDate = new Date(log.created_at);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <CalendarIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Dernière heure</p>
                <p className="text-3xl font-bold mt-1">
                  {logs.filter(log => {
                    const logTime = new Date(log.created_at).getTime();
                    const oneHourAgo = Date.now() - 60 * 60 * 1000;
                    return logTime > oneHourAgo;
                  }).length}
                </p>
              </div>
              <ClockIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Toutes les actions</option>
                <option value="login">Connexion</option>
                <option value="logout">Déconnexion</option>
                <option value="tenant_suspended">Suspension tenant</option>
                <option value="tenant_activated">Activation tenant</option>
                <option value="tenant_deleted">Suppression tenant</option>
                <option value="superadmin_created">Création SuperAdmin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID SuperAdmin
              </label>
              <input
                type="text"
                value={filters.super_admin_id}
                onChange={(e) =>
                  handleFilterChange("super_admin_id", e.target.value)
                }
                placeholder="Filtrer par ID admin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Historique des actions ({logs.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Aucun log trouvé
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(log.created_at).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleTimeString("fr-FR")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-xs font-semibold">
                              {log.admin_first_name?.[0]}
                              {log.admin_last_name?.[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.admin_first_name} {log.admin_last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.admin_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {log.description || "N/A"}
                        </div>
                        {log.resource_type && (
                          <div className="text-xs text-gray-500 mt-1">
                            Resource: {log.resource_type}
                            {log.resource_id && ` #${log.resource_id}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || "N/A"}
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
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                À propos des logs d'activité
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Tous les logs sont conservés indéfiniment pour des raisons
                d'audit et de sécurité. Les logs incluent l'adresse IP, le
                timestamp exact et les métadonnées associées à chaque action.
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

export default ActivityLogs;
