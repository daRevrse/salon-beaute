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

import { usePublicTheme } from "../../contexts/PublicThemeContext";

const PublicRouter = () => {
  const { slug } = useParams();
  const { salon, loading } = usePublicTheme();

  if (loading && !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Router vers la bonne page selon le business_type
  const businessType = salon?.business_type || "beauty";

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
