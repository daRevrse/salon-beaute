/**
 * SALONHUB - Routes Billing
 * Gestion de la facturation et des revenus (SuperAdmin)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const {
  superAdminAuth,
  requirePermission,
  logAdminActivity,
} = require("../middleware/superadmin");

// ==========================================
// BILLING OVERVIEW & METRICS
// ==========================================

/**
 * GET /api/admin/billing/overview
 * Vue d'ensemble des revenus et métriques financières
 */
router.get(
  "/overview",
  superAdminAuth,
  requirePermission("billing", "view"),
  async (req, res) => {
    try {
      // MRR actuel (somme des MRR de tous les tenants actifs)
      const [mrrResult] = await pool.query(`
        SELECT
          SUM(mrr) as current_mrr,
          COUNT(*) as paying_tenants
        FROM tenants
        WHERE subscription_status = 'active' AND mrr > 0
      `);

      // ARR (MRR × 12)
      const currentMRR = parseFloat(mrrResult[0].current_mrr || 0);
      const arr = currentMRR * 12;

      // Revenus du mois en cours
      const [monthlyRevenue] = await pool.query(`
        SELECT
          SUM(amount) as total,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_transaction
        FROM billing_transactions
        WHERE status = 'succeeded'
          AND MONTH(created_at) = MONTH(CURRENT_DATE())
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
      `);

      // Revenus du mois précédent (pour comparaison)
      const [lastMonthRevenue] = await pool.query(`
        SELECT SUM(amount) as total
        FROM billing_transactions
        WHERE status = 'succeeded'
          AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
          AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
      `);

      // Taux de croissance MoM
      const currentMonth = parseFloat(monthlyRevenue[0].total || 0);
      const lastMonth = parseFloat(lastMonthRevenue[0].total || 0);
      const growthRate = lastMonth > 0
        ? (((currentMonth - lastMonth) / lastMonth) * 100).toFixed(2)
        : 0;

      // Paiements échoués ce mois
      const [failedPayments] = await pool.query(`
        SELECT COUNT(*) as count, SUM(amount) as total_amount
        FROM billing_transactions
        WHERE status = 'failed'
          AND MONTH(created_at) = MONTH(CURRENT_DATE())
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
      `);

      // Remboursements ce mois
      const [refunds] = await pool.query(`
        SELECT COUNT(*) as count, SUM(refunded_amount) as total_amount
        FROM billing_transactions
        WHERE status = 'refunded'
          AND MONTH(refunded_at) = MONTH(CURRENT_DATE())
          AND YEAR(refunded_at) = YEAR(CURRENT_DATE())
      `);

      // Répartition par plan
      const [planDistribution] = await pool.query(`
        SELECT
          subscription_plan,
          COUNT(*) as tenant_count,
          SUM(mrr) as plan_mrr
        FROM tenants
        WHERE subscription_status = 'active'
        GROUP BY subscription_plan
        ORDER BY plan_mrr DESC
      `);

      // Churn rate (annulations ce mois / tenants actifs début du mois)
      const [churnData] = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM subscription_changes
           WHERE change_type = 'cancelled'
           AND MONTH(effective_date) = MONTH(CURRENT_DATE())
           AND YEAR(effective_date) = YEAR(CURRENT_DATE())) as cancelled_count,
          (SELECT COUNT(*) FROM tenants
           WHERE subscription_status IN ('active', 'trial')) as active_count
      `);

      const churnRate = churnData[0].active_count > 0
        ? ((churnData[0].cancelled_count / churnData[0].active_count) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        metrics: {
          mrr: currentMRR.toFixed(2),
          arr: arr.toFixed(2),
          paying_tenants: mrrResult[0].paying_tenants,
          monthly_revenue: parseFloat(monthlyRevenue[0].total || 0).toFixed(2),
          monthly_transactions: monthlyRevenue[0].transaction_count,
          avg_transaction_value: parseFloat(monthlyRevenue[0].avg_transaction || 0).toFixed(2),
          growth_rate: growthRate,
          failed_payments_count: failedPayments[0].count,
          failed_payments_amount: parseFloat(failedPayments[0].total_amount || 0).toFixed(2),
          refunds_count: refunds[0].count,
          refunds_amount: parseFloat(refunds[0].total_amount || 0).toFixed(2),
          churn_rate: churnRate,
        },
        plan_distribution: planDistribution,
      });
    } catch (error) {
      console.error("Erreur GET /billing/overview:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/billing/revenue-timeline
 * Timeline des revenus (12 derniers mois)
 */
router.get(
  "/revenue-timeline",
  superAdminAuth,
  requirePermission("billing", "view"),
  async (req, res) => {
    try {
      const [timeline] = await pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') as month,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as revenue,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          SUM(CASE WHEN status = 'refunded' THEN refunded_amount ELSE 0 END) as refunds
        FROM billing_transactions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month
        ORDER BY month DESC
      `);

      res.json({
        success: true,
        timeline,
      });
    } catch (error) {
      console.error("Erreur GET /billing/revenue-timeline:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/billing/mrr-breakdown
 * Décomposition MRR par plan et évolution
 */
router.get(
  "/mrr-breakdown",
  superAdminAuth,
  requirePermission("billing", "view"),
  async (req, res) => {
    try {
      // MRR actuel par plan
      const [currentMRR] = await pool.query(`
        SELECT
          subscription_plan,
          SUM(mrr) as total_mrr,
          COUNT(*) as tenant_count,
          AVG(mrr) as avg_mrr_per_tenant
        FROM tenants
        WHERE subscription_status = 'active' AND mrr > 0
        GROUP BY subscription_plan
      `);

      // Évolution MRR (nouveaux, upgrades, downgrades, churn)
      const [mrrMovement] = await pool.query(`
        SELECT
          DATE_FORMAT(effective_date, '%Y-%m') as month,
          change_type,
          SUM(mrr_change) as total_change,
          COUNT(*) as count
        FROM subscription_changes
        WHERE effective_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month, change_type
        ORDER BY month DESC, change_type
      `);

      res.json({
        success: true,
        current_mrr: currentMRR,
        mrr_movement: mrrMovement,
      });
    } catch (error) {
      console.error("Erreur GET /billing/mrr-breakdown:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/billing/churn-metrics
 * Métriques de churn détaillées
 */
router.get(
  "/churn-metrics",
  superAdminAuth,
  requirePermission("billing", "view"),
  async (req, res) => {
    try {
      // Churn mensuel (6 derniers mois)
      const [monthlyChurn] = await pool.query(`
        SELECT
          DATE_FORMAT(effective_date, '%Y-%m') as month,
          COUNT(*) as churned_tenants,
          SUM(COALESCE(mrr_change, 0)) as lost_mrr
        FROM subscription_changes
        WHERE change_type = 'cancelled'
          AND effective_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month DESC
      `);

      // Raisons de churn
      const [churnReasons] = await pool.query(`
        SELECT
          reason,
          COUNT(*) as count
        FROM subscription_changes
        WHERE change_type = 'cancelled'
          AND reason IS NOT NULL
          AND effective_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        GROUP BY reason
        ORDER BY count DESC
        LIMIT 10
      `);

      // Customer Lifetime Value moyen
      const [clvData] = await pool.query(`
        SELECT
          AVG(TIMESTAMPDIFF(MONTH, t.created_at, COALESCE(sc.effective_date, NOW()))) as avg_lifetime_months,
          AVG(t.mrr) as avg_mrr
        FROM tenants t
        LEFT JOIN subscription_changes sc ON t.id = sc.tenant_id AND sc.change_type = 'cancelled'
        WHERE t.subscription_status IN ('active', 'cancelled')
      `);

      const avgLifetimeMonths = parseFloat(clvData[0].avg_lifetime_months || 0);
      const avgMRR = parseFloat(clvData[0].avg_mrr || 0);
      const clv = (avgLifetimeMonths * avgMRR).toFixed(2);

      res.json({
        success: true,
        monthly_churn: monthlyChurn,
        churn_reasons: churnReasons,
        customer_lifetime_value: clv,
        avg_lifetime_months: avgLifetimeMonths.toFixed(1),
      });
    } catch (error) {
      console.error("Erreur GET /billing/churn-metrics:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

// ==========================================
// TRANSACTIONS & INVOICES
// ==========================================

/**
 * GET /api/admin/billing/transactions
 * Liste des transactions
 */
router.get(
  "/transactions",
  superAdminAuth,
  requirePermission("billing", "view"),
  async (req, res) => {
    try {
      const {
        status,
        tenant_id,
        start_date,
        end_date,
        limit = 50,
        offset = 0
      } = req.query;

      let query = `
        SELECT
          bt.*,
          t.name as tenant_name,
          t.email as tenant_email
        FROM billing_transactions bt
        JOIN tenants t ON bt.tenant_id = t.id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ` AND bt.status = ?`;
        params.push(status);
      }

      if (tenant_id) {
        query += ` AND bt.tenant_id = ?`;
        params.push(tenant_id);
      }

      if (start_date) {
        query += ` AND bt.created_at >= ?`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND bt.created_at <= ?`;
        params.push(end_date);
      }

      query += ` ORDER BY bt.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [transactions] = await pool.query(query, params);

      // Compter le total
      let countQuery = `SELECT COUNT(*) as total FROM billing_transactions WHERE 1=1`;
      const countParams = [];

      if (status) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }

      if (tenant_id) {
        countQuery += ` AND tenant_id = ?`;
        countParams.push(tenant_id);
      }

      if (start_date) {
        countQuery += ` AND created_at >= ?`;
        countParams.push(start_date);
      }

      if (end_date) {
        countQuery += ` AND created_at <= ?`;
        countParams.push(end_date);
      }

      const [countResult] = await pool.query(countQuery, countParams);

      res.json({
        success: true,
        transactions,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error("Erreur GET /billing/transactions:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * POST /api/admin/billing/transactions/:id/refund
 * Rembourser une transaction
 */
router.post(
  "/transactions/:id/refund",
  superAdminAuth,
  requirePermission("billing", "refund"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      // Récupérer la transaction
      const [transactions] = await pool.query(
        `SELECT * FROM billing_transactions WHERE id = ?`,
        [id]
      );

      if (transactions.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Transaction non trouvée",
        });
      }

      const transaction = transactions[0];

      if (transaction.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          error: "Seules les transactions réussies peuvent être remboursées",
        });
      }

      const refundAmount = amount || transaction.amount;

      if (refundAmount > transaction.amount) {
        return res.status(400).json({
          success: false,
          error: "Le montant du remboursement ne peut pas dépasser le montant de la transaction",
        });
      }

      // Mettre à jour la transaction
      await pool.query(
        `UPDATE billing_transactions
         SET status = 'refunded',
             refunded_amount = ?,
             refunded_at = NOW(),
             failed_reason = ?
         WHERE id = ?`,
        [refundAmount, reason || "Remboursement manuel", id]
      );

      // Logger l'action
      await logAdminActivity(req.superAdmin.id, "transaction_refunded", {
        resource_type: "billing_transaction",
        resource_id: id,
        description: `Remboursement de ${refundAmount}€ pour la transaction ${transaction.invoice_number}`,
        metadata: { reason, original_amount: transaction.amount },
        req,
      });

      res.json({
        success: true,
        message: "Transaction remboursée avec succès",
      });
    } catch (error) {
      console.error("Erreur POST /billing/transactions/:id/refund:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

/**
 * GET /api/admin/billing/failed-payments
 * Liste des paiements échoués nécessitant une action
 */
router.get(
  "/failed-payments",
  superAdminAuth,
  requirePermission("billing", "view"),
  async (req, res) => {
    try {
      const [failedPayments] = await pool.query(`
        SELECT
          bt.*,
          t.name as tenant_name,
          t.email as tenant_email,
          t.payment_failed_count
        FROM billing_transactions bt
        JOIN tenants t ON bt.tenant_id = t.id
        WHERE bt.status = 'failed'
        ORDER BY bt.created_at DESC
        LIMIT 100
      `);

      res.json({
        success: true,
        failed_payments: failedPayments,
      });
    } catch (error) {
      console.error("Erreur GET /billing/failed-payments:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
);

module.exports = router;
