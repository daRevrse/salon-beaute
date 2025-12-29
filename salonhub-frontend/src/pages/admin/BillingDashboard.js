/**
 * SALONHUB - Billing Dashboard
 * Gestion facturation et revenus (SuperAdmin)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CurrencyEuroIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function MetricCard({ title, value, subtitle, IconComponent, color, trend }) {
  const colorClasses = {
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg p-6 text-white`}
    >
      <div className="flex items-center justify-between mb-2">
        <IconComponent className="w-10 h-10 opacity-80" />
        {trend && (
          <div
            className={`flex items-center text-sm ${
              trend >= 0 ? "text-green-100" : "text-red-100"
            }`}
          >
            {trend >= 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
    </div>
  );
}

function PlanDistributionBar({ plan, mrr, totalMRR }) {
  const percentage = ((mrr / totalMRR) * 100).toFixed(1);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {plan}
        </span>
        <span className="text-sm text-gray-600">
          {mrr}€ ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function BillingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [revenueTimeline, setRevenueTimeline] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      // Load billing overview
      const [overviewRes, timelineRes, transactionsRes, failedRes] =
        await Promise.all([
          axios.get(`${API_URL}/admin/billing/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/admin/billing/revenue-timeline`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/admin/billing/transactions?limit=20`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/admin/billing/failed-payments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      setMetrics(overviewRes.data.metrics);
      setPlanDistribution(overviewRes.data.plan_distribution || []);
      setRevenueTimeline(timelineRes.data.timeline || []);
      setTransactions(transactionsRes.data.transactions || []);
      setFailedPayments(failedRes.data.failed_payments || []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      showError("Erreur lors du chargement des données");
      if (error.response?.status === 401) {
        navigate("/superadmin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transactionId) => {
    if (!window.confirm("Confirmer le remboursement de cette transaction ?")) {
      return;
    }

    const reason = prompt("Raison du remboursement:");
    if (!reason) return;

    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/admin/billing/transactions/${transactionId}/refund`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      success("Transaction remboursée avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur remboursement:", error);
      showError("Erreur lors du remboursement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const totalMRR = planDistribution.reduce(
    (sum, p) => sum + parseFloat(p.plan_mrr || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold">Billing & Revenue</h1>
              <p className="text-sm text-purple-200">Gestion facturation</p>
            </div>
            <button
              onClick={() => navigate("/superadmin/dashboard")}
              className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Retour au Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="MRR"
              value={`${parseFloat(metrics.mrr).toLocaleString()}€`}
              subtitle="Monthly Recurring Revenue"
              IconComponent={CurrencyEuroIcon}
              color="green"
            />
            <MetricCard
              title="ARR"
              value={`${parseFloat(metrics.arr).toLocaleString()}€`}
              subtitle="Annual Recurring Revenue"
              IconComponent={ArrowTrendingUpIcon}
              color="blue"
            />
            <MetricCard
              title="Revenus ce mois"
              value={`${parseFloat(metrics.monthly_revenue).toLocaleString()}€`}
              subtitle={`${metrics.monthly_transactions} transactions`}
              IconComponent={BanknotesIcon}
              color="purple"
              trend={parseFloat(metrics.growth_rate)}
            />
            <MetricCard
              title="Paiements échoués"
              value={metrics.failed_payments_count}
              subtitle={`${parseFloat(
                metrics.failed_payments_amount
              ).toLocaleString()}€`}
              IconComponent={ExclamationTriangleIcon}
              color="red"
            />
          </div>
        )}

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Clients payants
              </h3>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.paying_tenants || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Moyenne: {metrics?.avg_transaction_value || 0}€/transaction
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Taux de churn
              </h3>
              <ArrowTrendingDownIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.churn_rate || 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Ce mois</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Remboursements
              </h3>
              <ReceiptRefundIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.refunds_count || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {parseFloat(metrics?.refunds_amount || 0).toLocaleString()}€
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "overview"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "transactions"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab("failed")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "failed"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Paiements échoués ({failedPayments.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* MRR Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Répartition MRR par plan
              </h3>
              {planDistribution.length > 0 ? (
                planDistribution.map((plan) => (
                  <PlanDistributionBar
                    key={plan.subscription_plan}
                    plan={plan.subscription_plan}
                    mrr={parseFloat(plan.plan_mrr || 0)}
                    totalMRR={totalMRR}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Aucune donnée disponible
                </p>
              )}
            </div>

            {/* Revenue Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Évolution des revenus (12 mois)
              </h3>
              <div className="space-y-2">
                {revenueTimeline.slice(0, 6).map((month) => (
                  <div
                    key={month.month}
                    className="flex items-center justify-between py-2 border-b"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {month.month}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-green-600 font-semibold">
                        {parseFloat(month.revenue).toLocaleString()}€
                      </span>
                      <span className="text-xs text-gray-500">
                        ({month.successful_count} paiements)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.tenant_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.tenant_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {parseFloat(transaction.amount).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : transaction.status === "refunded"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {transaction.status === "succeeded" && (
                        <button
                          onClick={() => handleRefund(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Rembourser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Failed Payments Tab */}
        {activeTab === "failed" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Échecs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Raison
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.tenant_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.tenant_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {parseFloat(payment.amount).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {payment.payment_failed_count || 1} échec(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.failed_reason || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
}

export default BillingDashboard;
