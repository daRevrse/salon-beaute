/**
 * SALONHUB - Routes SuperAdmin
 * Gestion système du SaaS (réservé aux SuperAdmins)
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
const {
  superAdminAuth,
  requirePermission,
  requireSuperAdmin,
  generateSuperAdminToken,
  logAdminActivity,
} = require("../middleware/superadmin");

// ==========================================
// AUTHENTIFICATION SUPERADMIN
// ==========================================

/**
 * POST /api/admin/auth/login
 * Connexion SuperAdmin
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email et mot de passe requis",
      });
    }

    // Récupérer le SuperAdmin
    const [admins] = await pool.query(
      `SELECT * FROM super_admins WHERE email = ?`,
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Identifiants invalides",
      });
    }

    const admin = admins[0];

    // Vérifier si le compte est actif
    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        error: "Compte désactivé",
        message: "Votre compte SuperAdmin a été désactivé",
      });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Identifiants invalides",
      });
    }

    // Mettre à jour last_login et compteur
    const ip_address =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    await pool.query(
      `UPDATE super_admins
       SET last_login_at = NOW(),
           last_login_ip = ?,
           login_count = login_count + 1
       WHERE id = ?`,
      [ip_address, admin.id]
    );

    // Logger l'action
    await logAdminActivity(admin.id, "login", {
      description: "Connexion SuperAdmin",
      req,
    });

    // Générer le token
    const token = generateSuperAdminToken(admin);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        is_super: admin.is_super,
      },
    });
  } catch (error) {
    console.error("Erreur login SuperAdmin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * GET /api/admin/auth/me
 * Récupérer les infos du SuperAdmin connecté
 */
