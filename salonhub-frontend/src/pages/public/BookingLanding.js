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
  ShoppingBagIcon as ShoppingBag,
} from "@heroicons/react/24/outline";
import GalleryLightbox from "../../components/common/GalleryLightbox";
import {
  getDayHours,
  getDayKey,
  getWeekSchedule,
  hasBusinessHours,
  getMapsUrl,
  getPhoneHref,
} from "../../utils/publicSalon";

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
  const [activeCategory, setActiveCategory] = useState(null);

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

  const todayHours = getDayHours(salon?.business_hours, getDayKey(new Date()));
  const schedule = getWeekSchedule(salon?.business_hours);
  const mapsUrl = getMapsUrl(salon);
  const phoneHref = getPhoneHref(salon?.phone);
  const hasShop = ["PRO", "CUSTOM", "professional", "enterprise", "custom", "pro"].includes(
    salon?.subscription_plan
  );

  // Catégories (dans l'ordre d'apparition) pour filtrer et regrouper les prestations
  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))];
  const visibleServices = activeCategory
    ? services.filter((s) => s.category === activeCategory)
    : services;
  const groups =
    !activeCategory && categories.length > 1
      ? [
          ...categories.map((category) => ({
            category,
            items: services.filter((s) => s.category === category),
          })),
          { category: "Autres", items: services.filter((s) => !s.category) },
        ].filter((group) => group.items.length > 0)
      : [{ category: null, items: visibleServices }];

  const goToService = (service) =>
    navigate(`/book/${slug}/datetime?service=${service.id}`, { state: { service } });

  const scrollToServices = () =>
    document.getElementById("prestations")?.scrollIntoView({ behavior: "smooth" });

  const hasGallery = (service) => {
    if (!service.gallery) return false;
    try {
      const gallery = typeof service.gallery === "string" ? JSON.parse(service.gallery) : service.gallery;
      return Array.isArray(gallery) && gallery.length > 0;
    } catch (e) {
      return false;
    }
  };

  const renderServiceCard = (service) => (
    <div
      key={service.id}
      className="group relative bg-white rounded-2xl shadow-soft hover:shadow-soft-xl transition-all duration-300 overflow-hidden border border-slate-200"
    >
      <button
        type="button"
        onClick={() => goToService(service)}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-2xl"
        aria-label={`${term.book} : ${service.name}, ${formatPrice(service.price)}, ${formatDuration(service.duration)}`}
      >
        {/* Image (ou visuel neutre aux couleurs du salon) */}
        <div className="h-36 sm:h-40 bg-slate-100 overflow-hidden relative">
          {service.image_url ? (
            <img
              src={getImageUrl(service.image_url)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={dynamicStyles.gradientBg}>
              <SparklesIcon className="h-10 w-10 text-white/80" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{service.name}</h3>
          {service.description && (
            <p className="text-slate-600 text-sm line-clamp-2 mb-3">{service.description}</p>
          )}
          <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
            <span className="text-lg font-bold" style={dynamicStyles.primaryText}>
              {formatPrice(service.price)}
            </span>
            <span className="flex items-center gap-1 text-slate-500 text-sm">
              <ClockIcon className="w-4 h-4" />
              {formatDuration(service.duration)}
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 flex items-center justify-between" style={dynamicStyles.primaryBg}>
          <span className="font-medium text-sm" style={dynamicStyles.primaryText}>
            {term.book}
          </span>
          <ChevronRightIcon className="w-4 h-4" style={dynamicStyles.primaryText} />
        </div>
      </button>

      {hasGallery(service) && (
        <button
          type="button"
          onClick={(e) => openGallery(service, e)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          style={dynamicStyles.primaryText}
          aria-label={`Voir les photos : ${service.name}`}
        >
          <PhotoIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" style={dynamicStyles.fontFamily}>
      {/* Hero Section - Slideshow + Intro */}
      <div className="relative w-full min-h-[360px] h-[48vh] md:h-[60vh] overflow-hidden rounded-b-3xl shadow-soft-xl">
        {/* Background Images */}
        {salon?.banner_url ? (
          <img
            src={getImageUrl(salon.banner_url)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : salon?.images?.length > 0 ? (
          salon.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt=""
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
              alt={`Logo ${salon?.name || ""}`}
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-28 md:w-28 rounded-2xl border-4 border-white/30 shadow-soft-xl object-cover mb-3 bg-white p-2"
            />
          ) : (
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-28 md:w-28 rounded-2xl flex items-center justify-center border-4 border-white/30 shadow-soft-xl mb-3"
              style={dynamicStyles.gradientBg}
            >
              <SparklesIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold drop-shadow-xl">
            {salon?.name || `Votre ${term.establishment.toLowerCase()}`}
          </h1>

          <p className="mt-2 sm:mt-3 text-base sm:text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md px-4">
            {salon?.slogan || config.bookingSubtitle}
          </p>

          {hasBusinessHours(salon?.business_hours) && (
            <p className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm">
              <span className={`h-2 w-2 rounded-full ${todayHours ? "bg-emerald-400" : "bg-slate-300"}`} />
              {todayHours ? `Ouvert aujourd'hui · ${todayHours.open} – ${todayHours.close}` : "Fermé aujourd'hui"}
            </p>
          )}

          {/* Action principale visible dès le premier écran */}
          <button
            type="button"
            onClick={scrollToServices}
            className="mt-5 px-8 py-3 rounded-full text-white font-semibold shadow-soft-xl hover:opacity-90 transition-all"
            style={dynamicStyles.primaryButton}
          >
            {term.bookOnline}
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-white/90 text-sm sm:text-base">
            {phoneHref && (
              <a href={phoneHref} className="inline-flex items-center gap-2 hover:text-white underline-offset-4 hover:underline">
                <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                {salon.phone}
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white underline-offset-4 hover:underline text-center"
              >
                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                {salon.address}
                {salon.city && `, ${salon.city}`}
              </a>
            )}
          </div>

          {hasShop && (
            <button
              type="button"
              onClick={() => navigate(`/book/${slug}/shop`)}
              className="mt-4 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-semibold hover:bg-white hover:text-gray-900 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Accéder à la boutique
            </button>
          )}
        </div>
      </div>

      {/* Services Section */}
      <main id="prestations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 scroll-mt-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">
            Choisissez {businessType === "restaurant" ? "votre plat" : businessType === "training" ? "votre formation" : "votre prestation"}
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

        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 sm:justify-center" role="tablist" aria-label="Catégories">
            {[null, ...categories].map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category || "all"}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
                    active ? "shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  style={active ? dynamicStyles.activeOption : {}}
                >
                  {category || "Tout"}
                </button>
              );
            })}
          </div>
        )}

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {term.noServices} disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.category || "all"} aria-label={group.category || undefined}>
                {group.category && (
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">{group.category}</h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {group.items.map(renderServiceCard)}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Horaires de la semaine */}
        {hasBusinessHours(salon?.business_hours) && (
          <section className="mt-12 max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
              <ClockIcon className="w-5 h-5" style={dynamicStyles.primaryText} />
              Horaires d'ouverture
            </h3>
            <dl className="divide-y divide-slate-100">
              {schedule.map((day) => (
                <div
                  key={day.key}
                  className={`flex justify-between py-1.5 text-sm ${
                    day.key === getDayKey(new Date()) ? "font-semibold text-slate-900" : "text-slate-600"
                  }`}
                >
                  <dt>{day.label}</dt>
                  <dd>{day.hours ? `${day.hours.open} – ${day.hours.close}` : "Fermé"}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12" style={dynamicStyles.footer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm">
          {phoneHref && (
            <a href={phoneHref} className="flex justify-center items-center gap-2 mb-1 hover:underline">
              <PhoneIcon className="w-4 h-4" />
              <span>{salon.phone}</span>
            </a>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center items-center gap-2 hover:underline"
            >
              <MapPinIcon className="w-4 h-4" />
              <span>
                {salon.address}
                {salon.city && `, ${salon.city}`}
              </span>
            </a>
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
