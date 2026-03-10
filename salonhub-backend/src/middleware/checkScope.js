/**
 * SALONHUB - Middleware de vérification des scopes API
 *
 * Vérifie que la clé API possède le scope requis pour accéder à la route.
 * Si la requête provient d'un utilisateur authentifié par JWT (pas une clé API),
 * le middleware laisse passer sans vérification.
 *
 * Usage:
 *   router.get("/", checkScope("clients:read"), handler);
 *   router.post("/", checkScope("clients:write"), handler);
 *
 * Scopes disponibles:
 *   - clients:read, clients:write
 *   - services:read, services:write
 *   - appointments:read, appointments:write
 *   - settings:read, settings:write
 *   - public:read
 */

const VALID_SCOPES = [
  "clients:read",
  "clients:write",
  "services:read",
  "services:write",
  "appointments:read",
  "appointments:write",
  "settings:read",
  "settings:write",
  "public:read",
];

/**
 * Middleware factory — retourne un middleware qui vérifie le scope requis
 *
 * @param {string} requiredScope - Le scope nécessaire (ex: "clients:read")
 * @returns {Function} Express middleware
 */
const checkScope = (requiredScope) => {
  // Validation au montage du serveur (pas à chaque requête)
  if (!VALID_SCOPES.includes(requiredScope)) {
    throw new Error(
      `[checkScope] Scope invalide: "${requiredScope}". Scopes valides: ${VALID_SCOPES.join(", ")}`
    );
  }

  return (req, res, next) => {
    // Si l'utilisateur est authentifié par JWT (pas une clé API) → laisser passer
    // Les utilisateurs classiques (dashboard, mobile) ont un accès complet
    if (!req.user?.via_api_key) {
      return next();
    }

    // Requête via clé API — vérifier les scopes
    const scopes = req.apiKeyScopes;

    // Si pas de scopes définis sur la clé → accès total (rétrocompatibilité)
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return next();
    }

    // Vérifier que le scope requis est dans la liste des scopes de la clé
    if (!scopes.includes(requiredScope)) {
      return res.status(403).json({
        success: false,
        error: "Scope insuffisant",
        message: `Cette clé API n'a pas la permission "${requiredScope}". Scopes actuels: ${scopes.join(", ")}`,
        required_scope: requiredScope,
        current_scopes: scopes,
      });
    }

    // Scope valide → continuer
    next();
  };
};

/**
 * Middleware combiné — vérifie PLUSIEURS scopes (l'un OU l'autre suffit)
 * Utile pour les routes qui acceptent read OU write
 *
 * @param {string[]} requiredScopes - Au moins un de ces scopes doit être présent
 * @returns {Function} Express middleware
 */
const checkAnyScope = (requiredScopes) => {
  return (req, res, next) => {
    // Si pas via API key → passer
    if (!req.user?.via_api_key) {
      return next();
    }

    const scopes = req.apiKeyScopes;

    // Pas de scopes définis → accès total
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return next();
    }

    // Vérifier qu'au moins un des scopes requis est présent
    const hasAny = requiredScopes.some((s) => scopes.includes(s));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        error: "Scope insuffisant",
        message: `Cette clé API nécessite l'un des scopes suivants: ${requiredScopes.join(", ")}. Scopes actuels: ${scopes.join(", ")}`,
        required_scopes: requiredScopes,
        current_scopes: scopes,
      });
    }

    next();
  };
};

module.exports = {
  checkScope,
  checkAnyScope,
  VALID_SCOPES,
};
