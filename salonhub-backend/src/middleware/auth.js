/**
 * SALONHUB - Middleware Authentification
 * Vérification des tokens JWT et protection des routes
 */

const jwt = require("jsonwebtoken");
const { isApiKey, apiKeyMiddleware } = require("./apiKey");

/**
 * Middleware de vérification JWT
 * Extrait et vérifie le token dans le header Authorization
 * Délègue automatiquement au middleware API Key si le token commence par sk_live_
 */
const authMiddleware = (req, res, next) => {
  try {
    // Récupération du token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Token manquant",
        message: "Aucun token d'authentification fourni",
      });
    }

    // Format attendu: "Bearer TOKEN"
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Format token invalide",
        message: "Le format doit être: Bearer TOKEN",
      });
    }

    const token = parts[1];

    // Délégation vers API Key middleware si le token est une clé API
    if (isApiKey(token)) {
      return apiKeyMiddleware(req, res, next);
    }

    // Vérification du token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injection des données utilisateur dans la requête
    req.user = {
      id: decoded.id,
      tenant_id: decoded.tenant_id,
      email: decoded.email,
      role: decoded.role,
    };

    // Log en dev
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔐 Auth: User ${req.user.id} (${req.user.role}) - Tenant ${req.user.tenant_id}`
      );
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Token invalide",
        message: "Le token d'authentification est invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expiré",
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
    }

    console.error("Erreur auth middleware:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Middleware de vérification de rôle
 * Vérifie que l'utilisateur a un rôle suffisant
 *
 * @param {Array} allowedRoles - Rôles autorisés ['owner', 'admin', 'staff']
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Non authentifié",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
        message: "Vous n'avez pas les permissions nécessaires",
      });
    }

    next();
  };
};

/**
 * Middleware de vérification de fonctionnalité technique
 * Vérifie que le plan du tenant possède la fonctionnalité demandée
 *
 * @param {String} featureKey - La clé technique (ex: 'shop', 'wallet', 'api_access')
 */
const featureMiddleware = (featureKey) => {
  const db = require("../config/database");

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.tenant_id) {
        return res.status(401).json({
          success: false,
          error: "Non authentifié",
        });
      }

      const tenantId = req.user.tenant_id;

      // Récupérer les features du plan du tenant et son statut
      const results = await db.query(
        `SELECT t.subscription_status, t.trial_ends_at, sp.technical_features
         FROM tenants t
         LEFT JOIN subscription_plans sp ON t.subscription_plan = sp.name
         WHERE t.id = ?`,
        [tenantId]
      );

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant introuvable",
        });
      }

      const { subscription_status, trial_ends_at, technical_features } = results[0];

      // Vérifier le statut de l'abonnement
      if (subscription_status === "expired" || subscription_status === "suspended" || subscription_status === "cancelled") {
        return res.status(403).json({
          success: false,
          error: "Abonnement inactif",
          message: "Votre abonnement n'est plus actif. Veuillez régulariser votre situation.",
        });
      }

      // Cas du trial : On autorise TOUTES les fonctionnalités par défaut pendant l'essai
      if (subscription_status === "trial" && trial_ends_at) {
        if (new Date(trial_ends_at) < new Date()) {
          return res.status(403).json({
            success: false,
            error: "Période d'essai expirée",
            message: "Votre période d'essai est terminée. Veuillez choisir un plan.",
          });
        }
        // En période d'essai active, on laisse passer sans vérifier les technical_features
        return next();
      }

      // Si pas de features définies (plan inconnu ou error), on bloque par sécurité
      if (!technical_features) {
        // Optionnel: autoriser certaines features de base même sans plan
        return res.status(403).json({
          success: false,
          error: "Aucun plan actif",
          message: "Aucun plan d'abonnement n'est associé à votre compte.",
        });
      }

      const features = Array.isArray(technical_features)
        ? technical_features
        : (typeof technical_features === 'string' ? JSON.parse(technical_features || '[]') : []);

      if (!features.includes(featureKey)) {
        return res.status(403).json({
          success: false,
          error: "Fonctionnalité restreinte",
          message: `La fonctionnalité '${featureKey}' n'est pas incluse dans votre offre actuelle.`,
        });
      }

      next();
    } catch (error) {
      console.error("Erreur featureMiddleware:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  };
};

/**
 * Middleware de vérification de permission spécifique
 * Vérifie qu'un utilisateur a un droit spécifique (colonne en BDD)
 * 
 * @param {String} permissionKey - La colonne à vérifier (ex: 'can_confirm_appointments')
 */
const permissionMiddleware = (permissionKey) => {
  const db = require("../config/database");

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Non authentifié",
        });
      }

      // Le propriétaire a toujours tous les droits
      if (req.user.role === "owner") {
        return next();
      }

      const results = await db.query(
        `SELECT ${permissionKey} FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (results.length === 0 || !results[0][permissionKey]) {
        return res.status(403).json({
          success: false,
          error: "Permission refusée",
          message: "Vous n'avez pas les droits nécessaires pour cette action.",
        });
      }

      next();
    } catch (error) {
      console.error("Erreur permissionMiddleware:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  };
};
/**
 * Helper: Générer un token JWT
 *
 * @param {Object} user - Données utilisateur
 * @returns {String} Token JWT
 */
const generateToken = (user, expiresIn = "7d") => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || expiresIn,
    }
  );
};

/**
 * Helper: Décoder un token sans vérification
 * Utile pour débugger
 */
const decodeToken = (token) => {
  const jwt = require("jsonwebtoken");
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  featureMiddleware,
  permissionMiddleware,
  generateToken,
  decodeToken,
};
