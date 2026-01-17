/**
 * Public Booking Confirmation Page - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 */

import React, { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import {
  PhoneIcon as PhoneIconOutline,
  MapPinIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const BookingConfirmation = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { service, date, slot, client, appointment } = location.state || {};
  const { formatPrice } = useCurrency();

  const { salon, fetchSalon } = usePublicBooking(slug);

  // Business type configuration
  const businessType = salon?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  useEffect(() => {
    if (!service || !date || !slot) {
      navigate(`/book/${slug}`);
      return;
    }
    fetchSalon();
  }, [service, date, slot, slug, navigate, fetchSalon]);

  const handleNewBooking = () => {
    navigate(`/book/${slug}`);
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

  // Get confirmation message based on business type
  const getConfirmationTitle = () => {
    switch (businessType) {
      case "restaurant":
        return "Réservation enregistrée !";
      case "training":
        return "Inscription enregistrée !";
      case "medical":
        return "Rendez-vous enregistré !";
      default:
        return `${term.appointment} enregistré !`;
    }
  };

  const getNewBookingLabel = () => {
    switch (businessType) {
      case "restaurant":
        return "Faire une autre réservation";
      case "training":
        return "S'inscrire à une autre formation";
      case "medical":
        return "Prendre un autre rendez-vous";
      default:
        return "Prendre un autre rendez-vous";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-slate-900">
              {salon?.name || term.establishment}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full mb-4 shadow-soft-xl`}>
            <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
            {getConfirmationTitle()}
          </h2>
          <p className="text-xl text-slate-600">
            Merci, {client?.first_name || `Cher ${term.client.toLowerCase()}`} !
          </p>
        </div>

        {/* Status Info - Enhanced Alert Style */}
        <div className={`${config.lightBg} border ${config.lightBorderColor} rounded-2xl p-6 mb-10 shadow-soft`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className={`h-6 w-6 ${config.textColor}`} />
            </div>
            <div className="ml-3">
              <h3 className={`text-lg font-medium ${config.darkTextColor} mb-1`}>
                En attente de validation
              </h3>
              <div className={`mt-2 text-base ${config.textColor}`}>
                <p>
                  Votre {term.appointment.toLowerCase()} est en statut <strong>"en attente"</strong>.
                  {term.establishment} vous confirmera dans les plus brefs délais.
                  {client?.preferred_contact_method && (
                    <span>
                      {" "}
                      Nous utiliserons{" "}
                      <strong>
                        {client.preferred_contact_method === "email" && "Email"}
                        {client.preferred_contact_method === "sms" && "SMS"}
                        {client.preferred_contact_method === "whatsapp" && "WhatsApp"}
                        {client.preferred_contact_method === "phone" && "Téléphone"}
                      </strong>{" "}
                      pour vous contacter.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details - Enhanced Card Style */}
        <div className="bg-white rounded-2xl shadow-soft-xl border border-slate-200 overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4`}>
            <h3 className="text-xl font-display font-semibold text-white">Récapitulatif</h3>
          </div>

          <div className="px-6 py-6 space-y-3">
            <h4 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center">
              <CalendarDaysIcon className={`w-5 h-5 mr-2 ${config.textColor}`} />
              Détails {businessType === "restaurant" ? "de la réservation" : businessType === "training" ? "de la formation" : businessType === "medical" ? "de la consultation" : "du rendez-vous"}
            </h4>

            {service && <DetailRow label={term.service} value={service.name} config={config} />}

            {date && <DetailRow label="Date" value={formatDate(date)} config={config} />}

            {slot && (
              <DetailRow label="Heure" value={slot.time} icon={ClockIcon} config={config} />
            )}

            {service && (
              <DetailRow label={term.serviceDuration} value={`${service.duration} minutes`} config={config} />
            )}

            {service && (
              <div className="flex justify-between py-3 border-t border-slate-100 mt-4 pt-4">
                <span className="text-xl font-semibold text-slate-700">
                  Prix Total
                </span>
                <span className={`font-bold ${config.textColor} text-2xl flex items-center`}>
                  <CurrencyDollarIcon className="w-6 h-6 mr-1" />
                  {formatPrice(service.price)}
                </span>
              </div>
            )}

            {client && (
              <>
                <h4 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3 pt-6 flex items-center">
                  <UserCircleIcon className={`w-5 h-5 mr-2 ${config.textColor}`} />
                  Vos Coordonnées
                </h4>

                <DetailRow
                  label="Nom"
                  value={`${client.first_name} ${client.last_name}`}
                  config={config}
                />
                <DetailRow
                  label="Téléphone"
                  value={client.phone}
                  icon={PhoneIconOutline}
                  config={config}
                />
                {client.email && (
                  <DetailRow
                    label="Email"
                    value={client.email}
                    icon={EnvelopeIcon}
                    config={config}
                  />
                )}
                {client.notes && (
                  <div className="py-2 border-t border-slate-100 pt-4">
                    <span className="text-slate-600 block mb-1 font-medium">
                      Notes
                    </span>
                    <p className={`text-sm text-slate-700 ${config.lightBg} rounded-xl p-3 italic border ${config.lightBorderColor}`}>
                      {client.notes}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleNewBooking}
            className={`px-8 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium hover:shadow-glow focus:outline-none focus:ring-2 ${config.focusRing} focus:ring-offset-2 transition-all duration-300 shadow-soft`}
          >
            {getNewBookingLabel()}
          </button>
        </div>

        {/* Contact Info */}
        {salon && (salon.phone || salon.address) && (
          <div className="mt-12 text-center border-t border-slate-200 pt-8">
            <h3 className="text-lg font-medium text-slate-700 mb-4">
              Besoin d'assistance ?
            </h3>
            <div className="space-y-2 text-base text-slate-600">
              {salon.phone && (
                <p className="flex items-center justify-center">
                  <PhoneIconOutline className={`w-5 h-5 mr-2 ${config.textColor}`} />
                  <a
                    href={`tel:${salon.phone}`}
                    className={`${config.textColor} hover:${config.darkTextColor} font-medium`}
                  >
                    {salon.phone}
                  </a>
                </p>
              )}
              {salon.address && (
                <p className="flex items-center justify-center">
                  <MapPinIcon className={`w-5 h-5 mr-2 ${config.textColor}`} />
                  {salon.address}
                  {salon.city && `, ${salon.city}`}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} {salon?.name || "SalonHub"}. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper component for cleaner details
const DetailRow = ({ label, value, icon: Icon, config }) => (
  <div className="flex justify-between py-1.5 border-b border-slate-50/50">
    <span className="text-slate-600 flex items-center">
      {Icon && <Icon className={`w-4 h-4 mr-1 ${config.textColor}`} />}
      {label}
    </span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);

export default BookingConfirmation;
