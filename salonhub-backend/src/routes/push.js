/**
 * Routes pour gérer les notifications push
 * Permet aux clients et au staff de s'abonner aux notifications
 * - Web Push (VAPID) pour les navigateurs (PWA)
 * - Expo Push pour les appareils mobiles (React Native)
 */

const express = require("express");
const router = express.Router();
const pushService = require("../services/pushService");
const expoPushService = require("../services/expoPushService");
const { authMiddleware } = require("../middleware/auth");

// ==========================================
// WEB PUSH (VAPID) — Navigateurs / PWA
// ==========================================

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
 * S'abonner aux notifications push (Web Push / VAPID)
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
 * Se désabonner des notifications push (Web Push)
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

// ==========================================
// EXPO PUSH — Appareils mobiles (React Native)
// ==========================================

/**
 * POST /api/push/register-mobile
 * Enregistrer un token Expo push (mobile)
 * Body: { token, deviceName?, platform? }
 */
router.post("/register-mobile", authMiddleware, async (req, res) => {
  try {
    const { token, deviceName, platform } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token Expo manquant",
      });
    }

    const result = await expoPushService.registerToken({
      tenantId: req.user.tenant_id,
      userId: req.user.id,
      token,
      deviceName: deviceName || null,
      platform: platform || null,
    });

    res.json({
      success: true,
      message: result.updated
        ? "Token mobile mis à jour"
        : "Token mobile enregistré",
      tokenId: result.tokenId,
    });
  } catch (error) {
    console.error("Erreur enregistrement token mobile:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'enregistrement du token",
      message: error.message,
    });
  }
});

/**
 * POST /api/push/unregister-mobile
 * Supprimer un token Expo push (déconnexion mobile)
 * Body: { token }
 */
router.post("/unregister-mobile", authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token manquant",
      });
    }

    await expoPushService.removeToken(token);

    res.json({
      success: true,
      message: "Token mobile supprimé",
    });
  } catch (error) {
    console.error("Erreur suppression token mobile:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression du token",
    });
  }
});

// ==========================================
// TEST — Envoi de notification test (tous canaux)
// ==========================================

/**
 * POST /api/push/test
 * Envoyer une notification push de test (owner only)
 * Envoie simultanément via Web Push ET Expo Push
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

    const notifTitle = title || "Notification de test";
    const notifBody =
      body || "Ceci est une notification push de test depuis SalonHub";

    // Payload Web Push (navigateurs)
    const webPayload = {
      title: notifTitle,
      body: notifBody,
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: "test",
      requireInteraction: false,
    };

    // Payload Expo Push (mobile)
    const expoPayload = {
      title: notifTitle,
      body: notifBody,
      data: { type: "test" },
    };

    const results = { web: null, mobile: null };

    if (clientId) {
      // Envoyer au client (web push seulement pour les clients)
      results.web = await pushService.sendToClient(clientId, webPayload);
    } else if (userId) {
      // Envoyer à un utilisateur spécifique (mobile)
      results.mobile = await expoPushService.sendToUser(userId, expoPayload);
    } else {
      // Envoyer à tout le salon (web + mobile)
      results.web = await pushService.sendToTenant(
        req.user.tenant_id,
        webPayload,
        true
      );
      results.mobile = await expoPushService.sendToTenant(
        req.user.tenant_id,
        expoPayload
      );
    }

    res.json({
      success: true,
      message: "Notification de test envoyée",
      results,
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