router.get("/auth/me", superAdminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: req.superAdmin,
    });
  } catch (error) {
    console.error("Erreur GET /auth/me:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GESTION TENANTS
// ==========================================

/**
 * GET /api/admin/tenants
 * Liste de tous les tenants (salons)
 */
router.get(
  "/tenants",
  superAdminAuth,
  requirePermission("tenants", "view"),
  async (req, res) => {
    try {
      const { status, plan, search, limit = 50, offset = 0 } = req.query;

      let query = `
      SELECT
        t.*,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT a.id) as total_appointments
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN clients c ON t.id = c.tenant_id
      LEFT JOIN appointments a ON t.id = a.tenant_id
      WHERE 1=1
    `;

      const params = [];

      // Filtres
      if (status) {
        query += ` AND t.subscription_status = ?`;
        params.push(status);
      }

      if (plan) {
        query += ` AND t.subscription_plan = ?`;
        params.push(plan);
      }

      if (search) {
        query += ` AND (t.name LIKE ? OR t.email LIKE ? OR t.slug LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [tenants] = await pool.query(query, params);

      // Compter le total
      let countQuery = `SELECT COUNT(*) as total FROM tenants WHERE 1=1`;
      const countParams = [];

      if (status) {
        countQuery += ` AND subscription_status = ?`;
        countParams.push(status);
      }
      if (plan) {
        countQuery += ` AND subscription_plan = ?`;
        countParams.push(plan);
      }
      if (search) {
        countQuery += ` AND (name LIKE ? OR email LIKE ? OR slug LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        tenants,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + tenants.length < total,
        },
      });
    } catch (error) {
      console.error("Erreur GET /tenants:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/tenants/:id
 * Détails d'un tenant spécifique
 */
router.get(
  "/tenants/:id",
  superAdminAuth,
  requirePermission("tenants", "view"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const [tenants] = await pool.query(
        `SELECT * FROM tenants WHERE id = ?`,
        [id]
      );

      if (tenants.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant non trouvé",
        });
      }

      const tenant = tenants[0];

      // Statistiques détaillées
      const [stats] = await pool.query(
        `SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = ?) as total_users,
        (SELECT COUNT(*) FROM clients WHERE tenant_id = ?) as total_clients,
        (SELECT COUNT(*) FROM services WHERE tenant_id = ?) as total_services,
        (SELECT COUNT(*) FROM appointments WHERE tenant_id = ?) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE tenant_id = ? AND status = 'completed') as completed_appointments
      `,
        [id, id, id, id, id]
      );

      res.json({
        success: true,
        tenant,
        stats: stats[0],
      });
    } catch (error) {
      console.error("Erreur GET /tenants/:id:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/tenants/:id/suspend
 * Suspendre un tenant
 */
router.put(
  "/tenants/:id/suspend",
  superAdminAuth,
  requirePermission("tenants", "suspend"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Vérifier que le tenant existe
      const [tenants] = await pool.query(
        `SELECT * FROM tenants WHERE id = ?`,
        [id]
      );

      if (tenants.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant non trouvé",
        });
      }

      const tenant = tenants[0];

      // Mettre à jour le statut
      await pool.query(
        `UPDATE tenants SET subscription_status = 'suspended' WHERE id = ?`,
        [id]
      );

      // Logger l'action
      await logAdminActivity(req.superAdmin.id, "tenant_suspended", {
        resource_type: "tenant",
        resource_id: id,
        description: `Suspension du tenant: ${tenant.name}`,
        metadata: { reason, previous_status: tenant.subscription_status },
        req,
      });

      res.json({
        success: true,
        message: "Tenant suspendu avec succès",
      });
    } catch (error) {
      console.error("Erreur PUT /tenants/:id/suspend:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/tenants/:id/activate
 * Réactiver un tenant suspendu
 */
router.put(
  "/tenants/:id/activate",
  superAdminAuth,
  requirePermission("tenants", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const [tenants] = await pool.query(
        `SELECT * FROM tenants WHERE id = ?`,
        [id]
      );

      if (tenants.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant non trouvé",
        });
      }

      const tenant = tenants[0];

      await pool.query(
        `UPDATE tenants SET subscription_status = 'active' WHERE id = ?`,
        [id]
      );

      await logAdminActivity(req.superAdmin.id, "tenant_activated", {
        resource_type: "tenant",
        resource_id: id,
        description: `Réactivation du tenant: ${tenant.name}`,
        metadata: { previous_status: tenant.subscription_status },
        req,
      });

      res.json({
        success: true,
        message: "Tenant réactivé avec succès",
      });
    } catch (error) {
      console.error("Erreur PUT /tenants/:id/activate:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * DELETE /api/admin/tenants/:id
 * Supprimer définitivement un tenant (DANGER - Super Admin uniquement)
 */
router.delete(
  "/tenants/:id",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { confirm } = req.body;

      if (confirm !== "DELETE") {
        return res.status(400).json({
          success: false,
          error: "Confirmation requise",
          message: 'Vous devez envoyer {"confirm": "DELETE"} pour confirmer',
        });
      }

      const [tenants] = await pool.query(
        `SELECT * FROM tenants WHERE id = ?`,
        [id]
      );

      if (tenants.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant non trouvé",
        });
      }

      const tenant = tenants[0];

      // Supprimer le tenant (CASCADE supprimera users, clients, etc.)
      await pool.query(`DELETE FROM tenants WHERE id = ?`, [id]);

      await logAdminActivity(req.superAdmin.id, "tenant_deleted", {
        resource_type: "tenant",
        resource_id: id,
        description: `Suppression DÉFINITIVE du tenant: ${tenant.name}`,
        metadata: { tenant_data: tenant },
        req,
      });

      res.json({
        success: true,
        message: "Tenant supprimé définitivement",
      });
    } catch (error) {
      console.error("Erreur DELETE /tenants/:id:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// ANALYTICS GLOBALES
// ==========================================

/**
 * GET /api/admin/analytics/overview
 * Vue d'ensemble du SaaS
 */
router.get(
  "/analytics/overview",
  superAdminAuth,
  requirePermission("analytics", "view_global"),
  async (req, res) => {
    try {
      // Statistiques globales
      const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'active') as active_tenants,
        (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'trial') as trial_tenants,
        (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'suspended') as suspended_tenants,
        (SELECT COUNT(*) FROM tenants WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_tenants_30d,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed') as completed_appointments
    `);

      // Répartition par plan
      const [planDistribution] = await pool.query(`
      SELECT
        subscription_plan,
        COUNT(*) as count
      FROM tenants
      GROUP BY subscription_plan
    `);

      // Croissance mensuelle
      const [monthlyGrowth] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_tenants
      FROM tenants
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month DESC
    `);

      res.json({
        success: true,
        stats: stats[0],
        plan_distribution: planDistribution,
        monthly_growth: monthlyGrowth,
      });
    } catch (error) {
      console.error("Erreur GET /analytics/overview:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// GESTION DES SUPERADMINS
// ==========================================

/**
 * GET /api/admin/superadmins
 * Liste des SuperAdmins (Super Admin uniquement)
 */
router.get("/superadmins", superAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const [admins] = await pool.query(`
      SELECT
        id, email, first_name, last_name,
        is_active, is_super, login_count,
        last_login_at, created_at
      FROM super_admins
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Erreur GET /superadmins:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * POST /api/admin/superadmins
 * Créer un nouveau SuperAdmin (Super Admin uniquement)
 */
router.post("/superadmins", superAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, first_name, last_name, permissions } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: "Données manquantes",
      });
    }

    // Vérifier si l'email existe déjà
    const [existing] = await pool.query(
      `SELECT id FROM super_admins WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Cet email est déjà utilisé",
      });
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    // Insérer le nouveau SuperAdmin
    const [result] = await pool.query(
      `INSERT INTO super_admins
       (email, password_hash, first_name, last_name, permissions, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [email, password_hash, first_name, last_name, JSON.stringify(permissions || {})]
    );

    await logAdminActivity(req.superAdmin.id, "superadmin_created", {
      resource_type: "super_admin",
      resource_id: result.insertId,
      description: `Création d'un nouveau SuperAdmin: ${email}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: "SuperAdmin créé avec succès",
      admin_id: result.insertId,
    });
  } catch (error) {
    console.error("Erreur POST /superadmins:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// LOGS D'ACTIVITÉ
// ==========================================

/**
 * GET /api/admin/activity-logs
 * Historique des actions SuperAdmin
 */
router.get(
  "/activity-logs",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, action, super_admin_id } = req.query;

      let query = `
      SELECT
        al.*,
        sa.email as admin_email,
        sa.first_name as admin_first_name,
        sa.last_name as admin_last_name
      FROM admin_activity_logs al
      JOIN super_admins sa ON al.super_admin_id = sa.id
      WHERE 1=1
    `;

      const params = [];

      if (action) {
        query += ` AND al.action = ?`;
        params.push(action);
      }

      if (super_admin_id) {
        query += ` AND al.super_admin_id = ?`;
        params.push(super_admin_id);
      }

      query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [logs] = await pool.query(query, params);

      res.json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error("Erreur GET /activity-logs:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

module.exports = router;
