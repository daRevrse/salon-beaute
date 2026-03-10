/**
 * PublicBookingLayout.js
 * Layout partagé pour le tunnel de réservation
 * Gère le chargement initial des données et l'application du thème
 */

import React, { useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import { PublicThemeProvider, usePublicTheme } from "../../contexts/PublicThemeContext";
import usePublicBooking from "../../hooks/usePublicBooking";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import { useCurrency } from "../../contexts/CurrencyContext";

const PublicBookingLayoutContent = () => {
  const { slug } = useParams();
  const { changeCurrency } = useCurrency();
  const { setSalon, setSettings } = usePublicTheme();
  
  const { 
    salon, 
    settings, 
    loading, 
    error, 
    fetchSalon, 
    fetchSettings 
  } = usePublicBooking(slug);

  useEffect(() => {
    const loadData = async () => {
      try {
        const salonData = await fetchSalon();
        if (salonData?.currency) {
          changeCurrency(salonData.currency);
        }
        await fetchSettings();
      } catch (err) {
        console.error("Error loading layout data:", err);
      }
    };
    loadData();
  }, [slug, fetchSalon, fetchSettings, changeCurrency]);

  // Mettre à jour le contexte quand les données arrivent
  useEffect(() => {
    if (salon) setSalon(salon);
  }, [salon, setSalon]);

  useEffect(() => {
    if (settings) setSettings(settings);
  }, [settings, setSettings]);

  if (loading && !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement de l'établissement...</p>
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
        </div>
      </div>
    );
  }

  return <Outlet />;
};

const PublicBookingLayout = () => {
  return (
    <PublicThemeProvider>
      <PublicBookingLayoutContent />
    </PublicThemeProvider>
  );
};

export default PublicBookingLayout;
