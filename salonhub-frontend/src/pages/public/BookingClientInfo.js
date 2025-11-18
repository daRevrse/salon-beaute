/**
 * Page du formulaire client
 * Collecte les informations du client pour finaliser la réservation
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import PromoCodeInput from "../../components/common/PromoCodeInput";
import api from "../../services/api";
import {
  // <-- Import Heroicons
  ClockIcon,
  PhoneIcon as PhoneIconOutline,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

const BookingClientInfo = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { service, date, slot } = location.state || {};
  const { formatPrice } = useCurrency();

  const { salon, loading, error, fetchSalon, createAppointment, clearError } =
    usePublicBooking(slug);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    notes: "",
    preferred_contact_method: "email", // Par défaut: email
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState(null);
  const [finalAmount, setFinalAmount] = useState(service?.price || 0);

  useEffect(() => {
    if (!service || !date || !slot) {
      navigate(`/book/${slug}`);
      return;
    }
    fetchSalon();
  }, [service, date, slot, slug, navigate, fetchSalon]);

  useEffect(() => {
    if (service) {
      setFinalAmount(service.price);
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "Le prénom est requis";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Le nom est requis";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Le téléphone est requis";
    } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = "Numéro de téléphone invalide";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email invalide";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const appointmentData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        service_id: service.id,
        appointment_date: date,
        start_time: slot.time + ":00",
        notes: formData.notes.trim() || null,
        preferred_contact_method: formData.preferred_contact_method,
        promo_code: promoCode?.code || null,
        final_amount: finalAmount,
      };

      const result = await createAppointment(appointmentData);

      // Navigation vers la page de confirmation avec les données
      navigate(`/book/${slug}/confirmation`, {
        state: {
          service,
          date,
          slot,
          client: formData,
          appointment: result.appointment,
        },
      });
    } catch (err) {
      console.error("Erreur lors de la création du rendez-vous:", err);
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/book/${slug}/datetime`, { state: { service } });
  };

  const handleValidatePromoCode = async (code) => {
    if (!code) {
      // Retirer le code promo
      setPromoCode(null);
      setFinalAmount(service.price);
      return { success: true };
    }

    try {
      const response = await api.post('/promotions/validate', {
        code: code,
        service_id: service.id,
        amount: service.price,
      });

      if (response.data.success) {
        setPromoCode(response.data.data);
        setFinalAmount(response.data.data.final_amount);
        return response.data;
      } else {
        setPromoCode(null);
        setFinalAmount(service.price);
        return response.data;
      }
    } catch (error) {
      console.error('Erreur validation promo:', error);
      throw error;
    }
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString + "T00:00:00").toLocaleDateString(
      "fr-FR",
      options
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-indigo-600 mb-2">Étape 3/3</p>
          <h2 className="text-3xl font-bold text-gray-900">Vos coordonnées</h2>
          <p className="text-gray-600 mt-2">
            Vérifiez et complétez vos informations pour finaliser la réservation
          </p>
        </div>

        {/* Récapitulatif - Enhanced Box Style */}
        {service && date && slot && (
          <div className="bg-white border border-indigo-200 rounded-xl shadow-lg p-6 mb-8 space-y-4">
            <h3 className="font-semibold text-gray-900 text-xl border-b pb-3 mb-4 flex items-center">
              <CalendarDaysIcon className="w-6 h-6 mr-2 text-indigo-600" />
              Votre Réservation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium text-gray-900">{service.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prix</p>
                {promoCode ? (
                  <div>
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(service.price)}
                    </p>
                    <p className="font-bold text-green-600 text-lg flex items-center">
                      <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                      {formatPrice(finalAmount)}
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-indigo-600 text-lg flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                    {formatPrice(service.price)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Heure</p>
                <p className="font-medium text-gray-900 flex items-center">
                  {formatDate(date)} à {slot.time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Durée</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1 inline-block" />
                  {service.duration} minutes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
              <UserCircleIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Vos coordonnées personnelles
            </h3>

            {/* Prénom et Nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Prénom *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    formErrors.first_name ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.first_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nom *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    formErrors.last_name ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.last_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Téléphone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.phone ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {formErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email (optionnel)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@exemple.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Moyen de notification préféré - Enhanced Selector */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                <EnvelopeIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Préférence de Contact
              </h3>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Comment souhaitez-vous être notifié ? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Email Option */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      preferred_contact_method: "email",
                    })
                  }
                  className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-lg transition-all ${
                    formData.preferred_contact_method === "email"
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-300 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <EnvelopeIcon
                    className={`w-7 h-7 mb-2 ${
                      formData.preferred_contact_method === "email"
                        ? "text-indigo-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium">Email</span>
                </button>

                {/* SMS Option */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      preferred_contact_method: "sms",
                    })
                  }
                  className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-lg transition-all ${
                    formData.preferred_contact_method === "sms"
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-300 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <ChatBubbleBottomCenterTextIcon
                    className={`w-7 h-7 mb-2 ${
                      formData.preferred_contact_method === "sms"
                        ? "text-indigo-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium">SMS</span>
                </button>

                {/* WhatsApp Option (Using Phone Icon for simplicity) */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      preferred_contact_method: "whatsapp",
                    })
                  }
                  className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-lg transition-all ${
                    formData.preferred_contact_method === "whatsapp"
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-300 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <ChatBubbleOvalLeftEllipsisIcon
                    className={`w-7 h-7 mb-2 ${
                      formData.preferred_contact_method === "whatsapp"
                        ? "text-indigo-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>

                {/* Phone Option */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      preferred_contact_method: "phone",
                    })
                  }
                  className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-lg transition-all ${
                    formData.preferred_contact_method === "phone"
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-300 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <PhoneIconOutline
                    className={`w-7 h-7 mb-2 ${
                      formData.preferred_contact_method === "phone"
                        ? "text-indigo-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium">Téléphone</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Nous vous contacterons via ce moyen pour confirmer votre
                rendez-vous
              </p>
            </div>

            {/* Notes */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Notes (Optionnel)
              </h3>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notes ou demandes particulières
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Précisez vos demandes ou préférences..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Code Promo */}
            <div className="pt-4">
              <PromoCodeInput
                onValidate={handleValidatePromoCode}
                currentAmount={service?.price || 0}
                clientId={null}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 mt-6 shadow-xl"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Confirmation en cours...
                </span>
              ) : (
                "✓ Confirmer la réservation"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookingClientInfo;
