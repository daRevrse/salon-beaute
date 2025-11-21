/**
 * Page Clients AMÉLIORÉE
 * Liste, recherche, création, modification et messagerie
 */

import { useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import { useClients } from "../hooks/useClients";
import { usePermissions } from "../contexts/PermissionContext";
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
} from "@heroicons/react/24/outline";

const Clients = () => {
  const {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    fetchClients,
  } = useClients();
  const { can } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [messagingClient, setMessagingClient] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
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
        handleCloseModal();
      } else {
        alert(result.error);
      }
    } else {
      const result = await createClient(formData);
      if (result.success) {
        handleCloseModal();
      } else {
        alert(result.error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      const result = await deleteClient(id);
      if (!result.success) {
        alert(result.error);
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
        // Si un lien WhatsApp est retourné, l'ouvrir dans un nouvel onglet
        if (response.data.data?.whatsapp_link) {
          window.open(response.data.data.whatsapp_link, '_blank');
          alert("Email envoyé ! WhatsApp va s'ouvrir dans un nouvel onglet.");
        } else if (response.data.data?.email_sent) {
          alert("Email envoyé avec succès !");
        } else {
          alert("Message envoyé avec succès !");
        }
        handleCloseMessageModal();
      } else {
        alert(response.data.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
      alert(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray-600">
              Gérez vos clients et communiquez avec eux
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
          >
            + Nouveau client
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Rechercher un client (nom, email, téléphone)..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Liste */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg">Aucun client trouvé</p>
              <p className="text-sm mt-2">
                Commencez par ajouter votre premier client
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  {/* Colonne Actions supprimée */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => {
                      setDetailClient(client);
                      setShowDetailModal(true);
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-700 font-medium">
                            {client.first_name?.charAt(0)}
                            {client.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center">
                        {client.email ? (
                          <>
                            <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {client.email}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {client.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </div>
                    </td>
                    {/* Cellule Actions supprimée */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Édition/Création */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingClient ? "Modifier le client" : "Nouveau client"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[500px] shadow-xl rounded-lg bg-white">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contacter {messagingClient.first_name}{" "}
                    {messagingClient.last_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Envoyez un message personnalisé à votre client
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseMessageModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              {/* Canal d'envoi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal d'envoi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {messagingClient.email && (
                    <button
                      type="button"
                      onClick={() =>
                        setMessageData({ ...messageData, send_via: "email" })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageData.send_via === "email"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email
                    </button>
                  )}
                  {messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() =>
                        setMessageData({ ...messageData, send_via: "sms" })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageData.send_via === "sms"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                      WhatsApp/SMS
                    </button>
                  )}
                  {messagingClient.email && messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() =>
                        setMessageData({ ...messageData, send_via: "both" })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageData.send_via === "both"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Les deux
                    </button>
                  )}
                </div>
              </div>

              {/* Sujet (pour email uniquement) */}
              {(messageData.send_via === "email" ||
                messageData.send_via === "both") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={messageData.subject}
                    onChange={handleMessageChange}
                    placeholder="Message de votre salon"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={messageData.message}
                  onChange={handleMessageChange}
                  placeholder="Saisissez votre message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Info envoi */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  {messageData.send_via === 'email' && (
                    <p>L'email sera envoyé immédiatement au client.</p>
                  )}
                  {messageData.send_via === 'sms' && (
                    <p>WhatsApp s'ouvrira dans un nouvel onglet avec le message pré-rempli.</p>
                  )}
                  {messageData.send_via === 'both' && (
                    <p>L'email sera envoyé et WhatsApp s'ouvrira dans un nouvel onglet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseMessageModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 shadow-md inline-flex items-center"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  {sending ? "Envoi..." : "Envoyer le message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historique Client */}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-2xl rounded-xl bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <span className="text-indigo-700 font-bold text-2xl">
                      {detailClient.first_name?.charAt(0)}
                      {detailClient.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      {detailClient.first_name} {detailClient.last_name}
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">
                      Client depuis le{" "}
                      {new Date(detailClient.created_at).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailClient(null);
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Informations de contact */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Informations de contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {detailClient.email || (
                          <span className="text-gray-400 italic">
                            Non renseigné
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Téléphone
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {detailClient.phone || (
                          <span className="text-gray-400 italic">
                            Non renseigné
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {detailClient.notes && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Notes
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {detailClient.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions rapides
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setHistoryClient(detailClient);
                      setShowHistoryModal(true);
                    }}
                    className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-md"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Voir l'historique
                  </button>

                  {(detailClient.email || detailClient.phone) && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenMessageModal(detailClient);
                      }}
                      className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md"
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
                      className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Modifier
                    </button>
                  )}

                  {can.deleteClient && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleDelete(detailClient.id);
                      }}
                      className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md"
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
