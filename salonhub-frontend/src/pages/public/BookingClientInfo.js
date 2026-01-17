/**
 * Public Booking Client Info Page - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import PromoCodeInput from "../../components/common/PromoCodeInput";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUtils";
import {
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

  // Business type configuration
  const businessType = salon?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    notes: "",
    preferred_contact_method: "email",
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
      console.error("Error creating appointment:", err);
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/book/${slug}/datetime`, { state: { service } });
  };

  const handleValidatePromoCode = async (code) => {
    if (!code) {
      setPromoCode(null);
      setFinalAmount(service.price);
      return { success: true };
    }

    try {
      const response = await api.post("/public/promotions/validate", {
        code: code,
        salon_slug: slug,
        order_amount: service.price,
        service_id: service.id,
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
      console.error("Error validating promo:", error);
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
    return new Date(dateString + "T00:00:00").toLocaleDateString("fr-FR", options);
  };

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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <p className={`text-sm font-medium ${config.textColor} mb-2`}>
              Étape 3/3
            </p>
            <h2 className="text-3xl font-display font-bold text-slate-900">
              Vos coordonnées
            </h2>
            <p className="text-slate-600 mt-2">
              Vérifiez et complétez vos informations pour finaliser la réservation
            </p>
          </div>

          {/* Recap - Enhanced Box Style */}
          {service && date && slot && (
            <div className={`bg-white border ${config.lightBorderColor} rounded-2xl shadow-soft-xl p-4 sm:p-6 mb-8 space-y-4`}>
              <h3 className="font-semibold text-slate-900 text-lg sm:text-xl border-b border-slate-100 pb-3 mb-4 flex items-center">
                <CalendarDaysIcon className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 ${config.textColor}`} />
                Votre {term.appointment}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">{term.service}</p>
                  <p className="font-medium text-slate-900">{service.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{term.servicePrice}</p>
                  {promoCode ? (
                    <div>
                      <p className="text-sm text-slate-400 line-through">
                        {formatPrice(service.price)}
                      </p>
                      <p className="font-bold text-emerald-600 text-lg flex items-center">
                        <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                        {formatPrice(finalAmount)}
                      </p>
                    </div>
                  ) : (
                    <p className={`font-bold ${config.textColor} text-lg flex items-center`}>
                      <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                      {formatPrice(service.price)}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500">Date & Heure</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(date)} à {slot.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{term.serviceDuration}</p>
                  <p className="font-medium text-slate-900 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1 inline-block" />
                    {service.duration} minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-soft-xl p-4 sm:p-6 border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center border-b border-slate-100 pb-3">
                <UserCircleIcon className={`w-5 h-5 mr-2 ${config.textColor}`} />
                Vos coordonnées personnelles
              </h3>

              {/* First & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent ${
                      formErrors.first_name ? "border-red-500" : "border-slate-200"
                    }`}
                    required
                  />
                  {formErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.first_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent ${
                      formErrors.last_name ? "border-red-500" : "border-slate-200"
                    }`}
                    required
                  />
                  {formErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent ${
                    formErrors.phone ? "border-red-500" : "border-slate-200"
                  }`}
                  required
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vous@exemple.com"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent ${
                    formErrors.email ? "border-red-500" : "border-slate-200"
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Contact Preference - Enhanced Selector */}
              <div className="pt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center border-b border-slate-100 pb-3">
                  <EnvelopeIcon className={`w-5 h-5 mr-2 ${config.textColor}`} />
                  Préférence de Contact
                </h3>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Comment souhaitez-vous être notifié ? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Email Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_contact_method: "email" })}
                    className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-xl transition-all ${
                      formData.preferred_contact_method === "email"
                        ? `${config.borderColor} ${config.lightBg} shadow-soft`
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <EnvelopeIcon
                      className={`w-7 h-7 mb-2 ${
                        formData.preferred_contact_method === "email" ? config.textColor : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-medium">Email</span>
                  </button>

                  {/* SMS Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_contact_method: "sms" })}
                    className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-xl transition-all ${
                      formData.preferred_contact_method === "sms"
                        ? `${config.borderColor} ${config.lightBg} shadow-soft`
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <ChatBubbleBottomCenterTextIcon
                      className={`w-7 h-7 mb-2 ${
                        formData.preferred_contact_method === "sms" ? config.textColor : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-medium">SMS</span>
                  </button>

                  {/* WhatsApp Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_contact_method: "whatsapp" })}
                    className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-xl transition-all ${
                      formData.preferred_contact_method === "whatsapp"
                        ? `${config.borderColor} ${config.lightBg} shadow-soft`
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <ChatBubbleOvalLeftEllipsisIcon
                      className={`w-7 h-7 mb-2 ${
                        formData.preferred_contact_method === "whatsapp" ? config.textColor : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>

                  {/* Phone Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_contact_method: "phone" })}
                    className={`flex flex-col items-center justify-center px-4 py-4 border-2 rounded-xl transition-all ${
                      formData.preferred_contact_method === "phone"
                        ? `${config.borderColor} ${config.lightBg} shadow-soft`
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <PhoneIconOutline
                      className={`w-7 h-7 mb-2 ${
                        formData.preferred_contact_method === "phone" ? config.textColor : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-medium">Téléphone</span>
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Nous vous contacterons via ce moyen pour confirmer votre {term.appointment.toLowerCase()}
                </p>
              </div>

              {/* Notes */}
              <div className="pt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center border-b border-slate-100 pb-3">
                  <ChatBubbleBottomCenterTextIcon className={`w-5 h-5 mr-2 ${config.textColor}`} />
                  Notes (Optionnel)
                </h3>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                  Notes ou demandes particulières
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Précisez vos demandes ou préférences..."
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent resize-none`}
                />
              </div>

              {/* Promo Code */}
              <div className="pt-4">
                <PromoCodeInput
                  onValidate={handleValidatePromoCode}
                  currentAmount={service?.price || 0}
                  clientId={null}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full bg-gradient-to-r ${config.gradient} text-white py-4 px-6 rounded-xl font-medium hover:shadow-glow focus:outline-none focus:ring-2 ${config.focusRing} focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6 shadow-soft-xl`}
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
                  `Confirmer ${businessType === "restaurant" ? "la réservation" : businessType === "training" ? "l'inscription" : businessType === "medical" ? "le rendez-vous" : "la réservation"}`
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookingClientInfo;
