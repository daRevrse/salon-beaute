/**
 * SALONHUB - Routes API Keys
 * Gestion des clés API pour le plan Developer/Custom
 * Toutes les routes nécessitent JWT auth (owner/admin)
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../config/database");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");
const { API_KEY_PREFIX, API_ALLOWED_PLANS } = require("../middleware/apiKey");

const MAX_KEYS_PER_TENANT = 5;

// Tous les routes nécessitent auth JWT + tenant
router.use(authMiddleware, tenantMiddleware);

/**
 * Middleware: vérifier que le plan autorise les clés API
 */
const checkApiPlan = async (req, res, next) => {
  try {
    const [tenant] = await query(
      "SELECT subscription_plan, subscription_status, trial_ends_at FROM tenants WHERE id = ?",
      [req.tenantId]
    );

    if (!tenant) {
      return res.status(404).json({ success: false, error: "Tenant introuvable" });
    }

    // Trial actif → autorisé
    if (tenant.subscription_status === "trial") {
      if (tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()) {
        return res.status(403).json({
          success: false,
          error: "Période d'essai expirée",
          message: "Passez au plan Developer ou Custom pour utiliser les clés API.",
        });
      }
      return next();
    }

    // Plan developer ou custom → autorisé
    if (API_ALLOWED_PLANS.includes(tenant.subscription_plan)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Plan insuffisant",
      message:
        "Les clés API nécessitent un plan Developer (14,99€/mois) ou Custom.",
    });
  } catch (error) {
    console.error("Erreur checkApiPlan:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

/**
 * POST /api/api-keys
 * Générer une nouvelle clé API
 * La clé complète n'est affichée qu'UNE SEULE FOIS
 */
router.post(
  "/",
  roleMiddleware(["owner", "admin"]),
  checkApiPlan,
  async (req, res) => {
    try {
      const { name, scopes, expires_at } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Le nom de la clé est requis",
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          error: "Le nom ne peut pas dépasser 100 caractères",
        });
      }

      // Vérifier le nombre max de clés
      const existingKeys = await query(
        "SELECT COUNT(*) as count FROM api_keys WHERE tenant_id = ? AND is_active = TRUE",
        [req.tenantId]
      );

      if (existingKeys[0].count >= MAX_KEYS_PER_TENANT) {
        return res.status(400).json({
          success: false,
          error: `Limite atteinte: maximum ${MAX_KEYS_PER_TENANT} clés API actives par établissement`,
        });
      }

      // Valider les scopes si fournis
      const validScopes = [
        "clients:read",
        "clients:write",
        "services:read",
        "services:write",
        "appointments:read",
        "appointments:write",
        "settings:read",
        "settings:write",
        "public:read",
      ];

      if (scopes) {
        if (!Array.isArray(scopes)) {
          return res.status(400).json({
            success: false,
            error: "Les scopes doivent être un tableau",
            valid_scopes: validScopes,
          });
        }
        const invalidScopes = scopes.filter((s) => !validScopes.includes(s));
        if (invalidScopes.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Scopes invalides: ${invalidScopes.join(", ")}`,
            valid_scopes: validScopes,
          });
        }
      }

      // Générer la clé API
      const randomPart = crypto.randomBytes(24).toString("hex");
      const fullKey = `${API_KEY_PREFIX}${randomPart}`;
      const keyPrefix = fullKey.substring(0, API_KEY_PREFIX.length + 8);

      // Hasher la clé
      const keyHash = await bcrypt.hash(fullKey, 10);

      // Insérer en base
      const result = await query(
        `INSERT INTO api_keys (tenant_id, user_id, key_prefix, key_hash, name, scopes, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.tenantId,
          req.userId,
          keyPrefix,
          keyHash,
          name.trim(),
          scopes ? JSON.stringify(scopes) : null,
          expires_at || null,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Clé API créée avec succès",
        data: {
          id: result.insertId,
          name: name.trim(),
          key: fullKey,
          key_prefix: keyPrefix,
          scopes: scopes || null,
          expires_at: expires_at || null,
          created_at: new Date().toISOString(),
        },
        warning:
          "Copiez cette clé maintenant. Elle ne sera plus affichée après cette page.",
      });
    } catch (error) {
      console.error("Erreur création clé API:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

/**
 * GET /api/api-keys
 * Lister toutes les clés API du tenant
 */
router.get(
  "/",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const keys = await query(
        `SELECT id, key_prefix, name, scopes, daily_requests, last_used_at, expires_at, is_active, created_at
         FROM api_keys
         WHERE tenant_id = ?
         ORDER BY created_at DESC`,
        [req.tenantId]
      );

      res.json({
        success: true,
        data: keys.map((k) => ({
          ...k,
          scopes: k.scopes ? JSON.parse(k.scopes) : null,
        })),
        meta: {
          total: keys.length,
          active: keys.filter((k) => k.is_active).length,
          max_allowed: MAX_KEYS_PER_TENANT,
        },
      });
    } catch (error) {
      console.error("Erreur liste clés API:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

/**
 * PATCH /api/api-keys/:id
 * Modifier une clé API (nom, scopes, statut actif)
 */
router.patch(
  "/:id",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, scopes, is_active } = req.body;

      // Vérifier que la clé appartient au tenant
      const [key] = await query(
        "SELECT * FROM api_keys WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      if (!key) {
        return res.status(404).json({
          success: false,
          error: "Clé API non trouvée",
        });
      }

      const updates = [];
      const params = [];

      if (name !== undefined) {
        if (!name.trim() || name.length > 100) {
          return res.status(400).json({
            success: false,
            error: "Le nom doit contenir entre 1 et 100 caractères",
          });
        }
        updates.push("name = ?");
        params.push(name.trim());
      }

      if (scopes !== undefined) {
        updates.push("scopes = ?");
        params.push(scopes ? JSON.stringify(scopes) : null);
      }

      if (is_active !== undefined) {
        updates.push("is_active = ?");
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucune modification fournie",
        });
      }

      params.push(id, req.tenantId);

      await query(
        `UPDATE api_keys SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`,
        params
      );

      res.json({
        success: true,
        message: "Clé API mise à jour",
      });
    } catch (error) {
      console.error("Erreur mise à jour clé API:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

/**
 * DELETE /api/api-keys/:id
 * Désactiver une clé API (soft delete)
 */
router.delete(
  "/:id",
  roleMiddleware(["owner", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await query(
        "UPDATE api_keys SET is_active = FALSE WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Clé API non trouvée",
        });
      }

      res.json({
        success: true,
        message: "Clé API désactivée",
      });
    } catch (error) {
      console.error("Erreur suppression clé API:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

module.exports = router;
