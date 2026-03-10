/**
 * SALONHUB - Routes Salons (Multi-Salon)
 * Gestion des salons d'un utilisateur + switch de salon actif
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { query, transaction } = require("../config/database");
const { authMiddleware, generateToken } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Auth sur toutes les routes
router.use(authMiddleware);

// Plans autorisant le multi-salon
const MULTI_SALON_PLANS = ["custom"];

// ==========================================
// GET - Liste des salons de l'utilisateur
// ==========================================
router.get("/", async (req, res) => {
  try {
    const salons = await query(
      `SELECT
        us.id as membership_id,
        us.role,
        us.is_primary,
        us.is_active as membership_active,
        us.joined_at,
        t.id as tenant_id,
        t.name,
        t.slug,
        t.logo_url,
        t.business_type,
        t.subscription_plan,
        t.subscription_status,
        t.trial_ends_at,
        t.phone,
        t.email,
        t.address
      FROM user_salons us
      JOIN tenants t ON us.tenant_id = t.id
      WHERE us.user_id = ? AND us.is_active = TRUE
      ORDER BY us.is_primary DESC, t.name ASC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: salons,
      meta: {
        count: salons.length,
        active_tenant_id: req.user.tenant_id,
      },
    });
  } catch (error) {
    console.error("Erreur liste salons:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// POST - Changer de salon actif
// ==========================================
router.post("/switch/:tenantId", async (req, res) => {
  try {
    const targetTenantId = parseInt(req.params.tenantId);

    // Vérifier que l'utilisateur appartient à ce salon
    const [membership] = await query(
      `SELECT us.role, us.is_active, t.name as tenant_name, t.slug,
              t.subscription_plan, t.subscription_status, t.trial_ends_at,
              t.logo_url, t.business_type
       FROM user_salons us
       JOIN tenants t ON us.tenant_id = t.id
       WHERE us.user_id = ? AND us.tenant_id = ? AND us.is_active = TRUE`,
      [req.user.id, targetTenantId]
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ce salon.",
      });
    }

    // Générer un nouveau token avec le nouveau tenant_id
    // Le rôle vient de user_salons (pas de users.role)
    const newToken = generateToken({
      id: req.user.id,
      tenant_id: targetTenantId,
      email: req.user.email,
      role: membership.role,
    });

    // Calculer le statut effectif
    let effectiveStatus = membership.subscription_status;
    if (
      membership.subscription_status === "trial" &&
      membership.trial_ends_at
    ) {
      if (new Date(membership.trial_ends_at) < new Date()) {
        effectiveStatus = "expired";
      }
    }

    res.json({
      success: true,
      message: `Basculé vers ${membership.tenant_name}`,
      data: {
        token: newToken,
        user: {
          id: req.user.id,
          email: req.user.email,
          role: membership.role,
          tenant_id: targetTenantId,
        },
        tenant: {
          id: targetTenantId,
          name: membership.tenant_name,
          slug: membership.slug,
          subscription_plan: membership.subscription_plan,
          subscription_status: effectiveStatus,
          trial_ends_at: membership.trial_ends_at,
          logo_url: membership.logo_url,
          business_type: membership.business_type,
        },
      },
    });
  } catch (error) {
    console.error("Erreur switch salon:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// POST - Créer un nouveau salon
// ==========================================
router.post("/", tenantMiddleware, async (req, res) => {
  try {
    const { name, business_type, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Le nom du salon est obligatoire",
      });
    }

    // Vérifier le plan du salon actuel (doit être Custom)
    const [currentTenant] = await query(
      `SELECT subscription_plan, subscription_status, subscription_started_at,
              trial_ends_at, stripe_customer_id, stripe_subscription_id
       FROM tenants WHERE id = ?`,
      [req.tenantId]
    );

    if (!currentTenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant actuel introuvable",
      });
    }

    // Vérifier le droit au multi-salon
    if (!MULTI_SALON_PLANS.includes(currentTenant.subscription_plan)) {
      return res.status(403).json({
        success: false,
        error: "Plan insuffisant",
        message:
          "La création de salons supplémentaires nécessite le plan Custom. Contactez-nous pour un devis personnalisé.",
      });
    }

    // Vérifier le rôle (seul le owner peut créer un nouveau salon)
    const [membership] = await query(
      "SELECT role FROM user_salons WHERE user_id = ? AND tenant_id = ?",
      [req.user.id, req.tenantId]
    );

    if (!membership || membership.role !== "owner") {
      return res.status(403).json({
        success: false,
        error: "Seul le propriétaire peut créer un nouveau salon",
      });
    }

    // Générer le slug
    const slug =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    // Créer le tenant via transaction
    const result = await transaction(async (connection) => {
      // 1. Créer le tenant
      const [tenantResult] = await connection.query(
        `INSERT INTO tenants (name, slug, business_type, phone, email, address,
          subscription_plan, subscription_status, subscription_started_at,
          trial_ends_at, stripe_customer_id, stripe_subscription_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          slug,
          business_type || "beauty",
          phone || null,
          email || null,
          address || null,
          currentTenant.subscription_plan,
          currentTenant.subscription_status,
          currentTenant.subscription_started_at,
          currentTenant.trial_ends_at,
          currentTenant.stripe_customer_id,
          currentTenant.stripe_subscription_id,
        ]
      );

      const newTenantId = tenantResult.insertId;

      // 2. Ajouter l'utilisateur comme owner du nouveau salon
      await connection.query(
        `INSERT INTO user_salons (user_id, tenant_id, role, is_primary, is_active)
         VALUES (?, ?, 'owner', FALSE, TRUE)`,
        [req.user.id, newTenantId]
      );

      // 3. Créer les horaires par défaut (stockés dans settings)
      const defaultBusinessHours = {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "17:00", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true },
      };

      await connection.query(
        `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
         VALUES (?, 'business_hours', ?, 'json')`,
        [newTenantId, JSON.stringify(defaultBusinessHours)]
      );

      return { tenantId: newTenantId, slug };
    });

    res.status(201).json({
      success: true,
      message: "Salon créé avec succès",
      data: {
        tenant_id: result.tenantId,
        name,
        slug: result.slug,
        business_type: business_type || "beauty",
      },
    });
  } catch (error) {
    console.error("Erreur création salon:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// PUT - Modifier un salon
// ==========================================
router.put("/:tenantId", async (req, res) => {
  try {
    const targetTenantId = parseInt(req.params.tenantId);
    const { name, phone, email, address, business_type } = req.body;

    // Vérifier l'accès owner/admin
    const [membership] = await query(
      "SELECT role FROM user_salons WHERE user_id = ? AND tenant_id = ? AND is_active = TRUE",
      [req.user.id, targetTenantId]
    );

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
      });
    }

    // Construire l'update dynamiquement
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      params.push(email);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      params.push(address);
    }
    if (business_type !== undefined) {
      updates.push("business_type = ?");
      params.push(business_type);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Aucune modification" });
    }

    params.push(targetTenantId);

    await query(
      `UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: "Salon modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur modification salon:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// DELETE - Supprimer un salon
// ==========================================
router.delete("/:tenantId", async (req, res) => {
  try {
    const targetTenantId = parseInt(req.params.tenantId);

    // Vérifier que c'est bien un owner
    const [membership] = await query(
      "SELECT role, is_primary FROM user_salons WHERE user_id = ? AND tenant_id = ? AND is_active = TRUE",
      [req.user.id, targetTenantId]
    );

    if (!membership || membership.role !== "owner") {
      return res.status(403).json({
        success: false,
        error: "Seul le propriétaire peut supprimer un salon",
      });
    }

    // Impossible de supprimer le salon principal
    if (membership.is_primary) {
      return res.status(400).json({
        success: false,
        error: "Impossible de supprimer votre salon principal",
        message:
          "Vous devez d'abord désigner un autre salon comme principal.",
      });
    }

    // Vérifier que ce n'est pas le salon actif
    if (targetTenantId === req.user.tenant_id) {
      return res.status(400).json({
        success: false,
        error: "Impossible de supprimer le salon actif",
        message: "Basculez vers un autre salon avant de le supprimer.",
      });
    }

    // Supprimer (cascade via FK supprime tout: user_salons, appointments, clients, etc.)
    await query("DELETE FROM tenants WHERE id = ?", [targetTenantId]);

    res.json({
      success: true,
      message: "Salon supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression salon:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// POST - Inviter quelqu'un dans un salon
// ==========================================
router.post(
  "/:tenantId/invite",
  tenantMiddleware,
  async (req, res) => {
    try {
      const targetTenantId = parseInt(req.params.tenantId);
      const { email, role } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({ success: false, error: "Email obligatoire" });
      }

      if (role && !["admin", "staff"].includes(role)) {
        return res
          .status(400)
          .json({ success: false, error: "Rôle invalide (admin ou staff)" });
      }

      // Vérifier accès owner/admin au salon
      const [membership] = await query(
        "SELECT role FROM user_salons WHERE user_id = ? AND tenant_id = ? AND is_active = TRUE",
        [req.user.id, targetTenantId]
      );

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé",
        });
      }

      // Vérifier si l'utilisateur n'est pas déjà dans le salon
      const [existing] = await query(
        `SELECT us.id FROM user_salons us
         JOIN users u ON us.user_id = u.id
         WHERE u.email = ? AND us.tenant_id = ?`,
        [email, targetTenantId]
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Cet utilisateur fait déjà partie du salon",
        });
      }

      // Vérifier si une invitation en attente existe
      const [pendingInvite] = await query(
        `SELECT id FROM salon_invitations
         WHERE email = ? AND tenant_id = ? AND accepted_at IS NULL AND expires_at > NOW()`,
        [email, targetTenantId]
      );

      if (pendingInvite) {
        return res.status(409).json({
          success: false,
          error: "Une invitation est déjà en attente pour cet email",
        });
      }

      // Générer le token d'invitation
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

      await query(
        `INSERT INTO salon_invitations (tenant_id, email, role, token, invited_by, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [targetTenantId, email, role || "staff", token, req.user.id, expiresAt]
      );

      // Récupérer le nom du salon
      const [tenant] = await query("SELECT name FROM tenants WHERE id = ?", [
        targetTenantId,
      ]);

      // TODO: Envoyer l'email d'invitation
      // emailService.sendSalonInvitation({ to: email, salonName: tenant.name, token, role })

      res.status(201).json({
        success: true,
        message: `Invitation envoyée à ${email}`,
        data: {
          email,
          role: role || "staff",
          salon_name: tenant?.name,
          expires_at: expiresAt,
          // En dev, on retourne le token pour tester
          ...(process.env.NODE_ENV !== "production" && {
            invitation_token: token,
          }),
        },
      });
    } catch (error) {
      console.error("Erreur invitation:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  }
);

// ==========================================
// GET - Voir une invitation
// ==========================================
router.get("/invitations/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [invitation] = await query(
      `SELECT si.*, t.name as salon_name, t.logo_url, t.business_type,
              u.first_name as invited_by_first_name, u.last_name as invited_by_last_name
       FROM salon_invitations si
       JOIN tenants t ON si.tenant_id = t.id
       JOIN users u ON si.invited_by = u.id
       WHERE si.token = ?`,
      [token]
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation introuvable",
      });
    }

    if (invitation.accepted_at) {
      return res.status(400).json({
        success: false,
        error: "Cette invitation a déjà été acceptée",
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Cette invitation a expiré",
      });
    }

    res.json({
      success: true,
      data: {
        salon_name: invitation.salon_name,
        salon_logo: invitation.logo_url,
        business_type: invitation.business_type,
        role: invitation.role,
        email: invitation.email,
        invited_by: `${invitation.invited_by_first_name} ${invitation.invited_by_last_name}`,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Erreur consultation invitation:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// POST - Accepter une invitation
// ==========================================
router.post("/invitations/:token/accept", async (req, res) => {
  try {
    const { token } = req.params;

    const [invitation] = await query(
      `SELECT * FROM salon_invitations WHERE token = ?`,
      [token]
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation introuvable",
      });
    }

    if (invitation.accepted_at) {
      return res.status(400).json({
        success: false,
        error: "Invitation déjà acceptée",
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Invitation expirée",
      });
    }

    // Trouver l'utilisateur par son email (doit être connecté ou avoir un compte)
    const [user] = await query("SELECT id FROM users WHERE email = ?", [
      invitation.email,
    ]);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Aucun compte SalonHub trouvé pour cet email",
        message:
          "L'utilisateur doit d'abord créer un compte SalonHub avant d'accepter l'invitation.",
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans le salon
    const [existingMembership] = await query(
      "SELECT id FROM user_salons WHERE user_id = ? AND tenant_id = ?",
      [user.id, invitation.tenant_id]
    );

    if (existingMembership) {
      // Marquer l'invitation comme acceptée quand même
      await query(
        "UPDATE salon_invitations SET accepted_at = NOW() WHERE id = ?",
        [invitation.id]
      );
      return res.status(409).json({
        success: false,
        error: "Vous faites déjà partie de ce salon",
      });
    }

    // Transaction : accepter l'invitation + ajouter au salon
    await transaction(async (connection) => {
      // Ajouter l'utilisateur au salon
      await connection.query(
        `INSERT INTO user_salons (user_id, tenant_id, role, is_primary, is_active)
         VALUES (?, ?, ?, FALSE, TRUE)`,
        [user.id, invitation.tenant_id, invitation.role]
      );

      // Marquer l'invitation comme acceptée
      await connection.query(
        "UPDATE salon_invitations SET accepted_at = NOW() WHERE id = ?",
        [invitation.id]
      );
    });

    // Récupérer le nom du salon
    const [tenant] = await query("SELECT name FROM tenants WHERE id = ?", [
      invitation.tenant_id,
    ]);

    res.json({
      success: true,
      message: `Vous avez rejoint ${tenant?.name || "le salon"} !`,
      data: {
        tenant_id: invitation.tenant_id,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error("Erreur acceptation invitation:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// GET - Liste des invitations en attente d'un salon
// ==========================================
router.get("/:tenantId/invitations", tenantMiddleware, async (req, res) => {
  try {
    const targetTenantId = parseInt(req.params.tenantId);

    // Vérifier l'accès
    const [membership] = await query(
      "SELECT role FROM user_salons WHERE user_id = ? AND tenant_id = ? AND is_active = TRUE",
      [req.user.id, targetTenantId]
    );

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
      });
    }

    const invitations = await query(
      `SELECT si.id, si.email, si.role, si.expires_at, si.accepted_at, si.created_at,
              u.first_name as invited_by_first_name, u.last_name as invited_by_last_name
       FROM salon_invitations si
       JOIN users u ON si.invited_by = u.id
       WHERE si.tenant_id = ?
       ORDER BY si.created_at DESC
       LIMIT 50`,
      [targetTenantId]
    );

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error("Erreur liste invitations:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
