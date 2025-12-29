/**
 * SALONHUB - Routes Impersonation
 * Système d'impersonation pour le support (SuperAdmin)
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const {
  superAdminAuth,
  requirePermission,
  logAdminActivity,
} = require("../middleware/superadmin");

/**
 * POST /api/admin/impersonate/exit
 * Terminer une session d'impersonation
 * MUST be before /:userId route to avoid matching "exit" as a userId
 */
router.post("/exit", superAdminAuth, async (req, res) => {
  try {
    const { session_id } = req.body;

    // If no session_id provided, terminate all active sessions for this superadmin
    // This is used when exiting from the impersonation banner
    if (!session_id) {
      await pool.query(
        `UPDATE impersonation_sessions
         SET ended_at = NOW(), is_active = FALSE
         WHERE super_admin_id = ? AND is_active = TRUE`,
        [req.superAdmin.id]
      );

      await logAdminActivity(req.superAdmin.id, "impersonation_ended", {
        description: "Fin de toutes les sessions d'impersonation actives",
        req,
      });

      return res.json({
        success: true,
        message: "Toutes les sessions d'impersonation terminées",
      });
    }

    // Terminate specific session
    await pool.query(
      `UPDATE impersonation_sessions
       SET ended_at = NOW(), is_active = FALSE
       WHERE id = ? AND super_admin_id = ?`,
      [session_id, req.superAdmin.id]
    );

    await logAdminActivity(req.superAdmin.id, "impersonation_ended", {
      description: "Fin de session d'impersonation",
      metadata: { session_id },
      req,
    });

    res.json({
      success: true,
      message: "Session d'impersonation terminée",
    });
  } catch (error) {
    console.error("Erreur POST /impersonate/exit:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * POST /api/admin/impersonate/:userId
 * Démarrer une session d'impersonation
 */
router.post(
  "/:userId",
  superAdminAuth,
  requirePermission("impersonate", "enabled"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: "Une raison détaillée est requise (minimum 10 caractères)",
        });
      }

      // Récupérer l'utilisateur et les données du tenant
      const [users] = await pool.query(
        `SELECT u.*, t.name as tenant_name, t.email as tenant_email,
         t.slug, t.phone, t.address, t.city, t.postal_code,
         t.subscription_plan, t.subscription_status, t.trial_ends_at
         FROM users u
         JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }

      const user = users[0];

      // Vérifier que le tenant n'est pas suspendu
      const [tenants] = await pool.query(
        `SELECT subscription_status FROM tenants WHERE id = ?`,
        [user.tenant_id]
      );

      if (tenants[0].subscription_status === "suspended") {
        return res.status(403).json({
          success: false,
          error: "Impossible d'impersonner un utilisateur d'un tenant suspendu",
        });
      }

      // Générer un token d'impersonation (1 heure d'expiration)
      const impersonationToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id,
          role: user.role,
          type: "impersonation",
          impersonated_by: req.superAdmin.id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const tokenHash = crypto
        .createHash("sha256")
        .update(impersonationToken)
        .digest("hex");

      const ip_address =
        req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const user_agent = req.headers["user-agent"];

      // Enregistrer la session d'impersonation
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      await pool.query(
        `INSERT INTO impersonation_sessions
         (super_admin_id, user_id, tenant_id, token_hash, reason, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.superAdmin.id,
          user.id,
          user.tenant_id,
          tokenHash,
          reason,
          ip_address,
          user_agent,
          expiresAt,
        ]
      );

      // Logger l'action
      await logAdminActivity(req.superAdmin.id, "impersonation_started", {
        resource_type: "user",
        resource_id: user.id,
        description: `Impersonation de ${user.first_name} ${user.last_name} (${user.email}) - ${user.tenant_name}`,
        metadata: { reason, tenant_id: user.tenant_id },
        req,
      });

      res.json({
        success: true,
        token: impersonationToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          tenant_id: user.tenant_id,
        },
        tenant: {
          id: user.tenant_id,
          name: user.tenant_name,
          email: user.tenant_email,
          slug: user.slug,
          phone: user.phone,
          address: user.address,
          city: user.city,
          postal_code: user.postal_code,
          subscription_plan: user.subscription_plan,
          subscription_status: user.subscription_status,
          trial_ends_at: user.trial_ends_at,
        },
        expires_at: expiresAt,
      });
    } catch (error) {
      console.error("Erreur POST /impersonate/:userId:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/impersonate/active-sessions
 * Liste des sessions d'impersonation actives
 */
router.get(
  "/active-sessions",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const [sessions] = await pool.query(`
        SELECT
          i.*,
          sa.email as admin_email,
          sa.first_name as admin_first_name,
          sa.last_name as admin_last_name,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          t.name as tenant_name
        FROM impersonation_sessions i
        JOIN super_admins sa ON i.super_admin_id = sa.id
        JOIN users u ON i.user_id = u.id
        JOIN tenants t ON i.tenant_id = t.id
        WHERE i.is_active = TRUE
          AND i.expires_at > NOW()
        ORDER BY i.started_at DESC
      `);

      res.json({
        success: true,
        active_sessions: sessions,
      });
    } catch (error) {
      console.error("Erreur GET /impersonate/active-sessions:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/impersonate/history
 * Historique des sessions d'impersonation
 */
router.get(
  "/history",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, super_admin_id } = req.query;

      let query = `
        SELECT
          i.*,
          sa.email as admin_email,
          sa.first_name as admin_first_name,
          sa.last_name as admin_last_name,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          t.name as tenant_name
        FROM impersonation_sessions i
        JOIN super_admins sa ON i.super_admin_id = sa.id
        JOIN users u ON i.user_id = u.id
        JOIN tenants t ON i.tenant_id = t.id
        WHERE 1=1
      `;

      const params = [];

      if (super_admin_id) {
        query += ` AND i.super_admin_id = ?`;
        params.push(super_admin_id);
      }

      query += ` ORDER BY i.started_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [sessions] = await pool.query(query, params);

      res.json({
        success: true,
        sessions,
      });
    } catch (error) {
      console.error("Erreur GET /impersonate/history:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * Middleware pour vérifier si l'utilisateur est en mode impersonation
 */
const impersonationCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === "impersonation") {
      req.isImpersonating = true;
      req.impersonatedBy = decoded.impersonated_by;

      // Mettre à jour last_activity
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await pool.query(
        `UPDATE impersonation_sessions
         SET last_activity = NOW()
         WHERE token_hash = ? AND is_active = TRUE`,
        [tokenHash]
      );
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = router;
module.exports.impersonationCheck = impersonationCheck;
