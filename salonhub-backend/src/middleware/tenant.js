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

  // Injection du tenant_id dans la requête
  // Accessible dans toutes les routes via req.tenantId
  req.tenantId = tenantId;

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
    if (tenant.subscription_status === "trial" && tenant.trial_ends_at) {
      const trialEnd = new Date(tenant.trial_ends_at);
      if (trialEnd < new Date()) {
        return res.status(403).json({
          success: false,
          error: "Période d'essai expirée",
          message:
            "Votre période d'essai est terminée. Veuillez souscrire à un abonnement.",
        });
      }
    }

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

module.exports = {
  tenantMiddleware,
  checkSubscriptionStatus,
};
