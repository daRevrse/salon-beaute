/**
 * Public Booking DateTime Page - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import { getImageUrl } from "../../utils/imageUtils";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import {
  ClockIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
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

  // Business type configuration
  const businessType = salon?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

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

  // Date minimum = today
  const today = new Date().toISOString().split("T")[0];

  // Helper: Parse business hours
  const parseBusinessHours = () => {
    if (!salon?.business_hours) return null;

    try {
      const hours = typeof salon.business_hours === 'string'
        ? JSON.parse(salon.business_hours)
        : salon.business_hours;

      const daysMap = {
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sunday: 'Dimanche'
      };

      const schedule = [];

      Object.entries(daysMap).forEach(([key, label]) => {
        const dayHours = hours[key];
        if (dayHours && dayHours.open && dayHours.close && !dayHours.closed) {
          schedule.push({
            day: label,
            open: dayHours.open,
            close: dayHours.close,
            isOpen: true
          });
        } else {
          schedule.push({
            day: label,
            isOpen: false
          });
        }
      });

      return schedule;
    } catch (err) {
      console.error('Error parsing business hours:', err);
      return null;
    }
  };

  const businessSchedule = parseBusinessHours();
  const openDays = businessSchedule?.filter(d => d.isOpen) || [];

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      {service?.image_url && (
        <div className="fixed inset-0 z-0">
          <img
            src={getImageUrl(service.image_url)}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className={`flex items-center ${config.textColor} hover:${config.darkTextColor} transition-colors font-medium`}
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Retour
              </button>
              <div className="text-center flex-1">
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  {salon?.name || term.establishment}
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
            <p className={`text-sm font-medium ${config.textColor} mb-2`}>
              Étape 2/3
            </p>
            <h2 className="text-3xl font-display font-bold text-slate-900">
              Choisissez la date et l'heure
            </h2>
          </div>

          {/* Selected Service - Enhanced Card Style */}
          {service && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-xl">
                    {service.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1 inline-block" />
                    {service.duration} min &bull;
                    <CurrencyDollarIcon className="w-4 h-4 ml-2 mr-1 inline-block" />
                    {formatPrice(service.price)}
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className={`text-sm font-medium ${config.textColor} hover:${config.darkTextColor} transition-colors`}
                >
                  Changer
                </button>
              </div>
            </div>
          )}

          {/* Business Hours */}
          {businessSchedule && openDays.length > 0 && (
            <div className={`bg-gradient-to-br ${config.lightBg} border ${config.lightBorderColor} rounded-2xl p-5 mb-8 shadow-soft`}>
              <div className="flex items-start">
                <InformationCircleIcon className={`w-6 h-6 ${config.textColor} mr-3 flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Horaires d'ouverture
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {businessSchedule.map((day, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                          day.isOpen
                            ? 'bg-white/80 text-slate-900'
                            : 'bg-slate-100/50 text-slate-400'
                        }`}
                      >
                        <span className="font-medium text-sm">{day.day}</span>
                        {day.isOpen ? (
                          <span className={`text-sm ${config.darkTextColor} font-semibold`}>
                            {day.open} - {day.close}
                          </span>
                        ) : (
                          <span className="text-sm italic">Fermé</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {openDays.length < 7 && (
                    <p className="text-xs text-slate-600 mt-3 italic">
                      Ouvert {openDays.length} jour{openDays.length > 1 ? 's' : ''} par semaine.
                      Veuillez choisir une date correspondant aux jours d'ouverture.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="bg-white rounded-2xl shadow-soft-xl p-6 mb-8 border border-slate-200">
            <label className="flex items-center text-lg font-semibold text-slate-700 mb-4">
              <CalendarDaysIcon className={`w-6 h-6 mr-2 ${config.textColor}`} />
              Sélectionnez une date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-lg focus:ring-2 ${config.focusRing} focus:border-transparent transition-shadow`}
            />
          </div>

          {/* Available Slots */}
          {loading && selectedDate && (
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${config.borderColor} mx-auto`}></div>
              <p className="mt-4 text-slate-600">
                Recherche des créneaux disponibles...
              </p>
            </div>
          )}

          {!loading && selectedDate && availableSlots.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-soft border border-slate-200">
              <ClockIcon className="mx-auto h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-xl font-medium text-slate-900 mb-2">
                Aucun créneau disponible
              </h3>
              <p className="text-slate-600 mb-4">
                {term.establishment} est fermé ce jour ou tous les créneaux sont réservés.
              </p>
              {openDays.length > 0 && (
                <div className={`inline-block ${config.lightBg} border ${config.lightBorderColor} rounded-xl px-4 py-3 mt-2`}>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Jours d'ouverture :
                  </p>
                  <p className={`text-sm ${config.darkTextColor} font-semibold`}>
                    {openDays.map(d => d.day).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && selectedDate && availableSlots.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Créneaux disponibles ({availableSlots.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    className={`px-4 py-3 border ${config.lightBorderColor} rounded-xl text-center ${config.lightBg} hover:${config.mediumBg} hover:${config.borderColor} transition-colors duration-150 font-medium text-slate-900 shadow-soft focus:outline-none focus:ring-2 ${config.focusRing}`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-8">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BookingDateTime;
