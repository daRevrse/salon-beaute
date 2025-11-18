/**
 * SALONHUB - Middleware SuperAdmin
 * Authentification et autorisation pour les SuperAdmins
 */

const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

/**
 * Middleware d'authentification SuperAdmin
 * Vérifie que le token est valide et appartient à un SuperAdmin
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // Récupération du token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Token manquant",
        message: "Authentification SuperAdmin requise",
      });
    }

    // Format: "Bearer TOKEN"
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

    // Vérifier que c'est bien un token SuperAdmin
    if (decoded.type !== "superadmin") {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
        message: "Accès réservé aux SuperAdmins",
      });
    }

    // Récupérer les infos complètes du SuperAdmin depuis la DB
    const [admins] = await pool.query(
      `SELECT id, email, first_name, last_name, permissions, is_active, is_super
       FROM super_admins
       WHERE id = ? AND is_active = TRUE`,
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        error: "SuperAdmin non trouvé ou désactivé",
      });
    }

    const admin = admins[0];

    // Parser les permissions JSON
    let permissions = {};
    if (admin.permissions) {
      try {
        permissions =
          typeof admin.permissions === "string"
            ? JSON.parse(admin.permissions)
            : admin.permissions;
      } catch (e) {
        console.error("Erreur parsing permissions:", e);
      }
    }

    // Injection dans la requête
    req.superAdmin = {
      id: admin.id,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      is_super: admin.is_super,
      permissions,
    };

    // Log en dev
    if (process.env.NODE_ENV === "development") {
      console.log(
        `👑 SuperAdmin: ${req.superAdmin.email} (${
          req.superAdmin.is_super ? "SUPER" : "ADMIN"
        })`
      );
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Token invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expiré",
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
    }

    console.error("Erreur superadmin middleware:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Middleware de vérification de permission SuperAdmin
 * Vérifie qu'un SuperAdmin a une permission spécifique
 *
 * @param {String} resource - Ressource (ex: 'tenants')
 * @param {String} action - Action (ex: 'delete')
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.superAdmin) {
      return res.status(401).json({
        success: false,
        error: "Non authentifié",
      });
    }

    // Les super admins ont tous les droits
    if (req.superAdmin.is_super) {
      return next();
    }

    // Vérifier la permission
    const hasPermission =
      req.superAdmin.permissions?.[resource]?.[action] === true;

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: "Permission refusée",
        message: `Vous n'avez pas la permission: ${resource}.${action}`,
      });
    }

    next();
  };
};

/**
 * Middleware: Réservé aux Super Admins uniquement
 * (is_super = true)
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.superAdmin) {
    return res.status(401).json({
      success: false,
      error: "Non authentifié",
    });
  }

  if (!req.superAdmin.is_super) {
    return res.status(403).json({
      success: false,
      error: "Accès refusé",
      message: "Cette action est réservée aux Super Admins",
    });
  }

  next();
};

/**
 * Helper: Générer un token JWT pour SuperAdmin
 *
 * @param {Object} admin - Données SuperAdmin
 * @returns {String} Token JWT
 */
const generateSuperAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      type: "superadmin", // Important: identifier le type de token
      is_super: admin.is_super,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

/**
 * Helper: Logger une action SuperAdmin (audit trail)
 *
 * @param {Number} superAdminId - ID du SuperAdmin
 * @param {String} action - Action effectuée
 * @param {Object} options - Options { resource_type, resource_id, description, metadata, req }
 */
const logAdminActivity = async (superAdminId, action, options = {}) => {
  try {
    const {
      resource_type = null,
      resource_id = null,
      description = null,
      metadata = null,
      req = null,
    } = options;

    const ip_address = req
      ? req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress
      : null;
    const user_agent = req ? req.headers["user-agent"] : null;

    await pool.query(
      `INSERT INTO admin_activity_logs
       (super_admin_id, action, resource_type, resource_id, description, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        superAdminId,
        action,
        resource_type,
        resource_id,
        description,
        metadata ? JSON.stringify(metadata) : null,
        ip_address,
        user_agent,
      ]
    );

    console.log(
      `📝 Admin Log: [${action}] by SuperAdmin #${superAdminId} on ${resource_type}#${resource_id}`
    );
  } catch (error) {
    console.error("Erreur logging admin activity:", error);
    // Ne pas bloquer l'action si le log échoue
  }
};

module.exports = {
  superAdminAuth,
  requirePermission,
  requireSuperAdmin,
  generateSuperAdminToken,
  logAdminActivity,
};
