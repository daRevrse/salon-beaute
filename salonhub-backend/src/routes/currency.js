/**
 * Routes API pour la gestion des devises et taux de change
 */

const express = require('express');
const router = express.Router();
const currencyService = require('../services/currencyService');

/**
 * GET /api/currency/rates
 * Récupérer tous les taux de change disponibles
 */
router.get('/rates', async (req, res) => {
  try {
    const rates = await currencyService.getAllRates();

    if (!rates) {
      return res.status(503).json({
        success: false,
        error: 'Service de taux de change temporairement indisponible'
      });
    }

    res.json({
      success: true,
      data: {
        base: 'EUR',
        rates: rates,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Erreur récupération taux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des taux'
    });
  }
});

/**
 * GET /api/currency/convert
 * Convertir un montant d'une devise à une autre
 * Query params: amount, from, to
 */
router.get('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    // Validation
    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants: amount, from, to requis'
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Montant invalide'
      });
    }

    const convertedAmount = await currencyService.convertCurrency(
      amountNum,
      from.toUpperCase(),
      to.toUpperCase()
    );

    const rate = await currencyService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase()
    );

    res.json({
      success: true,
      data: {
        original: {
          amount: amountNum,
          currency: from.toUpperCase()
        },
        converted: {
          amount: convertedAmount,
          currency: to.toUpperCase()
        },
        rate: rate,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Erreur conversion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la conversion'
    });
  }
});

/**
 * GET /api/currency/rate/:from/:to
 * Obtenir le taux de change entre deux devises
 */
router.get('/rate/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;

    const rate = await currencyService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase()
    );

    res.json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: rate,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Erreur récupération taux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/currency/refresh
 * Forcer le rafraîchissement du cache des taux
 * (endpoint admin uniquement)
 */
router.post('/refresh', async (req, res) => {
  try {
    const rates = await currencyService.refreshCache();

    res.json({
      success: true,
      message: 'Cache des taux de change rafraîchi',
      data: {
        base: 'EUR',
        rates: rates,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Erreur rafraîchissement cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du rafraîchissement du cache'
    });
  }
});

module.exports = router;
