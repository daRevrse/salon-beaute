/**
 * SALONHUB - Routes Authentification Google
 * Login et inscription via Google OAuth 2.0 (sans Firebase)
 */

const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const { query, transaction } = require("../config/database");
const { generateToken } = require("../middleware/auth");
const emailService = require("../services/emailService");

// Client IDs par plateforme
const CLIENT_IDS = {
  web: process.env.GOOGLE_CLIENT_ID,
  android: process.env.GOOGLE_CLIENT_ID_ANDROID,
  ios: process.env.GOOGLE_CLIENT_ID_IOS,
};

const oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Vérifie un Google token (ID token ou access token) et retourne le payload
 * - ID token : vérifié cryptographiquement via google-auth-library
 * - Access token : vérifié via l'API userinfo de Google
 */
async function verifyGoogleToken(token, platform) {
  let googleUser;

  try {
    // Essayer d'abord comme ID token
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: Object.values(CLIENT_IDS).filter(Boolean),
    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      throw new Error("L'adresse email Google n'est pas vérifiée");
    }

    googleUser = {
      google_id: payload.sub,
      email: payload.email,
      first_name: payload.given_name || "",
      last_name: payload.family_name || "",
      avatar_url: payload.picture || null,
    };
  } catch (idTokenError) {
    // Si ce n'est pas un ID token valide, essayer comme access token
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Access token Google invalide");
      }

      const payload = await response.json();

      if (!payload.email_verified) {
        throw new Error("L'adresse email Google n'est pas vérifiée");
      }

      googleUser = {
        google_id: payload.sub,
        email: payload.email,
        first_name: payload.given_name || "",
        last_name: payload.family_name || "",
        avatar_url: payload.picture || null,
      };
    } catch (accessTokenError) {
      throw new Error(
        "Token Google invalide (ni ID token ni access token valide)"
      );
    }
  }

  return googleUser;
}

// ==========================================
// POST - Login avec Google
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { id_token, platform } = req.body;

    if (!id_token) {
      return res.status(400).json({
        success: false,
        error: "Le token Google est requis",
      });
    }

    // Vérifier le token Google
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(id_token, platform || "web");
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Token Google invalide",
        message: error.message,
      });
    }

    // Chercher l'utilisateur par google_id d'abord
    let [user] = await query(
      `SELECT
        u.*,
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.subscription_status,
        t.subscription_plan,
        t.trial_ends_at,
        t.logo_url,
        t.business_type
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.google_id = ?`,
      [googleUser.google_id]
    );

    // Fallback : chercher par email
    if (!user) {
      [user] = await query(
        `SELECT
          u.*,
          t.id as tenant_id,
          t.name as tenant_name,
          t.slug as tenant_slug,
          t.subscription_status,
          t.subscription_plan,
          t.trial_ends_at,
          t.logo_url,
          t.business_type
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.email = ?`,
        [googleUser.email]
      );

      // Si trouvé par email, lier le compte Google
      if (user && !user.google_id) {
        await query(
          `UPDATE users SET google_id = ?, auth_provider = 'both', avatar_url = COALESCE(avatar_url, ?) WHERE id = ?`,
          [googleUser.google_id, googleUser.avatar_url, user.id]
        );
        user.google_id = googleUser.google_id;
        user.auth_provider = "both";
      }
    }

    // Aucun utilisateur trouvé → inscription nécessaire
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "no_account",
        message: "Aucun compte trouvé avec cet email Google",
        google_user: {
          email: googleUser.email,
          first_name: googleUser.first_name,
          last_name: googleUser.last_name,
          avatar_url: googleUser.avatar_url,
          google_id: googleUser.google_id,
        },
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

    // Mettre à jour last_login_at
    await query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Générer token JWT SalonHub
    const token = generateToken({
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    });

    // Calculer le statut effectif de l'abonnement
    let effectiveStatus = user.subscription_status;
    if (user.subscription_status === "trial" && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd < new Date()) {
        effectiveStatus = "expired";
        await query(
          "UPDATE tenants SET subscription_status = 'expired' WHERE id = ?",
          [user.tenant_id]
        );
      }
    }

    // Récupérer la liste des salons de l'utilisateur
    const salons = await query(
      `SELECT
        us.role, us.is_primary, us.is_active as membership_active,
        t.id as tenant_id, t.name, t.slug, t.logo_url, t.business_type,
        t.subscription_plan, t.subscription_status
      FROM user_salons us
      JOIN tenants t ON us.tenant_id = t.id
      WHERE us.user_id = ? AND us.is_active = TRUE
      ORDER BY us.is_primary DESC, t.name ASC`,
      [user.id]
    );

    res.json({
      success: true,
      message: "Connexion Google réussie",
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
          auth_provider: user.auth_provider,
        },
        tenant: {
          id: user.tenant_id,
          name: user.tenant_name,
          slug: user.tenant_slug,
          subscription_status: effectiveStatus,
          subscription_plan: user.subscription_plan,
          trial_ends_at: user.trial_ends_at,
          logo_url: user.logo_url,
          business_type: user.business_type,
        },
        salons,
      },
    });
  } catch (error) {
    console.error("Erreur login Google:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la connexion Google",
    });
  }
});

