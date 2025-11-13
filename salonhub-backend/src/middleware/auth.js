/**
 * SALONHUB - Middleware Authentification
 * Vérification des tokens JWT et protection des routes
 */

const jwt = require("jsonwebtoken");

/**
 * Middleware de vérification JWT
 * Extrait et vérifie le token dans le header Authorization
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

    // Vérification du token
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
 * Helper: Générer un token JWT
 *
 * @param {Object} user - Données utilisateur
 * @returns {String} Token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

/**
 * Helper: Décoder un token sans vérification
 * Utile pour débugger
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  generateToken,
  decodeToken,
};
