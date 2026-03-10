/**
 * Currency Context
 * Gestion de la devise native du salon (sans conversion)
 * Chaque salon définit sa propre devise, tous les prix sont affichés dans cette devise
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
  MAD: { symbol: "DH", name: "Moroccan Dirham", locale: "fr-MA" },
  XOF: { symbol: "CFA", name: "West African CFA Franc", locale: "fr-FR" },
  XAF: { symbol: "FCFA", name: "Central African CFA Franc", locale: "fr-FR" },
  TND: { symbol: "DT", name: "Tunisian Dinar", locale: "fr-TN" },
  DZD: { symbol: "DA", name: "Algerian Dinar", locale: "fr-DZ" },
};

export const CurrencyProvider = ({ children }) => {
  // Devise du salon (définie dans les paramètres)
  const [currency, setCurrency] = useState("EUR");
  const [isLoading, setIsLoading] = useState(true);

  // Initialisation : charger la devise du salon depuis localStorage ou API
  useEffect(() => {
    const initCurrency = () => {
      // Priorité : devise du tenant stockée localement
      const tenantCurrency = localStorage.getItem("tenant_currency");
      if (tenantCurrency && CURRENCIES[tenantCurrency]) {
        setCurrency(tenantCurrency);
      }
      setIsLoading(false);
    };

    initCurrency();
  }, []);

  // Fonction pour changer la devise du salon
  const changeCurrency = (newCurrency) => {
    if (CURRENCIES[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem("tenant_currency", newCurrency);
    }
  };

  // Fonction pour formater un prix dans la devise du salon (SANS conversion)
  const formatPrice = (amount) => {
    if (amount === null || amount === undefined) return "-";

    const currencyInfo = CURRENCIES[currency];
    if (!currencyInfo) {
      return `${amount} ${currency}`;
    }

    try {
      return new Intl.NumberFormat(currencyInfo.locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback pour les devises non supportées par Intl
      return `${currencyInfo.symbol} ${parseFloat(amount).toFixed(2)}`;
    }
  };

  // Fonction pour obtenir uniquement le symbole
  const getCurrencySymbol = () => {
    return CURRENCIES[currency]?.symbol || currency;
  };

  // Fonction pour obtenir le code de la devise
  const getCurrencyCode = () => {
    return currency;
  };

  // Fonction pour obtenir les infos complètes de la devise
  const getCurrencyInfo = () => {
    return CURRENCIES[currency] || { symbol: currency, name: currency, locale: "fr-FR" };
  };

  const value = {
    currency,
    currencyInfo: CURRENCIES[currency],
    changeCurrency,
    formatPrice,
    getCurrencySymbol,
    getCurrencyCode,
    getCurrencyInfo,
    isLoading,
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
