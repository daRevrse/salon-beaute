/**
 * Routes pour la gestion des paramètres du salon
 */

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Toutes les routes sont protégées
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/settings
 * Récupérer tous les paramètres du salon
 */
router.get("/", async (req, res) => {
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
router.get("/salon", async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await db.query(
      `SELECT id, name, slug, phone, email, address, logo_url, currency
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

    res.json({
      success: true,
      data: tenant[0],
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
 * PUT /api/settings/salon
 * Mettre à jour les informations du salon (nom, logo, etc.)
 */
router.put("/salon", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, phone, email, address, logo_url, banner_url } = req.body;

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
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
    if (logo_url !== undefined) {
      updates.push("logo_url = ?");
      params.push(logo_url);
    }
    if (banner_url !== undefined) {
      updates.push("banner_url = ?");
      params.push(banner_url);
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
router.put("/", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { business_hours, slot_duration, currency } = req.body;

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
router.get("/currency", async (req, res) => {
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
router.get("/:key", async (req, res) => {
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

module.exports = router;