// ==========================================
// POST - Inscription avec Google
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const {
      id_token,
      platform,
      // Infos salon
      salon_name,
      salon_email,
      salon_phone,
      salon_address,
      salon_city,
      salon_postal_code,
      // Plan
      subscription_plan,
      // Business type
      business_type,
    } = req.body;

    if (!id_token) {
      return res.status(400).json({
        success: false,
        error: "Le token Google est requis",
      });
    }

    if (!salon_name || !salon_email) {
      return res.status(400).json({
        success: false,
        error: "Le nom et l'email du salon sont requis",
      });
    }

    // Vérifier le token Google
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(id_token, platform || "web");
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Token Google invalide",
        message: error.message,
      });
    }

    // Validation business_type
    const validBusinessTypes = ["beauty", "restaurant", "training", "medical"];
    const finalBusinessType =
      business_type && validBusinessTypes.includes(business_type)
        ? business_type
        : "beauty";

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

    // Vérifier que l'email utilisateur (Google) n'existe pas
    const [existingUser] = await query("SELECT id FROM users WHERE email = ?", [
      googleUser.email,
    ]);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Vérifier que le google_id n'est pas déjà utilisé
    const [existingGoogleUser] = await query(
      "SELECT id FROM users WHERE google_id = ?",
      [googleUser.google_id]
    );

    if (existingGoogleUser) {
      return res.status(409).json({
        success: false,
        error: "Ce compte Google est déjà associé à un compte SalonHub",
      });
    }

    // Générer slug unique
    let slug = salon_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

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
      // 1. Créer le tenant
      const [tenantResult] = await connection.query(
        `INSERT INTO tenants (
          name, slug, email, phone, address, city, postal_code,
          subscription_plan, subscription_status, trial_ends_at, business_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'trial', DATE_ADD(NOW(), INTERVAL 14 DAY), ?)`,
        [
          salon_name,
          finalSlug,
          salon_email,
          salon_phone || null,
          salon_address || null,
          salon_city || null,
          salon_postal_code || null,
          subscription_plan || "starter",
          finalBusinessType,
        ]
      );

      const tenantId = tenantResult.insertId;

      // 2. Créer l'utilisateur (sans mot de passe, avec google_id)
      const [userResult] = await connection.query(
        `INSERT INTO users (
          tenant_id, email, password_hash, first_name, last_name, role, is_active,
          avatar_url, google_id, auth_provider
        ) VALUES (?, ?, NULL, ?, ?, 'owner', TRUE, ?, ?, 'google')`,
        [
          tenantId,
          googleUser.email,
          googleUser.first_name,
          googleUser.last_name,
          googleUser.avatar_url,
          googleUser.google_id,
        ]
      );

      // 3. Entrée user_salons (multi-salon pivot)
      await connection.query(
        `INSERT INTO user_salons (user_id, tenant_id, role, is_primary, is_active)
         VALUES (?, ?, 'owner', TRUE, TRUE)`,
        [userResult.insertId, tenantId]
      );

      // 4. Paramètres par défaut
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
      email: googleUser.email,
      role: "owner",
    });

    // Email de bienvenue (async)
    emailService
      .sendWelcomeEmail({
        to: googleUser.email,
        firstName: googleUser.first_name,
        tenantSlug: finalSlug,
      })
      .catch((error) => {
        console.error("Erreur envoi email de bienvenue:", error.message);
      });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    res.status(201).json({
      success: true,
      message: "Inscription Google réussie ! Bienvenue sur SalonHub",
      data: {
        token,
        user: {
          id: result.userId,
          email: googleUser.email,
          first_name: googleUser.first_name,
          last_name: googleUser.last_name,
          role: "owner",
          avatar_url: googleUser.avatar_url,
          auth_provider: "google",
        },
        tenant: {
          id: result.tenantId,
          name: salon_name,
          slug: finalSlug,
          business_type: finalBusinessType,
          subscription_status: "trial",
          subscription_plan: subscription_plan || "starter",
          trial_ends_at: trialEndsAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Erreur inscription Google:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'inscription Google",
    });
  }
});

module.exports = router;
