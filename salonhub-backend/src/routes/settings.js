/**
 * Routes pour la gestion des paramètres du salon
 */

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");
const { checkScope } = require("../middleware/checkScope");

// Toutes les routes sont protégées
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/settings
 * Récupérer tous les paramètres du salon
 */
router.get("/", checkScope("settings:read"), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const settings = await db.query(
      `SELECT setting_key, setting_value, setting_type
       FROM settings
       WHERE tenant_id = ?`,
      [tenantId]
    );

    // Formater les settings en objet
    const formattedSettings = {};
    settings.forEach((setting) => {
      let value = setting.setting_value;

      // Parser selon le type
      if (setting.setting_type === "json") {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error("Erreur parsing JSON:", e);
        }
      } else if (setting.setting_type === "number") {
        value = parseFloat(value);
      } else if (setting.setting_type === "boolean") {
        value = value === "true" || value === "1";
      }

      formattedSettings[setting.setting_key] = value;
    });

    // Valeurs par défaut si vides
    if (!formattedSettings.business_hours) {
      formattedSettings.business_hours = {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "17:00", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true },
      };
    }

    if (!formattedSettings.slot_duration) {
      formattedSettings.slot_duration = 30;
    }

    res.json(formattedSettings);
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/settings/salon
 * Récupérer les informations du salon
 */
