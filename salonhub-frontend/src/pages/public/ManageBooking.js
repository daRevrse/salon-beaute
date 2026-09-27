/**
 * ManageBooking - « Gérer mon rendez-vous » (lien client, sans compte)
 *
 * Le client arrive depuis le lien de ses emails : il retrouve son RDV,
 * l'ajoute à son agenda (.ics), le déplace (même professionnel) ou
 * l'annule, dans le délai fixé par l'établissement.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import usePublicBooking from "../../hooks/usePublicBooking";
import { useCurrency } from "../../contexts/CurrencyContext";
import { usePublicTheme, formatDuration } from "../../contexts/PublicThemeContext";
import { getMapsUrl, getPhoneHref } from "../../utils/publicSalon";
import DayStrip, { fromDateKey, useUpcomingDays } from "../../components/public/DayStrip";
import SlotGrid from "../../components/public/SlotGrid";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowPathIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_API_URL;

const STATUS_INFO = {
  pending: { label: "En attente de confirmation", className: "bg-amber-50 text-amber-800 border-amber-200" },
  confirmed: { label: "Confirmé", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Annulé", className: "bg-slate-100 text-slate-600 border-slate-200" },
  completed: { label: "Terminé", className: "bg-slate-100 text-slate-600 border-slate-200" },
  no_show: { label: "Absent", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

const formatLongDate = (key) => {
  const label = fromDateKey(key).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// Réservation de plusieurs prestations : toutes sont recherchées ensemble
const serviceIds = (appointment) =>
  appointment.service_ids?.length ? appointment.service_ids : appointment.service_id;

const formatDeadline = (iso) => {
  const date = new Date(iso);
  return `${date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${date
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h")}`;
};

const ManageBooking = () => {
  const { slug, token } = useParams();
  const { formatPrice } = useCurrency();
  const { salon: themeSalon, dynamicStyles } = usePublicTheme();
  const { availableSlots, loading: slotsLoading, fetchAvailability } = usePublicBooking(slug);

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [mode, setMode] = useState(null); // null | "reschedule" | "cancel"
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  const days = useUpcomingDays(themeSalon?.business_hours);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/public/manage/${token}`);
      setData(res.data);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err.response?.status === 404
          ? "Ce lien n'est plus valide. Contactez l'établissement pour toute question sur votre rendez-vous."
          : "Impossible de charger votre rendez-vous. Réessayez dans un instant."
      );
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const appointment = data?.appointment;
  const salon = data?.salon || themeSalon;
  const policy = data?.policy;

  // Déplacement : créneaux du même professionnel, en ignorant le RDV actuel
  useEffect(() => {
    if (mode !== "reschedule" || !selectedDate || !appointment) return;
    setSelectedSlot(null);
    fetchAvailability(serviceIds(appointment), selectedDate, appointment.staff_id, token).catch(() => {});
  }, [mode, selectedDate, appointment, token, fetchAvailability]);

  const openReschedule = () => {
    setActionError(null);
    setNotice(null);
    setMode("reschedule");
    if (!selectedDate) {
      const firstOpen = days.find((d) => !d.closed);
      setSelectedDate(firstOpen?.key || "");
    }
  };

  const openCancel = () => {
    setActionError(null);
    setNotice(null);
    setMode("cancel");
  };

  const closeAction = () => {
    setMode(null);
    setActionError(null);
    setSelectedSlot(null);
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await axios.post(`${API_URL}/public/manage/${token}/reschedule`, {
        date: selectedDate,
        start_time: selectedSlot.time,
      });
      await load();
      setMode(null);
      setSelectedSlot(null);
      setNotice(
        res.data.status === "confirmed"
          ? "Votre rendez-vous a été déplacé et reste confirmé."
          : "Votre demande de déplacement est enregistrée. L'établissement va confirmer le nouveau créneau."
      );
    } catch (err) {
      setActionError(err.response?.data?.error || "Impossible de déplacer le rendez-vous");
      fetchAvailability(serviceIds(appointment), selectedDate, appointment.staff_id, token).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      await axios.post(`${API_URL}/public/manage/${token}/cancel`, { reason });
      await load();
      setMode(null);
      setNotice("Votre rendez-vous est annulé. L'établissement a été prévenu.");
    } catch (err) {
      setActionError(err.response?.data?.error || "Impossible d'annuler le rendez-vous");
    } finally {
      setSubmitting(false);
    }
  };

  const phoneHref = getPhoneHref(salon?.phone);
  const mapsUrl = getMapsUrl(salon);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" style={dynamicStyles.fontFamily}>
        <div className="text-center max-w-md bg-white rounded-3xl shadow-soft border border-slate-200 p-8">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Rendez-vous introuvable</h1>
          <p className="text-slate-600 mb-6">{loadError}</p>
          <Link to={`/book/${slug}`} className="inline-flex px-6 py-3 rounded-xl text-white font-medium" style={dynamicStyles.primaryButton}>
            Prendre un rendez-vous
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status" aria-label="Chargement">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400" />
      </div>
    );
  }

  const status = STATUS_INFO[appointment.status] || STATUS_INFO.pending;
  const isActive = ["pending", "confirmed"].includes(appointment.status);
  const canChange = isActive && policy?.can_change;
  const isGroup = (appointment.services || []).length > 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={dynamicStyles.fontFamily}>
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 text-center">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">{salon?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Mon rendez-vous</p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {notice && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900" role="status">
            <CheckCircleIcon className="h-6 w-6 flex-shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        {/* Récapitulatif */}
        <section className="bg-white rounded-3xl shadow-soft-xl border border-slate-200 overflow-hidden" aria-labelledby="manage-title">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h2 id="manage-title" className="text-lg font-bold text-slate-900">
              Bonjour {appointment.client_first_name} !
            </h2>
            <span className={`px-3 py-1 rounded-full border text-sm font-medium ${status.className}`}>{status.label}</span>
          </div>
          <dl className="px-6 py-5 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{isGroup ? "Prestations" : "Prestation"}</dt>
              <dd className="font-medium text-slate-900 text-right">
                {isGroup ? (
                  <ul className="space-y-1">
                    {appointment.services.map((item) => (
                      <li key={`${item.name}-${item.start_time}`}>
                        {item.name}{" "}
                        <span className="text-slate-500 font-normal">
                          {item.start_time.replace(":", "h")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  appointment.service_name
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Date
              </dt>
              <dd className="font-medium text-slate-900 text-right">{formatLongDate(appointment.date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Heure
              </dt>
              <dd className="font-medium text-slate-900">
                {appointment.start_time.replace(":", "h")} – {appointment.end_time.replace(":", "h")}
                <span className="text-slate-500 font-normal"> ({formatDuration(appointment.service_duration)})</span>
              </dd>
            </div>
            {appointment.staff_first_name && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 flex items-center">
                  <UserCircleIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Avec
                </dt>
                <dd className="font-medium text-slate-900">{appointment.staff_first_name}</dd>
              </div>
            )}
            {appointment.service_price !== null && appointment.service_price !== undefined && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Prix</dt>
                <dd className="font-medium text-slate-900">{formatPrice(appointment.service_price)}</dd>
              </div>
            )}
          </dl>

          {isActive && (
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <a
                href={`${API_URL}/public/manage/${token}/calendar.ics`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                Ajouter à mon agenda
              </a>
              {canChange && (
                <>
                  <button
                    type="button"
                    onClick={openReschedule}
                    aria-expanded={mode === "reschedule"}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium shadow-soft"
                    style={dynamicStyles.primaryButton}
                  >
                    <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
                    Déplacer
                  </button>
                  <button
                    type="button"
                    onClick={openCancel}
                    aria-expanded={mode === "cancel"}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-700 font-medium hover:bg-red-50"
                  >
                    <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                    Annuler
                  </button>
                </>
              )}
            </div>
          )}

          {isActive && (
            <div className="px-6 pb-6">
              <p className="flex items-start gap-2 text-sm text-slate-500">
                <InformationCircleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {canChange && policy.change_deadline ? (
                  <span>Vous pouvez déplacer ou annuler en ligne jusqu'au {formatDeadline(policy.change_deadline)}.</span>
                ) : (
                  <span>
                    {policy?.notice_hours === -1
                      ? "Pour déplacer ou annuler ce rendez-vous, contactez directement l'établissement"
                      : "Le délai pour modifier en ligne est dépassé : contactez directement l'établissement"}
                    {salon?.phone ? (
                      <>
                        {" au "}
                        <a href={phoneHref} className="font-medium underline" style={dynamicStyles.primaryText}>
                          {salon.phone}
                        </a>
                      </>
                    ) : null}
                    .
                  </span>
                )}
              </p>
            </div>
          )}
        </section>

        {/* Déplacer */}
        {mode === "reschedule" && (
          <section className="bg-white rounded-3xl shadow-soft-xl border border-slate-200 p-5 sm:p-6" aria-labelledby="reschedule-title">
            <h2 id="reschedule-title" className="text-lg font-semibold text-slate-900 mb-1">Choisir un nouveau créneau</h2>
            <p className="text-sm text-slate-500 mb-4">
              {appointment.staff_first_name ? `Avec ${appointment.staff_first_name}, ` : ""}
              {isGroup ? "mêmes prestations, à la suite" : "même prestation"} ({formatDuration(appointment.service_duration)}).
            </p>
            <DayStrip days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />

            <div className="mt-5">
              {slotsLoading ? (
                <p className="text-slate-500 text-sm" role="status">Recherche des créneaux disponibles...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-slate-600 text-sm">Aucun créneau disponible ce jour. Essayez une autre date.</p>
              ) : (
                <SlotGrid slots={availableSlots} onSelect={setSelectedSlot} selectedTime={selectedSlot?.time || ""} />
              )}
            </div>

            {actionError && (
              <p className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">{actionError}</p>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={closeAction} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">
                Retour
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={!selectedSlot || submitting}
                className="px-5 py-3 rounded-xl text-white font-medium shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                style={dynamicStyles.primaryButton}
              >
                {submitting
                  ? "Enregistrement..."
                  : selectedSlot
                  ? `Déplacer au ${fromDateKey(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à ${selectedSlot.time}`
                  : "Choisissez un créneau"}
              </button>
            </div>
          </section>
        )}

        {/* Annuler */}
        {mode === "cancel" && (
          <section className="bg-white rounded-3xl shadow-soft-xl border border-red-200 p-5 sm:p-6" aria-labelledby="cancel-title">
            <h2 id="cancel-title" className="text-lg font-semibold text-slate-900 mb-1">Annuler ce rendez-vous ?</h2>
            <p className="text-sm text-slate-500 mb-4">L'établissement sera prévenu et le créneau libéré.</p>
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-slate-700 mb-1">
              Motif (facultatif)
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Un empêchement, un imprévu..."
            />
            {actionError && (
              <p className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">{actionError}</p>
            )}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={closeAction} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">
                Garder mon rendez-vous
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-5 py-3 rounded-xl bg-red-600 text-white font-medium shadow-soft hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Annulation..." : "Confirmer l'annulation"}
              </button>
            </div>
          </section>
        )}

        {!isActive && (
          <div className="text-center">
            <Link
              to={`/book/${salon?.slug || slug}`}
              className="inline-flex px-6 py-3 rounded-xl text-white font-medium shadow-soft"
              style={dynamicStyles.primaryButton}
            >
              Reprendre un rendez-vous
            </Link>
          </div>
        )}
      </main>

      <footer className="mt-auto" style={dynamicStyles.footer}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center text-sm space-y-1">
          {phoneHref && (
            <a href={phoneHref} className="flex justify-center items-center gap-2 hover:underline">
              <PhoneIcon className="w-4 h-4" aria-hidden="true" />
              <span>{salon.phone}</span>
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2 hover:underline">
              <MapPinIcon className="w-4 h-4" aria-hidden="true" />
              <span>
                {salon.address}
                {salon.city && `, ${salon.city}`}
              </span>
            </a>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ManageBooking;
