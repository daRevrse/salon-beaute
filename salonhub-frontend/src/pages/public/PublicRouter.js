/**
 * PublicRouter.js - Router dynamique selon le business_type
 * Redirige vers la bonne page publique selon le secteur d'activité
 */

import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import api from "../../services/api";

// Pages publiques par secteur
import BookingLanding from "./BookingLanding";
import RestaurantLanding from "./restaurant/RestaurantLanding";
import TrainingLanding from "./training/TrainingLanding";
import MedicalLanding from "./medical/MedicalLanding";

const PublicRouter = () => {
  const { slug } = useParams();
  const [businessType, setBusinessType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/public/tenant/${slug}`);
        if (response.data.success) {
          setBusinessType(response.data.data.business_type || "beauty");
        } else {
          setError("Établissement introuvable");
        }
      } catch (err) {
        console.error("Error fetching tenant:", err);
        // Handle different error types
        if (err.response?.status === 403) {
          // Subscription expired or inactive
          setError("Page indisponible");
        } else {
          setError("Établissement introuvable");
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchTenantInfo();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isUnavailable = error === "Page indisponible";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md px-4">
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
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {isUnavailable ? "Page temporairement indisponible" : "Établissement introuvable"}
          </h2>
          <p className="text-slate-500">
            {isUnavailable
              ? "Cette page de réservation n'est pas disponible actuellement. Veuillez réessayer plus tard ou contacter directement l'établissement."
              : "Vérifiez l'URL et réessayez"}
          </p>
        </div>
      </div>
    );
  }

  // Router vers la bonne page selon le business_type
  switch (businessType) {
    case "restaurant":
      return <Navigate to={`/r/${slug}`} replace />;
    case "training":
      return <TrainingLanding />;
    case "medical":
      return <MedicalLanding />;
    case "beauty":
    default:
      return <BookingLanding />;
  }
};

export default PublicRouter;
