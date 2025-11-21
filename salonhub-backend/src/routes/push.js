/**
 * Routes pour gérer les notifications push
 * Permet aux clients et au staff de s'abonner aux notifications
 */

const express = require("express");
const router = express.Router();
const pushService = require("../services/pushService");
const { authMiddleware } = require("../middleware/auth");

/**
 * GET /api/push/vapid-public-key
 * Récupérer la clé publique VAPID (nécessaire pour le frontend)
 */
router.get("/vapid-public-key", (req, res) => {
  try {
    const publicKey = pushService.getPublicKey();

    if (!publicKey) {
      return res.status(503).json({
        success: false,
        error: "Service de notifications push non disponible",
      });
    }

    res.json({
      success: true,
      publicKey: publicKey,
    });
  } catch (error) {
    console.error("Erreur récupération clé VAPID:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * POST /api/push/subscribe
 * S'abonner aux notifications push
 * Body: { subscription: {...}, clientId?, userId? }
 */
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, clientId, userId } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        error: "Données d'abonnement manquantes",
      });
    }

    // Récupérer le tenantId depuis le header ou le token (si authentifié)
    let tenantId = req.headers["x-tenant-id"];

    // Si authentifié, utiliser le tenant de l'utilisateur
    if (req.user) {
      tenantId = req.user.tenant_id;
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID manquant",
      });
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await pushService.saveSubscription({
      tenantId,
      clientId,
      userId,
      subscription,
      userAgent,
      ipAddress,
    });

    res.json({
      success: true,
      message: result.updated
        ? "Abonnement mis à jour"
        : "Abonnement créé avec succès",
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    console.error("Erreur lors de l'abonnement push:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'enregistrement de l'abonnement",
      message: error.message,
    });
  }
});

/**
 * POST /api/push/unsubscribe
 * Se désabonner des notifications push
 * Body: { endpoint }
 */
router.post("/unsubscribe", async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: "Endpoint manquant",
      });
    }

    await pushService.removeSubscription(endpoint);

    res.json({
      success: true,
      message: "Désabonnement réussi",
    });
  } catch (error) {
    console.error("Erreur lors du désabonnement push:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du désabonnement",
    });
  }
});

/**
 * POST /api/push/test
 * Envoyer une notification push de test (admin only)
 */
router.post("/test", authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux administrateurs",
      });
    }

    const { clientId, userId, title, body } = req.body;

    const payload = {
      title: title || "Notification de test",
      body: body || "Ceci est une notification push de test depuis SalonHub",
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: "test",
      requireInteraction: false,
    };

    let result;

    if (clientId) {
      result = await pushService.sendToClient(clientId, payload);
    } else if (userId) {
      // Envoyer au staff (pas encore implémenté, à faire si besoin)
      return res.status(400).json({
        success: false,
        error: "Envoi au staff pas encore implémenté",
      });
    } else {
      // Envoyer à tout le salon
      result = await pushService.sendToTenant(req.user.tenant_id, payload, true);
    }

    res.json({
      success: true,
      message: "Notification de test envoyée",
      result: result,
    });
  } catch (error) {
    console.error("Erreur envoi notification test:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la notification",
      message: error.message,
    });
  }
});

module.exports = router;
