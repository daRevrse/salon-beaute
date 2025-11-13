/**
 * Page de confirmation de réservation
 * Affiche un récapitulatif et confirme que le rendez-vous a été enregistré
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import usePublicBooking from '../../hooks/usePublicBooking';
import { useCurrency } from '../../contexts/CurrencyContext';

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
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {salon?.name || 'Salon de Beauté'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Rendez-vous enregistré !
          </h2>
          <p className="text-lg text-gray-600">
            Votre demande de rendez-vous a été enregistrée avec succès.
          </p>
        </div>

        {/* Status Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                En attente de validation
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Votre rendez-vous sera validé par le salon dans les plus brefs délais.
                  {client?.preferred_contact_method && (
                    <span>
                      {' '}Vous serez contacté par{' '}
                      <strong>
                        {client.preferred_contact_method === 'email' && '📧 Email'}
                        {client.preferred_contact_method === 'sms' && '💬 SMS'}
                        {client.preferred_contact_method === 'whatsapp' && '📱 WhatsApp'}
                        {client.preferred_contact_method === 'phone' && '📞 Téléphone'}
                      </strong>
                      {' '}pour confirmation.
                    </span>
                  )}
                  {!client?.preferred_contact_method && ' Vous serez contacté pour confirmation.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-indigo-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              Récapitulatif de votre réservation
            </h3>
          </div>

          <div className="px-6 py-6 space-y-4">
            {service && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Service</span>
                <span className="font-medium text-gray-900">{service.name}</span>
              </div>
            )}

            {date && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Date</span>
                <span className="font-medium text-gray-900">{formatDate(date)}</span>
              </div>
            )}

            {slot && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Heure</span>
                <span className="font-medium text-gray-900">{slot.time}</span>
              </div>
            )}

            {service && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Durée</span>
                <span className="font-medium text-gray-900">{service.duration} minutes</span>
              </div>
            )}

            {service && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Prix</span>
                <span className="font-medium text-indigo-600 text-lg">{formatPrice(service.price)}</span>
              </div>
            )}

            {client && (
              <>
                <div className="pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Vos coordonnées</h4>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Nom</span>
                  <span className="font-medium text-gray-900">
                    {client.first_name} {client.last_name}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Téléphone</span>
                  <span className="font-medium text-gray-900">{client.phone}</span>
                </div>

                {client.email && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900">{client.email}</span>
                  </div>
                )}

                {client.notes && (
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">Notes</span>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">
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
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150"
          >
            Prendre un autre rendez-vous
          </button>
        </div>

        {/* Contact Info */}
        {salon && (salon.phone || salon.address) && (
          <div className="mt-12 text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Besoin d'aide ?
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              {salon.phone && (
                <p>
                  <span className="inline-block mr-2">📞</span>
                  <a href={`tel:${salon.phone}`} className="text-indigo-600 hover:text-indigo-700">
                    {salon.phone}
                  </a>
                </p>
              )}
              {salon.address && (
                <p>
                  <span className="inline-block mr-2">📍</span>
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
            Merci d'avoir choisi {salon?.name || 'notre salon'} !
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BookingConfirmation;
