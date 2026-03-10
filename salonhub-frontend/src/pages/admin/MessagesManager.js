/**
 * SALONHUB - Messages Manager
 * Gestion des messages individuels aux tenants (SuperAdmin)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function MessagesManager() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [form, setForm] = useState({
    tenant_id: "",
    tenant_name: "",
    subject: "",
    content: "",
    send_email: true,
  });
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    loadMessages();
    loadTenants();
  }, [navigate]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/messages", authHeaders());
      setMessages(response.data.messages || response.data || []);
    } catch (err) {
      console.error("Erreur chargement messages:", err);
      if (err.response?.status === 403) {
        showError("Acces refuse");
        navigate("/superadmin/dashboard");
      } else {
        showError("Erreur lors du chargement des messages");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await api.get("/admin/tenants?limit=100", authHeaders());
      setTenants(response.data.tenants || response.data || []);
    } catch (err) {
      console.error("Erreur chargement tenants:", err);
    }
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectTenant = (tenant) => {
    setForm((prev) => ({
      ...prev,
      tenant_id: tenant.id,
      tenant_name: tenant.business_name || tenant.name || `Tenant #${tenant.id}`,
    }));
    setTenantSearch(tenant.business_name || tenant.name || `Tenant #${tenant.id}`);
    setShowTenantDropdown(false);
  };

  const filteredTenants = tenants.filter((t) => {
    const name = (t.business_name || t.name || "").toLowerCase();
    const slug = (t.slug || "").toLowerCase();
    const search = tenantSearch.toLowerCase();
    return name.includes(search) || slug.includes(search);
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!form.tenant_id) {
      showError("Veuillez selectionner un tenant");
      return;
    }
    if (!form.subject.trim()) {
      showError("Le sujet est requis");
      return;
    }
    if (!form.content.trim()) {
      showError("Le contenu est requis");
      return;
    }

    try {
      setSending(true);
      await api.post(
        "/admin/messages",
        {
          tenant_id: form.tenant_id,
          subject: form.subject.trim(),
          content: form.content.trim(),
          send_email: form.send_email,
        },
        authHeaders()
      );

      success("Message envoye avec succes");
      setForm({
        tenant_id: "",
        tenant_name: "",
        subject: "",
        content: "",
        send_email: true,
      });
      setTenantSearch("");
      setShowForm(false);
      loadMessages();
    } catch (err) {
      console.error("Erreur envoi message:", err);
      showError(
        err.response?.data?.error || "Erreur lors de l'envoi du message"
      );
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setForm({
      tenant_id: "",
      tenant_name: "",
      subject: "",
      content: "",
      send_email: true,
    });
    setTenantSearch("");
    setShowForm(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
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
          <p className="text-gray-600">Chargement des messages...</p>
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
              <button
                onClick={() => navigate("/superadmin/dashboard")}
                className="text-white hover:text-indigo-200 transition text-sm font-medium"
              >
                &larr; Retour au dashboard
              </button>
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2" />
                <h1 className="text-xl font-bold">Gestion des Messages</h1>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition shadow"
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Nouveau message
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Message Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg mb-8 border border-indigo-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                Envoyer un nouveau message
              </h2>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-5">
              {/* Tenant Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant destinataire <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={(e) => {
                    setTenantSearch(e.target.value);
                    setShowTenantDropdown(true);
                    if (!e.target.value) {
                      handleFormChange("tenant_id", "");
                      handleFormChange("tenant_name", "");
                    }
                  }}
                  onFocus={() => setShowTenantDropdown(true)}
                  placeholder="Rechercher un tenant par nom ou slug..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {form.tenant_id && (
                  <span className="absolute right-3 top-9 text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                    ID: {form.tenant_id}
                  </span>
                )}
                {showTenantDropdown && tenantSearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredTenants.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Aucun tenant trouve
                      </div>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() => selectTenant(tenant)}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition flex items-center justify-between border-b border-gray-100 last:border-b-0"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.business_name || tenant.name || `Tenant #${tenant.id}`}
                            </div>
                            {tenant.slug && (
                              <div className="text-xs text-gray-500">
                                {tenant.slug}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            #{tenant.id}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => handleFormChange("subject", e.target.value)}
                  placeholder="Sujet du message..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => handleFormChange("content", e.target.value)}
                  placeholder="Redigez votre message..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                />
              </div>

              {/* Send Email Toggle */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.send_email}
                    onChange={(e) =>
                      handleFormChange("send_email", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <div className="flex items-center text-sm text-gray-700">
                  <EnvelopeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                  Envoyer egalement par email
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  {sending ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Messages List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Messages envoyes ({messages.length})
            </h2>
            <button
              onClick={loadMessages}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              Actualiser
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-16">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Aucun message envoye
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Cliquez sur "Nouveau message" pour envoyer votre premier message
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sujet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
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
                  {messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <EnvelopeIcon className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {msg.subject}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5 line-clamp-1 max-w-xs">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {msg.tenant_name || msg.tenant_business_name || `Tenant #${msg.tenant_id}`}
                        </div>
                        {msg.tenant_slug && (
                          <div className="text-xs text-gray-500">
                            {msg.tenant_slug}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {msg.read || msg.is_read ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Lu
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Non lu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(msg.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {msg.admin_name ||
                            msg.admin_first_name
                              ? `${msg.admin_first_name || ""} ${msg.admin_last_name || ""}`.trim()
                              : "Admin"}
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

      {/* Click outside to close tenant dropdown */}
      {showTenantDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowTenantDropdown(false)}
        />
      )}

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

export default MessagesManager;
