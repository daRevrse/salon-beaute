/**
 * SALONHUB - Advanced Analytics Dashboard
 * Analytics avancées avec cohort analysis (SuperAdmin)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChartBarIcon,
  UserGroupIcon,
  HeartIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function HealthScoreBadge({ score }) {
  let color = "green";
  if (score < 30) color = "red";
  else if (score < 60) color = "yellow";

  const colorClasses = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full ${colorClasses[color]}`}
    >
      {score}/100
    </span>
  );
}

function ChurnRiskBadge({ risk }) {
  const styles = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800",
  };

  const labels = {
    LOW: "Faible",
    MEDIUM: "Moyen",
    HIGH: "Élevé",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[risk]}`}
    >
      {labels[risk]}
    </span>
  );
}

function AdvancedAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cohorts");

  // Cohort data
  const [cohorts, setCohorts] = useState([]);
  const [retentionByMonth, setRetentionByMonth] = useState([]);

  // Engagement data
  const [activityLevels, setActivityLevels] = useState([]);
  const [topEngagedTenants, setTopEngagedTenants] = useState([]);
  const [featureAdoption, setFeatureAdoption] = useState(null);

  // Health scores
  const [tenantHealth, setTenantHealth] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);

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

      const [cohortRes, engagementRes, healthRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics/cohort-retention`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/admin/analytics/engagement-metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/admin/analytics/tenant-health-scores`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCohorts(cohortRes.data.cohorts || []);
      setRetentionByMonth(cohortRes.data.retention_by_month || []);

      setActivityLevels(engagementRes.data.activity_levels || []);
      setTopEngagedTenants(engagementRes.data.top_engaged_tenants || []);
      setFeatureAdoption(engagementRes.data.feature_adoption || {});

      setTenantHealth(healthRes.data.tenant_health || []);
      setHealthSummary(healthRes.data.summary || {});
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold">Advanced Analytics</h1>
              <p className="text-sm text-purple-200">
                Analyse approfondie & métriques
              </p>
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
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("cohorts")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "cohorts"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <UserGroupIcon className="w-5 h-5 inline mr-2" />
                Cohortes & Rétention
              </button>
              <button
                onClick={() => setActiveTab("engagement")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "engagement"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <ArrowTrendingUpIcon className="w-5 h-5 inline mr-2" />
                Engagement
              </button>
              <button
                onClick={() => setActiveTab("health")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === "health"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <HeartIcon className="w-5 h-5 inline mr-2" />
                Health Scores
              </button>
            </nav>
          </div>
        </div>

        {/* Cohorts Tab */}
        {activeTab === "cohorts" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Analyse de cohorte (12 derniers mois)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cohorte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Taille
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Encore actifs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rétention
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Durée vie moy.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        MRR moy.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cohorts.map((cohort) => {
                      const retentionRate = (
                        (cohort.still_active / cohort.cohort_size) *
                        100
                      ).toFixed(1);
                      return (
                        <tr
                          key={cohort.cohort_month}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cohort.cohort_month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {cohort.cohort_size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cohort.still_active}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                retentionRate >= 80
                                  ? "bg-green-100 text-green-800"
                                  : retentionRate >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {retentionRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {parseFloat(cohort.avg_lifetime_months).toFixed(1)}{" "}
                            mois
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {parseFloat(cohort.avg_mrr || 0).toFixed(2)}€
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Tab */}
        {activeTab === "engagement" && (
          <div className="space-y-6">
            {/* Activity Levels */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Niveaux d'activité (30 derniers jours)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {activityLevels.map((level) => (
                  <div
                    key={level.activity_level}
                    className="border rounded-lg p-4 text-center"
                  >
                    <p className="text-sm text-gray-500 mb-1">
                      {level.activity_level}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {level.tenant_count}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Moy: {parseFloat(level.avg_appointments).toFixed(1)} RDV
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Adoption */}
            {featureAdoption && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Adoption des fonctionnalités
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Clients créés</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {featureAdoption.client_adoption_rate}%
                      </p>
                    </div>
                    <CheckCircleIcon className="w-12 h-12 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">
                        Appointments créés
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {featureAdoption.appointment_adoption_rate}%
                      </p>
                    </div>
                    <CheckCircleIcon className="w-12 h-12 text-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Top Engaged Tenants */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Top 20 tenants les plus actifs
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Salon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actifs 7j
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actifs 30j
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topEngagedTenants.slice(0, 20).map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tenant.tenant_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {tenant.subscription_plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tenant.total_users}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {tenant.active_users_7d}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                          {tenant.active_users_30d}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Health Scores Tab */}
        {activeTab === "health" && (
          <div className="space-y-6">
            {/* Summary */}
            {healthSummary && (
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500 mb-2">Score moyen</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {healthSummary.average_health_score}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sur {healthSummary.total_tenants} tenants
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-red-600 font-medium">
                      Risque ÉLEVÉ
                    </p>
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {healthSummary.risk_distribution?.HIGH || 0}
                  </p>
                  <p className="text-sm text-red-400 mt-1">
                    Nécessitent attention
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">
                      Risque FAIBLE
                    </p>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {healthSummary.risk_distribution?.LOW || 0}
                  </p>
                  <p className="text-sm text-green-400 mt-1">En bonne santé</p>
                </div>
              </div>
            )}

            {/* Health Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Scores de santé par tenant
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Salon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Health Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Risque churn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        RDV (30j)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Clients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Users actifs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenantHealth.slice(0, 50).map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tenant.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <HealthScoreBadge score={tenant.health_score} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ChurnRiskBadge risk={tenant.churn_risk} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tenant.appointments_30d}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tenant.total_clients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tenant.active_users}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

export default AdvancedAnalytics;
