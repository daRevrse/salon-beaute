/**
 * Public Booking Landing Page - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { usePublicTheme } from "../../contexts/PublicThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { getImageUrl } from "../../utils/imageUtils";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";

import {
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import GalleryLightbox from "../../components/common/GalleryLightbox";

// Fonction utilitaire pour formater les minutes en HH:MM ou texte lisible
const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? `1 heure` : `${h} heures`;
  return `${h}h${String(m).padStart(2, "0")}`;
};

const BookingLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { salon, settings, dynamicStyles, theme: themeSettings } = usePublicTheme();

  const { services, loading, error, fetchServices } =
    usePublicBooking(slug);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);

  // Open gallery lightbox for a service
  const openGallery = useCallback((service, e) => {
    e.stopPropagation();
    // Parse gallery if it's a string
    let galleryData = [];
    if (service.gallery) {
      galleryData = typeof service.gallery === 'string'
        ? JSON.parse(service.gallery)
        : service.gallery;
    }
    // Combine main image with gallery images
    const allImages = [service.image_url, ...galleryData].filter(Boolean);
    setLightboxImages(allImages);
    setLightboxOpen(true);
  }, []);

  // Business type configuration
  const businessType = salon?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Auto slideshow every 5 seconds
  useEffect(() => {
    if (!salon?.images?.length) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % salon.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [salon?.images]);

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto"
            style={dynamicStyles.primaryBorder}
          />
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isUnavailable = error.includes("n'est pas disponible");
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className={`w-16 h-16 ${isUnavailable ? 'bg-amber-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isUnavailable ? (
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isUnavailable ? "Page temporairement indisponible" : "Erreur"}
          </h2>
          <p className="text-slate-600">{error}</p>
          {isUnavailable && (
            <p className="text-slate-500 text-sm mt-2">Veuillez réessayer plus tard ou contacter directement l'établissement.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={dynamicStyles.fontFamily}>
      {/* Hero Section - Slideshow + Intro */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden rounded-b-3xl shadow-soft-xl">
        {/* Background Images */}
        {salon?.banner_url ? (
          <img
            src={getImageUrl(salon.banner_url)}
            alt={`Bannière ${term.establishment}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : salon?.images?.length > 0 ? (
          salon.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Image ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        ) : (
          <div className="absolute inset-0" style={dynamicStyles.gradientBg}></div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
          {salon?.logo_url ? (
            <img
              src={getImageUrl(salon.logo_url)}
              alt="Logo"
              className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-2xl border-4 border-white/30 shadow-soft-xl object-cover mb-4 bg-white p-2"
            />
          ) : (
            <div
              className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-2xl flex items-center justify-center border-4 border-white/30 shadow-soft-xl mb-4"
              style={dynamicStyles.gradientBg}
            >
              <SparklesIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold drop-shadow-xl">
            {salon?.name || `Votre ${term.establishment.toLowerCase()}`}
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md px-4">
            {salon?.slogan || config.bookingSubtitle}
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

      {/* Services Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3">
            Choisissez {businessType === "restaurant" ? "votre plat" : businessType === "training" ? "votre formation" : businessType === "medical" ? "votre prestation" : "votre prestation"}
          </h2>
          <p className="text-slate-600">
            {businessType === "restaurant"
              ? "Découvrez notre carte"
              : businessType === "training"
              ? "Découvrez nos formations professionnelles"
              : businessType === "medical"
              ? "Découvrez nos prestations de santé"
              : "Découvrez notre sélection de services professionnels"}
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {term.noServices} disponible pour le moment.
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
                className="group bg-white rounded-2xl shadow-soft hover:shadow-soft-xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200"
              >
                {/* Service Image */}
                <div className="h-40 bg-slate-100 overflow-hidden relative">
                  <img
                    src={
                      getImageUrl(service.image_url) ||
                      `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop`
                    }
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition"></div>

                  {/* Gallery button */}
                  {service.gallery && (
                    typeof service.gallery === 'string'
                      ? JSON.parse(service.gallery).length > 0
                      : service.gallery.length > 0
                  ) && (
                    <button
                      onClick={(e) => openGallery(service, e)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                      style={dynamicStyles.primaryText}
                      title="Voir la galerie"
                    >
                      <PhotoIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {service.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
                    <span className="text-lg sm:text-xl font-bold" style={dynamicStyles.primaryText}>
                      {formatPrice(service.price)}
                    </span>

                    <div className="flex items-center gap-1 text-slate-500">
                      <ClockIcon className="w-5 h-5" />
                      <span className="text-sm">{formatDuration(service.duration)}</span>
                    </div>
                  </div>

                  {service.category && (
                    <span
                      className="inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full"
                      style={{ ...dynamicStyles.primaryBg, ...dynamicStyles.primaryText }}
                    >
                      {service.category}
                    </span>
                  )}
                </div>

                <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={dynamicStyles.primaryBg}>
                  <span className="font-medium text-sm" style={dynamicStyles.primaryText}>
                    {term.book}
                  </span>
                  <ChevronRightIcon className="w-4 h-4" style={dynamicStyles.primaryText} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12" style={dynamicStyles.footer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm">
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

          <p className="mt-4 text-xs" style={dynamicStyles.footerMuted}>
            © {new Date().getFullYear()} {salon?.name || "SalonHub"}. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Gallery Lightbox */}
      <GalleryLightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default BookingLanding;
