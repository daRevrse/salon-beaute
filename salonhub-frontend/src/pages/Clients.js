/**
 * Page Clients AMÉLIORÉE
 * Liste, recherche, création, modification et messagerie
 */

import { useState } from 'react';
import DashboardLayout from '../components/common/DashboardLayout';
import { useClients } from '../hooks/useClients';
import { usePermissions } from '../contexts/PermissionContext';
import ClientHistory from '../components/clients/ClientHistory';
import api from '../services/api';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [messagingClient, setMessagingClient] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [messageData, setMessageData] = useState({
    subject: '',
    message: '',
    send_via: 'email',
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
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      notes: '',
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      const result = await deleteClient(id);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleOpenMessageModal = (client) => {
    setMessagingClient(client);
    setMessageData({
      subject: '',
      message: '',
      send_via: client.email && client.phone ? 'both' : client.email ? 'email' : 'sms',
    });
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessagingClient(null);
    setMessageData({
      subject: '',
      message: '',
      send_via: 'email',
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
      const response = await api.post('/notifications/send', {
        client_id: messagingClient.id,
        type: 'manual',
        subject: messageData.subject || null,
        message: messageData.message,
        send_via: messageData.send_via,
      });

      if (response.data.success) {
        alert('Message envoyé avec succès ! (Simulation)');
        handleCloseMessageModal();
      } else {
        alert(response.data.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error('Erreur envoi message:', err);
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
            <p className="mt-2 text-gray-600">Gérez vos clients et communiquez avec eux</p>
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
              <p className="text-sm mt-2">Commencez par ajouter votre premier client</p>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
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
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {client.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => {
                          setHistoryClient(client);
                          setShowHistoryModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                        title="Voir l'historique"
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Historique
                      </button>
                      {(client.email || client.phone) && (
                        <button
                          onClick={() => handleOpenMessageModal(client)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                          title="Contacter le client"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          Contacter
                        </button>
                      )}
                      {can.editClient && (
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Modifier
                        </button>
                      )}
                      {can.deleteClient && (
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
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
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
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
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
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
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
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
                    Contacter {messagingClient.first_name} {messagingClient.last_name}
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
                      onClick={() => setMessageData({ ...messageData, send_via: 'email' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageData.send_via === 'email'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email
                    </button>
                  )}
                  {messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: 'sms' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageData.send_via === 'sms'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                      WhatsApp/SMS
                    </button>
                  )}
                  {messagingClient.email && messagingClient.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageData({ ...messageData, send_via: 'both' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageData.send_via === 'both'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Les deux
                    </button>
                  )}
                </div>
              </div>

              {/* Sujet (pour email uniquement) */}
              {(messageData.send_via === 'email' || messageData.send_via === 'both') && (
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📧 L'email sera envoyé immédiatement.
                  📱 WhatsApp/SMS est en mode simulation (affichage dans les logs serveur).
                </p>
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
                  {sending ? 'Envoi...' : 'Envoyer le message'}
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
    </DashboardLayout>
  );
};

export default Clients;
