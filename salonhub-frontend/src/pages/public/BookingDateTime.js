/**
 * Page de sélection de date et heure
 * Permet au client de choisir un créneau disponible
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  // <-- Import Heroicons
  ClockIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

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
    fetchAvailability,
  } = usePublicBooking(slug);

  const [selectedDate, setSelectedDate] = useState("");
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
        slot,
      },
    });
  };

  const handleBack = () => {
    navigate(`/book/${slug}`);
  };

  // Date minimum = aujourd'hui
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen relative">
      {/* Background Image avec Overlay */}
      {service?.image_url && (
        <div className="fixed inset-0 z-0">
          <img
            src={service.image_url.replace("api/", "")}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header - Nettoyé et centré */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Retour
              </button>
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {salon?.name || "Salon de Beauté"}
                </h1>
              </div>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Step indicator */}
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-indigo-600 mb-2">
              Étape 2/3
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Choisissez la date et l'heure
            </h2>
          </div>

          {/* Service sélectionné - Enhanced Card Style */}
          {service && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-xl">
                    {service.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1 inline-block" />
                    {service.duration} min &bull;
                    <CurrencyDollarIcon className="w-4 h-4 ml-2 mr-1 inline-block" />
                    {formatPrice(service.price)}
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Changer
                </button>
              </div>
            </div>
          )}

          {/* Sélection de date */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <label className="block text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <CalendarDaysIcon className="w-6 h-6 mr-2 text-indigo-600" />
              Sélectionnez une date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>

          {/* Créneaux disponibles */}
          {loading && selectedDate && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Recherche des créneaux disponibles...
              </p>
            </div>
          )}

          {!loading && selectedDate && availableSlots.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
              <ClockIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Salon fermé ou complet
              </h3>
              <p className="text-gray-600">
                Veuillez choisir une autre date ou un autre service.
              </p>
            </div>
          )}

          {!loading && selectedDate && availableSlots.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Créneaux disponibles ({availableSlots.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    className="px-4 py-3 border border-indigo-200 rounded-lg text-center bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400 transition-colors duration-150 font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BookingDateTime;
