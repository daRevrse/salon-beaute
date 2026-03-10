/**
 * SALONHUB - Routes Webhooks
 * CRUD pour gérer les webhooks + logs de livraison
 * Réservé aux plans Developer, Custom et Trial
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");
const {
  dispatch,
  sendTestEvent,
  generateSecret,
  WEBHOOK_EVENTS,
} = require("../services/webhookService");
const { API_ALLOWED_PLANS } = require("../middleware/apiKey");

// Auth + tenant sur toutes les routes
router.use(authMiddleware, tenantMiddleware);

// Max 5 webhooks par tenant
const MAX_WEBHOOKS = 5;

/**
 * Middleware: vérifier que le plan autorise les webhooks
 * Même logique que checkApiPlan dans api-keys.js
 */
const checkWebhookPlan = async (req, res, next) => {
  try {
    const [tenant] = await query(
      "SELECT subscription_plan, subscription_status, trial_ends_at FROM tenants WHERE id = ?",
      [req.tenantId]
    );

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, error: "Tenant introuvable" });
    }

    // Trial actif
    if (tenant.subscription_status === "trial") {
      if (
        tenant.trial_ends_at &&
        new Date(tenant.trial_ends_at) < new Date()
      ) {
        return res.status(403).json({
          success: false,
          error: "Période d'essai expirée",
          message:
            "Passez au plan Developer ou Custom pour utiliser les webhooks.",
        });
      }
      return next();
    }

    // Plan autorisé
    if (API_ALLOWED_PLANS.includes(tenant.subscription_plan)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Plan insuffisant",
      message:
        "Les webhooks nécessitent un plan Developer (14,99€/mois) ou Custom.",
    });
  } catch (error) {
    console.error("Erreur checkWebhookPlan:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

// ==========================================
// GET - Liste des événements disponibles
// ==========================================
router.get("/events", (req, res) => {
  res.json({
    success: true,
    data: WEBHOOK_EVENTS,
  });
});

// ==========================================
// GET - Liste des webhooks du tenant
// ==========================================
router.get("/", checkWebhookPlan, async (req, res) => {
  try {
    const webhooks = await query(
      `SELECT id, url, events, is_active, description, failure_count, last_triggered_at, created_at
       FROM webhooks
       WHERE tenant_id = ?
       ORDER BY created_at DESC`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: webhooks,
      meta: {
        count: webhooks.length,
        max: MAX_WEBHOOKS,
      },
    });
  } catch (error) {
    console.error("Erreur liste webhooks:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// POST - Créer un webhook
// ==========================================
router.post(
  "/",
  roleMiddleware(["owner", "admin"]),
  checkWebhookPlan,
  async (req, res) => {
    try {
      const { url, events, description } = req.body;

      // Validation URL
      if (!url || !url.startsWith("https://")) {
        return res.status(400).json({
          success: false,
          error: "URL invalide",
          message: "L'URL doit commencer par https://",
        });
      }

      // Validation événements
      if (!events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Événements requis",
          message: "Sélectionnez au moins un type d'événement.",
        });
      }

      // Vérifier que les événements sont valides
      const invalidEvents = events.filter(
        (e) => !WEBHOOK_EVENTS.includes(e)
      );
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Événements invalides",
          message: `Événements non reconnus: ${invalidEvents.join(", ")}`,
          valid_events: WEBHOOK_EVENTS,
        });
      }

      // Vérifier le nombre max
      const [countResult] = await query(
        "SELECT COUNT(*) as count FROM webhooks WHERE tenant_id = ?",
        [req.tenantId]
      );

      if (countResult.count >= MAX_WEBHOOKS) {
        return res.status(400).json({
          success: false,
          error: "Limite atteinte",
          message: `Maximum ${MAX_WEBHOOKS} webhooks par compte.`,
        });
      }

      // Générer le secret
      const secret = generateSecret();

      // Insertion
      const result = await query(
        `INSERT INTO webhooks (tenant_id, user_id, url, secret, events, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.tenantId,
          req.userId,
          url,
          secret,
          JSON.stringify(events),
          description || null,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Webhook créé avec succès",
        data: {
          id: result.insertId,
          url,
          events,
          secret, // Affiché UNE seule fois
          is_active: true,
        },
        warning:
          "Le secret ne sera plus jamais affiché. Conservez-le en lieu sûr pour vérifier les signatures.",
      });
    } catch (error) {
      console.error("Erreur création webhook:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

// ==========================================
// PATCH - Modifier un webhook
// ==========================================
router.patch(
  "/:id",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { url, events, description, is_active } = req.body;

      // Vérifier que le webhook appartient au tenant
      const [webhook] = await query(
        "SELECT id FROM webhooks WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      if (!webhook) {
        return res
          .status(404)
          .json({ success: false, error: "Webhook introuvable" });
      }

      // Construire la requête dynamique
      const updates = [];
      const params = [];

      if (url !== undefined) {
        if (!url.startsWith("https://")) {
          return res.status(400).json({
            success: false,
            error: "L'URL doit commencer par https://",
          });
        }
        updates.push("url = ?");
        params.push(url);
      }

      if (events !== undefined) {
        if (!Array.isArray(events) || events.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Sélectionnez au moins un événement",
          });
        }
        const invalidEvents = events.filter(
          (e) => !WEBHOOK_EVENTS.includes(e)
        );
        if (invalidEvents.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Événements invalides: ${invalidEvents.join(", ")}`,
          });
        }
        updates.push("events = ?");
        params.push(JSON.stringify(events));
      }

      if (description !== undefined) {
        updates.push("description = ?");
        params.push(description);
      }

      if (is_active !== undefined) {
        updates.push("is_active = ?");
        params.push(is_active);
        // Si on réactive, reset le compteur d'échecs
        if (is_active) {
          updates.push("failure_count = 0");
        }
      }

      if (updates.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "Aucune modification" });
      }

      params.push(id, req.tenantId);

      await query(
        `UPDATE webhooks SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`,
        params
      );

      res.json({
        success: true,
        message: "Webhook modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur modification webhook:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

// ==========================================
// DELETE - Supprimer un webhook
// ==========================================
router.delete(
  "/:id",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        "DELETE FROM webhooks WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Webhook introuvable" });
      }

      res.json({
        success: true,
        message: "Webhook supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression webhook:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

// ==========================================
// POST - Tester un webhook
// ==========================================
router.post(
  "/:id/test",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await sendTestEvent(id, req.tenantId);

      res.json({
        success: true,
        message: result.success
          ? "Test réussi !"
          : "Le test a échoué",
        data: result,
      });
    } catch (error) {
      console.error("Erreur test webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }
);

// ==========================================
// GET - Logs de livraison d'un webhook
// ==========================================
router.get("/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Vérifier que le webhook appartient au tenant
    const [webhook] = await query(
      "SELECT id FROM webhooks WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!webhook) {
      return res
        .status(404)
        .json({ success: false, error: "Webhook introuvable" });
    }

    const logs = await query(
      `SELECT id, event, response_status, response_time_ms, attempt, status, error_message, delivered_at, created_at
       FROM webhook_logs
       WHERE webhook_id = ? AND tenant_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [id, req.tenantId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await query(
      "SELECT COUNT(*) as total FROM webhook_logs WHERE webhook_id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Erreur logs webhook:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// POST - Régénérer le secret d'un webhook
// ==========================================
router.post(
  "/:id/regenerate-secret",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier propriété
      const [webhook] = await query(
        "SELECT id FROM webhooks WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      if (!webhook) {
        return res
          .status(404)
          .json({ success: false, error: "Webhook introuvable" });
      }

      const newSecret = generateSecret();

      await query("UPDATE webhooks SET secret = ? WHERE id = ?", [
        newSecret,
        id,
      ]);

      res.json({
        success: true,
        message: "Secret régénéré avec succès",
        data: {
          secret: newSecret,
        },
        warning:
          "Le nouveau secret ne sera plus jamais affiché. Mettez à jour votre intégration.",
      });
    } catch (error) {
      console.error("Erreur régénération secret:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

module.exports = router;
