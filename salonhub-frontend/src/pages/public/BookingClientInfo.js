/**
 * Public Booking Client Info Page - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { usePublicTheme } from "../../contexts/PublicThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { formatDuration } from "../../contexts/PublicThemeContext";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import PromoCodeInput from "../../components/common/PromoCodeInput";
import api from "../../services/api";
import pwaService from "../../services/pwaService";
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
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const BookingClientInfo = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { service, date, slot } = location.state || {};
  const { formatPrice } = useCurrency();
  const { salon, settings, dynamicStyles, theme: themeSettings } = usePublicTheme();

  const { loading, error, createAppointment, clearError } =
    usePublicBooking(slug);

  // Business type configuration
  const businessType = salon?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  // Thème personnalisé - Utilisation de dynamicStyles du contexte
  const customStyles = dynamicStyles;

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

  // Paygate state
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
  const [paymentAppointmentDetails, setPaymentAppointmentDetails] = useState(null);

  // Deposit calculation
  const isDepositEnabled = settings?.require_appointment_deposit === true || settings?.require_appointment_deposit === 'true';
  const serviceHasDeposit = service?.requires_deposit === 1 || service?.requires_deposit === true;
  // Deposit amount: use service-level if set, otherwise default to 30% of finalAmount when deposit is enabled
  const rawDepositAmount = isDepositEnabled
    ? (serviceHasDeposit && parseFloat(service?.deposit_amount) > 0)
      ? parseFloat(service.deposit_amount)
      : Math.round(finalAmount * 0.3)
    : null;
  // Guard: deposit cannot exceed total amount
  const depositAmount = rawDepositAmount && rawDepositAmount < finalAmount ? rawDepositAmount : null;
  const remainingAmount = depositAmount ? (finalAmount - depositAmount) : 0;
  // Show payment section if salon enabled deposits (regardless of plan)
  const showPaymentSection = isDepositEnabled;

  useEffect(() => {
    if (!service || !date || !slot) {
      navigate(`/book/${slug}`);
      return;
    }
  }, [service, date, slot, slug, navigate]);

  useEffect(() => {
    if (service) {
      setFinalAmount(service.price);
    }
  }, [service]);

  useEffect(() => {
    if (salon?.tenant_id) {
      pwaService.setTenantId(salon.tenant_id);
    }
  }, [salon]);

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

      // Si l'utilisateur est abonné aux notifications, lier son clientId à l'abonnement
      if (result.appointment?.client_id) {
        await pwaService.saveSubscriptionToBackend(null, result.appointment.client_id);
      }

      if (formData.payment_method === 'paygate') {
        const paygatePhone = formData.payment_phone?.trim() || formData.phone.trim();
        await api.post('/payments/paygate/init-appointment', {
            appointmentId: result.appointment.id,
            phone: paygatePhone,
            amount: depositAmount || finalAmount
        });

        const apptDetails = {
           service,
           date,
           slot,
           client: formData,
           appointment: result.appointment,
        };
        setPaymentAppointmentDetails(apptDetails);
        setIsAwaitingPayment(true);
        startPaymentPolling(result.appointment.id, apptDetails);

      } else {
        navigate(`/book/${slug}/confirmation`, {
          state: {
            service,
            date,
            slot,
            client: formData,
            appointment: result.appointment,
          },
        });
      }
    } catch (err) {
      console.error("Error creating appointment:", err);
      // Wait, if createAppointment fails, publicBooking hook already sets error, but we should also toast or show it cleanly
      setSubmitting(false);
    }
  };

  const startPaymentPolling = (appointmentId, details) => {
    let attempts = 0;
    const maxAttempts = 40; // Approx 2 minutes with 3-second interval

    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/public/appointments/${appointmentId}/payment-status`);
        if (res.data.success && (res.data.data.payment_status === 'paid' || res.data.data.payment_status === 'deposit_paid')) {
            clearInterval(poll);
            setIsAwaitingPayment(false);
            navigate(`/book/${slug}/confirmation`, {
              state: details,
            });
        }
      } catch(err) {
        console.error("Error polling payment status", err);
      }
      
      if (attempts >= maxAttempts) {
         clearInterval(poll);
         setIsAwaitingPayment(false);
         alert("Le paiement a pris trop de temps. Veuillez vérifier l'état de votre rendez-vous ou réessayer.");
      }
    }, 3000);
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

  const inputStyle = (fieldName) => ({
    outline: "none",
    transition: "all 0.2s ease-in-out"
  });

  const handleInputFocus = (e, fieldName) => {
    if (!formErrors[fieldName]) {
      e.target.style.boxShadow = dynamicStyles.focusRing.boxShadow;
      e.target.style.borderColor = dynamicStyles.focusRing.borderColor;
    }
  };

  const handleInputBlur = (e, fieldName) => {
    if (!formErrors[fieldName]) {
      e.target.style.boxShadow = "none";
      e.target.style.borderColor = "#e2e8f0";
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-slate-50" style={customStyles.fontFamily}>
      {/* Background overlay if no service image */}
      {!service?.image_url && <div className="fixed inset-0 bg-slate-50 z-0" />}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center transition-colors font-medium"
                style={dynamicStyles.primaryText}
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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          {/* Progress Indication */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
              style={{ ...dynamicStyles.primaryBg, ...dynamicStyles.primaryText }}
            >
              Étape 3 sur 3 : Finalisation
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900">Vos coordonnées</h2>
          </div>

          {/* Recap Summary - Premium Unified Card */}
          {service && date && slot && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft px-6 py-6 mb-8 relative overflow-hidden">
               <div 
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={dynamicStyles.primaryButton}
              />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div 
                    className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2"
                    style={dynamicStyles.primaryBorderLight}
                  >
                    <img
                      src={getImageUrl(service.image_url) || `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop`}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
                    <div className="flex flex-col text-slate-500 text-sm mt-1 space-y-1">
                      <span className="flex items-center">
                        <CalendarDaysIcon className="w-5 h-5 mr-2" style={dynamicStyles.primaryText} />
                        {formatDate(date)}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2" style={dynamicStyles.primaryText} />
                        {slot.time} • {formatDuration(service.duration)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center border-t md:border-t-0 pt-4 md:pt-0">
                  <span className="text-slate-500 text-sm md:mb-1">Montant total</span>
                  <div className="text-right">
                    {promoCode ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(service.price)}
                        </span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatPrice(finalAmount)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold" style={dynamicStyles.primaryText}>
                        {formatPrice(service.price)}
                      </span>
                    )}
                    {depositAmount && (
                      <div className="mt-2 text-xs text-slate-500 space-y-0.5 text-right">
                        <div>Acompte : <span className="font-semibold text-amber-600">{formatPrice(depositAmount)}</span></div>
                        <div>Reste sur place : <span className="font-medium">{formatPrice(remainingAmount)}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className="bg-white rounded-3xl shadow-soft-xl border border-slate-200 overflow-hidden">
            <div 
              className="h-2 w-full" 
              style={dynamicStyles.primaryButton}
            />
            
            <div className="p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section Header */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl" style={dynamicStyles.primaryBg}>
                    <UserCircleIcon className="w-8 h-8" style={dynamicStyles.primaryText} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Informations personnelles</h3>
                    <p className="text-slate-500">Pour vous envoyer la confirmation de votre {term.appointment.toLowerCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="block text-sm font-semibold text-slate-700">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      autoComplete="given-name"
                      value={formData.first_name}
                      onChange={handleChange}
                      onFocus={(e) => handleInputFocus(e, "first_name")}
                      onBlur={(e) => handleInputBlur(e, "first_name")}
                      placeholder="Ex: Jean"
                      className={`w-full px-5 py-4 border rounded-2xl transition-all outline-none bg-slate-50/50 focus:bg-white ${
                        formErrors.first_name ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                      }`}
                      required
                    />
                    {formErrors.first_name && (
                      <p className="text-xs text-red-600 font-medium pl-1">{formErrors.first_name}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="block text-sm font-semibold text-slate-700">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      autoComplete="family-name"
                      value={formData.last_name}
                      onChange={handleChange}
                      onFocus={(e) => handleInputFocus(e, "last_name")}
                      onBlur={(e) => handleInputBlur(e, "last_name")}
                      placeholder="Ex: Dupont"
                      className={`w-full px-5 py-4 border rounded-2xl transition-all outline-none bg-slate-50/50 focus:bg-white ${
                        formErrors.last_name ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                      }`}
                      required
                    />
                    {formErrors.last_name && (
                      <p className="text-xs text-red-600 font-medium pl-1">{formErrors.last_name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={(e) => handleInputFocus(e, "phone")}
                      onBlur={(e) => handleInputBlur(e, "phone")}
                      placeholder="+33 6 ..."
                      className={`w-full px-5 py-4 border rounded-2xl transition-all outline-none bg-slate-50/50 focus:bg-white ${
                        formErrors.phone ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                      }`}
                      required
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-600 font-medium pl-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={(e) => handleInputFocus(e, "email")}
                      onBlur={(e) => handleInputBlur(e, "email")}
                      placeholder="vous@exemple.com"
                      className={`w-full px-5 py-4 border rounded-2xl transition-all outline-none bg-slate-50/50 focus:bg-white ${
                        formErrors.email ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-600 font-medium pl-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Notification Preference */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center space-x-3 text-slate-900">
                    <EnvelopeIcon className="w-6 h-6" style={dynamicStyles.primaryText} />
                    <h4 className="text-lg font-bold">Préférence de notification</h4>
                  </div>
                  <p className="text-sm text-slate-500">Choisir le canal pour recevoir la confirmation :</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { id: 'email', label: 'Email', icon: EnvelopeIcon },
                      { id: 'sms', label: 'SMS', icon: ChatBubbleBottomCenterTextIcon },
                      { id: 'whatsapp', label: 'WhatsApp', icon: ChatBubbleOvalLeftEllipsisIcon },
                      { id: 'phone', label: 'Appel', icon: PhoneIconOutline }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferred_contact_method: method.id })}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all duration-200 ${
                          formData.preferred_contact_method === method.id
                            ? "shadow-md"
                            : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                        }`}
                        style={formData.preferred_contact_method === method.id ? dynamicStyles.activeOption : {}}
                      >
                        <method.icon className={`w-8 h-8 mb-2 ${formData.preferred_contact_method === method.id ? "" : "text-slate-400"}`} />
                        <span className="text-xs font-bold uppercase tracking-wide">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-2 pt-4">
                   <div className="flex items-center space-x-3 text-slate-900 mb-2">
                    <ChatBubbleBottomCenterTextIcon className="w-6 h-6" style={dynamicStyles.primaryText} />
                    <h4 className="text-lg font-bold">Notes ou demandes</h4>
                  </div>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    onFocus={(e) => handleInputFocus(e, "notes")}
                    onBlur={(e) => handleInputBlur(e, "notes")}
                    placeholder="Précisez vos préférences particulières ici..."
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl transition-all outline-none bg-slate-50/50 focus:bg-white resize-none"
                  />
                </div>

                {/* Promo Code Component */}
                <div className="pt-4 px-1">
                  <PromoCodeInput
                    onValidate={handleValidatePromoCode}
                    currentAmount={service?.price || 0}
                    clientId={null}
                  />
                </div>

                {/* Security/Trust indicator */}
                <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs pt-4">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Vos données sont protégées et ne seront jamais partagées.</span>
                </div>

                {/* Payment Section - Deposit/Partial Payment */}
                {showPaymentSection && (
                  <div className="space-y-5 pt-6 border-t border-slate-100 mt-6">
                    {/* Section Header */}
                    <div className="flex items-center space-x-3 text-slate-900">
                      <div className="p-2 rounded-xl" style={dynamicStyles.primaryBg}>
                        <CurrencyDollarIcon className="w-6 h-6" style={dynamicStyles.primaryText} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">Paiement d'acompte</h4>
                        <p className="text-sm text-slate-500">Sécurisez votre {term.appointment.toLowerCase()} avec un acompte</p>
                      </div>
                    </div>

                    {/* Deposit Breakdown Card */}
                    {depositAmount && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Montant total du service</span>
                          <span className="text-sm font-semibold text-slate-800">{formatPrice(finalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-amber-700">Acompte à payer maintenant</span>
                          <span className="text-base font-bold text-amber-700">{formatPrice(depositAmount)}</span>
                        </div>
                        <div className="border-t border-amber-200 pt-2 flex justify-between items-center">
                          <span className="text-sm text-slate-500">Reste à payer sur place</span>
                          <span className="text-sm font-medium text-slate-600">{formatPrice(remainingAmount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: 'paygate' })}
                        className={`relative flex flex-col items-center justify-center p-5 border-2 rounded-2xl transition-all duration-200 ${
                          formData.payment_method === 'paygate'
                            ? "shadow-lg"
                            : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                        }`}
                        style={formData.payment_method === 'paygate' ? dynamicStyles.activeOption : {}}
                      >
                        <svg className="w-7 h-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h6" />
                        </svg>
                        <span className="text-sm font-bold uppercase tracking-wide">Mobile Money</span>
                        <span className="text-xs text-slate-500 mt-1">T-Money, Moov Africa</span>
                        {depositAmount && formData.payment_method === 'paygate' && (
                          <span className="mt-2 text-xs font-bold px-3 py-1 rounded-full" style={{ ...dynamicStyles.primaryBg, ...dynamicStyles.primaryText }}>
                            {formatPrice(depositAmount)}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: 'onsite' })}
                        className={`relative flex flex-col items-center justify-center p-5 border-2 rounded-2xl transition-all duration-200 ${
                          formData.payment_method === 'onsite' || !formData.payment_method
                            ? "shadow-lg"
                            : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                        }`}
                        style={formData.payment_method === 'onsite' || !formData.payment_method ? dynamicStyles.activeOption : {}}
                      >
                        <svg className="w-7 h-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="text-sm font-bold uppercase tracking-wide">Sur place</span>
                        <span className="text-xs text-slate-500 mt-1">Payer lors de la prestation</span>
                        {formData.payment_method === 'onsite' || !formData.payment_method ? (
                          <span className="mt-2 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                            {formatPrice(finalAmount)}
                          </span>
                        ) : null}
                      </button>
                    </div>

                    {/* Mobile Money Phone Input */}
                    {formData.payment_method === 'paygate' && (
                      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Numéro Mobile Money pour le prélèvement
                        </label>
                        <input
                          type="tel"
                          placeholder="Ex: 90 00 00 00"
                          value={formData.payment_phone || formData.phone || ''}
                          onChange={(e) => setFormData({...formData, payment_phone: e.target.value})}
                          onFocus={(e) => handleInputFocus(e, "payment_phone")}
                          onBlur={(e) => handleInputBlur(e, "payment_phone")}
                          className="w-full px-5 py-4 border border-slate-200 rounded-2xl transition-all outline-none bg-white focus:bg-white"
                        />
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          Un prélèvement de <strong className="text-slate-600">{formatPrice(depositAmount || finalAmount)}</strong> sera initié sur ce numéro
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Success/Error API Feedback */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 animate-pulse">
                    <p className="text-red-800 font-medium text-center">{error}</p>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  style={dynamicStyles.primaryButton}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, dynamicStyles.primaryButtonHover, dynamicStyles.shadowGlow)}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, dynamicStyles.primaryButton);
                    e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {formData.payment_method === 'paygate' ? 'Paiement en cours...' : 'Confirmation en cours...'}
                    </span>
                  ) : formData.payment_method === 'paygate' && depositAmount ? (
                    <span className="flex items-center justify-center">
                      Payer l'acompte de {formatPrice(depositAmount)} et confirmer
                    </span>
                  ) : formData.payment_method === 'paygate' ? (
                    <span className="flex items-center justify-center">
                      Payer {formatPrice(finalAmount)} et confirmer
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Confirmer {businessType === "restaurant" ? "ma table" : businessType === "medical" ? "mon rendez-vous" : term.appointment.toLowerCase()}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
        
        {/* Simple Footer */}
        <footer className="mt-auto py-8 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} {salon?.name || "SalonHub"}. Tous droits réservés.</p>
        </footer>
      </div>
      
      {/* Payment Loading Overlay */}
      {isAwaitingPayment && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
            <div className="w-20 h-20 mb-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">Confirmation du paiement...</h3>
            <p className="text-slate-500 text-center max-w-sm px-4">
                Veuillez valider le paiement de <strong className="text-slate-800">{formatPrice(depositAmount || finalAmount)}</strong> sur votre téléphone. Une fois validé, vous serez redirigé automatiquement.
            </p>
            <button 
                onClick={() => setIsAwaitingPayment(false)}
                className="mt-8 text-sm text-slate-400 hover:text-slate-600 underline">
                Annuler l'attente
            </button>
        </div>
      )}
    </div>
  );
};

export default BookingClientInfo;
