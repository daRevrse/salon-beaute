/**
 * MedicalLanding.js - Page publique pour le secteur Médical
 * Affiche les services médicaux et permet la prise de rendez-vous
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  HeartIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const MedicalLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPractitioner, setSelectedPractitioner] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    reason: "",
    is_first_visit: true,
  });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch tenant info
        const tenantRes = await api.get(`/public/tenant/${slug}`);
        if (tenantRes.data.success) {
          setTenant(tenantRes.data.data);
        }

        // Fetch services (using standard services for medical)
        const servicesRes = await api.get(`/public/services/${slug}`);
        if (servicesRes.data.success) {
          setServices(servicesRes.data.data || []);
        }

        // Fetch practitioners
        const practRes = await api.get(`/public/medical/${slug}/practitioners`);
        if (practRes.data.success) {
          setPractitioners(practRes.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  useEffect(() => {
    // Fetch available slots when date and practitioner selected
    const fetchSlots = async () => {
      if (!selectedDate || !selectedPractitioner) return;

      try {
        setLoadingSlots(true);
        const res = await api.get(`/public/medical/${slug}/availability`, {
          params: {
            date: selectedDate,
            practitioner_id: selectedPractitioner.id,
            service_id: selectedService?.id,
          },
        });
        if (res.data.success) {
          setAvailableSlots(res.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedPractitioner, selectedService, slug]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: tenant?.currency || "EUR",
    }).format(amount);
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    try {
      setBooking(true);
      await api.post(`/public/medical/${slug}/appointments`, {
        service_id: selectedService?.id,
        practitioner_id: selectedPractitioner?.id,
        date: selectedDate,
        time: selectedTime,
        ...bookingForm,
      });
      setBookingSuccess(true);
    } catch (error) {
      console.error("Error booking:", error);
      alert(error.response?.data?.error || "Erreur lors de la prise de rendez-vous");
    } finally {
      setBooking(false);
    }
  };

  const resetBooking = () => {
    setShowBookingModal(false);
    setBookingSuccess(false);
    setBookingStep(1);
    setSelectedService(null);
    setSelectedPractitioner(null);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
    setBookingForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      reason: "",
      is_first_visit: true,
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <HeartIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Cabinet médical introuvable</h2>
          <p className="text-slate-500">Vérifiez l'URL et réessayez</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative">
        {tenant.banner_url ? (
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={tenant.banner_url}
              alt={tenant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-r from-teal-600 to-cyan-700" />
        )}

        {/* Tenant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="max-w-6xl mx-auto flex items-end gap-6">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{tenant.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm md:text-base opacity-90">
                {tenant.address && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {tenant.address}, {tenant.city}
                  </span>
                )}
                {tenant.phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4" />
                    {tenant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <button
          onClick={() => setShowBookingModal(true)}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <CalendarDaysIcon className="h-5 w-5" />
          Prendre rendez-vous en ligne
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-teal-100">
            <ShieldCheckIcon className="h-8 w-8 text-teal-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800">Professionnels certifiés</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-cyan-100">
            <ClockIcon className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800">RDV rapide</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-emerald-100">
            <HeartIcon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800">Soins personnalisés</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-blue-100">
            <BuildingOffice2Icon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800">Équipements modernes</div>
          </div>
        </div>

        {/* Practitioners */}
        {practitioners.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserIcon className="h-7 w-7 text-teal-500" />
              Notre Équipe Médicale
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {practitioners.map((pract) => (
                <div
                  key={pract.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {pract.avatar_url ? (
                      <img
                        src={pract.avatar_url}
                        alt={pract.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-teal-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-800">{pract.name}</h3>
                      <p className="text-sm text-teal-600">{pract.specialty || "Praticien"}</p>
                    </div>
                  </div>
                  {pract.bio && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-3">{pract.bio}</p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPractitioner(pract);
                      setShowBookingModal(true);
                    }}
                    className="w-full py-2 border border-teal-200 text-teal-600 rounded-xl text-sm font-medium hover:bg-teal-50 transition-colors"
                  >
                    Prendre RDV avec ce praticien
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <HeartIcon className="h-7 w-7 text-teal-500" />
          Nos Consultations & Soins
        </h2>

        {services.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200">
            <HeartIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucun service disponible</h3>
            <p className="text-slate-500">Contactez-nous pour plus d'informations</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-lg transition-all"
              >
                {/* Category badge */}
                {service.category && (
                  <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full mb-3">
                    {service.category}
                  </span>
                )}

                <h3 className="text-lg font-semibold text-slate-800 mb-2">{service.name}</h3>

                {service.description && (
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                )}

                {/* Service details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ClockIcon className="h-4 w-4 text-slate-400" />
                    <span>{service.duration || 30} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CurrencyEuroIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-teal-600">{formatCurrency(service.price || 0)}</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setShowBookingModal(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  Prendre RDV
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Informations pratiques</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-teal-50 transition-colors"
              >
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <PhoneIcon className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Téléphone</div>
                  <div className="font-medium text-slate-800">{tenant.phone}</div>
                </div>
              </a>
            )}
            {tenant.email && (
              <a
                href={`mailto:${tenant.email}`}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-teal-50 transition-colors"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <EnvelopeIcon className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="font-medium text-slate-800">{tenant.email}</div>
                </div>
              </a>
            )}
            {tenant.address && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MapPinIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Adresse</div>
                  <div className="font-medium text-slate-800">
                    {tenant.address}, {tenant.postal_code} {tenant.city}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Rendez-vous confirmé !</h3>
                <p className="text-slate-500 mb-6">
                  Vous recevrez un email de confirmation avec tous les détails de votre rendez-vous.
                </p>
                <button
                  onClick={resetBooking}
                  className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Prendre rendez-vous</h2>
                    <p className="text-slate-500 text-sm mt-1">Étape {bookingStep} sur 3</p>
                  </div>
                  <button
                    onClick={resetBooking}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="px-6 pt-4">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 h-2 rounded-full ${
                          step <= bookingStep ? "bg-teal-500" : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {/* Step 1: Select Service & Practitioner */}
                  {bookingStep === 1 && (
                    <div className="space-y-6">
                      {/* Service selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type de consultation
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {services.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setSelectedService(service)}
                              className={`w-full p-3 border rounded-xl text-left transition-all ${
                                selectedService?.id === service.id
                                  ? "border-teal-500 bg-teal-50"
                                  : "border-slate-200 hover:border-teal-300"
                              }`}
                            >
                              <div className="font-medium text-slate-800">{service.name}</div>
                              <div className="text-sm text-slate-500">
                                {service.duration} min • {formatCurrency(service.price || 0)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Practitioner selection */}
                      {practitioners.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Praticien (optionnel)
                          </label>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPractitioner(null)}
                              className={`w-full p-3 border rounded-xl text-left transition-all ${
                                !selectedPractitioner
                                  ? "border-teal-500 bg-teal-50"
                                  : "border-slate-200 hover:border-teal-300"
                              }`}
                            >
                              <div className="font-medium text-slate-800">Pas de préférence</div>
                            </button>
                            {practitioners.map((pract) => (
                              <button
                                key={pract.id}
                                type="button"
                                onClick={() => setSelectedPractitioner(pract)}
                                className={`w-full p-3 border rounded-xl text-left transition-all ${
                                  selectedPractitioner?.id === pract.id
                                    ? "border-teal-500 bg-teal-50"
                                    : "border-slate-200 hover:border-teal-300"
                                }`}
                              >
                                <div className="font-medium text-slate-800">{pract.name}</div>
                                <div className="text-sm text-slate-500">{pract.specialty}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setBookingStep(2)}
                        disabled={!selectedService}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continuer
                      </button>
                    </div>
                  )}

                  {/* Step 2: Select Date & Time */}
                  {bookingStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Date du rendez-vous
                        </label>
                        <input
                          type="date"
                          min={getMinDate()}
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSelectedTime("");
                          }}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      {selectedDate && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Horaire disponible
                          </label>
                          {loadingSlots ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent mx-auto"></div>
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4">Aucun créneau disponible pour cette date</p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setSelectedTime(slot)}
                                  className={`py-2 px-3 border rounded-lg text-sm font-medium transition-all ${
                                    selectedTime === slot
                                      ? "border-teal-500 bg-teal-500 text-white"
                                      : "border-slate-200 hover:border-teal-300"
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setBookingStep(1)}
                          className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                        >
                          Retour
                        </button>
                        <button
                          onClick={() => setBookingStep(3)}
                          disabled={!selectedDate || !selectedTime}
                          className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continuer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Patient Info */}
                  {bookingStep === 3 && (
                    <form onSubmit={handleBooking} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            required
                            value={bookingForm.first_name}
                            onChange={(e) => setBookingForm({ ...bookingForm, first_name: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nom *
                          </label>
                          <input
                            type="text"
                            required
                            value={bookingForm.last_name}
                            onChange={(e) => setBookingForm({ ...bookingForm, last_name: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Date de naissance
                        </label>
                        <input
                          type="date"
                          value={bookingForm.date_of_birth}
                          onChange={(e) => setBookingForm({ ...bookingForm, date_of_birth: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Motif de consultation
                        </label>
                        <textarea
                          value={bookingForm.reason}
                          onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Décrivez brièvement la raison de votre consultation..."
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_first_visit"
                          checked={bookingForm.is_first_visit}
                          onChange={(e) => setBookingForm({ ...bookingForm, is_first_visit: e.target.checked })}
                          className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <label htmlFor="is_first_visit" className="text-sm text-slate-700">
                          C'est ma première visite
                        </label>
                      </div>

                      {/* Summary */}
                      <div className="p-4 bg-teal-50 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Consultation</span>
                          <span className="font-medium text-slate-800">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Date</span>
                          <span className="font-medium text-slate-800">
                            {new Date(selectedDate).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })} à {selectedTime}
                          </span>
                        </div>
                        {selectedPractitioner && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Praticien</span>
                            <span className="font-medium text-slate-800">{selectedPractitioner.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-teal-200">
                          <span className="text-slate-600">Prix</span>
                          <span className="font-bold text-teal-600">{formatCurrency(selectedService?.price || 0)}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingStep(2)}
                          className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                        >
                          Retour
                        </button>
                        <button
                          type="submit"
                          disabled={booking}
                          className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                          {booking ? "Confirmation..." : "Confirmer le RDV"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalLanding;
