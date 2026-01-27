/**
 * SALONHUB - Middleware Tenant
 * Extraction et validation du tenant_id pour isolation multi-tenant
 *
 * CRITIQUE: Ce middleware DOIT être appliqué sur TOUTES les routes
 * qui manipulent des données pour garantir l'isolation entre salons
 */

/**
 * Middleware d'extraction du tenant
 * Récupère le tenant_id depuis le JWT décodé par authMiddleware
 */
const tenantMiddleware = (req, res, next) => {
  // Le tenant_id est injecté par authMiddleware dans req.user
  const tenantId = req.user?.tenant_id;

  if (!tenantId) {
    return res.status(403).json({
      success: false,
      error: "Tenant non identifié",
      message: "Impossible de déterminer le salon associé",
    });
  }

  // Injection du tenant_id et user_id dans la requête
  // Accessible dans toutes les routes via req.tenantId et req.userId
  req.tenantId = tenantId;
  req.userId = req.user?.id;

  // Log en dev (pour debug)
  if (process.env.NODE_ENV === "development") {
    console.log(`🏢 Tenant ID: ${tenantId} | Route: ${req.method} ${req.path}`);
  }

  next();
};

/**
 * Middleware optionnel: Vérification du statut d'abonnement
 * Bloque l'accès si l'abonnement est suspendu ou annulé
 */
const checkSubscriptionStatus = async (req, res, next) => {
  const { query } = require("../config/database");

  try {
    const [tenant] = await query(
      "SELECT subscription_status, trial_ends_at FROM tenants WHERE id = ?",
      [req.tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Salon introuvable",
      });
    }

    // Vérifier statut
    if (tenant.subscription_status === "suspended") {
      return res.status(403).json({
        success: false,
        error: "Abonnement suspendu",
        message:
          "Votre abonnement a été suspendu. Veuillez contacter le support.",
      });
    }

    if (tenant.subscription_status === "cancelled") {
      return res.status(403).json({
        success: false,
        error: "Abonnement annulé",
        message: "Votre abonnement a été annulé.",
      });
    }

    // Vérifier fin d'essai
    // if (tenant.subscription_status === "trial" && tenant.trial_ends_at) {
    //   const trialEnd = new Date(tenant.trial_ends_at);
    //   if (trialEnd < new Date()) {
    //     return res.status(403).json({
    //       success: false,
    //       error: "Période d'essai expirée",
    //       message:
    //         "Votre période d'essai est terminée. Veuillez souscrire à un abonnement.",
    //     });
    //   }
    // }

    // Tout est OK
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error("Erreur vérification abonnement:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Middleware pour les routes publiques: Vérifie si le tenant a un abonnement actif
 * Bloque l'accès aux pages publiques (booking, menu, etc.) si abonnement expiré
 * MAIS n'affecte PAS l'accès au dashboard admin du tenant
 *
 * @param {string} slugParam - Nom du paramètre contenant le slug (par défaut 'slug')
 */
const checkPublicSubscription = (slugParam = 'slug') => {
  return async (req, res, next) => {
    const { query } = require("../config/database");

    try {
      const slug = req.params[slugParam];

      if (!slug) {
        return next(); // Pas de slug, on laisse passer (erreur sera gérée ailleurs)
      }

      const [tenant] = await query(
        `SELECT id, name, subscription_status, trial_ends_at, is_active
         FROM tenants WHERE slug = ?`,
        [slug]
      );

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: "Établissement non trouvé"
        });
      }

      // Vérifier si le tenant est actif
      if (!tenant.is_active) {
        return res.status(403).json({
          success: false,
          error: "Page indisponible",
          message: "Cette page de réservation n'est pas disponible actuellement."
        });
      }

      // Vérifier le statut de l'abonnement
      const invalidStatuses = ['suspended', 'cancelled', 'expired'];
      if (invalidStatuses.includes(tenant.subscription_status)) {
        return res.status(403).json({
          success: false,
          error: "Page indisponible",
          message: "Cette page de réservation n'est pas disponible actuellement."
        });
      }

      // Vérifier si la période d'essai est expirée
      if (tenant.subscription_status === 'trial' && tenant.trial_ends_at) {
        const trialEnd = new Date(tenant.trial_ends_at);
        if (trialEnd < new Date()) {
          // Mettre à jour le statut dans la BDD pour cohérence
          await query("UPDATE tenants SET subscription_status = 'expired' WHERE id = ?", [tenant.id]);

          return res.status(403).json({
            success: false,
            error: "Page indisponible",
            message: "Cette page de réservation n'est pas disponible actuellement."
          });
        }
      }

      // Injecter les infos du tenant dans la requête pour les routes suivantes
      req.publicTenant = tenant;

      next();
    } catch (error) {
      console.error("Erreur vérification abonnement public:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur serveur"
      });
    }
  };
};

module.exports = {
  tenantMiddleware,
  checkSubscriptionStatus,
  checkPublicSubscription,
};
