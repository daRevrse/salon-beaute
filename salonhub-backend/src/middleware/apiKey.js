/**
 * SALONHUB - Middleware API Key
 * Authentification par clé API (sk_live_...)
 * Réservé aux plans Developer, Custom et Trial
 */

const bcrypt = require("bcryptjs");
const { query } = require("../config/database");

const API_KEY_PREFIX = "sk_live_";
const DAILY_RATE_LIMIT = 5000;

/**
 * Vérifie si un token est une clé API
 */
const isApiKey = (token) => {
  return token && token.startsWith(API_KEY_PREFIX);
};

// L'accès API est désormais géré via la colonne technical_features de la table subscription_plans

/**
 * Middleware d'authentification par clé API
 */
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Clé API manquante",
        message: "Aucune clé API fournie dans le header Authorization",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Format invalide",
        message: "Le format doit être: Bearer sk_live_...",
      });
    }

    const apiKey = parts[1];

    if (!isApiKey(apiKey)) {
      return res.status(401).json({
        success: false,
        error: "Clé API invalide",
        message: "La clé API doit commencer par sk_live_",
      });
    }

    // Extraire le préfixe (les 16 premiers caractères après sk_live_)
    const keyPrefix = apiKey.substring(0, API_KEY_PREFIX.length + 8);

    // Chercher la clé dans la base
    const keys = await query(
      `SELECT ak.*, t.subscription_plan, t.subscription_status, t.trial_ends_at,
              sp.technical_features
       FROM api_keys ak
       JOIN tenants t ON t.id = ak.tenant_id
       LEFT JOIN subscription_plans sp ON t.subscription_plan = sp.name
       WHERE ak.key_prefix = ? AND ak.is_active = TRUE`,
      [keyPrefix]
    );

    if (keys.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Clé API invalide",
        message: "Cette clé API n'existe pas ou a été désactivée",
      });
    }

    const keyRecord = keys[0];

    // Vérifier le hash de la clé complète
    const isValid = await bcrypt.compare(apiKey, keyRecord.key_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Clé API invalide",
        message: "La clé API fournie est incorrecte",
      });
    }

    // Vérifier l'expiration de la clé
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: "Clé API expirée",
        message: "Cette clé API a expiré. Veuillez en générer une nouvelle.",
      });
    }

    // Vérifier si le plan contient la fonctionnalité api_access
    const features = Array.isArray(keyRecord.technical_features) 
      ? keyRecord.technical_features 
      : (typeof keyRecord.technical_features === 'string' ? JSON.parse(keyRecord.technical_features || '[]') : []);
    
    const hasApiAccess = features.includes('api_access');

    if (subscription_status === "trial") {
      // Vérifier si le trial n'est pas expiré
      if (trial_ends_at && new Date(trial_ends_at) < new Date()) {
        return res.status(403).json({
          success: false,
          error: "Période d'essai expirée",
          message:
            "Votre période d'essai est terminée. Passez à un plan incluant l'accès API pour continuer.",
        });
      }
      // Trial actif → accès autorisé par défaut (ou on peut aussi checker features)
    } else if (!hasApiAccess) {
      return res.status(403).json({
        success: false,
        error: "Fonctionnalité non incluse",
        message:
          "L'accès API n'est pas inclus dans votre plan actuel (" + subscription_plan + "). Veuillez contacter le support ou changer de plan.",
      });
    }

    // Vérifier le statut de l'abonnement
    if (["suspended", "cancelled", "expired"].includes(subscription_status)) {
      return res.status(403).json({
        success: false,
        error: "Abonnement inactif",
        message: "Votre abonnement n'est pas actif. Veuillez renouveler.",
      });
    }

    // Rate limiting quotidien
    const today = new Date().toISOString().split("T")[0];
    let dailyRequests = keyRecord.daily_requests || 0;

    if (
      !keyRecord.daily_requests_reset ||
      keyRecord.daily_requests_reset.toISOString().split("T")[0] !== today
    ) {
      // Nouveau jour, reset le compteur
      dailyRequests = 0;
    }

    if (dailyRequests >= DAILY_RATE_LIMIT) {
      return res.status(429).json({
        success: false,
        error: "Limite de requêtes atteinte",
        message: `Vous avez atteint la limite de ${DAILY_RATE_LIMIT} requêtes/jour. Réessayez demain.`,
        limit: DAILY_RATE_LIMIT,
        reset: today + "T23:59:59Z",
      });
    }

    // Mettre à jour last_used_at et compteur
    await query(
      `UPDATE api_keys
       SET last_used_at = NOW(),
           daily_requests = ?,
           daily_requests_reset = ?
       WHERE id = ?`,
      [dailyRequests + 1, today, keyRecord.id]
    );

    // Injecter les données dans la requête (même format que authMiddleware)
    req.user = {
      id: keyRecord.user_id,
      tenant_id: keyRecord.tenant_id,
      role: "owner",
      via_api_key: true,
      api_key_id: keyRecord.id,
      api_key_name: keyRecord.name,
    };

    // Vérifier les scopes si définis
    if (keyRecord.scopes) {
      req.apiKeyScopes = JSON.parse(keyRecord.scopes);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔑 API Key: "${keyRecord.name}" (${keyPrefix}) - Tenant ${keyRecord.tenant_id} - ${dailyRequests + 1}/${DAILY_RATE_LIMIT} req`
      );
    }

    next();
  } catch (error) {
    console.error("Erreur apiKey middleware:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

module.exports = {
  isApiKey,
  apiKeyMiddleware,
  API_KEY_PREFIX,
};
