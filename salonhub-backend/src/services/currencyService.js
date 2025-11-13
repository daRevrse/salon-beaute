/**
 * Service de conversion de devises
 * Utilise l'API exchangerate-api.com (gratuite, 1500 requêtes/mois)
 */

const fetch = require("node-fetch");

// Cache des taux de change (rafraîchi toutes les 24h)
let exchangeRatesCache = {
  rates: null,
  lastUpdate: null,
  baseCurrency: "EUR",
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
const API_URL = "https://api.exchangerate-api.com/v4/latest/EUR";

/**
 * Récupérer les taux de change depuis l'API
 */
async function fetchExchangeRates() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Mettre à jour le cache
    exchangeRatesCache = {
      rates: data.rates,
      lastUpdate: Date.now(),
      baseCurrency: data.base,
    };

    console.log("✅ Taux de change mis à jour:", new Date().toLocaleString());
    return data.rates;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des taux de change:",
      error
    );

    // Si le cache existe encore, on le retourne même s'il est expiré
    if (exchangeRatesCache.rates) {
      console.log("⚠️ Utilisation du cache expiré");
      return exchangeRatesCache.rates;
    }

    throw error;
  }
}

/**
 * Obtenir les taux de change (avec cache)
 */
async function getExchangeRates() {
  const now = Date.now();
  const cacheAge = exchangeRatesCache.lastUpdate
    ? now - exchangeRatesCache.lastUpdate
    : null;

  // Si le cache est valide (moins de 24h), le retourner
  if (exchangeRatesCache.rates && cacheAge && cacheAge < CACHE_DURATION) {
    return exchangeRatesCache.rates;
  }

  // Sinon, récupérer de nouveaux taux
  return await fetchExchangeRates();
}

/**
 * Convertir un montant d'une devise à une autre
 * @param {number} amount - Montant à convertir
 * @param {string} fromCurrency - Devise source (ex: "EUR")
 * @param {string} toCurrency - Devise cible (ex: "USD")
 * @returns {number} - Montant converti
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  // Si même devise, pas de conversion
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await getExchangeRates();

    // L'API donne les taux depuis EUR vers toutes les devises
    // Pour convertir de A vers B: amount * (rate_B / rate_A)

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    const convertedAmount = amount * (toRate / fromRate);

    return Math.round(convertedAmount * 100) / 100; // Arrondir à 2 décimales
  } catch (error) {
    console.error(`Erreur conversion ${fromCurrency} -> ${toCurrency}:`, error);
    // En cas d'erreur, retourner le montant original
    return amount;
  }
}

/**
 * Obtenir le taux de change entre deux devises
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @returns {number} - Taux de change
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    const rates = await getExchangeRates();
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    return toRate / fromRate;
  } catch (error) {
    console.error(
      `Erreur récupération taux ${fromCurrency} -> ${toCurrency}:`,
      error
    );
    return 1;
  }
}

/**
 * Obtenir tous les taux de change disponibles
 */
async function getAllRates() {
  try {
    return await getExchangeRates();
  } catch (error) {
    console.error("Erreur récupération de tous les taux:", error);
    return null;
  }
}

/**
 * Forcer le rafraîchissement du cache
 */
async function refreshCache() {
  console.log("🔄 Rafraîchissement manuel du cache des taux de change...");
  return await fetchExchangeRates();
}

module.exports = {
  convertCurrency,
  getExchangeRate,
  getAllRates,
  refreshCache,
  getExchangeRates,
};
