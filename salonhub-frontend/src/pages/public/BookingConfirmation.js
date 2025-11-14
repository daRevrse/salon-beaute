/**
 * Page de confirmation de réservation
 * Affiche un récapitulatif et confirme que le rendez-vous a été enregistré
 */

import React, { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  // <-- Import Heroicons
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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {salon?.name || "Salon de Beauté"}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 shadow-lg">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Rendez-vous enregistré !
          </h2>
          <p className="text-xl text-gray-600">
            Merci, {client?.first_name || "Cher client"} !
          </p>
        </div>

        {/* Status Info - Enhanced Alert Style */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-10 shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800 mb-1">
                En attente de validation
              </h3>
              <div className="mt-2 text-base text-blue-700">
                <p>
                  Votre rendez-vous est en statut <strong>"en attente"</strong>.
                  Le salon vous confirmera dans les plus brefs délais.
                  {client?.preferred_contact_method && (
                    <span>
                      {" "}
                      Nous utiliserons{" "}
                      <strong>
                        {client.preferred_contact_method === "email" &&
                          "📧 Email"}
                        {client.preferred_contact_method === "sms" && "💬 SMS"}
                        {client.preferred_contact_method === "whatsapp" &&
                          "📱 WhatsApp"}
                        {client.preferred_contact_method === "phone" &&
                          "📞 Téléphone"}
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-indigo-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">Récapitulatif</h3>
          </div>

          <div className="px-6 py-6 space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Détails du Rendez-vous
            </h4>

            {service && <DetailRow label="Service" value={service.name} />}

            {date && <DetailRow label="Date" value={formatDate(date)} />}

            {slot && (
              <DetailRow label="Heure" value={slot.time} icon={ClockIcon} />
            )}

            {service && (
              <DetailRow label="Durée" value={`${service.duration} minutes`} />
            )}

            {service && (
              <div className="flex justify-between py-3 border-t border-gray-100 mt-4 pt-4">
                <span className="text-xl font-semibold text-gray-700">
                  Prix Total
                </span>
                <span className="font-bold text-indigo-600 text-2xl flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 mr-1" />
                  {formatPrice(service.price)}
                </span>
              </div>
            )}

            {client && (
              <>
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3 pt-6 flex items-center">
                  <UserCircleIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  Vos Coordonnées
                </h4>

                <DetailRow
                  label="Nom"
                  value={`${client.first_name} ${client.last_name}`}
                />
                <DetailRow
                  label="Téléphone"
                  value={client.phone}
                  icon={PhoneIconOutline}
                />
                {client.email && (
                  <DetailRow
                    label="Email"
                    value={client.email}
                    icon={EnvelopeIcon}
                  />
                )}
                {client.notes && (
                  <div className="py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 block mb-1 font-medium">
                      Notes
                    </span>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 italic border border-gray-200">
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
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150 shadow-md"
          >
            Prendre un autre rendez-vous
          </button>
        </div>

        {/* Contact Info */}
        {salon && (salon.phone || salon.address) && (
          <div className="mt-12 text-center border-t pt-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Besoin d'assistance ?
            </h3>
            <div className="space-y-2 text-base text-gray-600">
              {salon.phone && (
                <p className="flex items-center justify-center">
                  <PhoneIconOutline className="w-5 h-5 mr-2 text-indigo-600" />
                  <a
                    href={`tel:${salon.phone}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {salon.phone}
                  </a>
                </p>
              )}
              {salon.address && (
                <p className="flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  {salon.address}
                  {salon.city && `, ${salon.city}`}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {salon?.name || "SalonHub"}. Tous
            droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper component for cleaner details
const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex justify-between py-1.5 border-b border-gray-50/50">
    <span className="text-gray-600 flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-1 text-gray-500" />}
      {label}
    </span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default BookingConfirmation;
