/**
 * Routes pour gérer le scheduler (admin only)
 * Permet de déclencher manuellement les rappels et voir le statut
 */

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const scheduler = require("../services/scheduler");

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      error: "Accès réservé aux administrateurs",
    });
  }
  next();
};

/**
 * GET /api/scheduler/status
 * Obtenir le statut du scheduler
 */
router.get("/status", authMiddleware, requireAdmin, (req, res) => {
  try {
    const status = scheduler.status();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Erreur statut scheduler:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du statut",
    });
  }
});

/**
 * POST /api/scheduler/trigger/24h
 * Déclencher manuellement les rappels 24h (pour tests)
 */
router.post("/trigger/24h", authMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log("🧪 Déclenchement manuel des rappels 24h...");
    const result = await scheduler.triggerManual24h();
    res.json({
      success: true,
      message: "Rappels 24h exécutés avec succès",
      data: result,
    });
  } catch (error) {
    console.error("Erreur rappels 24h:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'exécution des rappels 24h",
      message: error.message,
    });
  }
});

/**
 * POST /api/scheduler/trigger/2h
 * Déclencher manuellement les rappels 2h (pour tests)
 */
router.post("/trigger/2h", authMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log("🧪 Déclenchement manuel des rappels 2h...");
    const result = await scheduler.triggerManual2h();
    res.json({
      success: true,
      message: "Rappels 2h exécutés avec succès",
      data: result,
    });
  } catch (error) {
    console.error("Erreur rappels 2h:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'exécution des rappels 2h",
      message: error.message,
    });
  }
});

/**
 * POST /api/scheduler/restart
 * Redémarrer le scheduler
 */
router.post("/restart", authMiddleware, requireAdmin, (req, res) => {
  try {
    scheduler.restart();
    res.json({
      success: true,
      message: "Scheduler redémarré avec succès",
    });
  } catch (error) {
    console.error("Erreur redémarrage scheduler:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du redémarrage du scheduler",
    });
  }
});

module.exports = router;
