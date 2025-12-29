/**
 * SALONHUB - Routes System Health
 * Monitoring de la santé système et performance (SuperAdmin)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const {
  superAdminAuth,
  requirePermission,
} = require("../middleware/superadmin");

// ==========================================
// SYSTEM HEALTH OVERVIEW
// ==========================================

/**
 * GET /api/admin/system/health
 * Vue d'ensemble de la santé système
 */
router.get(
  "/health",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date(),
        services: {},
      };

      // 1. Database Health
      try {
        const dbStart = Date.now();
        await pool.query("SELECT 1");
        const dbTime = Date.now() - dbStart;

        health.services.database = {
          status: dbTime < 100 ? "healthy" : dbTime < 500 ? "degraded" : "down",
          response_time: dbTime,
          message: `Database responding in ${dbTime}ms`,
        };
      } catch (error) {
        health.services.database = {
          status: "down",
          error: error.message,
        };
        health.status = "down";
      }

      // 2. Error Rate (dernière heure)
      try {
        const [errorCount] = await pool.query(`
          SELECT COUNT(*) as count
          FROM system_error_logs
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            AND severity IN ('high', 'critical')
        `);

        const errors = errorCount[0].count;
        health.services.error_rate = {
          status: errors < 10 ? "healthy" : errors < 50 ? "degraded" : "down",
          errors_last_hour: errors,
        };

        if (errors >= 50) {
          health.status = "degraded";
        }
      } catch (error) {
        health.services.error_rate = {
          status: "unknown",
          error: error.message,
        };
      }

      // 3. API Performance
      try {
        const [avgPerformance] = await pool.query(`
          SELECT
            AVG(response_time) as avg_response_time,
            MAX(response_time) as max_response_time,
            COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests
          FROM api_performance_logs
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `);

        const avgTime = avgPerformance[0].avg_response_time || 0;
        health.services.api_performance = {
          status: avgTime < 200 ? "healthy" : avgTime < 500 ? "degraded" : "down",
          avg_response_time: Math.round(avgTime),
          max_response_time: avgPerformance[0].max_response_time,
          slow_requests_count: avgPerformance[0].slow_requests,
        };

        if (avgTime >= 500) {
          health.status = "degraded";
        }
      } catch (error) {
        health.services.api_performance = {
          status: "unknown",
          error: error.message,
        };
      }

      // 4. Storage Usage
      try {
        const [storageStats] = await pool.query(`
          SELECT
            SUM(total_bytes) as total_storage,
            SUM(files_count) as total_files
          FROM storage_usage
        `);

        const totalGB = (storageStats[0].total_storage || 0) / (1024 * 1024 * 1024);
        health.services.storage = {
          status: "healthy",
          total_storage_gb: totalGB.toFixed(2),
          total_files: storageStats[0].total_files || 0,
        };
      } catch (error) {
        health.services.storage = {
          status: "unknown",
          error: error.message,
        };
      }

      // 5. Active Connections
      try {
        const [connections] = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.processlist
          WHERE db = DATABASE()
        `);

        health.services.database_connections = {
          status: "healthy",
          active_connections: connections[0].count,
        };
      } catch (error) {
        // Ignore si pas de permission
        health.services.database_connections = {
          status: "unknown",
        };
      }

      res.json({
        success: true,
        health,
      });
    } catch (error) {
      console.error("Erreur GET /system/health:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        health: {
          status: "down",
          error: error.message,
        },
      });
    }
  }
);

// ==========================================
// ERROR LOGS
// ==========================================

/**
 * GET /api/admin/system/error-logs
 * Logs d'erreurs système
 */
router.get(
  "/error-logs",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const {
        severity,
        endpoint,
        resolved,
        start_date,
        end_date,
        limit = 100,
        offset = 0
      } = req.query;

      let query = `
        SELECT
          sel.*,
          t.name as tenant_name,
          u.email as user_email
        FROM system_error_logs sel
        LEFT JOIN tenants t ON sel.tenant_id = t.id
        LEFT JOIN users u ON sel.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (severity) {
        query += ` AND sel.severity = ?`;
        params.push(severity);
      }

      if (endpoint) {
        query += ` AND sel.endpoint LIKE ?`;
        params.push(`%${endpoint}%`);
      }

      if (resolved !== undefined) {
        query += ` AND sel.resolved = ?`;
        params.push(resolved === 'true' ? 1 : 0);
      }

      if (start_date) {
        query += ` AND sel.created_at >= ?`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND sel.created_at <= ?`;
        params.push(end_date);
      }

      query += ` ORDER BY sel.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [errors] = await pool.query(query, params);

      // Statistiques
      const [stats] = await pool.query(`
        SELECT
          COUNT(*) as total_errors,
          COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_errors,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_errors,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as errors_last_hour,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as errors_last_24h
        FROM system_error_logs
      `);

      // Top error types
      const [topErrors] = await pool.query(`
        SELECT
          error_type,
          COUNT(*) as count,
          MAX(created_at) as last_occurrence
        FROM system_error_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY error_type
        ORDER BY count DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        errors,
        stats: stats[0],
        top_error_types: topErrors,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error("Erreur GET /system/error-logs:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * PUT /api/admin/system/error-logs/:id/resolve
 * Marquer une erreur comme résolue
 */
router.put(
  "/error-logs/:id/resolve",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(
        `UPDATE system_error_logs
         SET resolved = TRUE,
             resolved_by = ?,
             resolved_at = NOW()
         WHERE id = ?`,
        [req.superAdmin.id, id]
      );

      res.json({
        success: true,
        message: "Erreur marquée comme résolue",
      });
    } catch (error) {
      console.error("Erreur PUT /system/error-logs/:id/resolve:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

/**
 * GET /api/admin/system/performance
 * Métriques de performance
 */
router.get(
  "/performance",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { hours = 24 } = req.query;

      // Performance par endpoint
      const [endpointPerformance] = await pool.query(`
        SELECT
          endpoint,
          method,
          COUNT(*) as request_count,
          AVG(response_time) as avg_response_time,
          MIN(response_time) as min_response_time,
          MAX(response_time) as max_response_time,
          COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM api_performance_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        GROUP BY endpoint, method
        ORDER BY request_count DESC
        LIMIT 20
      `, [parseInt(hours)]);

      // Performance temporelle (par heure)
      const [timelinePerformance] = await pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
          COUNT(*) as request_count,
          AVG(response_time) as avg_response_time,
          MAX(response_time) as max_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM api_performance_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        GROUP BY hour
        ORDER BY hour
      `, [parseInt(hours)]);

      // Requêtes les plus lentes
      const [slowestRequests] = await pool.query(`
        SELECT
          endpoint,
          method,
          response_time,
          status_code,
          created_at
        FROM api_performance_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY response_time DESC
        LIMIT 20
      `, [parseInt(hours)]);

      res.json({
        success: true,
        endpoint_performance: endpointPerformance,
        timeline: timelinePerformance,
        slowest_requests: slowestRequests,
      });
    } catch (error) {
      console.error("Erreur GET /system/performance:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// SLOW QUERIES
// ==========================================

/**
 * GET /api/admin/system/slow-queries
 * Requêtes SQL lentes
 */
router.get(
  "/slow-queries",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { min_time = 1 } = req.query;

      const [slowQueries] = await pool.query(`
        SELECT
          query_hash,
          query_text,
          execution_time,
          rows_examined,
          rows_sent,
          database_name,
          created_at
        FROM slow_query_logs
        WHERE execution_time >= ?
        ORDER BY execution_time DESC
        LIMIT 50
      `, [parseFloat(min_time)]);

      // Statistiques des requêtes lentes
      const [stats] = await pool.query(`
        SELECT
          COUNT(*) as total_slow_queries,
          AVG(execution_time) as avg_execution_time,
          MAX(execution_time) as max_execution_time,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as slow_queries_last_hour
        FROM slow_query_logs
        WHERE execution_time >= ?
      `, [parseFloat(min_time)]);

      res.json({
        success: true,
        slow_queries: slowQueries,
        stats: stats[0],
      });
    } catch (error) {
      console.error("Erreur GET /system/slow-queries:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// STORAGE USAGE
// ==========================================

/**
 * GET /api/admin/system/storage-usage
 * Utilisation du stockage par tenant
 */
router.get(
  "/storage-usage",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const [storageByTenant] = await pool.query(`
        SELECT
          su.*,
          t.name as tenant_name,
          t.email as tenant_email,
          t.subscription_plan,
          ROUND((su.total_bytes / (1024 * 1024 * 1024)), 2) as total_gb
        FROM storage_usage su
        JOIN tenants t ON su.tenant_id = t.id
        ORDER BY su.total_bytes DESC
        LIMIT 50
      `);

      // Statistiques globales
      const [globalStats] = await pool.query(`
        SELECT
          SUM(total_bytes) as total_storage_bytes,
          SUM(files_count) as total_files,
          COUNT(DISTINCT tenant_id) as tenants_with_storage,
          AVG(total_bytes) as avg_storage_per_tenant,
          ROUND((SUM(total_bytes) / (1024 * 1024 * 1024)), 2) as total_storage_gb
        FROM storage_usage
      `);

      res.json({
        success: true,
        storage_by_tenant: storageByTenant,
        global_stats: globalStats[0],
      });
    } catch (error) {
      console.error("Erreur GET /system/storage-usage:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// HEALTH CHECK HISTORY
// ==========================================

/**
 * GET /api/admin/system/health-history
 * Historique des health checks
 */
router.get(
  "/health-history",
  superAdminAuth,
  requirePermission("system", "view_logs"),
  async (req, res) => {
    try {
      const { check_type, hours = 24 } = req.query;

      let query = `
        SELECT *
        FROM system_health_checks
        WHERE checked_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      `;

      const params = [parseInt(hours)];

      if (check_type) {
        query += ` AND check_type = ?`;
        params.push(check_type);
      }

      query += ` ORDER BY checked_at DESC LIMIT 1000`;

      const [history] = await pool.query(query, params);

      // Statistiques par service
      const [serviceStats] = await pool.query(`
        SELECT
          check_type,
          COUNT(*) as check_count,
          AVG(response_time) as avg_response_time,
          COUNT(CASE WHEN status = 'healthy' THEN 1 END) as healthy_count,
          COUNT(CASE WHEN status = 'degraded' THEN 1 END) as degraded_count,
          COUNT(CASE WHEN status = 'down' THEN 1 END) as down_count,
          MAX(checked_at) as last_check
        FROM system_health_checks
        WHERE checked_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        GROUP BY check_type
      `, [parseInt(hours)]);

      res.json({
        success: true,
        history,
        service_stats: serviceStats,
      });
    } catch (error) {
      console.error("Erreur GET /system/health-history:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

module.exports = router;
