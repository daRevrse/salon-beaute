/**
 * SALONHUB - Routes Alerts
 * Système de gestion des alertes et notifications (SuperAdmin)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const {
  superAdminAuth,
  requirePermission,
  requireSuperAdmin,
  logAdminActivity,
} = require("../middleware/superadmin");

// ==========================================
// ALERT RULES MANAGEMENT
// ==========================================

/**
 * GET /api/admin/alerts/rules
 * Liste des règles d'alerte
 */
router.get(
  "/rules",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { is_active } = req.query;

      let query = `
        SELECT
          ar.*,
          sa.email as created_by_email,
          sa.first_name as created_by_name
        FROM alert_rules ar
        LEFT JOIN super_admins sa ON ar.created_by = sa.id
        WHERE 1=1
      `;

      const params = [];

      if (is_active !== undefined) {
        query += ` AND ar.is_active = ?`;
        params.push(is_active === 'true' ? 1 : 0);
      }

      query += ` ORDER BY ar.created_at DESC`;

      const [rules] = await pool.query(query, params);

      res.json({
        success: true,
        rules,
      });
    } catch (error) {
      console.error("Erreur GET /alerts/rules:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/alerts/rules
 * Créer une nouvelle règle d'alerte
 */
router.post(
  "/rules",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const {
        name,
        description,
        condition_type,
        condition_config,
        notification_channels,
        severity,
      } = req.body;

      if (!name || !condition_type) {
        return res.status(400).json({
          success: false,
          error: "name et condition_type sont requis",
        });
      }

      const [result] = await pool.query(
        `INSERT INTO alert_rules
         (name, description, condition_type, condition_config, notification_channels, severity, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [
          name,
          description,
          condition_type,
          JSON.stringify(condition_config || {}),
          JSON.stringify(notification_channels || ['email']),
          severity || 'medium',
          req.superAdmin.id,
        ]
      );

      await logAdminActivity(req.superAdmin.id, "alert_rule_created", {
        resource_type: "alert_rule",
        resource_id: result.insertId,
        description: `Création de la règle d'alerte: ${name}`,
        req,
      });

      res.status(201).json({
        success: true,
        message: "Règle d'alerte créée avec succès",
        rule_id: result.insertId,
      });
    } catch (error) {
      console.error("Erreur POST /alerts/rules:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/alerts/rules/:id
 * Mettre à jour une règle d'alerte
 */
router.put(
  "/rules/:id",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        condition_config,
        notification_channels,
        severity,
        is_active,
      } = req.body;

      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push("name = ?");
        params.push(name);
      }
      if (description !== undefined) {
        updates.push("description = ?");
        params.push(description);
      }
      if (condition_config !== undefined) {
        updates.push("condition_config = ?");
        params.push(JSON.stringify(condition_config));
      }
      if (notification_channels !== undefined) {
        updates.push("notification_channels = ?");
        params.push(JSON.stringify(notification_channels));
      }
      if (severity !== undefined) {
        updates.push("severity = ?");
        params.push(severity);
      }
      if (is_active !== undefined) {
        updates.push("is_active = ?");
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucune donnée à mettre à jour",
        });
      }

      params.push(id);

      await pool.query(
        `UPDATE alert_rules SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      await logAdminActivity(req.superAdmin.id, "alert_rule_updated", {
        resource_type: "alert_rule",
        resource_id: id,
        description: `Mise à jour de la règle d'alerte #${id}`,
        req,
      });

      res.json({
        success: true,
        message: "Règle d'alerte mise à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur PUT /alerts/rules/:id:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * DELETE /api/admin/alerts/rules/:id
 * Supprimer une règle d'alerte
 */
router.delete(
  "/rules/:id",
  superAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(`DELETE FROM alert_rules WHERE id = ?`, [id]);

      await logAdminActivity(req.superAdmin.id, "alert_rule_deleted", {
        resource_type: "alert_rule",
        resource_id: id,
        description: `Suppression de la règle d'alerte #${id}`,
        req,
      });

      res.json({
        success: true,
        message: "Règle d'alerte supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur DELETE /alerts/rules/:id:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// ALERT INSTANCES
// ==========================================

/**
 * GET /api/admin/alerts/instances
 * Liste des alertes déclenchées
 */
router.get(
  "/instances",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const {
        severity,
        is_acknowledged,
        tenant_id,
        limit = 100,
        offset = 0
      } = req.query;

      let query = `
        SELECT
          ai.*,
          ar.name as rule_name,
          ar.condition_type,
          t.name as tenant_name,
          sa.email as acknowledged_by_email
        FROM alert_instances ai
        JOIN alert_rules ar ON ai.alert_rule_id = ar.id
        LEFT JOIN tenants t ON ai.tenant_id = t.id
        LEFT JOIN super_admins sa ON ai.acknowledged_by = sa.id
        WHERE 1=1
      `;

      const params = [];

      if (severity) {
        query += ` AND ai.severity = ?`;
        params.push(severity);
      }

      if (is_acknowledged !== undefined) {
        query += ` AND ai.is_acknowledged = ?`;
        params.push(is_acknowledged === 'true' ? 1 : 0);
      }

      if (tenant_id) {
        query += ` AND ai.tenant_id = ?`;
        params.push(tenant_id);
      }

      query += ` ORDER BY ai.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [instances] = await pool.query(query, params);

      // Compter le total
      let countQuery = `SELECT COUNT(*) as total FROM alert_instances WHERE 1=1`;
      const countParams = [];

      if (severity) {
        countQuery += ` AND severity = ?`;
        countParams.push(severity);
      }

      if (is_acknowledged !== undefined) {
        countQuery += ` AND is_acknowledged = ?`;
        countParams.push(is_acknowledged === 'true' ? 1 : 0);
      }

      if (tenant_id) {
        countQuery += ` AND tenant_id = ?`;
        countParams.push(tenant_id);
      }

      const [countResult] = await pool.query(countQuery, countParams);

      // Statistiques rapides
      const [stats] = await pool.query(`
        SELECT
          COUNT(*) as total_alerts,
          COUNT(CASE WHEN is_acknowledged = FALSE THEN 1 END) as unacknowledged,
          COUNT(CASE WHEN severity = 'critical' AND is_acknowledged = FALSE THEN 1 END) as critical_unacknowledged,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h
        FROM alert_instances
      `);

      res.json({
        success: true,
        instances,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
        stats: stats[0],
      });
    } catch (error) {
      console.error("Erreur GET /alerts/instances:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/alerts/instances
 * Créer une alerte manuelle
 */
router.post(
  "/instances",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const {
        alert_rule_id,
        tenant_id,
        severity,
        title,
        message,
        metadata,
      } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: "title et message sont requis",
        });
      }

      const [result] = await pool.query(
        `INSERT INTO alert_instances
         (alert_rule_id, tenant_id, severity, title, message, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          alert_rule_id || null,
          tenant_id || null,
          severity || 'medium',
          title,
          message,
          JSON.stringify(metadata || {}),
        ]
      );

      res.status(201).json({
        success: true,
        message: "Alerte créée avec succès",
        instance_id: result.insertId,
      });
    } catch (error) {
      console.error("Erreur POST /alerts/instances:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/alerts/instances/:id/acknowledge
 * Marquer une alerte comme traitée
 */
router.put(
  "/instances/:id/acknowledge",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(
        `UPDATE alert_instances
         SET is_acknowledged = TRUE,
             acknowledged_by = ?,
             acknowledged_at = NOW()
         WHERE id = ?`,
        [req.superAdmin.id, id]
      );

      await logAdminActivity(req.superAdmin.id, "alert_acknowledged", {
        resource_type: "alert_instance",
        resource_id: id,
        description: `Alerte #${id} marquée comme traitée`,
        req,
      });

      res.json({
        success: true,
        message: "Alerte traitée avec succès",
      });
    } catch (error) {
      console.error("Erreur PUT /alerts/instances/:id/acknowledge:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/alerts/instances/bulk-acknowledge
 * Marquer plusieurs alertes comme traitées
 */
router.post(
  "/instances/bulk-acknowledge",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { instance_ids } = req.body;

      if (!Array.isArray(instance_ids) || instance_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "instance_ids doit être un tableau non vide",
        });
      }

      const placeholders = instance_ids.map(() => '?').join(',');

      await pool.query(
        `UPDATE alert_instances
         SET is_acknowledged = TRUE,
             acknowledged_by = ?,
             acknowledged_at = NOW()
         WHERE id IN (${placeholders})`,
        [req.superAdmin.id, ...instance_ids]
      );

      await logAdminActivity(req.superAdmin.id, "alerts_bulk_acknowledged", {
        description: `${instance_ids.length} alertes marquées comme traitées`,
        metadata: { count: instance_ids.length },
        req,
      });

      res.json({
        success: true,
        message: `${instance_ids.length} alerte(s) traitée(s) avec succès`,
      });
    } catch (error) {
      console.error("Erreur POST /alerts/instances/bulk-acknowledge:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// ALERT TRIGGERS (Helper Functions)
// ==========================================

/**
 * Helper: Créer une alerte programmatiquement
 * Utilisé par les autres modules du système
 */
async function triggerAlert(condition_type, data) {
  try {
    // Trouver les règles actives pour ce type de condition
    const [rules] = await pool.query(
      `SELECT * FROM alert_rules
       WHERE condition_type = ? AND is_active = TRUE`,
      [condition_type]
    );

    if (rules.length === 0) {
      return; // Pas de règle active pour ce type
    }

    for (const rule of rules) {
      const config = typeof rule.condition_config === 'string'
        ? JSON.parse(rule.condition_config)
        : rule.condition_config;

      // Évaluer si la condition est remplie
      const shouldTrigger = evaluateCondition(condition_type, config, data);

      if (shouldTrigger) {
        // Créer l'instance d'alerte
        await pool.query(
          `INSERT INTO alert_instances
           (alert_rule_id, tenant_id, severity, title, message, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rule.id,
            data.tenant_id || null,
            rule.severity,
            data.title || rule.name,
            data.message || rule.description,
            JSON.stringify(data),
          ]
        );

        console.log(`🚨 Alert triggered: ${rule.name}`);
      }
    }
  } catch (error) {
    console.error("Erreur triggerAlert:", error);
  }
}

/**
 * Évaluer une condition d'alerte
 */
function evaluateCondition(condition_type, config, data) {
  switch (condition_type) {
    case 'payment_failed':
      return data.failure_count >= (config.threshold || 3);

    case 'churn_risk':
      return data.health_score < (config.min_health_score || 30);

    case 'inactive_tenant':
      return data.days_inactive >= (config.days_threshold || 30);

    case 'high_error_rate':
      return data.error_rate > (config.max_error_rate || 5);

    case 'storage_limit':
      return data.storage_usage_percent > (config.max_usage_percent || 90);

    default:
      return false;
  }
}

module.exports = router;
module.exports.triggerAlert = triggerAlert;
