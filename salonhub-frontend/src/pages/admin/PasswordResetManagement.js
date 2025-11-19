/**
 * SALONHUB - Gestion des réinitialisations de mot de passe
 * Interface SuperAdmin pour superviser les demandes de reset password
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  KeyIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  FunnelIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function PasswordResetManagement() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "", // all, active, used, expired
    tenant_id: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
  });
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    loadTokens();
  }, [navigate]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
      });

      if (filters.status) {
        params.append("status", filters.status);
      }

      if (filters.tenant_id) {
        params.append("tenant_id", filters.tenant_id);
      }

      const response = await axios.get(
        `${API_URL}/admin/password-resets?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTokens(response.data.tokens || []);
      calculateStats(response.data.tokens || []);
    } catch (error) {
      console.error("Erreur chargement tokens:", error);
      if (error.response?.status === 403) {
        showError("Accès refusé");
        navigate("/superadmin/dashboard");
      } else {
        showError("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tokensList) => {
    const now = new Date();
    const newStats = {
      total: tokensList.length,
      active: 0,
      used: 0,
      expired: 0,
    };

    tokensList.forEach((token) => {
      if (token.used) {
        newStats.used++;
      } else if (new Date(token.expires_at) < now) {
        newStats.expired++;
      } else {
        newStats.active++;
      }
    });

    setStats(newStats);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    loadTokens();
  };

  const handleCleanExpired = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer tous les tokens expirés et utilisés ?")) {
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/admin/password-resets/cleanup`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      success("Tokens expirés supprimés avec succès");
      loadTokens();
    } catch (error) {
      console.error("Erreur cleanup:", error);
      showError("Erreur lors du nettoyage");
    }
  };

  const getStatusBadge = (token) => {
    const now = new Date();
    const expiresAt = new Date(token.expires_at);

    if (token.used) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 inline-flex items-center">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Utilisé
        </span>
      );
    }

    if (expiresAt < now) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 inline-flex items-center">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Expiré
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 inline-flex items-center">
        <ClockIcon className="w-4 h-4 mr-1" />
        Actif
      </span>
    );
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff < 0) return "Expiré";

    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes < 60) return `${minutes} min restantes`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h restantes`;
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
                <KeyIcon className="w-6 h-6 mr-2" />
                <h1 className="text-xl font-bold">
                  Réinitialisations de mot de passe
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Demandes</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <KeyIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Actifs</p>
                <p className="text-3xl font-bold mt-1">{stats.active}</p>
              </div>
              <ClockIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Utilisés</p>
                <p className="text-3xl font-bold mt-1">{stats.used}</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Expirés</p>
                <p className="text-3xl font-bold mt-1">{stats.expired}</p>
              </div>
              <XCircleIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FunnelIcon className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">
                Filtres et Actions
              </h3>
            </div>
            <button
              onClick={handleCleanExpired}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center text-sm"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Nettoyer les expirés
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actifs uniquement</option>
                <option value="used">Utilisés uniquement</option>
                <option value="expired">Expirés uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Tenant
              </label>
              <input
                type="text"
                value={filters.tenant_id}
                onChange={(e) =>
                  handleFilterChange("tenant_id", e.target.value)
                }
                placeholder="Filtrer par ID tenant"
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

        {/* Tokens Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Liste des demandes ({tokens.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expire le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {token.user_first_name} {token.user_last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <EnvelopeIcon className="w-4 h-4 mr-1" />
                              {token.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {token.tenant_name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {token.tenant_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(token)}
                        {!token.used && new Date(token.expires_at) > new Date() && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimeRemaining(token.expires_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(token.created_at).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(token.created_at).toLocaleTimeString("fr-FR")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(token.expires_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {token.used_at
                          ? new Date(token.used_at).toLocaleString("fr-FR")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {token.ip_address || "N/A"}
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
            <KeyIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                À propos des réinitialisations de mot de passe
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Les tokens de réinitialisation sont valides pendant 1 heure.
                Les tokens expirés et utilisés peuvent être nettoyés
                automatiquement pour maintenir la base de données propre. Tous
                les événements sont enregistrés avec l'adresse IP et le
                user-agent pour des raisons de sécurité.
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

export default PasswordResetManagement;
