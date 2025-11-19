/**
 * SALONHUB - Routes de réinitialisation de mot de passe
 * Gestion de la récupération et réinitialisation des mots de passe
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
const emailService = require("../services/emailService");

/**
 * POST /api/password/forgot
 * Demande de réinitialisation de mot de passe
 * Public
 */
router.post("/forgot", async (req, res) => {
  const { email, tenant_slug } = req.body;

  if (!email || !tenant_slug) {
    return res.status(400).json({
      success: false,
      error: "Email et slug du salon requis",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Vérifier que le tenant existe
    const [tenants] = await connection.query(
      "SELECT id, name, subscription_status FROM tenants WHERE slug = ?",
      [tenant_slug]
    );

    if (tenants.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "Salon introuvable",
      });
    }

    const tenant = tenants[0];

    if (tenant.subscription_status === 'cancelled') {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        error: "Ce salon est actuellement désactivé",
      });
    }

    // Vérifier que l'utilisateur existe
    const [users] = await connection.query(
      "SELECT id, email, first_name, is_active FROM users WHERE email = ? AND tenant_id = ?",
      [email.toLowerCase(), tenant.id]
    );

    if (users.length === 0) {
      await connection.rollback();
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        error: "Ce compte est désactivé",
      });
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Token expire dans 1 heure
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Obtenir l'IP et user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    // Invalider les anciens tokens non utilisés de cet utilisateur
    await connection.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE",
      [user.id]
    );

    // Créer le nouveau token
    await connection.query(
      `INSERT INTO password_reset_tokens
       (user_id, tenant_id, token, email, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, tenant.id, hashedToken, email.toLowerCase(), expiresAt, ipAddress, userAgent]
    );

    await connection.commit();

    // Construire le lien de réinitialisation
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/${tenant_slug}/reset-password?token=${token}`;

    // Envoyer l'email de réinitialisation
    try {
      await emailService.sendPasswordResetEmail({
        to: email.toLowerCase(),
        firstName: user.first_name,
        resetLink,
        tenantName: tenant.name,
        expiresInMinutes: 60,
      });

      console.log(`✅ Email de réinitialisation envoyé à ${email}`);
    } catch (emailError) {
      console.error(`❌ Erreur lors de l'envoi de l'email à ${email}:`, emailError.message);
      // Ne pas bloquer la requête si l'envoi d'email échoue
      // Le token est quand même créé et valide
    }

    res.json({
      success: true,
      message: "Un email avec les instructions de réinitialisation a été envoyé à votre adresse",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erreur forgot password:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la demande de réinitialisation",
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/password/verify-token/:token
 * Vérifier la validité d'un token de réinitialisation
 * Public
 */
router.get("/verify-token/:token", async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token requis",
    });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const [results] = await pool.query(
      `SELECT
        prt.id,
        prt.email,
        prt.expires_at,
        prt.used,
        u.first_name,
        t.name as tenant_name,
        t.slug as tenant_slug
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      JOIN tenants t ON prt.tenant_id = t.id
      WHERE prt.token = ?`,
      [hashedToken]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Token invalide",
      });
    }

    const tokenData = results[0];

    // Vérifier si le token a expiré
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Ce lien a expiré. Veuillez demander un nouveau lien de réinitialisation.",
      });
    }

    // Vérifier si le token a déjà été utilisé
    if (tokenData.used) {
      return res.status(400).json({
        success: false,
        error: "Ce lien a déjà été utilisé",
      });
    }

    res.json({
      success: true,
      data: {
        email: tokenData.email,
        first_name: tokenData.first_name,
        tenant_name: tokenData.tenant_name,
        tenant_slug: tokenData.tenant_slug,
      },
    });
  } catch (error) {
    console.error("Erreur verify token:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification du token",
    });
  }
});

/**
 * POST /api/password/reset
 * Réinitialiser le mot de passe avec un token valide
 * Public
 */
router.post("/reset", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      error: "Token et nouveau mot de passe requis",
    });
  }

  // Valider le mot de passe
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Le mot de passe doit contenir au moins 8 caractères",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Récupérer le token
    const [tokens] = await connection.query(
      `SELECT
        prt.id,
        prt.user_id,
        prt.expires_at,
        prt.used,
        u.email,
        u.first_name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ?`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "Token invalide",
      });
    }

    const tokenData = tokens[0];

    // Vérifier si le token a expiré
    if (new Date(tokenData.expires_at) < new Date()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Ce lien a expiré",
      });
    }

    // Vérifier si le token a déjà été utilisé
    if (tokenData.used) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Ce lien a déjà été utilisé",
      });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe de l'utilisateur
    await connection.query(
      "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
      [passwordHash, tokenData.user_id]
    );

    // Marquer le token comme utilisé
    await connection.query(
      "UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = ?",
      [tokenData.id]
    );

    await connection.commit();

    console.log(`✅ Mot de passe réinitialisé pour: ${tokenData.email}`);

    res.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès",
      data: {
        email: tokenData.email,
        first_name: tokenData.first_name,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erreur reset password:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la réinitialisation du mot de passe",
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
