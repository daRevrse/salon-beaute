/**
 * Page Clients - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 */

import { useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import { useClients } from "../hooks/useClients";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../contexts/PermissionContext";
import { getBusinessTypeConfig } from "../utils/businessTypeConfig";
import ClientHistory from "../components/clients/ClientHistory";
import api from "../services/api";
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  UserCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { useToast } from "../hooks/useToast";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";

const Clients = () => {
  const { tenant } = useAuth();
  const {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    fetchClients,
  } = useClients();
  const { can } = usePermissions();

  // Business type configuration
  const businessType = tenant?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  // Hook toast
  const { toast, success, error, info, hideToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [messagingClient, setMessagingClient] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);

  // État pour confirmation suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [messageData, setMessageData] = useState({
    subject: "",
    message: "",
    send_via: "email",
  });

  const [sending, setSending] = useState(false);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchClients(query);
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email || "",
        phone: client.phone || "",
        notes: client.notes || "",
      });
    } else {
      setEditingClient(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        notes: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      notes: "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingClient) {
      const result = await updateClient(editingClient.id, formData);
      if (result.success) {
        success(`${term.client} modifié avec succès`);
        handleCloseModal();
        if (detailClient && detailClient.id === editingClient.id) {
          setDetailClient({ ...detailClient, ...formData });
        }
      } else {
        error(result.error || "Erreur lors de la modification");
      }
    } else {
      const result = await createClient(formData);
      if (result.success) {
        success(`${term.client} créé avec succès`);
        handleCloseModal();
      } else {
        error(result.error || "Erreur lors de la création");
      }
    }
  };

  // Gestion suppression
  const initiateDelete = (id) => {
    setClientToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      const result = await deleteClient(clientToDelete);
      if (result.success) {
        success(`${term.client} supprimé avec succès`);
        setShowDeleteConfirm(false);
        setClientToDelete(null);
        if (showDetailModal) setShowDetailModal(false);
      } else {
        error(result.error || "Erreur lors de la suppression");
      }
    }
  };

  const handleOpenMessageModal = (client) => {
    setMessagingClient(client);
    setMessageData({
      subject: "",
      message: "",
      send_via:
        client.email && client.phone ? "both" : client.email ? "email" : "sms",
    });
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessagingClient(null);
    setMessageData({
      subject: "",
      message: "",
      send_via: "email",
    });
  };

  const handleMessageChange = (e) => {
    setMessageData({
      ...messageData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await api.post("/notifications/send", {
        client_id: messagingClient.id,
        type: "manual",
        subject: messageData.subject || null,
        message: messageData.message,
        send_via: messageData.send_via,
      });

      if (response.data.success) {
        if (response.data.data?.whatsapp_link) {
          window.open(response.data.data.whatsapp_link, "_blank");
          info("WhatsApp va s'ouvrir dans un nouvel onglet", 5000);
        } else {
          success("Message envoyé avec succès !");
        }
        handleCloseMessageModal();
      } else {
        error(response.data.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
      error(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Toast Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {/* Modale Confirmation Suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={`Supprimer le ${term.client.toLowerCase()}`}
        message={`Êtes-vous sûr de vouloir supprimer ce ${term.client.toLowerCase()} ? Son historique sera également supprimé.`}
        confirmText="Supprimer définitivement"
        type="danger"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-soft-lg`}>
                <UsersIcon className="h-7 w-7 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                {term.clients}
              </h1>
            </div>
            <p className="text-slate-500 max-w-lg">
              Gérez votre base de {term.clients.toLowerCase()} et maintenez une relation privilégiée avec eux.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className={`inline-flex items-center px-6 py-3.5 bg-gradient-to-r ${config.gradient} text-white font-bold rounded-2xl shadow-soft hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {term.clientAdd}
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8">
          <div className="relative group">
            <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:${config.textColor} transition-colors`} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={`Rechercher un ${term.client.toLowerCase()} par nom, email ou téléphone...`}
              className="input-premium input-premium-icon !rounded-2xl shadow-soft"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white shadow-soft-xl rounded-2xl overflow-hidden border border-slate-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${config.borderColor} mx-auto`}></div>
              <p className="mt-4 text-slate-600">Chargement...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`mx-auto w-16 h-16 ${config.lightBg} rounded-2xl flex items-center justify-center mb-4`}>
                <UsersIcon className={`h-8 w-8 ${config.textColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{term.noClients}</h3>
              <p className="text-slate-500 mb-6">
                Commencez par ajouter votre premier {term.client.toLowerCase()}
              </p>
              <button
                onClick={() => handleOpenModal()}
                className={`px-6 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300`}
              >
                {term.clientAdd}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Coordonnées
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Inscrit le
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => {
                        setDetailClient(client);
                        setShowDetailModal(true);
                      }}
                      className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-11 w-11 rounded-2xl ${config.lightBg} flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100`}>
                            <span className={`${config.darkTextColor} font-bold text-base`}>
                              {client.first_name?.charAt(0)}
                              {client.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                              {client.first_name} {client.last_name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              ID: #{client.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {client.email && (
                            <div className="text-sm text-slate-600 flex items-center">
                              <EnvelopeIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="text-sm text-slate-600 flex items-center">
                              <PhoneIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                              {client.phone}
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-xs text-slate-400 italic">Aucune coordonnée</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {new Date(client.created_at).toLocaleDateString("fr-FR", {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(client);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              initiateDelete(client.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Création/Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white shadow-soft-2xl rounded-3xl animate-scale-in overflow-hidden border border-slate-100">
            <div className={`bg-gradient-to-r ${config.gradient} px-8 py-6 flex items-center justify-between`}>
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                {editingClient ? term.clientEdit : term.clientAdd}
              </h3>
              <button onClick={handleCloseModal} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-premium">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input-premium !rounded-2xl"
                    placeholder="ex: Marie"
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-premium">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input-premium !rounded-2xl"
                    placeholder="ex: Durand"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-premium">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-premium input-premium-icon !rounded-2xl"
                    placeholder="marie.durand@exemple.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-premium">
                  Téléphone
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-premium input-premium-icon !rounded-2xl"
                    placeholder="+33 6 ..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-premium">
                  Notes privées
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input-premium !rounded-2xl resize-none"
                  placeholder="Informations importantes sur ce client..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border-2 border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-2xl font-bold shadow-soft hover:shadow-glow disabled:opacity-50 transition-all duration-300`}
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Messagerie */}
      {showMessageModal && messagingClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white shadow-soft-2xl rounded-3xl animate-scale-in overflow-hidden border border-slate-100">
            <div className={`bg-gradient-to-r ${config.gradient} px-8 py-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl mr-4">
                     <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                      Message
                    </h3>
                    <p className="text-sm text-white/80 font-medium">
                      À {messagingClient.first_name} {messagingClient.last_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseMessageModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-7 w-7" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-8 space-y-6">
              {/* Canal d'envoi */}
              <div>
                <label className="label-premium mb-3">
                  Canal d'envoi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {messagingClient.email && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: "email" })}
                      className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                        messageData.send_via === "email"
                          ? `border-violet-500 bg-violet-50 text-violet-600 shadow-sm`
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-200"
                      }`}
                    >
                      <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                      Email
                    </button>
                  )}
                  {messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: "sms" })}
                      className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                        messageData.send_via === "sms"
                          ? `border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm`
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-200"
                      }`}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" />
                      WhatsApp
                    </button>
                  )}
                  {messagingClient.email && messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: "both" })}
                      className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                        messageData.send_via === "both"
                          ? `border-slate-800 bg-slate-800 text-white shadow-soft`
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-200"
                      }`}
                    >
                      Les deux
                    </button>
                  )}
                </div>
              </div>

              {/* Sujet (pour email) */}
              {(messageData.send_via === "email" || messageData.send_via === "both") && (
                <div className="space-y-2 animate-fade-in">
                  <label className="label-premium">
                    Sujet de l'email
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={messageData.subject}
                    onChange={handleMessageChange}
                    placeholder={`Message de votre ${config.terminology.establishment.toLowerCase()}`}
                    className="input-premium !rounded-2xl"
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <label className="label-premium">
                  Message personnalisé <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={messageData.message}
                  onChange={handleMessageChange}
                  placeholder="Saisissez votre message ici..."
                  className="input-premium !rounded-2xl resize-none"
                ></textarea>
              </div>

              {/* Info envoi */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${config.lightBg}`}>
                  <ExclamationCircleIcon className={`h-5 w-5 ${config.textColor}`} />
                </div>
                <div className="text-xs text-slate-600 leading-relaxed pt-0.5">
                  {messageData.send_via === "email" && (
                    <p>L'email sera envoyé immédiatement via notre serveur sécurisé.</p>
                  )}
                  {messageData.send_via === "sms" && (
                    <p>WhatsApp s'ouvrira dans un nouvel onglet avec votre message prêt à être envoyé.</p>
                  )}
                  {messageData.send_via === "both" && (
                    <p>L'email sera envoyé automatiquement et WhatsApp s'ouvrira pour l'envoi mobile.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseMessageModal}
                  className="px-6 py-3 border-2 border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all font-display"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold shadow-soft hover:shadow-glow disabled:opacity-50 transition-all duration-300 inline-flex items-center font-display"
                >
                   {sending ? (
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  )}
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showHistoryModal && historyClient && (
        <ClientHistory
          client={historyClient}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryClient(null);
          }}
        />
      )}

      {/* Modal Détails Client */}
      {showDetailModal && detailClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white shadow-soft-2xl rounded-3xl animate-scale-in overflow-hidden border border-slate-100">
            {/* Header */}
            <div className={`bg-gradient-to-r ${config.gradient} px-8 py-8 flex items-center justify-between`}>
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-soft border border-white/30">
                  <span className="text-white font-bold text-3xl">
                    {detailClient.first_name?.charAt(0)}
                    {detailClient.last_name?.charAt(0)}
                  </span>
                </div>
                <div className="ml-6">
                  <h3 className="text-3xl font-display font-bold text-white tracking-tight">
                    {detailClient.first_name} {detailClient.last_name}
                  </h3>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wider">
                      ID: #{detailClient.id}
                    </span>
                    <span className="text-white/80 text-sm font-medium">
                      Membre depuis {new Date(detailClient.created_at).toLocaleDateString("fr-FR", { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailClient(null);
                }}
                className="p-2 text-white/80 hover:text-white transition-colors self-start"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info Card */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-900 border-l-4 border-violet-500 pl-3">
                    Coordonnées
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <EnvelopeIcon className={`h-5 w-5 ${config.textColor}`} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Email</p>
                        <p className="text-sm text-slate-800 font-semibold truncate hover:text-violet-600 transition-colors cursor-pointer">
                          {detailClient.email || <span className="text-slate-400 italic font-normal">Non renseigné</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <PhoneIcon className={`h-5 w-5 ${config.textColor}`} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Téléphone</p>
                        <p className="text-sm text-slate-800 font-semibold truncate">
                          {detailClient.phone || <span className="text-slate-400 italic font-normal">Non renseigné</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes/Bio Card */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-900 border-l-4 border-emerald-500 pl-3">
                    Notes privées
                  </h4>
                  <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 h-full min-h-[120px]">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                      {detailClient.notes || "Aucune note particulière sur ce client."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <h4 className="text-base font-bold text-slate-900 mb-5 text-center">Actions rapides</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setHistoryClient(detailClient);
                      setShowHistoryModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-slate-200 rounded-2xl transition-all group"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                       <ClockIcon className={`h-6 w-6 ${config.textColor}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{term.clientHistory}</span>
                  </button>

                  <button
                    disabled={!detailClient.email && !detailClient.phone}
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenMessageModal(detailClient);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-slate-200 rounded-2xl transition-all group disabled:opacity-40"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                       <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contacter</span>
                  </button>

                  {can.editClient && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenModal(detailClient);
                      }}
                      className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-slate-200 rounded-2xl transition-all group"
                    >
                      <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                         <PencilIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Modifier</span>
                    </button>
                  )}

                  {can.deleteClient && (
                    <button
                      onClick={() => initiateDelete(detailClient.id)}
                      className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-white border-2 border-transparent hover:border-red-100 rounded-2xl transition-all group"
                    >
                      <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                         <TrashIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Clients;
