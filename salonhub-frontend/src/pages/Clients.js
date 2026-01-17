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
        {/* Header with gradient */}
        <div className="mb-8">
          <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-6 sm:p-8 text-white shadow-soft-xl`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-4">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold">
                    {term.clients}
                  </h1>
                  <p className="text-white/80 mt-1">
                    Gérez vos {term.clients.toLowerCase()} et communiquez avec eux
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center px-5 py-3 bg-white text-slate-800 rounded-xl hover:bg-white/90 transition-all duration-300 font-semibold shadow-soft"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {term.clientAdd}
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={`Rechercher un ${term.client.toLowerCase()} (nom, email, téléphone)...`}
              className={`w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent shadow-soft transition-all duration-300`}
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
              <table className="min-w-full divide-y divide-slate-200">
                <thead className={`${config.lightBg}`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Créé le
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => {
                        setDetailClient(client);
                        setShowDetailModal(true);
                      }}
                      className={`${config.hoverBg} transition-colors cursor-pointer`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full ${config.lightBg} flex items-center justify-center`}>
                            <span className={`${config.darkTextColor} font-semibold`}>
                              {client.first_name?.charAt(0)}
                              {client.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-800">
                              {client.first_name} {client.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 flex items-center">
                          {client.email ? (
                            <>
                              <EnvelopeIcon className="h-4 w-4 mr-2 text-slate-400" />
                              {client.email}
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {client.phone || <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500">
                          {new Date(client.created_at).toLocaleDateString("fr-FR")}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white shadow-soft-2xl rounded-2xl animate-scale-in">
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4 rounded-t-2xl`}>
              <h3 className="text-lg font-display font-semibold text-white">
                {editingClient ? term.clientEdit : term.clientAdd}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all resize-none`}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium shadow-soft hover:shadow-glow disabled:opacity-50 transition-all duration-300`}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white shadow-soft-2xl rounded-2xl animate-scale-in">
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4 rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white mr-3" />
                  <div>
                    <h3 className="text-lg font-display font-semibold text-white">
                      Contacter {messagingClient.first_name} {messagingClient.last_name}
                    </h3>
                    <p className="text-sm text-white/80">
                      Envoyez un message personnalisé
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseMessageModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              {/* Canal d'envoi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Canal d'envoi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {messagingClient.email && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: "email" })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        messageData.send_via === "email"
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-soft`
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email
                    </button>
                  )}
                  {messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: "sms" })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        messageData.send_via === "sms"
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-soft`
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                      WhatsApp
                    </button>
                  )}
                  {messagingClient.email && messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: "both" })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        messageData.send_via === "both"
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-soft`
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Les deux
                    </button>
                  )}
                </div>
              </div>

              {/* Sujet (pour email) */}
              {(messageData.send_via === "email" || messageData.send_via === "both") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Sujet
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={messageData.subject}
                    onChange={handleMessageChange}
                    placeholder={`Message de votre ${config.terminology.establishment.toLowerCase()}`}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all`}
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={messageData.message}
                  onChange={handleMessageChange}
                  placeholder="Saisissez votre message..."
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${config.focusRing} focus:border-transparent transition-all resize-none`}
                ></textarea>
              </div>

              {/* Info envoi */}
              <div className={`${config.lightBg} ${config.lightBorderColor} border rounded-xl p-4 flex items-start`}>
                <ExclamationCircleIcon className={`h-5 w-5 ${config.textColor} mr-3 flex-shrink-0 mt-0.5`} />
                <div className={`text-sm ${config.darkTextColor}`}>
                  {messageData.send_via === "email" && (
                    <p>L'email sera envoyé immédiatement.</p>
                  )}
                  {messageData.send_via === "sms" && (
                    <p>WhatsApp s'ouvrira dans un nouvel onglet avec le message pré-rempli.</p>
                  )}
                  {messageData.send_via === "both" && (
                    <p>L'email sera envoyé et WhatsApp s'ouvrira dans un nouvel onglet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseMessageModal}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium shadow-soft hover:shadow-glow disabled:opacity-50 transition-all duration-300 inline-flex items-center"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white shadow-soft-2xl rounded-2xl animate-scale-in">
            {/* Header */}
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-6 rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-soft">
                    <span className="text-white font-bold text-2xl">
                      {detailClient.first_name?.charAt(0)}
                      {detailClient.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-display font-bold text-white">
                      {detailClient.first_name} {detailClient.last_name}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      {term.client} depuis le{" "}
                      {new Date(detailClient.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailClient(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Contact Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <UserCircleIcon className={`h-5 w-5 mr-2 ${config.textColor}`} />
                  Informations de contact
                </h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${config.lightBg} p-4 rounded-xl`}>
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Email</p>
                      <p className="text-sm text-slate-800 mt-1">
                        {detailClient.email || (
                          <span className="text-slate-400 italic">Non renseigné</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Téléphone</p>
                      <p className="text-sm text-slate-800 mt-1">
                        {detailClient.phone || (
                          <span className="text-slate-400 italic">Non renseigné</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {detailClient.notes && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <InformationCircleIcon className={`h-5 w-5 mr-2 ${config.textColor}`} />
                    Notes
                  </h4>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {detailClient.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">
                  Actions rapides
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setHistoryClient(detailClient);
                      setShowHistoryModal(true);
                    }}
                    className={`flex items-center justify-center px-4 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-glow transition-all duration-300 font-medium`}
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    {term.clientHistory}
                  </button>

                  {(detailClient.email || detailClient.phone) && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenMessageModal(detailClient);
                      }}
                      className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      Contacter
                    </button>
                  )}

                  {can.editClient && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenModal(detailClient);
                      }}
                      className="flex items-center justify-center px-4 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-300 font-medium"
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Modifier
                    </button>
                  )}

                  {can.deleteClient && (
                    <button
                      onClick={() => initiateDelete(detailClient.id)}
                      className="flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 font-medium"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Supprimer
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
