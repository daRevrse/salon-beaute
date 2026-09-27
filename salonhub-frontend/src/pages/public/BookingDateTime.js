/**
 * Public Booking DateTime Page - Purple Dynasty Theme
 * Multi-Sector Adaptive with Business Type Terminology
 *
 * Étape 2 : choix du professionnel, du jour (bandeau des 14 prochains jours,
 * jours fermés grisés) et du créneau. La prestation, le jour et le
 * professionnel sont repris de l'URL : un rafraîchissement ou un lien
 * partagé conserve la sélection.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import { usePublicTheme, formatDuration } from "../../contexts/PublicThemeContext";
import { getImageUrl } from "../../utils/imageUtils";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import {
  getDayHours,
  getDayKey,
  hasBusinessHours,
  getMapsUrl,
  getPhoneHref,
} from "../../utils/publicSalon";
import {
  ClockIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  MapPinIcon,
  UserCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const DAYS_AHEAD = 14;

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Regroupe les créneaux par moment de la journée
const SLOT_GROUPS = [
  { label: "Matin", test: (h) => h < 12 },
  { label: "Après-midi", test: (h) => h >= 12 && h < 18 },
  { label: "Soir", test: (h) => h >= 18 },
];

const BookingDateTime = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  const { salon, dynamicStyles } = usePublicTheme();

  const {
    availableSlots,
    loading,
    error,
    fetchServices,
    fetchAvailability,
    fetchStaff,
  } = usePublicBooking(slug);

  const businessType = salon?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  const serviceParam = searchParams.get("service");
  const [service, setService] = useState(location.state?.service || null);
  const [selectedDate, setSelectedDate] = useState(
    location.state?.date || searchParams.get("date") || ""
  );
  // Choix du professionnel (null = sans préférence)
  const [staffOptions, setStaffOptions] = useState([]);
  const initialStaff = location.state?.staff?.id || Number(searchParams.get("staff")) || null;
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaff);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  // Jour choisi automatiquement (pas par le client) : on avance jusqu'au premier jour disponible
  const autoPickRef = useRef(!(location.state?.date || searchParams.get("date")));
  const selectedStaff = staffOptions.find((m) => m.id === selectedStaffId) || null;

  const today = toDateKey(new Date());
  const salonHasHours = hasBusinessHours(salon?.business_hours);

  // 14 prochains jours, jours fermés signalés
  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const closed = salonHasHours && !getDayHours(salon?.business_hours, getDayKey(date));
      return { key: toDateKey(date), date, closed };
    });
  }, [salon, salonHasHours]);

  // Prestation : état de navigation, sinon ?service= (rafraîchissement / lien partagé)
  useEffect(() => {
    if (service) return;
    if (!serviceParam) {
      navigate(`/book/${slug}`, { replace: true });
      return;
    }
    let active = true;
    fetchServices()
      .then((list) => {
        if (!active) return;
        const found = (list || []).find((s) => String(s.id) === serviceParam);
        if (found) setService(found);
        else navigate(`/book/${slug}`, { replace: true });
      })
      .catch(() => active && navigate(`/book/${slug}`, { replace: true }));
    return () => {
      active = false;
    };
  }, [service, serviceParam, slug, navigate, fetchServices]);

  // Jour par défaut : le premier jour ouvert
  useEffect(() => {
    if (selectedDate || days.length === 0) return;
    const firstOpen = days.find((d) => !d.closed);
    if (firstOpen) setSelectedDate(firstOpen.key);
  }, [days, selectedDate]);

  useEffect(() => {
    if (!service) return;
    let active = true;
    fetchStaff(service.id).then((staff) => {
      if (!active) return;
      setStaffOptions(staff);
      // Préférence devenue invalide (pro qui ne réalise plus la prestation)
      setSelectedStaffId((current) =>
        current && !staff.some((m) => m.id === current) ? null : current
      );
    });
    return () => {
      active = false;
    };
  }, [service, fetchStaff]);

  useEffect(() => {
    if (selectedDate && service) {
      setAvailabilityMessage(null);
      fetchAvailability(service.id, selectedDate, selectedStaffId)
        .then((result) => {
          setAvailabilityMessage(result?.message || null);
          if (autoPickRef.current && (result?.slots || []).length === 0) {
            // Plus de créneau ce jour-là (ex. aujourd'hui en fin de journée) : jour ouvert suivant
            const index = days.findIndex((d) => d.key === selectedDate);
            const next = days.slice(index + 1).find((d) => !d.closed);
            if (next) setSelectedDate(next.key);
            else autoPickRef.current = false;
          } else {
            autoPickRef.current = false;
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedStaffId, service, fetchAvailability]);

  const chooseDate = (key) => {
    autoPickRef.current = false;
    setSelectedDate(key);
  };

  // Garder la sélection dans l'URL
  useEffect(() => {
    if (!service) return;
    const next = { service: String(service.id) };
    if (selectedDate) next.date = selectedDate;
    if (selectedStaffId) next.staff = String(selectedStaffId);
    setSearchParams(next, { replace: true, state: location.state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, selectedDate, selectedStaffId]);

  const handleSlotSelect = (slot) => {
    const params = new URLSearchParams({ service: service.id, date: selectedDate, time: slot.time });
    if (selectedStaff) params.set("staff", selectedStaff.id);
    navigate(`/book/${slug}/info?${params.toString()}`, {
      state: {
        service,
        date: selectedDate,
        slot,
        staff: selectedStaff,
      },
    });
  };

  const handleBack = () => {
    navigate(`/book/${slug}`);
  };

  const slotGroups = SLOT_GROUPS.map((group) => ({
    label: group.label,
    slots: availableSlots.filter((slot) => group.test(Number(slot.time.split(":")[0]))),
  })).filter((group) => group.slots.length > 0);

  const selectedDay = days.find((d) => d.key === selectedDate);
  const isOtherDate = selectedDate && !selectedDay;
  const mapsUrl = getMapsUrl(salon);
  const phoneHref = getPhoneHref(salon?.phone);

  const emptyMessage = selectedStaff
    ? `${selectedStaff.first_name} n'a plus de créneau ce jour. Essayez une autre date ou « Sans préférence ».`
    : availabilityMessage === "Fermé ce jour"
    ? "Fermé ce jour. Choisissez un autre jour d'ouverture."
    : "Tous les créneaux de ce jour sont réservés. Essayez une autre date.";

  return (
    <div className="min-h-screen relative flex flex-col" style={dynamicStyles.fontFamily}>
      {/* Background Image with Overlay */}
      {service?.image_url && (
        <div className="fixed inset-0 z-0">
          <img src={getImageUrl(service.image_url)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center transition-colors font-medium"
                style={dynamicStyles.primaryText}
              >
                <ChevronLeftIcon className="w-5 h-5 mr-1 sm:mr-2" />
                Retour
              </button>
              <div className="text-center flex-1 min-w-0 px-2">
                <h1 className="text-lg sm:text-2xl font-display font-bold text-slate-900 truncate">
                  {salon?.name || term.establishment}
                </h1>
              </div>
              <div className="w-16 sm:w-20"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Step indicator */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold mb-2"
              style={{ ...dynamicStyles.primaryBg, ...dynamicStyles.primaryText }}
            >
              Étape 2 sur 3
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Choisissez la date et l'heure
            </h2>
          </div>

          {/* Selected Service */}
          {service && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-6 shadow-soft relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={dynamicStyles.primaryButton} />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-lg sm:text-xl">{service.name}</p>
                  <p className="text-sm text-slate-600 mt-2 flex items-center gap-3">
                    <span className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1.5" style={dynamicStyles.primaryText} />
                      {formatDuration(service.duration)}
                    </span>
                    <span className="flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1.5" style={dynamicStyles.primaryText} />
                      {formatPrice(service.price)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-slate-50"
                  style={dynamicStyles.primaryText}
                >
                  Changer
                </button>
              </div>
            </div>
          )}

          {/* Choix du professionnel */}
          {staffOptions.length > 1 && (
            <div className="bg-white rounded-2xl shadow-soft-xl p-5 sm:p-6 mb-6 border border-slate-200">
              <h3 className="flex items-center text-lg font-semibold text-slate-700 mb-4">
                <UserCircleIcon className="w-6 h-6 mr-2" style={dynamicStyles.primaryText} />
                Avec qui ?
              </h3>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Choix du professionnel">
                {[{ id: null, first_name: "Sans préférence", last_initial: "" }, ...staffOptions].map((member) => {
                  const isSelected = selectedStaffId === member.id;
                  return (
                    <button
                      key={member.id ?? "any"}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedStaffId(member.id)}
                      className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                        isSelected ? "shadow-md" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                      style={isSelected ? dynamicStyles.activeOption : {}}
                    >
                      {member.id === null ? (
                        <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <SparklesIcon className="h-4 w-4 text-slate-500" />
                        </span>
                      ) : member.avatar_url ? (
                        <img src={getImageUrl(member.avatar_url)} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span
                          className="h-8 w-8 rounded-full flex items-center justify-center font-semibold"
                          style={{ ...dynamicStyles.primaryBg, ...dynamicStyles.primaryText }}
                        >
                          {member.first_name?.charAt(0)}
                        </span>
                      )}
                      <span>
                        {member.first_name} {member.last_initial}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Choix du jour */}
          <div className="bg-white rounded-2xl shadow-soft-xl p-5 sm:p-6 mb-6 border border-slate-200">
            <h3 className="flex items-center text-lg font-semibold text-slate-700 mb-4">
              <CalendarDaysIcon className="w-6 h-6 mr-2" style={dynamicStyles.primaryText} />
              Quel jour ?
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="radiogroup" aria-label="Choix du jour">
              {days.map((day) => {
                const isSelected = day.key === selectedDate;
                const weekday = day.date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
                const month = day.date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
                return (
                  <button
                    key={day.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${day.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${day.closed ? " (fermé)" : ""}`}
                    disabled={day.closed}
                    onClick={() => chooseDate(day.key)}
                    className={`flex-shrink-0 w-16 py-2.5 rounded-2xl border-2 text-center transition-all ${
                      day.closed
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : isSelected
                        ? "shadow-md"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                    style={isSelected ? dynamicStyles.activeOption : {}}
                  >
                    <span className="block text-xs capitalize">
                      {day.key === today ? "Auj." : weekday}
                    </span>
                    <span className="block text-lg font-bold leading-tight">{day.date.getDate()}</span>
                    <span className="block text-[11px] capitalize">{day.closed ? "Fermé" : month}</span>
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              Autre date :
              <input
                type="date"
                value={isOtherDate ? selectedDate : ""}
                min={today}
                onChange={(e) => e.target.value && chooseDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white"
              />
            </label>
          </div>

          {/* Available Slots */}
          {loading && selectedDate && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={dynamicStyles.primaryBorder}></div>
              <p className="mt-4 text-slate-600">Recherche des créneaux disponibles...</p>
            </div>
          )}

          {!loading && selectedDate && availableSlots.length === 0 && (
            <div className="text-center py-10 px-4 bg-white rounded-2xl shadow-soft border border-slate-200">
              <ClockIcon className="mx-auto h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-xl font-medium text-slate-900 mb-2">Aucun créneau disponible</h3>
              <p className="text-slate-600">{emptyMessage}</p>
            </div>
          )}

          {!loading && selectedDate && availableSlots.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft-xl p-5 sm:p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {fromDateKey(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {availableSlots.length} créneau{availableSlots.length > 1 ? "x" : ""} disponible{availableSlots.length > 1 ? "s" : ""}
                {selectedStaff ? ` avec ${selectedStaff.first_name}` : ""}
              </p>
              <div className="space-y-5">
                {slotGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{group.label}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                      {group.slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className="px-3 py-3 border rounded-xl text-center font-medium text-slate-900 shadow-soft hover:shadow-md focus:outline-none focus:ring-2 transition-all"
                          style={{ ...dynamicStyles.primaryBg, ...dynamicStyles.primaryBorderLight }}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-8">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto" style={dynamicStyles.footer}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm">
            {phoneHref && (
              <a href={phoneHref} className="flex justify-center items-center gap-2 mb-1 hover:underline">
                <PhoneIcon className="w-4 h-4" />
                <span>{salon.phone}</span>
              </a>
            )}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2 hover:underline">
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
      </div>
    </div>
  );
};

export default BookingDateTime;