router.get("/salon", checkScope("settings:read"), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await db.query(
      `SELECT id, name, slug, phone, email, address, city, postal_code, logo_url, banner_url, slogan, currency, business_type,
              subscription_status, subscription_plan, trial_ends_at, onboarding_status
       FROM tenants
       WHERE id = ?`,
      [tenantId]
    );

    if (tenant.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Salon introuvable",
      });
    }

    // Vérifier si le trial est expiré et mettre à jour le statut
    const tenantData = tenant[0];
    if (tenantData.subscription_status === 'trial' && tenantData.trial_ends_at) {
      const trialEnd = new Date(tenantData.trial_ends_at);
      if (trialEnd < new Date()) {
        tenantData.subscription_status = 'expired';
        // Mettre à jour dans la BDD
        await db.query("UPDATE tenants SET subscription_status = 'expired' WHERE id = ?", [tenantId]);
      }
    }

    res.json({
      success: true,
      data: tenantData,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du salon:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * GET /api/settings/subscription
 * Récupérer les informations d'abonnement du tenant
 */
router.get("/subscription", checkScope("settings:read"), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await db.query(
      `SELECT subscription_status, subscription_plan, trial_ends_at,
              subscription_started_at, stripe_customer_id, stripe_subscription_id
       FROM tenants
       WHERE id = ?`,
      [tenantId]
    );

    if (tenant.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tenant introuvable",
      });
    }

    const tenantData = tenant[0];

    // Vérifier si le trial est expiré et mettre à jour le statut
    let effectiveStatus = tenantData.subscription_status;
    let isTrialExpired = false;
    let daysRemaining = null;

    if (tenantData.subscription_status === 'trial' && tenantData.trial_ends_at) {
      const trialEnd = new Date(tenantData.trial_ends_at);
      const now = new Date();

      if (trialEnd < now) {
        effectiveStatus = 'expired';
        isTrialExpired = true;
        // Mettre à jour dans la BDD
        await db.query("UPDATE tenants SET subscription_status = 'expired' WHERE id = ?", [tenantId]);
      } else {
        // Calculer les jours restants
        const diffTime = trialEnd.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      success: true,
      data: {
        status: effectiveStatus,
        plan: tenantData.subscription_plan,
        trial_ends_at: tenantData.trial_ends_at,
        subscription_started_at: tenantData.subscription_started_at,
        has_stripe_subscription: !!tenantData.stripe_subscription_id,
        is_trial_expired: isTrialExpired,
        days_remaining: daysRemaining,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * PUT /api/settings/salon
 * Mettre à jour les informations du salon (nom, logo, etc.)
 */
router.put("/salon", checkScope("settings:write"), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, slug, phone, email, address, city, postal_code, logo_url, banner_url, slogan } = req.body;

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (slug !== undefined) {
      updates.push("slug = ?");
      params.push(slug);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      params.push(email);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      params.push(address);
    }
    if (city !== undefined) {
      updates.push("city = ?");
      params.push(city);
    }
    if (postal_code !== undefined) {
      updates.push("postal_code = ?");
      params.push(postal_code);
    }
    if (logo_url !== undefined) {
      updates.push("logo_url = ?");
      params.push(logo_url);
    }
    if (banner_url !== undefined) {
      updates.push("banner_url = ?");
      params.push(banner_url);
    }
    if (slogan !== undefined) {
      updates.push("slogan = ?");
      params.push(slogan);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucune donnée à mettre à jour",
      });
    }

    params.push(tenantId);

    await db.query(
      `UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: "Informations du salon mises à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du salon:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * PUT /api/settings
 * Mettre à jour les paramètres du salon
 */
router.put("/", checkScope("settings:write"), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { business_hours, slot_duration, currency, theme_settings, require_appointment_deposit } = req.body;

    // Mettre à jour require_appointment_deposit
    if (require_appointment_deposit !== undefined) {
      const existing = await db.query(
        "SELECT id FROM settings WHERE tenant_id = ? AND setting_key = ?",
        [tenantId, "require_appointment_deposit"]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE settings
           SET setting_value = ?, setting_type = 'boolean', updated_at = NOW()
           WHERE tenant_id = ? AND setting_key = ?`,
          [require_appointment_deposit.toString(), tenantId, "require_appointment_deposit"]
        );
      } else {
        await db.query(
          `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
           VALUES (?, 'require_appointment_deposit', ?, 'boolean')`,
          [tenantId, require_appointment_deposit.toString()]
        );
      }
    }

    // Mettre à jour business_hours
    if (business_hours) {
      // Vérifier si le setting existe déjà
      const existing = await db.query(
        "SELECT id FROM settings WHERE tenant_id = ? AND setting_key = ?",
        [tenantId, "business_hours"]
      );

      if (existing.length > 0) {
        // Update
        await db.query(
          `UPDATE settings
           SET setting_value = ?, setting_type = 'json', updated_at = NOW()
           WHERE tenant_id = ? AND setting_key = ?`,
          [JSON.stringify(business_hours), tenantId, "business_hours"]
        );
      } else {
        // Insert
        await db.query(
          `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
           VALUES (?, 'business_hours', ?, 'json')`,
          [tenantId, JSON.stringify(business_hours)]
        );
      }
    }

    // Mettre à jour slot_duration
    if (slot_duration !== undefined) {
      const existing = await db.query(
        "SELECT id FROM settings WHERE tenant_id = ? AND setting_key = ?",
        [tenantId, "slot_duration"]
      );

      if (existing.length > 0) {
        // Update
        await db.query(
          `UPDATE settings
           SET setting_value = ?, setting_type = 'number', updated_at = NOW()
           WHERE tenant_id = ? AND setting_key = ?`,
          [slot_duration.toString(), tenantId, "slot_duration"]
        );
      } else {
        // Insert
        await db.query(
          `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
           VALUES (?, 'slot_duration', ?, 'number')`,
          [tenantId, slot_duration.toString()]
        );
      }
    }

    // Mettre à jour currency (également dans la table tenants)
    if (currency) {
      // Mettre à jour dans la table tenants
      await db.query(`UPDATE tenants SET currency = ? WHERE id = ?`, [
        currency,
        tenantId,
      ]);

      // Aussi stocker dans settings pour cohérence
      const existing = await db.query(
        "SELECT id FROM settings WHERE tenant_id = ? AND setting_key = ?",
        [tenantId, "currency"]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE settings
           SET setting_value = ?, setting_type = 'string', updated_at = NOW()
           WHERE tenant_id = ? AND setting_key = ?`,
          [currency, tenantId, "currency"]
        );
      } else {
        await db.query(
          `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
           VALUES (?, 'currency', ?, 'string')`,
          [tenantId, currency]
        );
      }
    }

    // Mettre à jour theme_settings
    if (theme_settings) {
      const existing = await db.query(
        "SELECT id FROM settings WHERE tenant_id = ? AND setting_key = ?",
        [tenantId, "theme_settings"]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE settings
           SET setting_value = ?, setting_type = 'json', updated_at = NOW()
           WHERE tenant_id = ? AND setting_key = ?`,
          [JSON.stringify(theme_settings), tenantId, "theme_settings"]
        );
      } else {
        await db.query(
          `INSERT INTO settings (tenant_id, setting_key, setting_value, setting_type)
           VALUES (?, 'theme_settings', ?, 'json')`,
          [tenantId, JSON.stringify(theme_settings)]
        );
      }
    }

    res.json({
      success: true,
      message: "Paramètres mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/settings/currency
 * Récupérer la devise du tenant
 */
router.get("/currency", checkScope("settings:read"), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Récupérer depuis la table tenants
    const tenant = await db.query(`SELECT currency FROM tenants WHERE id = ?`, [
      tenantId,
    ]);

    if (tenant.length === 0) {
      return res.json({ currency: "EUR" }); // Par défaut
    }

    res.json({ currency: tenant[0].currency || "EUR" });
  } catch (error) {
    console.error("Erreur lors de la récupération de la devise:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/settings/:key
 * Récupérer un paramètre spécifique
 */
router.get("/:key", checkScope("settings:read"), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { key } = req.params;

    const setting = await db.query(
      `SELECT setting_value, setting_type
       FROM settings
       WHERE tenant_id = ? AND setting_key = ?`,
      [tenantId, key]
    );

    if (setting.length === 0) {
      return res.status(404).json({ error: "Paramètre non trouvé" });
    }

    let value = setting[0].setting_value;

    // Parser selon le type
    if (setting[0].setting_type === "json") {
      try {
        value = JSON.parse(value);
      } catch (e) {
        console.error("Erreur parsing JSON:", e);
      }
    } else if (setting[0].setting_type === "number") {
      value = parseFloat(value);
    } else if (setting[0].setting_type === "boolean") {
      value = value === "true" || value === "1";
    }

    res.json({ [key]: value });
  } catch (error) {
    console.error("Erreur lors de la récupération du paramètre:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * PUT /api/settings/onboarding/complete
 * Marquer le tutoriel/onboarding comme terminé
 */
router.put("/onboarding/complete", checkScope("settings:write"), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    await db.query(
      `UPDATE tenants
       SET onboarding_status = 'completed', onboarding_completed_at = NOW()
       WHERE id = ?`,
      [tenantId]
    );

    res.json({
      success: true,
      message: "Onboarding marqué comme terminé",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut onboarding:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
