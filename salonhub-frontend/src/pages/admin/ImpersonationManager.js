/**
 * SALONHUB - Impersonation Manager
 * Gestion de l'impersonation (SuperAdmin)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  UserIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function ImpersonationManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    loadActiveSessions();
  }, [navigate]);

  const loadActiveSessions = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/impersonate/active-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveSessions(response.data.active_sessions || []);
    } catch (error) {
      console.error("Erreur chargement sessions:", error);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      showError("Veuillez entrer au moins 2 caractères");
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/admin/users?search=${encodeURIComponent(searchTerm)}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Erreur recherche:", error);
      showError("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonateClick = (user) => {
    setSelectedUser(user);
    setReason("");
    setShowReasonModal(true);
  };

  const startImpersonation = async () => {
    if (!reason || reason.trim().length < 10) {
      showError("Veuillez entrer une raison détaillée (minimum 10 caractères)");
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/admin/impersonate/${selectedUser.id}`,
        { reason: reason.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Save the SuperAdmin token so we can restore it later
      const superAdminToken = localStorage.getItem("superadmin_token");
      if (superAdminToken) {
        localStorage.setItem("original_superadmin_token", superAdminToken);
      }

      // Store impersonation data for banner (separate from auth data)
      localStorage.setItem("impersonation_token", response.data.token);
      localStorage.setItem("impersonation_user", JSON.stringify(response.data.user));

      // CRITICAL: Set auth data that AuthContext expects
      // This allows automatic authentication without credentials
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("tenant", JSON.stringify(response.data.tenant));

      success(`Impersonation démarrée: ${selectedUser.first_name} ${selectedUser.last_name}`);
      setShowReasonModal(false);

      // Redirect to tenant dashboard after a brief delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Erreur impersonation:", error);
      showError(error.response?.data?.error || "Erreur lors de l'impersonation");
    }
  };

  const endSession = async (sessionId) => {
    if (!window.confirm("Terminer cette session d'impersonation ?")) {
      return;
    }

    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/admin/impersonate/exit`,
        { session_id: sessionId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      success("Session terminée avec succès");
      loadActiveSessions();
    } catch (error) {
      console.error("Erreur fin de session:", error);
      showError("Erreur lors de la fin de session");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold">Impersonation Manager</h1>
              <p className="text-sm text-purple-200">Support & troubleshooting</p>
            </div>
            <button
              onClick={() => navigate("/superadmin/dashboard")}
              className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Retour au Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="max-w-7xl mx-auto flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Attention:</strong> L'impersonation vous donne un accès complet au compte utilisateur.
              Toutes les actions sont enregistrées dans les logs d'audit. Utilisez cette fonctionnalité uniquement
              pour le support client légitime.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "search"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Rechercher un utilisateur
              </button>
              <button
                onClick={() => {
                  setActiveTab("active");
                  loadActiveSessions();
                }}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "active"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sessions actives ({activeSessions.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={searchUsers}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? "Recherche..." : "Rechercher"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {users.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        Salon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <BuildingStorefrontIcon className="w-4 h-4 text-gray-400 mr-1" />
                            {user.tenant_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleImpersonateClick(user)}
                            className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
                            Impersonner
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === "active" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {activeSessions.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune session d'impersonation active</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Utilisateur impersonné
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Salon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Démarré
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Raison
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.admin_first_name} {session.admin_last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.user_first_name} {session.user_last_name}
                        </div>
                        <div className="text-sm text-gray-500">{session.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.tenant_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(session.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {session.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => endSession(session.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Terminer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Raison de l'impersonation
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Impersonation de: <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Support client - Problème de connexion signalé par le client..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimum 10 caractères. Cette raison sera enregistrée dans les logs d'audit.
              </p>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowReasonModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={startImpersonation}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Démarrer l'impersonation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

export default ImpersonationManager;
