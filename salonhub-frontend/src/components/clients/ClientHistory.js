/**
 * ClientHistory Component
 * Modal pour afficher l'historique des rendez-vous et services d'un client
 */

import { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import api from '../../services/api';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ScissorsIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const ClientHistory = ({ client, onClose }) => {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalSpent: 0,
    favoriteService: null,
  });

  useEffect(() => {
    if (client) {
      loadClientHistory();
    }
  }, [client]);

  const loadClientHistory = async () => {
    try {
      setLoading(true);

      // Charger tous les rendez-vous du client
      const response = await api.get(`/clients/${client.id}/appointments`);
      const clientAppointments = response.data.data || [];

      setAppointments(clientAppointments);

      // Calculer les statistiques
      const completed = clientAppointments.filter(a => a.status === 'completed');
      const cancelled = clientAppointments.filter(a => a.status === 'cancelled');
      const totalSpent = completed.reduce((sum, apt) => sum + (parseFloat(apt.service_price) || 0), 0);

      // Service le plus réservé
      const serviceCount = {};
      clientAppointments.forEach(apt => {
        if (apt.service_name) {
          serviceCount[apt.service_name] = (serviceCount[apt.service_name] || 0) + 1;
        }
      });

      const favoriteService = Object.keys(serviceCount).length > 0
        ? Object.keys(serviceCount).reduce((a, b) => serviceCount[a] > serviceCount[b] ? a : b)
        : null;

      setStats({
        totalAppointments: clientAppointments.length,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length,
        totalSpent,
        favoriteService,
      });
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'En attente' },
      confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Confirmé' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Terminé' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Annulé' },
      no_show: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Absent' },
    };

    const style = styles[status] || styles.pending;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text} border ${style.border}`}>
        {style.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-5xl shadow-2xl rounded-xl bg-white mb-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Historique de {client.first_name} {client.last_name}
              </h2>
              <p className="text-indigo-100 mt-1">{client.email || client.phone}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total RDV</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAppointments}</p>
                </div>
                <CalendarIcon className="h-10 w-10 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Complétés</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedAppointments}</p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Annulés</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelledAppointments}</p>
                </div>
                <XCircleIcon className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total dépensé</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{formatPrice(stats.totalSpent)}</p>
                </div>
                <CurrencyDollarIcon className="h-10 w-10 text-indigo-500" />
              </div>
            </div>
          </div>

          {stats.favoriteService && (
            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <p className="text-sm text-gray-600">
                  Service préféré : <span className="font-semibold text-indigo-600">{stats.favoriteService}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Appointments List */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des rendez-vous</h3>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <ExclamationCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ScissorsIcon className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-semibold text-gray-900">{apt.service_name}</h4>
                        {getStatusBadge(apt.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mt-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(apt.appointment_date)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {apt.start_time?.substring(0, 5)} - {apt.end_time?.substring(0, 5)}
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-semibold">{formatPrice(apt.service_price)}</span>
                        </div>
                      </div>

                      {apt.notes && (
                        <div className="mt-3 text-sm text-gray-500 bg-gray-50 rounded p-2">
                          <span className="font-medium">Note : </span>
                          {apt.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientHistory;
