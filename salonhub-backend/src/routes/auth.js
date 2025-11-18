/**
 * SALONHUB - Routes Authentification
 * Inscription, connexion, gestion utilisateurs
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { query, transaction } = require("../config/database");
const { generateToken, authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");
const emailService = require("../services/emailService");

// ==========================================
// POST - Inscription (Créer nouveau salon + owner)
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const {
      // Infos salon
      salon_name,
      salon_email,
      salon_phone,
      salon_address,
      salon_city,
      salon_postal_code,

      // Infos propriétaire
      first_name,
      last_name,
      email,
      password,

      // Plan (optionnel)
      subscription_plan,
    } = req.body;

    // Validation
    if (
      !salon_name ||
      !salon_email ||
      !first_name ||
      !last_name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
        required: [
          "salon_name",
          "salon_email",
          "first_name",
          "last_name",
          "email",
          "password",
        ],
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !emailRegex.test(salon_email)) {
      return res.status(400).json({
        success: false,
        error: "Format email invalide",
      });
    }

    // Validation password (min 8 caractères)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    // Vérifier que l'email salon n'existe pas déjà
    const [existingTenant] = await query(
      "SELECT id FROM tenants WHERE email = ?",
      [salon_email]
    );

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        error: "Un salon avec cet email existe déjà",
      });
    }

    // Vérifier que l'email utilisateur n'existe pas
    const [existingUser] = await query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Hash du password
    const passwordHash = await bcrypt.hash(password, 10);

    // Générer slug unique pour le salon
    let slug = salon_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlever accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Vérifier unicité du slug
    let slugSuffix = 1;
    let finalSlug = slug;
    while (true) {
      const [existing] = await query("SELECT id FROM tenants WHERE slug = ?", [
        finalSlug,
      ]);
      if (!existing) break;
      finalSlug = `${slug}-${slugSuffix}`;
      slugSuffix++;
    }

    // Transaction : Créer salon + utilisateur
    const result = await transaction(async (connection) => {
      // 1. Créer le tenant (salon)
      const [tenantResult] = await connection.query(
        `INSERT INTO tenants (
          name, slug, email, phone, address, city, postal_code,
          subscription_plan, subscription_status, trial_ends_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'trial', DATE_ADD(NOW(), INTERVAL 14 DAY))`,
        [
          salon_name,
          finalSlug,
          salon_email,
          salon_phone || null,
          salon_address || null,
          salon_city || null,
          salon_postal_code || null,
          subscription_plan || "starter",
        ]
      );

      const tenantId = tenantResult.insertId;

      // 2. Créer l'utilisateur propriétaire
      const [userResult] = await connection.query(
        `INSERT INTO users (
          tenant_id, email, password_hash, first_name, last_name, role, is_active
        ) VALUES (?, ?, ?, ?, ?, 'owner', TRUE)`,
        [tenantId, email, passwordHash, first_name, last_name]
      );

      // 3. Créer quelques paramètres par défaut
      await connection.query(
        `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type) VALUES
        (?, 'business_hours', '{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-18:00","friday":"09:00-18:00","saturday":"09:00-17:00","sunday":"closed"}', 'json'),
        (?, 'appointment_buffer', '15', 'number'),
        (?, 'require_email_confirmation', 'true', 'boolean')`,
        [tenantId, tenantId, tenantId]
      );

      return {
        tenantId,
        userId: userResult.insertId,
      };
    });

    // Générer token JWT
    const token = generateToken({
      id: result.userId,
      tenant_id: result.tenantId,
      email: email,
      role: "owner",
    });

    // Envoyer l'email de bienvenue (async, sans bloquer la réponse)
    emailService.sendWelcomeEmail({
      to: email,
      firstName: first_name,
      tenantSlug: finalSlug
    }).catch(error => {
      console.error('Erreur envoi email de bienvenue:', error.message);
      // Ne pas bloquer l'inscription si l'email échoue
    });

    res.status(201).json({
      success: true,
      message: "Inscription réussie ! Bienvenue sur SalonHub",
      data: {
        token,
        user: {
          id: result.userId,
          email,
          first_name,
          last_name,
          role: "owner",
        },
        tenant: {
          id: result.tenantId,
          name: salon_name,
          slug: finalSlug,
        },
      },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'inscription",
    });
  }
});

// ==========================================
// POST - Login (Connexion)
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email et mot de passe requis",
      });
    }

    // Récupérer l'utilisateur
    const [user] = await query(
      `SELECT 
        u.*,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.subscription_status,
        t.trial_ends_at,
        t.logo_url as logo_url
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier que l'utilisateur est actif
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Compte désactivé",
        message: "Votre compte a été désactivé. Contactez l'administrateur.",
      });
    }

    // Vérifier le password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier statut abonnement
    if (user.subscription_status === "suspended") {
      return res.status(403).json({
        success: false,
        error: "Abonnement suspendu",
        message:
          "Votre abonnement a été suspendu. Veuillez mettre à jour votre paiement.",
      });
    }

    if (user.subscription_status === "cancelled") {
      return res.status(403).json({
        success: false,
        error: "Abonnement annulé",
        message: "Votre abonnement a été annulé.",
      });
    }

    // Vérifier fin de période d'essai
    if (user.subscription_status === "trial" && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd < new Date()) {
        return res.status(403).json({
          success: false,
          error: "Période d'essai expirée",
          message:
            "Votre période d'essai est terminée. Veuillez souscrire à un abonnement.",
        });
      }
    }

    // Mettre à jour last_login_at
    await query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Générer token
    const token = generateToken({
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          tenant_id: user.tenant_id,
          avatar_url: user.avatar_url,
        },
        tenant: {
          name: user.tenant_name,
          slug: user.tenant_slug,
          subscription_status: user.subscription_status,
          logo_url: user.logo_url,
        },
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la connexion",
    });
  }
});

// ==========================================
// GET - Profil utilisateur connecté
// ==========================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.role, 
        u.is_active, u.last_login_at, u.created_at, u.avatar_url,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.subscription_plan,
        t.subscription_status,
        t.trial_ends_at
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Erreur récupération profil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PUT - Modifier son profil
// ==========================================
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, avatar_url } = req.body;

    // Vérifier si email existe déjà (si changé)
    if (email && email !== req.user.email) {
      const [existingUser] = await query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, req.user.id]
      );

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Cet email est déjà utilisé",
        });
      }
    }

    await query(
      `UPDATE users SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = ?,
        avatar_url = ?
      WHERE id = ?`,
      [first_name, last_name, email, phone, avatar_url, req.user.id]
    );

    // Récupérer le profil mis à jour
    const [updatedUser] = await query(
      `SELECT
        id, email, first_name, last_name, phone, avatar_url, role,
        is_active, last_login_at, created_at
      FROM users
      WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: "Profil mis à jour",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PUT - Changer mot de passe
// ==========================================
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // Validation
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: "Mot de passe actuel et nouveau requis",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Récupérer hash actuel
    const [user] = await query("SELECT password_hash FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable",
      });
    }

    // Vérifier mot de passe actuel
    const passwordMatch = await bcrypt.compare(
      current_password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Mot de passe actuel incorrect",
      });
    }

    // Hash nouveau password
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Mise à jour
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [
      newPasswordHash,
      req.user.id,
    ]);

    res.json({
      success: true,
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur changement password:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Liste staff du salon (owner/admin only)
// ==========================================
router.get("/staff", authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    // Seuls owner et admin peuvent voir la liste
    if (!["owner", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
      });
    }

    const staff = await query(
      `SELECT 
        id, email, first_name, last_name, phone, role,
        is_active, last_login_at, created_at, avatar_url
      FROM users
      WHERE tenant_id = ?
      ORDER BY role, last_name`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Erreur récupération staff:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Ajouter staff (owner/admin only)
// ==========================================
router.post("/staff", authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    // Vérifier permissions
    if (!["owner", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
      });
    }

    const { email, password, first_name, last_name, phone, role } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: "Email, password, prénom et nom requis",
      });
    }

    // Valider rôle
    const validRoles = ["staff", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Rôle invalide. Utilisez: staff ou admin",
      });
    }

    // Vérifier email unique
    const [existing] = await query(
      "SELECT id FROM users WHERE email = ? AND tenant_id = ?",
      [email, req.tenantId]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Un employé avec cet email existe déjà",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer
    const result = await query(
      `INSERT INTO users (
        tenant_id, email, password_hash, first_name, last_name, phone, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        email,
        passwordHash,
        first_name,
        last_name,
        phone || null,
        role || "staff",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Employé ajouté avec succès",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Erreur ajout staff:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PUT - Modifier un membre du staff (owner/admin only)
// ==========================================
router.put("/staff/:id", authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    // Vérifier permissions
    if (!["owner", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
      });
    }

    const { id } = req.params;
    const { first_name, last_name, phone, role, is_active } = req.body;

    // Vérifier que le staff existe et appartient au même tenant
    const [staff] = await query(
      "SELECT id, role FROM users WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Employé introuvable",
      });
    }

    // Ne pas permettre de modifier le owner
    if (staff.role === "owner") {
      return res.status(403).json({
        success: false,
        error: "Impossible de modifier le propriétaire",
      });
    }

    // Construire la requête UPDATE
    const updates = [];
    const params = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      params.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      params.push(last_name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone || null);
    }
    if (role !== undefined) {
      const validRoles = ["staff", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Rôle invalide",
        });
      }
      updates.push("role = ?");
      params.push(role);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucune donnée à mettre à jour",
      });
    }

    params.push(id, req.tenantId);

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({
      success: true,
      message: "Employé modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur modification staff:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// DELETE - Supprimer un membre du staff (owner/admin only)
// ==========================================
router.delete(
  "/staff/:id",
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      // Vérifier permissions
      if (!["owner", "admin"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé",
        });
      }

      const { id } = req.params;

      // Vérifier que le staff existe et appartient au même tenant
      const [staff] = await query(
        "SELECT id, role FROM users WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      if (!staff) {
        return res.status(404).json({
          success: false,
          error: "Employé introuvable",
        });
      }

      // Ne pas permettre de supprimer le owner
      if (staff.role === "owner") {
        return res.status(403).json({
          success: false,
          error: "Impossible de supprimer le propriétaire",
        });
      }

      // Ne pas permettre de se supprimer soi-même
      if (parseInt(id) === req.user.id) {
        return res.status(403).json({
          success: false,
          error: "Vous ne pouvez pas supprimer votre propre compte",
        });
      }

      await query("DELETE FROM users WHERE id = ? AND tenant_id = ?", [
        id,
        req.tenantId,
      ]);

      res.json({
        success: true,
        message: "Employé supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression staff:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// DELETE - Supprimer son propre compte utilisateur
// ==========================================
router.delete("/account", authMiddleware, async (req, res) => {
  try {
    const { password, confirmation_text } = req.body;

    // Validation : mot de passe requis pour confirmer la suppression
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Le mot de passe est requis pour supprimer votre compte",
      });
    }

    // Récupérer l'utilisateur avec son rôle et infos du salon
    const [user] = await query(
      `SELECT
        u.id, u.role, u.password_hash, u.tenant_id, u.email,
        t.name as salon_name, t.subscription_status, t.slug
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable",
      });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Mot de passe incorrect",
      });
    }

    // Si l'utilisateur est "owner", supprimer tout le tenant (salon + tous les données)
    if (user.role === "owner") {
      // Vérification de la confirmation (type GitHub)
      // Le frontend doit envoyer le nom du salon pour confirmer
      if (confirmation_text !== user.salon_name) {
        return res.status(400).json({
          success: false,
          error: "Confirmation invalide",
          message: `Pour confirmer la suppression, veuillez saisir exactement le nom de votre salon : "${user.salon_name}"`,
          required_confirmation: user.salon_name,
        });
      }

      // Vérifier s'il y a un abonnement actif
      if (user.subscription_status === "active") {
        return res.status(403).json({
          success: false,
          error:
            "Vous devez d'abord annuler votre abonnement avant de supprimer votre salon",
          message:
            "Veuillez annuler votre abonnement dans les paramètres de facturation, puis réessayez.",
        });
      }

      // Compter les données qui seront supprimées (pour information)
      const [stats] = await query(
        `SELECT
          (SELECT COUNT(*) FROM users WHERE tenant_id = ?) as total_users,
          (SELECT COUNT(*) FROM clients WHERE tenant_id = ?) as total_clients,
          (SELECT COUNT(*) FROM services WHERE tenant_id = ?) as total_services,
          (SELECT COUNT(*) FROM appointments WHERE tenant_id = ?) as total_appointments`,
        [user.tenant_id, user.tenant_id, user.tenant_id, user.tenant_id]
      );

      // Suppression en cascade du tenant (grâce aux contraintes FK ON DELETE CASCADE)
      // Cela supprimera automatiquement :
      // - Tous les users du tenant
      // - Tous les clients
      // - Tous les services
      // - Tous les rendez-vous
      // - Tous les paramètres
      // - Toutes les notifications
      await query("DELETE FROM tenants WHERE id = ?", [user.tenant_id]);

      res.json({
        success: true,
        message: `Le salon "${user.salon_name}" et toutes ses données ont été supprimés avec succès. Nous sommes désolés de vous voir partir.`,
        deleted: {
          type: "owner",
          tenant_deleted: true,
          tenant_name: user.salon_name,
          stats: {
            users: stats.total_users,
            clients: stats.total_clients,
            services: stats.total_services,
            appointments: stats.total_appointments,
          },
        },
      });
    } else {
      // Si l'utilisateur est "admin" ou "staff", supprimer seulement son compte
      // Pas besoin de confirmation du nom du salon pour les employés
      await query("DELETE FROM users WHERE id = ?", [user.id]);

      res.json({
        success: true,
        message: `Votre compte a été supprimé avec succès. Vous ne faites plus partie de l'équipe de "${user.salon_name}".`,
        deleted: {
          type: user.role,
          tenant_deleted: false,
          user_email: user.email,
        },
      });
    }
  } catch (error) {
    console.error("Erreur suppression compte:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression du compte",
    });
  }
});

module.exports = router;
