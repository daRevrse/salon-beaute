/**
 * SALONHUB - Routes Analytics Advanced
 * Analytics avancées et métriques détaillées (SuperAdmin)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const {
  superAdminAuth,
  requirePermission,
} = require("../middleware/superadmin");

// ==========================================
// COHORT ANALYSIS & RETENTION
// ==========================================

/**
 * GET /api/admin/analytics/cohort-retention
 * Analyse de cohorte et rétention
 */
router.get(
  "/cohort-retention",
  superAdminAuth,
  requirePermission("analytics", "view_global"),
  async (req, res) => {
    try {
      const { months = 12 } = req.query;

      // Cohortes basées sur le mois d'inscription
      const [cohorts] = await pool.query(`
        SELECT
          DATE_FORMAT(t.created_at, '%Y-%m') as cohort_month,
          COUNT(t.id) as cohort_size,
          SUM(CASE WHEN t.subscription_status = 'active' THEN 1 ELSE 0 END) as still_active,
          AVG(TIMESTAMPDIFF(MONTH, t.created_at, COALESCE(
            (SELECT effective_date FROM subscription_changes
             WHERE tenant_id = t.id AND change_type = 'cancelled'
             ORDER BY effective_date DESC LIMIT 1),
            NOW()
          ))) as avg_lifetime_months,
          AVG(t.mrr) as avg_mrr
        FROM tenants t
        WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
        GROUP BY cohort_month
        ORDER BY cohort_month DESC
      `, [parseInt(months)]);

      // Taux de rétention par mois depuis l'inscription
      const [retentionByMonth] = await pool.query(`
        SELECT
          DATE_FORMAT(t.created_at, '%Y-%m') as cohort_month,
          TIMESTAMPDIFF(MONTH, t.created_at, NOW()) as months_since_signup,
          COUNT(t.id) as total_tenants,
          SUM(CASE WHEN t.subscription_status IN ('active', 'trial') THEN 1 ELSE 0 END) as active_tenants,
          ROUND((SUM(CASE WHEN t.subscription_status IN ('active', 'trial') THEN 1 ELSE 0 END) / COUNT(t.id)) * 100, 2) as retention_rate
        FROM tenants t
        WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY cohort_month, months_since_signup
        HAVING months_since_signup <= 12
        ORDER BY cohort_month DESC, months_since_signup
      `);

      res.json({
        success: true,
        cohorts,
        retention_by_month: retentionByMonth,
      });
    } catch (error) {
      console.error("Erreur GET /analytics/cohort-retention:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// ENGAGEMENT METRICS
// ==========================================

/**
 * GET /api/admin/analytics/engagement-metrics
 * Métriques d'engagement des tenants
 */
router.get(
  "/engagement-metrics",
  superAdminAuth,
  requirePermission("analytics", "view_global"),
  async (req, res) => {
    try {
      // Tenants par niveau d'activité (appointments/mois)
      const [activityLevels] = await pool.query(`
        SELECT
          CASE
            WHEN monthly_appointments = 0 THEN 'Inactif'
            WHEN monthly_appointments BETWEEN 1 AND 10 THEN 'Faible'
            WHEN monthly_appointments BETWEEN 11 AND 50 THEN 'Moyen'
            WHEN monthly_appointments > 50 THEN 'Élevé'
          END as activity_level,
          COUNT(*) as tenant_count,
          AVG(monthly_appointments) as avg_appointments
        FROM (
          SELECT
            t.id,
            COUNT(a.id) as monthly_appointments
          FROM tenants t
          LEFT JOIN appointments a ON t.id = a.tenant_id
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          WHERE t.subscription_status = 'active'
          GROUP BY t.id
        ) as tenant_activity
        GROUP BY activity_level
      `);

      // Tenants par nombre d'utilisateurs actifs
      const [userEngagement] = await pool.query(`
        SELECT
          t.id,
          t.name as tenant_name,
          t.subscription_plan,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE
            WHEN u.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id
          END) as active_users_7d,
          COUNT(DISTINCT CASE
            WHEN u.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id
          END) as active_users_30d
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        WHERE t.subscription_status = 'active'
        GROUP BY t.id, t.name, t.subscription_plan
        HAVING total_users > 0
        ORDER BY active_users_7d DESC
        LIMIT 20
      `);

      // Statistiques d'utilisation des services
      const [serviceUsage] = await pool.query(`
        SELECT
          COUNT(*) as tenants_with_services,
          AVG(service_count) as avg_services_per_tenant,
          SUM(appointments_count) as total_appointments,
          AVG(appointments_count) as avg_appointments_per_tenant
        FROM (
          SELECT
            t.id,
            COUNT(DISTINCT s.id) as service_count,
            COUNT(DISTINCT a.id) as appointments_count
          FROM tenants t
          LEFT JOIN services s ON t.id = s.tenant_id
          LEFT JOIN appointments a ON t.id = a.tenant_id
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          WHERE t.subscription_status = 'active'
          GROUP BY t.id
        ) as tenant_stats
      `);

      // Adoption de fonctionnalités (clients, services, appointments)
      const [featureAdoption] = await pool.query(`
        SELECT
          COUNT(DISTINCT t.id) as total_tenants,
          COUNT(DISTINCT CASE WHEN client_count > 0 THEN t.id END) as tenants_with_clients,
          COUNT(DISTINCT CASE WHEN service_count > 0 THEN t.id END) as tenants_with_services,
          COUNT(DISTINCT CASE WHEN appointment_count > 0 THEN t.id END) as tenants_with_appointments,
          ROUND((COUNT(DISTINCT CASE WHEN client_count > 0 THEN t.id END) / COUNT(DISTINCT t.id)) * 100, 2) as client_adoption_rate,
          ROUND((COUNT(DISTINCT CASE WHEN appointment_count > 0 THEN t.id END) / COUNT(DISTINCT t.id)) * 100, 2) as appointment_adoption_rate
        FROM tenants t
        LEFT JOIN (
          SELECT tenant_id, COUNT(*) as client_count FROM clients GROUP BY tenant_id
        ) c ON t.id = c.tenant_id
        LEFT JOIN (
          SELECT tenant_id, COUNT(*) as service_count FROM services GROUP BY tenant_id
        ) s ON t.id = s.tenant_id
        LEFT JOIN (
          SELECT tenant_id, COUNT(*) as appointment_count FROM appointments GROUP BY tenant_id
        ) a ON t.id = a.tenant_id
        WHERE t.subscription_status IN ('active', 'trial')
      `);

      res.json({
        success: true,
        activity_levels: activityLevels,
        top_engaged_tenants: userEngagement,
        service_usage: serviceUsage[0],
        feature_adoption: featureAdoption[0],
      });
    } catch (error) {
      console.error("Erreur GET /analytics/engagement-metrics:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// TENANT HEALTH SCORES
// ==========================================

/**
 * GET /api/admin/analytics/tenant-health-scores
 * Scores de santé des tenants
 */
router.get(
  "/tenant-health-scores",
  superAdminAuth,
  requirePermission("analytics", "view_global"),
  async (req, res) => {
    try {
      const { min_score, max_score } = req.query;

      // Calculer un score de santé basé sur plusieurs facteurs
      const [healthScores] = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.email,
          t.subscription_plan,
          t.subscription_status,
          t.created_at,

          -- Facteurs de score
          COALESCE(stats.appointment_count_30d, 0) as appointments_30d,
          COALESCE(stats.client_count, 0) as total_clients,
          COALESCE(stats.active_users, 0) as active_users,
          COALESCE(t.payment_failed_count, 0) as payment_failures,
          DATEDIFF(NOW(), t.last_payment_at) as days_since_payment,

          -- Calcul du score (0-100)
          LEAST(100, GREATEST(0,
            (CASE WHEN COALESCE(stats.appointment_count_30d, 0) > 0 THEN 30 ELSE 0 END) +
            (CASE WHEN COALESCE(stats.client_count, 0) >= 10 THEN 20
                  WHEN COALESCE(stats.client_count, 0) >= 5 THEN 10
                  WHEN COALESCE(stats.client_count, 0) > 0 THEN 5
                  ELSE 0 END) +
            (CASE WHEN COALESCE(stats.active_users, 0) >= 3 THEN 20
                  WHEN COALESCE(stats.active_users, 0) >= 1 THEN 10
                  ELSE 0 END) +
            (CASE WHEN t.payment_failed_count = 0 THEN 20
                  WHEN t.payment_failed_count <= 2 THEN 10
                  ELSE 0 END) +
            (CASE WHEN DATEDIFF(NOW(), t.last_payment_at) <= 30 THEN 10
                  ELSE 0 END)
          )) as health_score,

          -- Risque de churn
          CASE
            WHEN COALESCE(stats.appointment_count_30d, 0) = 0
                 AND COALESCE(stats.active_users, 0) = 0 THEN 'HIGH'
            WHEN t.payment_failed_count > 2 THEN 'HIGH'
            WHEN COALESCE(stats.appointment_count_30d, 0) < 5 THEN 'MEDIUM'
            ELSE 'LOW'
          END as churn_risk

        FROM tenants t
        LEFT JOIN (
          SELECT
            t2.id as tenant_id,
            COUNT(DISTINCT CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN a.id END) as appointment_count_30d,
            COUNT(DISTINCT c.id) as client_count,
            COUNT(DISTINCT CASE WHEN u.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as active_users
          FROM tenants t2
          LEFT JOIN appointments a ON t2.id = a.tenant_id
          LEFT JOIN clients c ON t2.id = c.tenant_id
          LEFT JOIN users u ON t2.id = u.tenant_id
          GROUP BY t2.id
        ) stats ON t.id = stats.tenant_id
        WHERE t.subscription_status IN ('active', 'trial')
      `);

      // Filtrer par score si demandé
      let filteredScores = healthScores;
      if (min_score) {
        filteredScores = filteredScores.filter(t => t.health_score >= parseInt(min_score));
      }
      if (max_score) {
        filteredScores = filteredScores.filter(t => t.health_score <= parseInt(max_score));
      }

      // Statistiques générales
      const avgScore = filteredScores.reduce((sum, t) => sum + t.health_score, 0) / filteredScores.length || 0;
      const riskDistribution = {
        HIGH: filteredScores.filter(t => t.churn_risk === 'HIGH').length,
        MEDIUM: filteredScores.filter(t => t.churn_risk === 'MEDIUM').length,
        LOW: filteredScores.filter(t => t.churn_risk === 'LOW').length,
      };

      res.json({
        success: true,
        tenant_health: filteredScores,
        summary: {
          total_tenants: filteredScores.length,
          average_health_score: avgScore.toFixed(2),
          risk_distribution: riskDistribution,
        },
      });
    } catch (error) {
      console.error("Erreur GET /analytics/tenant-health-scores:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// FEATURE USAGE ANALYTICS
// ==========================================

/**
 * GET /api/admin/analytics/feature-usage
 * Analyse d'utilisation des fonctionnalités
 */
router.get(
  "/feature-usage",
  superAdminAuth,
  requirePermission("analytics", "view_global"),
  async (req, res) => {
    try {
      // Statistiques d'utilisation par fonctionnalité
      const [featureStats] = await pool.query(`
        SELECT
          'Appointments' as feature,
          COUNT(DISTINCT a.tenant_id) as tenants_using,
          COUNT(a.id) as total_usage,
          COUNT(DISTINCT CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN a.tenant_id END) as active_last_7d
        FROM appointments a
        UNION ALL
        SELECT
          'Clients' as feature,
          COUNT(DISTINCT c.tenant_id) as tenants_using,
          COUNT(c.id) as total_usage,
          COUNT(DISTINCT CASE WHEN c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN c.tenant_id END) as active_last_7d
        FROM clients c
        UNION ALL
        SELECT
          'Services' as feature,
          COUNT(DISTINCT s.tenant_id) as tenants_using,
          COUNT(s.id) as total_usage,
          COUNT(DISTINCT CASE WHEN s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN s.tenant_id END) as active_last_7d
        FROM services s
        UNION ALL
        SELECT
          'Users' as feature,
          COUNT(DISTINCT u.tenant_id) as tenants_using,
          COUNT(u.id) as total_usage,
          COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.tenant_id END) as active_last_7d
        FROM users u
      `);

      // Croissance d'utilisation (30 derniers jours)
      const [usageGrowth] = await pool.query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as appointments_created
        FROM appointments
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      res.json({
        success: true,
        feature_stats: featureStats,
        usage_growth: usageGrowth,
      });
    } catch (error) {
      console.error("Erreur GET /analytics/feature-usage:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

module.exports = router;
