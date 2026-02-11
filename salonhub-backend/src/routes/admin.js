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
 * PUT /api/admin/tenants/:id/change-plan
 * Manually change tenant subscription plan (SuperAdmin only)
 */
router.put(
  "/tenants/:id/change-plan",
  superAdminAuth,
  requirePermission("tenants", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { plan, reason } = req.body;

      // Validate plan
      const validPlans = ["essential", "pro", "custom", "trial"];
      if (!plan || !validPlans.includes(plan)) {
        return res.status(400).json({
          success: false,
          error: "Plan invalide",
          message: `Le plan doit être l'un des suivants: ${validPlans.join(", ")}`,
        });
      }

      // Get current tenant
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
      const previousPlan = tenant.subscription_plan;

      // Update tenant plan
      await pool.query(
        `UPDATE tenants SET 
          subscription_plan = ?,
          subscription_status = 'active',
          subscription_started_at = COALESCE(subscription_started_at, NOW())
        WHERE id = ?`,
        [plan, id]
      );

      // Log the activity
      await logAdminActivity(req.superAdmin.id, "plan_changed", {
        resource_type: "tenant",
        resource_id: id,
        description: `Changement de plan manuel pour ${tenant.name}: ${previousPlan} → ${plan}`,
        metadata: {
          previous_plan: previousPlan,
          new_plan: plan,
          reason: reason || "Changement manuel par SuperAdmin",
        },
        req,
      });

      res.json({
        success: true,
        message: `Plan mis à jour avec succès: ${plan}`,
        data: {
          tenant_id: id,
          previous_plan: previousPlan,
          new_plan: plan,
        },
      });
    } catch (error) {
      console.error("Erreur PUT /tenants/:id/change-plan:", error);
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
// GESTION DES UTILISATEURS
// ==========================================

/**
 * GET /api/admin/users
 * Liste de tous les utilisateurs (tous tenants)
 */
router.get(
  "/users",
  superAdminAuth,
  requirePermission("users", "view_all"),
  async (req, res) => {
    try {
      const { role, tenant_id, search, limit = 100, offset = 0 } = req.query;

      let query = `
        SELECT
          u.*,
          t.name as tenant_name,
          t.slug as tenant_slug
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE 1=1
      `;

      const params = [];

      if (role) {
        query += ` AND u.role = ?`;
        params.push(role);
      }

      if (tenant_id) {
        query += ` AND u.tenant_id = ?`;
        params.push(tenant_id);
      }

      if (search) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [users] = await pool.query(query, params);

      // Compter le total
      let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
      const countParams = [];

      if (role) {
        countQuery += ` AND role = ?`;
        countParams.push(role);
      }

      if (tenant_id) {
        countQuery += ` AND tenant_id = ?`;
        countParams.push(tenant_id);
      }

      if (search) {
        countQuery += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        users,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + users.length < total,
        },
      });
    } catch (error) {
      console.error("Erreur GET /users:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

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

// ==========================================
// GESTION DES RÉINITIALISATIONS MOT DE PASSE
// ==========================================

/**
 * GET /api/admin/password-resets
 * Liste des demandes de réinitialisation de mot de passe
 */
router.get(
  "/password-resets",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, status, tenant_id } = req.query;

      let query = `
      SELECT
        prt.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        t.name as tenant_name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      JOIN tenants t ON prt.tenant_id = t.id
      WHERE 1=1
    `;

      const params = [];

      // Filtre par statut
      if (status === "active") {
        query += ` AND prt.used = FALSE AND prt.expires_at > NOW()`;
      } else if (status === "used") {
        query += ` AND prt.used = TRUE`;
      } else if (status === "expired") {
        query += ` AND prt.used = FALSE AND prt.expires_at <= NOW()`;
      }

      // Filtre par tenant
      if (tenant_id) {
        query += ` AND prt.tenant_id = ?`;
        params.push(tenant_id);
      }

      query += ` ORDER BY prt.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [tokens] = await pool.query(query, params);

      res.json({
        success: true,
        tokens,
      });
    } catch (error) {
      console.error("Erreur GET /password-resets:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * DELETE /api/admin/password-resets/cleanup
 * Nettoyer les tokens expirés et utilisés
 */
router.delete(
  "/password-resets/cleanup",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      // Supprimer les tokens expirés et utilisés depuis plus de 7 jours
      const [result] = await pool.query(
        `DELETE FROM password_reset_tokens
         WHERE expires_at < NOW()
            OR (used = TRUE AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))`
      );

      // Logger l'action
      await logAdminActivity(req.superAdmin.id, "password_tokens_cleanup", {
        description: `Nettoyage des tokens de réinitialisation: ${result.affectedRows} supprimés`,
        req,
      });

      res.json({
        success: true,
        deleted_count: result.affectedRows,
      });
    } catch (error) {
      console.error("Erreur DELETE /password-resets/cleanup:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// MODIFICATION TENANT (CRUD complet)
// ==========================================

/**
 * PUT /api/admin/tenants/:id
 * Modifier les informations d'un tenant
 */
router.put(
  "/tenants/:id",
  superAdminAuth,
  requirePermission("tenants", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, address, city, postal_code } = req.body;

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

      // Construire la requête dynamique
      const updates = [];
      const params = [];

      if (name !== undefined) { updates.push("name = ?"); params.push(name); }
      if (email !== undefined) { updates.push("email = ?"); params.push(email); }
      if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
      if (address !== undefined) { updates.push("address = ?"); params.push(address); }
      if (city !== undefined) { updates.push("city = ?"); params.push(city); }
      if (postal_code !== undefined) { updates.push("postal_code = ?"); params.push(postal_code); }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucun champ à modifier",
        });
      }

      params.push(id);
      await pool.query(
        `UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      await logAdminActivity(req.superAdmin.id, "tenant_updated", {
        resource_type: "tenant",
        resource_id: id,
        description: `Modification du tenant: ${tenant.name}`,
        metadata: { fields_updated: updates.map(u => u.split(" = ")[0]) },
        req,
      });

      res.json({
        success: true,
        message: "Tenant modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur PUT /tenants/:id:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// GESTION DES UTILISATEURS (Actions)
// ==========================================

/**
 * PUT /api/admin/users/:id/toggle-active
 * Activer/Désactiver un utilisateur
 */
router.put(
  "/users/:id/toggle-active",
  superAdminAuth,
  requirePermission("users", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const [users] = await pool.query(
        `SELECT u.*, t.name as tenant_name FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }

      const user = users[0];
      const newStatus = !user.is_active;

      await pool.query(
        `UPDATE users SET is_active = ? WHERE id = ?`,
        [newStatus, id]
      );

      await logAdminActivity(req.superAdmin.id, newStatus ? "user_activated" : "user_deactivated", {
        resource_type: "user",
        resource_id: id,
        description: `${newStatus ? "Activation" : "Désactivation"} de ${user.first_name} ${user.last_name} (${user.tenant_name})`,
        req,
      });

      res.json({
        success: true,
        message: `Utilisateur ${newStatus ? "activé" : "désactivé"} avec succès`,
        is_active: newStatus,
      });
    } catch (error) {
      console.error("Erreur PUT /users/:id/toggle-active:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/reset-password
 * Réinitialiser le mot de passe d'un utilisateur
 */
router.put(
  "/users/:id/reset-password",
  superAdminAuth,
  requirePermission("users", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const [users] = await pool.query(
        `SELECT u.*, t.name as tenant_name FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }

      const user = users[0];

      // Générer un mot de passe aléatoire
      const crypto = require("crypto");
      const newPassword = crypto.randomBytes(6).toString("hex"); // 12 caractères
      const password_hash = await bcrypt.hash(newPassword, 10);

      await pool.query(
        `UPDATE users SET password_hash = ? WHERE id = ?`,
        [password_hash, id]
      );

      await logAdminActivity(req.superAdmin.id, "user_password_reset", {
        resource_type: "user",
        resource_id: id,
        description: `Reset mot de passe de ${user.first_name} ${user.last_name} (${user.tenant_name})`,
        req,
      });

      res.json({
        success: true,
        message: "Mot de passe réinitialisé avec succès",
        temporary_password: newPassword,
      });
    } catch (error) {
      console.error("Erreur PUT /users/:id/reset-password:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/change-role
 * Changer le rôle d'un utilisateur
 */
router.put(
  "/users/:id/change-role",
  superAdminAuth,
  requirePermission("users", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const validRoles = ["owner", "admin", "staff"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `Rôle invalide. Valeurs acceptées: ${validRoles.join(", ")}`,
        });
      }

      const [users] = await pool.query(
        `SELECT u.*, t.name as tenant_name FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }

      const user = users[0];
      const previousRole = user.role;

      await pool.query(
        `UPDATE users SET role = ? WHERE id = ?`,
        [role, id]
      );

      await logAdminActivity(req.superAdmin.id, "user_role_changed", {
        resource_type: "user",
        resource_id: id,
        description: `Changement de rôle de ${user.first_name} ${user.last_name}: ${previousRole} → ${role}`,
        metadata: { previous_role: previousRole, new_role: role },
        req,
      });

      res.json({
        success: true,
        message: `Rôle mis à jour: ${role}`,
        previous_role: previousRole,
        new_role: role,
      });
    } catch (error) {
      console.error("Erreur PUT /users/:id/change-role:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// BILLING AVANCÉ
// ==========================================

/**
 * PUT /api/admin/tenants/:id/subscription
 * Ajuster manuellement l'abonnement d'un tenant
 */
router.put(
  "/tenants/:id/subscription",
  superAdminAuth,
  requirePermission("tenants", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { plan, status, trial_ends_at, reason, discount_percent } = req.body;

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
      const updates = [];
      const params = [];
      const changes = {};

      if (plan) {
        const validPlans = ["essential", "pro", "custom", "trial"];
        if (!validPlans.includes(plan)) {
          return res.status(400).json({
            success: false,
            error: `Plan invalide. Valeurs: ${validPlans.join(", ")}`,
          });
        }
        updates.push("subscription_plan = ?");
        params.push(plan);
        changes.plan = { from: tenant.subscription_plan, to: plan };
      }

      if (status) {
        const validStatuses = ["active", "trial", "suspended", "cancelled", "expired"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: `Statut invalide. Valeurs: ${validStatuses.join(", ")}`,
          });
        }
        updates.push("subscription_status = ?");
        params.push(status);
        changes.status = { from: tenant.subscription_status, to: status };
      }

      if (trial_ends_at) {
        updates.push("trial_ends_at = ?");
        params.push(trial_ends_at);
        changes.trial_ends_at = trial_ends_at;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucune modification fournie",
        });
      }

      params.push(id);
      await pool.query(
        `UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      await logAdminActivity(req.superAdmin.id, "subscription_adjusted", {
        resource_type: "tenant",
        resource_id: id,
        description: `Ajustement abonnement de ${tenant.name}`,
        metadata: { changes, reason: reason || "Ajustement manuel SuperAdmin" },
        req,
      });

      res.json({
        success: true,
        message: "Abonnement ajusté avec succès",
        changes,
      });
    } catch (error) {
      console.error("Erreur PUT /tenants/:id/subscription:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/tenants/:id/retry-payment
 * Relancer un paiement échoué via Stripe
 */
router.post(
  "/tenants/:id/retry-payment",
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

      if (!tenant.stripe_customer_id) {
        return res.status(400).json({
          success: false,
          error: "Ce tenant n'a pas de compte Stripe",
        });
      }

      // Récupérer la dernière facture impayée
      const { stripe } = require("../config/stripe");
      const invoices = await stripe.invoices.list({
        customer: tenant.stripe_customer_id,
        status: "open",
        limit: 1,
      });

      if (invoices.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Aucune facture impayée trouvée",
        });
      }

      const invoice = invoices.data[0];
      const result = await stripe.invoices.pay(invoice.id);

      await logAdminActivity(req.superAdmin.id, "payment_retry", {
        resource_type: "tenant",
        resource_id: id,
        description: `Relance paiement pour ${tenant.name} - Facture ${invoice.id}`,
        metadata: { invoice_id: invoice.id, status: result.status },
        req,
      });

      res.json({
        success: true,
        message: "Paiement relancé avec succès",
        invoice_status: result.status,
      });
    } catch (error) {
      console.error("Erreur POST /tenants/:id/retry-payment:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/tenants/:id/invoices
 * Historique des factures d'un tenant via Stripe
 */
router.get(
  "/tenants/:id/invoices",
  superAdminAuth,
  requirePermission("tenants", "view"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 20 } = req.query;

      const [tenants] = await pool.query(
        `SELECT stripe_customer_id, name FROM tenants WHERE id = ?`,
        [id]
      );

      if (tenants.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant non trouvé",
        });
      }

      const tenant = tenants[0];

      if (!tenant.stripe_customer_id) {
        return res.json({
          success: true,
          invoices: [],
          message: "Ce tenant n'a pas de compte Stripe",
        });
      }

      const { stripe } = require("../config/stripe");
      const invoices = await stripe.invoices.list({
        customer: tenant.stripe_customer_id,
        limit: parseInt(limit),
      });

      const formattedInvoices = invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount_due / 100,
        currency: inv.currency,
        status: inv.status,
        created: new Date(inv.created * 1000),
        due_date: inv.due_date ? new Date(inv.due_date * 1000) : null,
        paid_at: inv.status_transitions?.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000)
          : null,
        invoice_pdf: inv.invoice_pdf,
        hosted_invoice_url: inv.hosted_invoice_url,
      }));

      res.json({
        success: true,
        invoices: formattedInvoices,
      });
    } catch (error) {
      console.error("Erreur GET /tenants/:id/invoices:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// COMMUNICATION (Annonces & Messages)
// ==========================================

/**
 * GET /api/admin/announcements
 * Lister toutes les annonces
 */
router.get(
  "/announcements",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const [announcements] = await pool.query(
        `SELECT a.*, sa.first_name as admin_first_name, sa.last_name as admin_last_name
         FROM admin_announcements a
         JOIN super_admins sa ON a.super_admin_id = sa.id
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)]
      );

      res.json({
        success: true,
        announcements,
      });
    } catch (error) {
      console.error("Erreur GET /announcements:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/announcements
 * Créer et envoyer une annonce
 */
router.post(
  "/announcements",
  superAdminAuth,
  requirePermission("system", "manage"),
  async (req, res) => {
    try {
      const { title, content, target_type, target_plans, target_tenant_ids, sent_via } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: "Titre et contenu requis",
        });
      }

      const [result] = await pool.query(
        `INSERT INTO admin_announcements
         (super_admin_id, title, content, target_type, target_plans, target_tenant_ids, sent_via, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          req.superAdmin.id,
          title,
          content,
          target_type || "all",
          target_plans ? JSON.stringify(target_plans) : null,
          target_tenant_ids ? JSON.stringify(target_tenant_ids) : null,
          sent_via || "email",
        ]
      );

      // Récupérer les destinataires selon le ciblage
      let recipientQuery = `
        SELECT DISTINCT u.email, u.first_name, t.name as tenant_name, t.id as tenant_id
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.role = 'owner' AND u.is_active = TRUE AND t.is_active = TRUE
      `;
      const recipientParams = [];

      if (target_type === "plan" && target_plans && target_plans.length > 0) {
        recipientQuery += ` AND t.subscription_plan IN (${target_plans.map(() => "?").join(",")})`;
        recipientParams.push(...target_plans);
      } else if (target_type === "specific" && target_tenant_ids && target_tenant_ids.length > 0) {
        recipientQuery += ` AND t.id IN (${target_tenant_ids.map(() => "?").join(",")})`;
        recipientParams.push(...target_tenant_ids);
      }

      const [recipients] = await pool.query(recipientQuery, recipientParams);

      // Envoyer les emails en arrière-plan (ne pas bloquer la réponse)
      if (sent_via !== "in_app") {
        const emailService = require("../services/emailService");
        for (const recipient of recipients) {
          emailService.sendEmail({
            to: recipient.email,
            subject: `[SalonHub] ${title}`,
            html: `
              <h2>${title}</h2>
              <p>Bonjour ${recipient.first_name},</p>
              <div>${content}</div>
              <br/>
              <p>L'équipe SalonHub</p>
            `,
          }).catch(err => console.error(`Erreur envoi annonce à ${recipient.email}:`, err));
        }
      }

      // Émettre via Socket.io pour les notifications in-app
      if (sent_via !== "email" && req.io) {
        const tenantIds = [...new Set(recipients.map(r => r.tenant_id))];
        for (const tid of tenantIds) {
          req.io.to(`tenant_${tid}`).emit("admin_notification", {
            type: "announcement",
            id: result.insertId,
            title,
            content,
            created_at: new Date().toISOString(),
          });
        }
      }

      await logAdminActivity(req.superAdmin.id, "announcement_sent", {
        resource_type: "announcement",
        resource_id: result.insertId,
        description: `Annonce envoyée: "${title}" à ${recipients.length} destinataires`,
        metadata: { target_type, recipients_count: recipients.length },
        req,
      });

      res.status(201).json({
        success: true,
        message: `Annonce envoyée à ${recipients.length} destinataire(s)`,
        announcement_id: result.insertId,
        recipients_count: recipients.length,
      });
    } catch (error) {
      console.error("Erreur POST /announcements:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/messages
 * Lister tous les messages
 */
router.get(
  "/messages",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { tenant_id, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT m.*,
          sa.first_name as admin_first_name, sa.last_name as admin_last_name,
          t.name as tenant_name,
          u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
        FROM admin_messages m
        JOIN super_admins sa ON m.super_admin_id = sa.id
        JOIN tenants t ON m.tenant_id = t.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (tenant_id) {
        query += ` AND m.tenant_id = ?`;
        params.push(tenant_id);
      }

      query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [messages] = await pool.query(query, params);

      res.json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error("Erreur GET /messages:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/messages
 * Envoyer un message à un tenant spécifique
 */
router.post(
  "/messages",
  superAdminAuth,
  requirePermission("system", "manage"),
  async (req, res) => {
    try {
      const { tenant_id, subject, content, send_email } = req.body;

      if (!tenant_id || !subject || !content) {
        return res.status(400).json({
          success: false,
          error: "tenant_id, subject et content requis",
        });
      }

      // Récupérer le tenant et son owner
      const [tenants] = await pool.query(
        `SELECT t.*, u.id as owner_id, u.email as owner_email, u.first_name as owner_first_name
         FROM tenants t
         JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
         WHERE t.id = ?
         LIMIT 1`,
        [tenant_id]
      );

      if (tenants.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant non trouvé",
        });
      }

      const tenant = tenants[0];

      const [result] = await pool.query(
        `INSERT INTO admin_messages
         (super_admin_id, tenant_id, user_id, subject, content)
         VALUES (?, ?, ?, ?, ?)`,
        [req.superAdmin.id, tenant_id, tenant.owner_id, subject, content]
      );

      // Envoyer par email si demandé
      if (send_email !== false && tenant.owner_email) {
        const emailService = require("../services/emailService");
        emailService.sendEmail({
          to: tenant.owner_email,
          subject: `[SalonHub] ${subject}`,
          html: `
            <h2>${subject}</h2>
            <p>Bonjour ${tenant.owner_first_name},</p>
            <div>${content}</div>
            <br/>
            <p>L'équipe SalonHub</p>
          `,
        }).catch(err => console.error(`Erreur envoi message à ${tenant.owner_email}:`, err));
      }

      // Émettre via Socket.io pour notification in-app
      if (req.io) {
        req.io.to(`tenant_${tenant_id}`).emit("admin_notification", {
          type: "message",
          id: result.insertId,
          title: subject,
          content,
          created_at: new Date().toISOString(),
        });
      }

      await logAdminActivity(req.superAdmin.id, "message_sent", {
        resource_type: "message",
        resource_id: result.insertId,
        description: `Message envoyé à ${tenant.name}: "${subject}"`,
        req,
      });

      res.status(201).json({
        success: true,
        message: "Message envoyé avec succès",
        message_id: result.insertId,
      });
    } catch (error) {
      console.error("Erreur POST /messages:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// FEATURE FLAGS PAR TENANT
// ==========================================

/**
 * GET /api/admin/feature-overrides
 * Lister les overrides de features
 */
router.get(
  "/feature-overrides",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { tenant_id } = req.query;

      let query = `
        SELECT fo.*, t.name as tenant_name
        FROM tenant_feature_overrides fo
        JOIN tenants t ON fo.tenant_id = t.id
        WHERE 1=1
      `;
      const params = [];

      if (tenant_id) {
        query += ` AND fo.tenant_id = ?`;
        params.push(tenant_id);
      }

      query += ` ORDER BY fo.created_at DESC`;

      const [overrides] = await pool.query(query, params);

      res.json({
        success: true,
        overrides,
      });
    } catch (error) {
      console.error("Erreur GET /feature-overrides:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/feature-overrides
 * Créer/Modifier un override de feature pour un tenant
 */
router.post(
  "/feature-overrides",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { tenant_id, feature_key, enabled, metadata } = req.body;

      if (!tenant_id || !feature_key) {
        return res.status(400).json({
          success: false,
          error: "tenant_id et feature_key requis",
        });
      }

      // Upsert (INSERT ... ON DUPLICATE KEY UPDATE)
      await pool.query(
        `INSERT INTO tenant_feature_overrides (tenant_id, feature_key, enabled, metadata, created_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), metadata = VALUES(metadata), updated_at = NOW()`,
        [tenant_id, feature_key, enabled !== false ? 1 : 0, metadata ? JSON.stringify(metadata) : null, req.superAdmin.id]
      );

      await logAdminActivity(req.superAdmin.id, "feature_override_set", {
        resource_type: "feature_override",
        description: `Feature "${feature_key}" ${enabled !== false ? "activée" : "désactivée"} pour tenant ${tenant_id}`,
        metadata: { tenant_id, feature_key, enabled },
        req,
      });

      res.json({
        success: true,
        message: `Feature "${feature_key}" ${enabled !== false ? "activée" : "désactivée"}`,
      });
    } catch (error) {
      console.error("Erreur POST /feature-overrides:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * DELETE /api/admin/feature-overrides/:tenantId/:featureKey
 * Supprimer un override de feature
 */
router.delete(
  "/feature-overrides/:tenantId/:featureKey",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { tenantId, featureKey } = req.params;

      const [result] = await pool.query(
        `DELETE FROM tenant_feature_overrides WHERE tenant_id = ? AND feature_key = ?`,
        [tenantId, featureKey]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Override non trouvé",
        });
      }

      await logAdminActivity(req.superAdmin.id, "feature_override_removed", {
        resource_type: "feature_override",
        description: `Override supprimé: "${featureKey}" pour tenant ${tenantId}`,
        req,
      });

      res.json({
        success: true,
        message: "Override supprimé",
      });
    } catch (error) {
      console.error("Erreur DELETE /feature-overrides:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

module.exports = router;
