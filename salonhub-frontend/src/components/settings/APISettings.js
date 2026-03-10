/**
 * Composant Paramètres API - Gestion des clés API
 * Visible uniquement pour les plans Developer, Custom et Trial
 */

import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const AVAILABLE_SCOPES = [
  { value: "clients:read", label: "Clients (lecture)", group: "Clients" },
  { value: "clients:write", label: "Clients (écriture)", group: "Clients" },
  { value: "services:read", label: "Services (lecture)", group: "Services" },
  { value: "services:write", label: "Services (écriture)", group: "Services" },
  {
    value: "appointments:read",
    label: "Rendez-vous (lecture)",
    group: "Rendez-vous",
  },
  {
    value: "appointments:write",
    label: "Rendez-vous (écriture)",
    group: "Rendez-vous",
  },
  {
    value: "settings:read",
    label: "Paramètres (lecture)",
    group: "Paramètres",
  },
  {
    value: "settings:write",
    label: "Paramètres (écriture)",
    group: "Paramètres",
  },
  { value: "public:read", label: "Données publiques", group: "Public" },
];

const APISettings = () => {
  const { tenant } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState([
    "clients:read",
    "services:read",
    "appointments:read",
    "public:read",
  ]);
  const [newKeyExpiry, setNewKeyExpiry] = useState("");

  // Modal clé créée (affichage unique)
  const [showKeyRevealModal, setShowKeyRevealModal] = useState(false);
  const [revealedKey, setRevealedKey] = useState("");
  const [keyCopied, setKeyCopied] = useState(false);

  // Modal confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api-keys");
      if (response.data.success) {
        setApiKeys(response.data.data);
      }
    } catch (err) {
      console.error("Erreur fetch API keys:", err);
      setError("Impossible de charger les clés API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Créer une clé
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const payload = {
        name: newKeyName.trim(),
        scopes: newKeyScopes,
      };

      if (newKeyExpiry) {
        payload.expires_at = newKeyExpiry;
      }

      const response = await api.post("/api-keys", payload);

      if (response.data.success) {
        setRevealedKey(response.data.data.key);
        setShowCreateModal(false);
        setShowKeyRevealModal(true);
        setNewKeyName("");
        setNewKeyScopes([
          "clients:read",
          "services:read",
          "appointments:read",
          "public:read",
        ]);
        setNewKeyExpiry("");
        await fetchApiKeys();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de la création"
      );
    } finally {
      setCreating(false);
    }
  };

  // Toggle actif/inactif
  const handleToggle = async (keyId, currentStatus) => {
    try {
      await api.patch(`/api-keys/${keyId}`, {
        is_active: !currentStatus,
      });
      await fetchApiKeys();
    } catch (err) {
      setError("Erreur lors de la modification");
    }
  };

  // Supprimer une clé
  const handleDelete = async () => {
    if (!keyToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/api-keys/${keyToDelete.id}`);
      setShowDeleteModal(false);
      setKeyToDelete(null);
      await fetchApiKeys();
    } catch (err) {
      setError("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Copier la clé
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(revealedKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 3000);
    } catch {
      // Fallback pour les navigateurs sans clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = revealedKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 3000);
    }
  };

  // Toggle scope
  const toggleScope = (scope) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  // Sélectionner tous les scopes
  const selectAllScopes = () => {
    setNewKeyScopes(AVAILABLE_SCOPES.map((s) => s.value));
  };

  // Désélectionner tous les scopes
  const deselectAllScopes = () => {
    setNewKeyScopes([]);
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Vérifier le plan
  const planAllowed =
    tenant?.subscription_plan === "developer" ||
    tenant?.subscription_plan === "custom" ||
    tenant?.subscription_status === "trial";

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Plan non autorisé
  if (!planAllowed) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border border-indigo-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <CodeBracketIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Accès API Developer
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Intégrez SalonHub à vos applications avec notre API REST. Créez
            jusqu'à 5 clés API avec des scopes granulaires et un rate limit de
            5 000 req/jour.
          </p>
          <div className="bg-white rounded-lg border border-indigo-200 p-4 mb-6 max-w-sm mx-auto">
            <p className="text-2xl font-bold text-indigo-600">
              14,99€
              <span className="text-sm font-normal text-slate-500">/mois</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">Plan Developer</p>
          </div>
          <button
            onClick={() =>
              (window.location.href = "/settings?tab=billing")
            }
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Passer au plan Developer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Header + Bouton créer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <KeyIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Clés API</h3>
            <p className="text-sm text-gray-500">
              {apiKeys.length}/5 clés utilisées
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchApiKeys}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={apiKeys.length >= 5}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle clé
          </button>
        </div>
      </div>

      {/* Liste des clés */}
      {apiKeys.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <KeyIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucune clé API
          </h4>
          <p className="text-gray-500 mb-4">
            Créez votre première clé API pour intégrer SalonHub à vos
            applications.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Créer une clé API
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className={`bg-white rounded-lg border p-4 transition-all ${
                key.is_active
                  ? "border-gray-200 hover:border-indigo-200"
                  : "border-gray-200 bg-gray-50 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {key.name}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        key.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {key.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 font-mono mb-2">
                    {key.key_prefix}••••••••••••
                  </p>

                  {/* Scopes */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {key.scopes &&
                      (Array.isArray(key.scopes)
                        ? key.scopes
                        : (() => {
                            try {
                              return JSON.parse(key.scopes);
                            } catch {
                              return [];
                            }
                          })()
                      ).map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {scope}
                        </span>
                      ))}
                  </div>

                  {/* Infos */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Créée le {formatDate(key.created_at)}</span>
                    {key.last_used_at && (
                      <span>
                        Dernière utilisation: {formatDate(key.last_used_at)}
                      </span>
                    )}
                    {key.expires_at && (
                      <span
                        className={
                          new Date(key.expires_at) < new Date()
                            ? "text-red-500"
                            : ""
                        }
                      >
                        Expire le {formatDate(key.expires_at)}
                      </span>
                    )}
                    <span>
                      {key.daily_requests || 0}/5000 req aujourd'hui
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleToggle(key.id, key.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      key.is_active
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={key.is_active ? "Désactiver" : "Activer"}
                  >
                    {key.is_active ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setKeyToDelete(key);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Sécurité des clés API
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                • La clé complète n'est affichée{" "}
                <strong>qu'une seule fois</strong> lors de la création
              </p>
              <p>• Les clés sont chiffrées avec bcrypt avant stockage</p>
              <p>• Limite de 5 000 requêtes par jour par clé</p>
              <p>
                • Utilisez des scopes restreints pour limiter l'accès aux
                données
              </p>
              <p>
                • Ne partagez jamais vos clés dans du code public (GitHub,
                etc.)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick start */}
      <div className="bg-slate-900 rounded-lg p-6 text-white">
        <h4 className="text-sm font-semibold mb-3 flex items-center">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-indigo-400" />
          Démarrage rapide
        </h4>
        <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
          <code>{`curl -X GET \\
  ${window.location.origin.replace("3000", "5000")}/api/clients \\
  -H "Authorization: Bearer sk_live_votre_cle_ici" \\
  -H "Content-Type: application/json"`}</code>
        </pre>
      </div>

      {/* ===== MODAL: Créer une clé ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <KeyIcon className="h-5 w-5 mr-2" />
                Nouvelle clé API
              </h3>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom de la clé *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="ex: Mon site web, App mobile..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date d'expiration{" "}
                  <span className="text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="date"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Laissez vide pour une clé sans expiration
                </p>
              </div>

              {/* Scopes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Permissions (scopes) *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllScopes}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-xs text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllScopes}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  {["Clients", "Services", "Rendez-vous", "Paramètres", "Public"].map(
                    (group) => (
                      <div key={group}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          {group}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {AVAILABLE_SCOPES.filter(
                            (s) => s.group === group
                          ).map((scope) => (
                            <label
                              key={scope.value}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs ${
                                newKeyScopes.includes(scope.value)
                                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={newKeyScopes.includes(scope.value)}
                                onChange={() => toggleScope(scope.value)}
                                className="sr-only"
                              />
                              {scope.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {newKeyScopes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                    Sans scope, la clé aura un accès total
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !newKeyName.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium shadow-sm hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {creating ? "Création..." : "Créer la clé"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Clé révélée (affichage unique) ===== */}
      {showKeyRevealModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Clé API créée avec succès
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Avertissement */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Copiez cette clé maintenant
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Elle ne sera plus jamais affichée. Conservez-la en lieu sûr.
                  </p>
                </div>
              </div>

              {/* Clé */}
              <div className="bg-slate-900 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-2">Votre clé API :</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-emerald-400 font-mono flex-1 break-all select-all">
                    {revealedKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                      keyCopied
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                    title="Copier"
                  >
                    {keyCopied ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {keyCopied && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Clé copiée dans le presse-papier !
                  </p>
                )}
              </div>

              {/* Bouton fermer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setShowKeyRevealModal(false);
                    setRevealedKey("");
                    setKeyCopied(false);
                  }}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  J'ai copié ma clé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Confirmer suppression ===== */}
      {showDeleteModal && keyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Supprimer la clé API
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Êtes-vous sûr de vouloir supprimer la clé{" "}
                <strong>"{keyToDelete.name}"</strong> ?
              </p>
              <p className="text-xs text-red-500">
                Toutes les intégrations utilisant cette clé cesseront de
                fonctionner immédiatement.
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setKeyToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
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

export default APISettings;
