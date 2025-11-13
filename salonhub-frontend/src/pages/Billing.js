/**
 * Page Billing
 * Gestion abonnement et facturation
 */

import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useCurrency } from "../contexts/CurrencyContext";

const Billing = () => {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Charger plans
      const plansRes = await api.get("/stripe/plans");
      setPlans(plansRes.data.data);

      // Charger abonnement actuel
      const subRes = await api.get("/stripe/subscription");
      setSubscription(subRes.data.data);
    } catch (err) {
      console.error("Erreur chargement billing:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (sessionId) => {
    try {
      const response = await api.post("/stripe/verify-session", { sessionId });

      if (response.data.success) {
        alert("✅ Abonnement activé avec succès !");
        // Nettoyer l'URL et recharger les données
        window.history.replaceState({}, document.title, "/billing");
        loadData();
      } else {
        console.error("Paiement non complété:", response.data.message);
      }
    } catch (err) {
      console.error("Erreur vérification paiement:", err);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();

    // Vérifier si on revient d'un checkout réussi
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && sessionId) {
      verifyPayment(sessionId);
    }
  }, [loadData, verifyPayment]);

  const handleSubscribe = async (planKey) => {
    try {
      setLoading(true);

      const response = await api.post("/stripe/create-checkout-session", {
        plan: planKey,
      });

      if (response.data.success) {
        // Rediriger vers Stripe Checkout
        window.location.href = response.data.url;
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      alert(
        err.response?.data?.error || "Erreur lors de la création de la session"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);

      const response = await api.post("/stripe/create-portal-session");

      if (response.data.success) {
        // Rediriger vers Stripe Customer Portal
        window.location.href = response.data.url;
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      trial: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    const labels = {
      trial: "Essai gratuit",
      active: "Actif",
      suspended: "Suspendu",
      cancelled: "Annulé",
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Abonnement & Facturation
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Abonnement actuel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Abonnement actuel
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-xl font-semibold text-gray-900 capitalize">
                {subscription?.plan || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <div className="mt-1">
                {subscription && getStatusBadge(subscription.status)}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">
                {subscription?.status === "trial"
                  ? "Fin de l'essai"
                  : "Prochaine facturation"}
              </p>
              <p className="text-lg font-medium text-gray-900">
                {subscription?.status === "trial"
                  ? formatDate(subscription.trialEndsAt)
                  : subscription?.stripeInfo?.currentPeriodEnd
                  ? formatDate(subscription.stripeInfo.currentPeriodEnd)
                  : "-"}
              </p>
            </div>
          </div>

          {subscription?.hasStripeSubscription && (
            <div className="mt-6">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Gérer mon abonnement
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Modifier votre plan, mettre à jour votre carte, voir vos
                factures, etc.
              </p>
            </div>
          )}

          {subscription?.status === "trial" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Essai gratuit actif !</strong> Profitez de toutes les
                fonctionnalités jusqu'au {formatDate(subscription.trialEndsAt)}.
                Aucune carte requise.
              </p>
            </div>
          )}
        </div>

        {/* Plans disponibles */}
        {(!subscription?.hasStripeSubscription ||
          subscription?.status === "trial") && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Choisissez votre plan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                    key === "professional" ? "ring-2 ring-blue-600" : ""
                  }`}
                >
                  {key === "professional" && (
                    <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                      Recommandé
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-5xl font-extrabold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="ml-2 text-gray-500">/mois</span>
                    </div>

                    <ul className="mt-6 space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="flex-shrink-0 h-6 w-6 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="ml-3 text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(key)}
                      disabled={loading || subscription?.plan === key}
                      className={`mt-8 w-full py-3 px-6 rounded-md font-semibold ${
                        key === "professional"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {subscription?.plan === key
                        ? "Plan actuel"
                        : "Choisir ce plan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-600 mt-8">
              Tous les plans incluent 14 jours d'essai gratuit. Aucune carte
              bancaire requise.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
