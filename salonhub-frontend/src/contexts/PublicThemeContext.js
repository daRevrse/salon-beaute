/**
 * Public Theme Context
 * Gestion du thème pour les pages publiques de réservation
 */

import React, { createContext, useContext, useState, useEffect } from "react";

const PublicThemeContext = createContext();

// Valeurs par défaut du thème
const DEFAULT_THEME = {
  primaryColor: "#8B5CF6",
  secondaryColor: "#6366F1",
  fontFamily: "Inter",
  footerBgColor: "#1E293B",
  footerTextColor: "#FFFFFF"
};

export const PublicThemeProvider = ({ children, initialTheme }) => {
  const [theme, setTheme] = useState({ ...DEFAULT_THEME, ...initialTheme });

  // Mettre à jour le thème si initialTheme change
  useEffect(() => {
    if (initialTheme) {
      setTheme({ ...DEFAULT_THEME, ...initialTheme });
    }
  }, [initialTheme]);

  // Styles dynamiques pré-calculés
  const dynamicStyles = {
    gradientBg: {
      background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
    },
    primaryText: {
      color: theme.primaryColor
    },
    primaryBg: {
      backgroundColor: `${theme.primaryColor}15`
    },
    primaryBorder: {
      borderColor: theme.primaryColor
    },
    primaryButton: {
      background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
      color: "#FFFFFF"
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
    }
  };

  const value = {
    theme,
    setTheme,
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
    // Retourner les valeurs par défaut si utilisé hors du Provider
    return {
      theme: DEFAULT_THEME,
      dynamicStyles: {
        gradientBg: { background: `linear-gradient(135deg, ${DEFAULT_THEME.primaryColor}, ${DEFAULT_THEME.secondaryColor})` },
        primaryText: { color: DEFAULT_THEME.primaryColor },
        primaryBg: { backgroundColor: `${DEFAULT_THEME.primaryColor}15` },
        primaryBorder: { borderColor: DEFAULT_THEME.primaryColor },
        primaryButton: { background: `linear-gradient(135deg, ${DEFAULT_THEME.primaryColor}, ${DEFAULT_THEME.secondaryColor})`, color: "#FFFFFF" },
        fontFamily: { fontFamily: DEFAULT_THEME.fontFamily },
        footer: { backgroundColor: DEFAULT_THEME.footerBgColor, color: DEFAULT_THEME.footerTextColor },
        footerMuted: { color: `${DEFAULT_THEME.footerTextColor}99` }
      }
    };
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
