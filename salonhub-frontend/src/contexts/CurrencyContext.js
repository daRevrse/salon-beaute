/**
 * Currency Context
 * Gestion de la devise sur toute la plateforme
 */

import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

// Liste des devises supportées avec leurs symboles
export const CURRENCIES = {
  EUR: { symbol: "€", name: "Euro", locale: "fr-FR" },
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
  CAD: { symbol: "CA$", name: "Canadian Dollar", locale: "en-CA" },
  CHF: { symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  MAD: { symbol: "MAD", name: "Moroccan Dirham", locale: "ar-MA" },
  XOF: { symbol: "CFA", name: "West African CFA Franc", locale: "fr-FR" },
  XAF: { symbol: "FCFA", name: "Central African CFA Franc", locale: "fr-FR" },
};

// Mapping pays -> devise par défaut
const COUNTRY_TO_CURRENCY = {
  FR: "EUR",
  BE: "EUR",
  LU: "EUR",
  CH: "CHF",
  MC: "EUR",
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  MA: "MAD",
  DZ: "MAD", // Algérie utilise MAD comme approximation
  TN: "MAD", // Tunisie utilise MAD comme approximation
  SN: "XOF", // Sénégal
  CI: "XOF", // Côte d'Ivoire
  CM: "XAF", // Cameroun
  GA: "XAF", // Gabon
  CG: "XAF", // Congo
};

// Détection automatique du pays via la locale du navigateur
const detectUserCountry = async () => {
  try {
    // Utiliser la locale du navigateur (plus fiable et sans limite d'API)
    const browserLang = navigator.language || navigator.userLanguage;
    console.log("Locale navigateur:", browserLang);

    // Mapping des locales vers les pays
    if (browserLang.includes("en-US")) return "US";
    if (browserLang.includes("en-GB")) return "GB";
    if (browserLang.includes("fr-CA")) return "CA";
    if (browserLang.includes("de-CH") || browserLang.includes("fr-CH"))
      return "CH";
    if (browserLang.includes("ar-MA") || browserLang.includes("fr-MA"))
      return "MA";
    if (browserLang.startsWith("fr")) return "FR";
    if (browserLang.startsWith("en")) return "GB";
    if (browserLang.startsWith("de")) return "CH";

    return "FR"; // Par défaut
  } catch (error) {
    console.error("Erreur détection pays:", error);
    return "FR";
  }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("EUR");
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [salonBaseCurrency, setSalonBaseCurrency] = useState("EUR"); // Devise de base du salon

  // Charger les taux de change
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const response = await fetch(`${API_URL}/currency/rates`);
        const data = await response.json();

        if (data.success) {
          setExchangeRates(data.data.rates);
        }
      } catch (error) {
        console.error("Erreur chargement taux de change:", error);
        // Fallback: pas de conversion, affichage direct
      }
    };

    fetchExchangeRates();
    // Rafraîchir les taux toutes les 24 heures
    const interval = setInterval(fetchExchangeRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Détection automatique au chargement
  useEffect(() => {
    const initCurrency = async () => {
      // 1. Vérifier si une devise est stockée en localStorage (préférence utilisateur)
      const savedCurrency = localStorage.getItem("preferred_currency");
      if (savedCurrency && CURRENCIES[savedCurrency]) {
        setCurrency(savedCurrency);
        setIsLoading(false);
        return;
      }

      // 2. Vérifier si le tenant a une devise configurée (via API)
      const tenantCurrency = localStorage.getItem("tenant_currency");
      if (tenantCurrency && CURRENCIES[tenantCurrency]) {
        setCurrency(tenantCurrency);
        setSalonBaseCurrency(tenantCurrency); // C'est la devise de base du salon
        setIsLoading(false);
        return;
      }

      // 3. Détecter automatiquement via géolocalisation
      const country = await detectUserCountry();
      const detectedCurrency = COUNTRY_TO_CURRENCY[country] || "EUR";
      setCurrency(detectedCurrency);
      setIsLoading(false);
    };

    initCurrency();
  }, []);

  // Fonction pour changer la devise
  const changeCurrency = (newCurrency) => {
    if (CURRENCIES[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem("preferred_currency", newCurrency);
    }
  };

  // Fonction pour convertir un prix d'une devise à une autre
  const convertPrice = (amount, fromCurrency, toCurrency) => {
    // Si même devise ou pas de taux disponibles, retourner le montant original
    if (fromCurrency === toCurrency || !exchangeRates) {
      return amount;
    }

    try {
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;

      // Conversion: amount * (toRate / fromRate)
      const converted = amount * (toRate / fromRate);
      return Math.round(converted * 100) / 100; // Arrondir à 2 décimales
    } catch (error) {
      console.error("Erreur conversion:", error);
      return amount; // Fallback
    }
  };

  // Fonction pour formater un prix avec conversion automatique
  const formatPrice = (amount, fromCurrency = null, customCurrency = null) => {
    const curr = customCurrency || currency;
    const baseCurr = fromCurrency || salonBaseCurrency;

    // Convertir le montant si nécessaire
    const convertedAmount = convertPrice(amount, baseCurr, curr);

    const currencyInfo = CURRENCIES[curr];

    return new Intl.NumberFormat(currencyInfo.locale, {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  };

  // Fonction pour obtenir uniquement le symbole
  const getCurrencySymbol = (customCurrency = null) => {
    const curr = customCurrency || currency;
    return CURRENCIES[curr]?.symbol || "€";
  };

  const value = {
    currency,
    currencyInfo: CURRENCIES[currency],
    salonBaseCurrency,
    setSalonBaseCurrency,
    changeCurrency,
    formatPrice,
    convertPrice,
    getCurrencySymbol,
    isLoading,
    exchangeRates,
    availableCurrencies: CURRENCIES,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export default CurrencyContext;
