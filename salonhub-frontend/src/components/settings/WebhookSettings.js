/**
 * Composant Paramètres Webhooks - Gestion des endpoints
 * Visible uniquement pour les plans Developer, Custom et Trial
 */

import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SignalIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// Grouper les événements par catégorie
const EVENT_GROUPS = {
  "Rendez-vous": [
    { value: "appointment.created", label: "Nouveau rendez-vous" },
    { value: "appointment.updated", label: "Rendez-vous modifié" },
    { value: "appointment.cancelled", label: "Rendez-vous annulé" },
    { value: "appointment.completed", label: "Rendez-vous terminé" },
    { value: "appointment.deleted", label: "Rendez-vous supprimé" },
  ],
  Clients: [
    { value: "client.created", label: "Nouveau client" },
    { value: "client.updated", label: "Client modifié" },
    { value: "client.deleted", label: "Client supprimé" },
  ],
  Services: [
    { value: "service.created", label: "Nouveau service" },
    { value: "service.updated", label: "Service modifié" },
    { value: "service.deleted", label: "Service supprimé" },
  ],
};

const WebhookSettings = () => {
  const { tenant } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ count: 0, max: 5 });

  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    description: "",
    events: [],
  });

  // Modal secret (affiché une seule fois)
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  // Modal confirmation suppression
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Logs
  const [expandedWebhook, setExpandedWebhook] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Test
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Plan gating
  const canUseWebhooks =
    tenant?.subscription_plan === "developer" ||
    tenant?.subscription_plan === "custom" ||
    tenant?.subscription_status === "trial";

  // ==========================================
  // Fetch webhooks
  // ==========================================
  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/webhooks");
      if (data.success) {
        setWebhooks(data.data || []);
        setMeta(data.meta || { count: 0, max: 5 });
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Plan insuffisant pour accéder aux webhooks.");
      } else {
        setError("Erreur lors du chargement des webhooks.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canUseWebhooks) {
      fetchWebhooks();
    } else {
      setLoading(false);
    }
  }, [canUseWebhooks, fetchWebhooks]);

  // ==========================================
  // Créer un webhook
  // ==========================================
  const handleCreate = async () => {
    if (!newWebhook.url || !newWebhook.url.startsWith("https://")) {
      setError("L'URL doit commencer par https://");
      return;
    }
    if (newWebhook.events.length === 0) {
      setError("Sélectionnez au moins un événement.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const { data } = await api.post("/webhooks", {
        url: newWebhook.url,
        events: newWebhook.events,
        description: newWebhook.description || undefined,
      });

      if (data.success) {
        // Afficher le secret (une seule fois)
        setRevealedSecret(data.data.secret);
        setShowSecretModal(true);
        setShowCreateModal(false);
        setNewWebhook({ url: "", description: "", events: [] });
        fetchWebhooks();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de la création."
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // Supprimer un webhook
  // ==========================================
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/webhooks/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchWebhooks();
    } catch (err) {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // Toggle actif/inactif
  // ==========================================
  const handleToggle = async (webhook) => {
    try {
      await api.patch(`/webhooks/${webhook.id}`, {
        is_active: !webhook.is_active,
      });
      fetchWebhooks();
    } catch (err) {
      setError("Erreur lors de la modification.");
    }
  };

  // ==========================================
  // Tester un webhook
  // ==========================================
  const handleTest = async (webhookId) => {
    try {
      setTestingId(webhookId);
      setTestResult(null);
      const { data } = await api.post(`/webhooks/${webhookId}/test`);
      setTestResult({
        webhookId,
        success: data.data?.success,
        status: data.data?.status,
        time: data.data?.response_time_ms,
        error: data.data?.error,
      });
    } catch (err) {
      setTestResult({
        webhookId,
        success: false,
        error: err.response?.data?.error || "Erreur lors du test.",
      });
    } finally {
      setTestingId(null);
    }
  };

  // ==========================================
  // Charger les logs
  // ==========================================
  const handleToggleLogs = async (webhookId) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null);
      setLogs([]);
      return;
    }

    try {
      setLogsLoading(true);
      setExpandedWebhook(webhookId);
      const { data } = await api.get(`/webhooks/${webhookId}/logs?limit=10`);
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // ==========================================
  // Régénérer le secret
  // ==========================================
  const handleRegenerateSecret = async (webhookId) => {
    try {
      const { data } = await api.post(
        `/webhooks/${webhookId}/regenerate-secret`
      );
      if (data.success) {
        setRevealedSecret(data.data.secret);
        setShowSecretModal(true);
      }
    } catch (err) {
      setError("Erreur lors de la régénération du secret.");
    }
  };

  // ==========================================
  // Toggle événement dans le formulaire
  // ==========================================
  const toggleEvent = (eventValue) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter((e) => e !== eventValue)
        : [...prev.events, eventValue],
    }));
  };

  const toggleGroupEvents = (group) => {
    const groupEvents = EVENT_GROUPS[group].map((e) => e.value);
    const allSelected = groupEvents.every((e) =>
      newWebhook.events.includes(e)
    );

    setNewWebhook((prev) => ({
      ...prev,
      events: allSelected
        ? prev.events.filter((e) => !groupEvents.includes(e))
        : [...new Set([...prev.events, ...groupEvents])],
    }));
  };

  // ==========================================
  // Copier dans le presse-papier
  // ==========================================
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  // ==========================================
  // Helper: parser les events
  // ==========================================
  const parseEvents = (events) => {
    if (Array.isArray(events)) return events;
    try {
      return JSON.parse(events);
    } catch {
      return [];
    }
  };

  // ==========================================
  // Helper: formater la date relative
  // ==========================================
  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString("fr-FR");
  };

  // ==========================================
  // Plan restriction
  // ==========================================
  if (!canUseWebhooks) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <SignalIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Webhooks non disponibles
        </h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          Les webhooks permettent de notifier automatiquement vos systèmes
          externes lorsque des événements se produisent dans SalonHub. Cette
          fonctionnalité est disponible avec le plan Developer ou Custom.
        </p>
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
          Passer au plan Developer — 14,99€/mois
        </button>
      </div>
    );
  }

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-slate-500">Chargement des webhooks...</span>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <SignalIcon className="h-5 w-5 text-indigo-500 mr-2" />
            Webhooks
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Recevez des notifications HTTP en temps réel quand des événements se
            produisent ({meta.count}/{meta.max})
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setError(null);
          }}
          disabled={meta.count >= meta.max}
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouveau webhook
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 text-xs mt-1 underline"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Liste vide */}
      {webhooks.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <GlobeAltIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-slate-700 mb-2">
            Aucun webhook configuré
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Créez votre premier webhook pour recevoir des notifications en temps
            réel lorsque des rendez-vous, clients ou services changent.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Créer un webhook
          </button>
        </div>
      )}

      {/* Liste des webhooks */}
      {webhooks.length > 0 && (
        <div className="space-y-4">
          {webhooks.map((webhook) => {
            const events = parseEvents(webhook.events);
            const isExpanded = expandedWebhook === webhook.id;
            const currentTestResult =
              testResult?.webhookId === webhook.id ? testResult : null;

            return (
              <div
                key={webhook.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  webhook.is_active
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                {/* En-tête webhook */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* URL */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            webhook.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {webhook.is_active ? "Actif" : "Inactif"}
                        </span>
                        {webhook.failure_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            {webhook.failure_count} échec
                            {webhook.failure_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-mono text-slate-700 truncate">
                        {webhook.url}
                      </p>

                      {webhook.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {webhook.description}
                        </p>
                      )}

                      {/* Événements */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {events.slice(0, 4).map((evt) => (
                          <span
                            key={evt}
                            className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs"
                          >
                            {evt}
                          </span>
                        ))}
                        {events.length > 4 && (
                          <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                            +{events.length - 4} autre
                            {events.length - 4 > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Dernière activité */}
                      <p className="text-xs text-slate-400 mt-2 flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Dernier déclenchement :{" "}
                        {formatRelativeDate(webhook.last_triggered_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(webhook)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          webhook.is_active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={
                          webhook.is_active
                            ? "Désactiver"
                            : "Activer"
                        }
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            webhook.is_active
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      {/* Test */}
                      <button
                        onClick={() => handleTest(webhook.id)}
                        disabled={testingId === webhook.id}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Envoyer un test"
                      >
                        {testingId === webhook.id ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <BoltIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Régénérer secret */}
                      <button
                        onClick={() => handleRegenerateSecret(webhook.id)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Régénérer le secret"
                      >
                        <ShieldCheckIcon className="h-4 w-4" />
                      </button>

                      {/* Logs toggle */}
                      <button
                        onClick={() => handleToggleLogs(webhook.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Voir les logs"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Supprimer */}
                      <button
                        onClick={() => setDeleteTarget(webhook)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Résultat de test */}
                  {currentTestResult && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-sm flex items-center ${
                        currentTestResult.success
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {currentTestResult.success ? (
                        <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      )}
                      <span>
                        {currentTestResult.success
                          ? `Test réussi — HTTP ${currentTestResult.status} en ${currentTestResult.time}ms`
                          : `Échec — ${currentTestResult.error || "Erreur inconnue"}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Logs panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Dernières livraisons
                    </h4>

                    {logsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <ArrowPathIcon className="h-5 w-5 text-slate-400 animate-spin" />
                      </div>
                    ) : logs.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">
                        Aucune livraison pour l'instant.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm border border-slate-100"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {log.status === "success" ? (
                                <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              ) : log.status === "failed" ? (
                                <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                              ) : (
                                <ClockIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              )}
                              <span className="font-mono text-xs text-slate-600 truncate">
                                {log.event}
                              </span>
                              {log.response_status && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    log.response_status < 300
                                      ? "bg-emerald-100 text-emerald-700"
                                      : log.response_status < 500
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {log.response_status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                              {log.response_time_ms && (
                                <span>{log.response_time_ms}ms</span>
                              )}
                              <span>
                                {formatRelativeDate(log.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-700">
          <p className="font-medium mb-1">Comment ça marche ?</p>
          <p className="text-indigo-600">
            SalonHub envoie une requête HTTP POST à votre URL chaque fois qu'un
            événement se produit. Le body contient les données de l'événement et
            l'en-tête <code className="bg-indigo-100 px-1 rounded">X-SalonHub-Signature</code>{" "}
            permet de vérifier l'authenticité via HMAC-SHA256.
          </p>
        </div>
      </div>

      {/* ==========================================
          MODAL - Créer un webhook
          ========================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Header modal */}
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <PlusIcon className="h-5 w-5 text-indigo-500 mr-2" />
                Nouveau webhook
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Configurez un endpoint pour recevoir les événements.
              </p>
            </div>

            {/* Body modal */}
            <div className="p-5 space-y-5">
              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  URL de l'endpoint *
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) =>
                    setNewWebhook((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://votre-serveur.com/webhook"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Doit commencer par https:// pour des raisons de sécurité.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description (optionnelle)
                </label>
                <input
                  type="text"
                  value={newWebhook.description}
                  onChange={(e) =>
                    setNewWebhook((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Synchronisation avec mon CRM"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Événements */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Événements à écouter *
                </label>
                <div className="space-y-4">
                  {Object.entries(EVENT_GROUPS).map(([group, events]) => {
                    const groupEvents = events.map((e) => e.value);
                    const allSelected = groupEvents.every((e) =>
                      newWebhook.events.includes(e)
                    );
                    const someSelected =
                      !allSelected &&
                      groupEvents.some((e) => newWebhook.events.includes(e));

                    return (
                      <div key={group}>
                        {/* En-tête groupe */}
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someSelected;
                            }}
                            onChange={() => toggleGroupEvents(group)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {group}
                          </span>
                        </label>

                        {/* Liste événements */}
                        <div className="ml-6 grid grid-cols-1 gap-1.5">
                          {events.map((evt) => (
                            <label
                              key={evt.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={newWebhook.events.includes(evt.value)}
                                onChange={() => toggleEvent(evt.value)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-slate-600">
                                {evt.label}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                {evt.value}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWebhook({ url: "", description: "", events: [] });
                  setError(null);
                }}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {creating ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Création...
                  </span>
                ) : (
                  "Créer le webhook"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - Secret révélé
          ========================================== */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-amber-500 mr-2" />
                Secret du webhook
              </h3>
            </div>

            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Ce secret ne sera <strong>plus jamais affiché</strong>.
                    Copiez-le maintenant et conservez-le en lieu sûr.
                  </p>
                </div>
              </div>

              <div className="relative">
                <code className="block w-full p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono break-all select-all">
                  {revealedSecret}
                </code>
                <button
                  onClick={() => copyToClipboard(revealedSecret)}
                  className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Copier"
                >
                  {secretCopied ? (
                    <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4 text-slate-300" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Utilisez ce secret pour vérifier la signature{" "}
                <code className="bg-slate-100 px-1 rounded">
                  X-SalonHub-Signature
                </code>{" "}
                de chaque requête reçue.
              </p>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowSecretModal(false);
                  setRevealedSecret("");
                  setSecretCopied(false);
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all"
              >
                J'ai copié le secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - Confirmer suppression
          ========================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                Supprimer ce webhook ?
              </h3>
              <p className="text-sm text-slate-500 text-center">
                Le webhook vers{" "}
                <span className="font-mono text-slate-700">
                  {deleteTarget.url}
                </span>{" "}
                sera définitivement supprimé avec tous ses logs de livraison.
              </p>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookSettings;
