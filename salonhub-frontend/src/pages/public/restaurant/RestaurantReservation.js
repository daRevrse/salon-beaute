/**
 * RestaurantReservation.js - Réservation de table en ligne
 * Calendrier, sélection heure, nombre de personnes
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Get base API URL - remove trailing /api if present for proper path construction
const RAW_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL.slice(0, -4) : RAW_API_URL;

export default function RestaurantReservation() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: date/heure, 2: infos, 3: confirmation
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    reservation_date: "",
    reservation_time: "",
    party_size: 2,
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    special_requests: "",
  });

  useEffect(() => {
    fetchRestaurant();
  }, [slug]);

  useEffect(() => {
    if (formData.reservation_date && formData.party_size) {
      fetchAvailability();
    }
  }, [formData.reservation_date, formData.party_size]);

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/restaurant/${slug}`);
      if (!res.ok) throw new Error("Restaurant non trouvé");
      const data = await res.json();
      setRestaurant(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoadingSlots(true);
      const res = await fetch(
        `${API_URL}/api/public/restaurant/${slug}/tables/availability?date=${formData.reservation_date}&party_size=${formData.party_size}`
      );
      const data = await res.json();
      setAvailableSlots(data.data?.available_times || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/public/restaurant/${slug}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la réservation");
      }

      setConfirmation(data.data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate date options (next 30 days)
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }
    return dates;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/r/${slug}`} className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Réserver une table</h1>
            <p className="text-sm text-gray-500">{restaurant?.business_name || restaurant?.name}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? <CheckCircleIcon className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 ${
                    step > s ? "bg-orange-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Date & Heure</span>
          <span>Coordonnées</span>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Choisissez votre créneau
            </h2>

            {/* Party Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserGroupIcon className="w-5 h-5 inline-block mr-2" />
                Nombre de personnes
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, party_size: num })}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.party_size === num
                        ? "border-orange-600 bg-orange-50 text-orange-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDaysIcon className="w-5 h-5 inline-block mr-2" />
                Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {getDateOptions().slice(0, 7).map((date) => (
                  <button
                    key={date.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, reservation_date: date.value, reservation_time: "" })}
                    className={`px-3 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                      formData.reservation_date === date.value
                        ? "border-orange-600 bg-orange-50 text-orange-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {date.label}
                  </button>
                ))}
              </div>
              <select
                value={formData.reservation_date}
                onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value, reservation_time: "" })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Voir plus de dates...</option>
                {getDateOptions().map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slots */}
            {formData.reservation_date && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="w-5 h-5 inline-block mr-2" />
                  Heure
                </label>
                {loadingSlots ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Aucun créneau disponible pour cette date
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, reservation_time: slot })}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          formData.reservation_time === slot
                            ? "border-orange-600 bg-orange-50 text-orange-600"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.reservation_date || !formData.reservation_time}
              className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Vos coordonnées
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="jean@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Demandes spéciales
                </label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) =>
                    setFormData({ ...formData, special_requests: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Anniversaire, chaise bébé, allergies..."
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Récapitulatif</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(formData.reservation_date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p>
                  <strong>Heure:</strong> {formData.reservation_time}
                </p>
                <p>
                  <strong>Personnes:</strong> {formData.party_size}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:bg-gray-300"
              >
                {submitting ? "Réservation..." : "Confirmer"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && confirmation && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Réservation confirmée !
            </h2>
            <p className="text-gray-600 mb-6">
              Un email de confirmation a été envoyé à {formData.customer_email}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Code de réservation</p>
              <p className="text-2xl font-bold text-orange-600">
                {confirmation.confirmation_code}
              </p>
            </div>

            <div className="text-left space-y-2 text-sm">
              <p>
                <strong>Restaurant:</strong> {restaurant?.business_name || restaurant?.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(confirmation.date || confirmation.reservation_date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>
                <strong>Heure:</strong> {confirmation.time || confirmation.reservation_time}
              </p>
              <p>
                <strong>Personnes:</strong> {confirmation.party_size}
              </p>
              {confirmation.table_number && (
                <p>
                  <strong>Table:</strong> {confirmation.table_number}
                </p>
              )}
            </div>

            <Link
              to={`/r/${slug}`}
              className="mt-6 inline-block px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
            >
              Retour au restaurant
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
