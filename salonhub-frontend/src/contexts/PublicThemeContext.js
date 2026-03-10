/**
 * Public Theme Context
 * Gestion du thème pour les pages publiques de réservation
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const PublicThemeContext = createContext();

// Valeurs par défaut du thème
export const DEFAULT_THEME = {
  primaryColor: "#8B5CF6",
  secondaryColor: "#6366F1",
  fontFamily: "Inter",
  footerBgColor: "#1E293B",
  footerTextColor: "#FFFFFF"
};

export const PublicThemeProvider = ({ children, initialSalon = null, initialSettings = null }) => {
  const [salon, setSalon] = useState(initialSalon);
  const [settings, setSettings] = useState(initialSettings);
  
  // Thème personnalisé du salon avec support d'overrides via query params (pour l'aperçu)
  const theme = useMemo(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const dbTheme = settings?.theme_settings || {};
    
    return {
      primaryColor: queryParams.get("primaryColor") || dbTheme.primaryColor || DEFAULT_THEME.primaryColor,
      secondaryColor: queryParams.get("secondaryColor") || dbTheme.secondaryColor || DEFAULT_THEME.secondaryColor,
      fontFamily: queryParams.get("fontFamily") || dbTheme.fontFamily || DEFAULT_THEME.fontFamily,
      footerBgColor: queryParams.get("footerBgColor") || dbTheme.footerBgColor || DEFAULT_THEME.footerBgColor,
      footerTextColor: queryParams.get("footerTextColor") || dbTheme.footerTextColor || DEFAULT_THEME.footerTextColor
    };
  }, [settings]);

  // Styles dynamiques pré-calculés
  const dynamicStyles = useMemo(() => ({
    gradientBg: {
      background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
    },
    primaryText: {
      color: theme.primaryColor
    },
    primaryBg: {
      backgroundColor: `${theme.primaryColor}10` // 10% opacity
    },
    primaryBgMedium: {
      backgroundColor: `${theme.primaryColor}20` // 20% opacity
    },
    primaryBorder: {
      borderColor: theme.primaryColor
    },
    primaryBorderLight: {
      borderColor: `${theme.primaryColor}40` // 40% opacity
    },
    primaryButton: {
      background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
      color: "#FFFFFF"
    },
    primaryButtonHover: {
      background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
      color: "#FFFFFF"
    },
    secondaryText: {
      color: theme.secondaryColor
    },
    secondaryBg: {
      backgroundColor: `${theme.secondaryColor}10`
    },
    fontFamily: {
      fontFamily: theme.fontFamily
    },
    footer: {
      backgroundColor: theme.footerBgColor || "#1E293B",
      color: theme.footerTextColor || "#FFFFFF"
    },
    footerMuted: {
      color: `${theme.footerTextColor || "#FFFFFF"}99`
    },
    activeOption: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}10`,
      color: theme.primaryColor
    },
    focusRing: {
      boxShadow: `0 0 0 2px ${theme.primaryColor}40`,
      borderColor: theme.primaryColor
    },
    shadowGlow: {
      boxShadow: `0 0 20px ${theme.primaryColor}40`
    }
  }), [theme]);

  const value = {
    salon,
    setSalon,
    settings,
    setSettings,
    theme,
    dynamicStyles,
    DEFAULT_THEME
  };

  return (
    <PublicThemeContext.Provider value={value}>
      {children}
    </PublicThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const usePublicTheme = () => {
  const context = useContext(PublicThemeContext);
  if (!context) {
    throw new Error("usePublicTheme must be used within a PublicThemeProvider");
  }
  return context;
};

// Fonction utilitaire pour formater les minutes en texte lisible
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? `1 heure` : `${h} heures`;
  return `${h}h${String(m).padStart(2, "0")}`;
};

export default PublicThemeContext;
