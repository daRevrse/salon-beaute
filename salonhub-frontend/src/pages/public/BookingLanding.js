/**
 * Page d'accueil du système de réservation
 * Version améliorée style site professionnel de salon
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";

// Icônes Heroicons
import {
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const BookingLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { formatPrice, setSalonBaseCurrency } = useCurrency();

  const { salon, services, loading, error, fetchSalon, fetchServices } =
    usePublicBooking(slug);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const salonData = await fetchSalon();
      if (salonData?.currency) {
        setSalonBaseCurrency(salonData.currency);
      }
      await fetchServices();
    };
    loadData();
  }, []);

  // AUTO SLIDESHOW EVERY 5 SECONDS
  useEffect(() => {
    if (!salon?.images?.length) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % salon.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [salon?.images]);

  if (loading && !salon && services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------ */}
      {/* HERO SECTION – SLIDESHOW + INTRO                       */}
      {/* ------------------------------------------------------ */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden rounded-b-3xl shadow-lg">
        {/* IMAGES BACKGROUND */}
        {salon?.banner_url ? (
          /* Bannière du salon si disponible */
          <img
            src={salon.banner_url.replace("api/", "")}
            alt="Bannière du salon"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : salon?.images?.length > 0 ? (
          /* Slideshow d'images si disponible */
          salon.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Salon image ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        ) : (
          /* Image par défaut */
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&h=600&fit=crop"
            alt="Salon de beauté"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        {/* HERO CONTENT */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
          <img
            src={
              salon?.logo_url?.replace("api/", "") ||
              "https://placehold.net/4.png"
            }
            alt="Salon Logo"
            className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-full border-4 border-white shadow-lg object-cover mb-4 bg-white p-2"
          />
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold drop-shadow-xl">
            {salon?.name || "Votre salon de beauté"}
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md px-4">
            Réservez votre prestation en quelques clics. Professionnalisme,
            confort et expertise.
          </p>

          {salon?.phone && (
            <div className="flex items-center justify-center gap-2 mt-6 text-white/90 text-sm sm:text-base">
              <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{salon.phone}</span>
            </div>
          )}

          {salon?.address && (
            <div className="flex items-center justify-center gap-2 text-white/90 mt-1 text-sm sm:text-base px-4 text-center">
              <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>
                {salon.address} {salon.city && `, ${salon.city}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* SERVICES SECTION                                       */}
      {/* ------------------------------------------------------ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Choisissez votre prestation
          </h2>
          <p className="text-gray-600">
            Découvrez notre sélection de services professionnels
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              Aucun service disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() =>
                  navigate(`/book/${slug}/datetime`, { state: { service } })
                }
                className="group bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* SERVICE IMAGE */}
                <div className="h-40 bg-gray-100 overflow-hidden relative">
                  <img
                    src={
                      service.image_url?.replace("api/", "") ||
                      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop"
                    }
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition"></div>
                </div>

                {/* CONTENT */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {service.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center border-t pt-3 mt-3">
                    <span className="text-indigo-600 text-lg sm:text-xl font-bold">
                      {formatPrice(service.price)}
                    </span>

                    <div className="flex items-center gap-1 text-gray-500">
                      <ClockIcon className="w-5 h-5" />
                      <span className="text-sm">{service.duration} min</span>
                    </div>
                  </div>

                  {service.category && (
                    <span className="inline-block mt-3 px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                      {service.category}
                    </span>
                  )}
                </div>

                <div className="bg-indigo-50 px-4 sm:px-6 py-3 flex items-center justify-between">
                  <span className="text-indigo-600 font-medium text-sm">
                    Réserver ce service
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------ */}
      {/* FOOTER                                                 */}
      {/* ------------------------------------------------------ */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          {salon?.phone && (
            <div className="flex justify-center items-center gap-2 mb-1">
              <PhoneIcon className="w-4 h-4" />
              <span>{salon.phone}</span>
            </div>
          )}

          {salon?.address && (
            <div className="flex justify-center items-center gap-2">
              <MapPinIcon className="w-4 h-4" />
              <span>
                {salon.address} {salon.city && `, ${salon.city}`}
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default BookingLanding;
