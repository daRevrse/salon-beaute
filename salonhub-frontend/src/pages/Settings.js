/**
 * Page de paramètres du salon
 * Gestion des horaires d'ouverture et autres configurations
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/common/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

const Settings = () => {
  const { user, tenant } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [businessHours, setBusinessHours] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  });

  const [slotDuration, setSlotDuration] = useState(30);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const settings = response.data;

      if (settings.business_hours) {
        setBusinessHours(settings.business_hours);
      }

      if (settings.slot_duration) {
        setSlotDuration(settings.slot_duration);
      }

      if (settings.currency) {
        setSelectedCurrency(settings.currency);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (day, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');

      // Sauvegarder business_hours, slot_duration et currency
      await axios.put(
        `${API_URL}/settings`,
        {
          business_hours: businessHours,
          slot_duration: slotDuration,
          currency: selectedCurrency
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Mettre à jour la devise dans le contexte
      changeCurrency(selectedCurrency);

      setMessage('Paramètres enregistrés avec succès !');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paramètres du salon</h1>
          <p className="mt-2 text-gray-600">
            Configurez la devise, les horaires d'ouverture et la durée des créneaux
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Devise */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">💱</span>
            Devise de votre salon
          </h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez la devise utilisée pour vos tarifs
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.symbol} - {info.name} ({code})
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              💡 La devise est détectée automatiquement selon votre pays, mais vous pouvez la modifier ici.
            </p>
          </div>
        </div>

        {/* Durée des créneaux */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Durée des créneaux de réservation
          </h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée d'un créneau (minutes)
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Les clients pourront réserver à des intervalles de {slotDuration} minutes
            </p>
          </div>
        </div>

        {/* Horaires d'ouverture */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Horaires d'ouverture
          </h2>

          <div className="space-y-4">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="w-32">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!businessHours[key].closed}
                      onChange={(e) => handleDayChange(key, 'closed', !e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {label}
                    </span>
                  </label>
                </div>

                {!businessHours[key].closed ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Ouverture</label>
                      <input
                        type="time"
                        value={businessHours[key].open}
                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Fermeture</label>
                      <input
                        type="time"
                        value={businessHours[key].close}
                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-gray-400 italic">
                    Fermé
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
