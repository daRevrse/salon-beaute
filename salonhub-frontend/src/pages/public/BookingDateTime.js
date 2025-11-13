/**
 * Page de sélection de date et heure
 * Permet au client de choisir un créneau disponible
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import usePublicBooking from '../../hooks/usePublicBooking';
import { useCurrency } from '../../contexts/CurrencyContext';

const BookingDateTime = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const service = location.state?.service;
  const { formatPrice } = useCurrency();

  const {
    salon,
    availableSlots,
    loading,
    error,
    fetchSalon,
    fetchAvailability
  } = usePublicBooking(slug);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!service) {
      navigate(`/book/${slug}`);
      return;
    }
    fetchSalon();
  }, [service, slug, navigate, fetchSalon]);

  useEffect(() => {
    if (selectedDate && service) {
      fetchAvailability(service.id, selectedDate);
    }
  }, [selectedDate, service, fetchAvailability]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    navigate(`/book/${slug}/info`, {
      state: {
        service,
        date: selectedDate,
        slot
      }
    });
  };

  const handleBack = () => {
    navigate(`/book/${slug}`);
  };

  // Date minimum = aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {salon?.name || 'Salon de Beauté'}
              </h1>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            2️⃣ Choisissez la date et l'heure
          </h2>
        </div>

        {/* Service sélectionné */}
        {service && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {service.duration} min • {formatPrice(service.price)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sélection de date */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez une date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={today}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Créneaux disponibles */}
        {loading && selectedDate && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Recherche des créneaux disponibles...</p>
          </div>
        )}

        {!loading && selectedDate && availableSlots.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun créneau disponible
            </h3>
            <p className="text-gray-600">
              Veuillez choisir une autre date
            </p>
          </div>
        )}

        {!loading && selectedDate && availableSlots.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Créneaux disponibles
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  className="px-4 py-3 border-2 border-indigo-200 rounded-lg text-center hover:bg-indigo-50 hover:border-indigo-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <span className="font-medium text-gray-900">
                    {slot.time}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingDateTime;
