/**
 * Page Billing AMÉLIORÉE
 * Gestion abonnement et facturation avec navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { withPermission } from "../components/common/PermissionGate";
import api from '../services/api';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Billing = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Charger plans
      const plansRes = await api.get('/stripe/plans');
      setPlans(plansRes.data.data);

      // Charger abonnement actuel
      const subRes = await api.get('/stripe/subscription');
      setSubscription(subRes.data.data);
    } catch (err) {
      console.error('Erreur chargement billing:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(
    async (sessionId) => {
      try {
        const response = await api.post('/stripe/verify-session', { sessionId });

        if (response.data.success) {
          alert('✅ Abonnement activé avec succès !');
          window.history.replaceState({}, document.title, '/billing');
          loadData();
        } else {
          console.error('Paiement non complété:', response.data.message);
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
      }
    },
    [loadData]
  );

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

      const response = await api.post('/stripe/create-checkout-session', {
        plan: planKey,
      });

      if (response.data.success) {
        window.location.href = response.data.url;
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la création de la session');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);

      const response = await api.post('/stripe/create-portal-session');

      if (response.data.success) {
        window.location.href = response.data.url;
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      trial: 'bg-blue-100 text-blue-800 border border-blue-200',
      active: 'bg-green-100 text-green-800 border border-green-200',
      suspended: 'bg-red-100 text-red-800 border border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
    };

    const labels = {
      trial: 'Essai gratuit',
      active: 'Actif',
      suspended: 'Suspendu',
      cancelled: 'Annulé',
    };

    const icons = {
      trial: <SparklesIcon className="h-4 w-4 inline mr-1" />,
      active: <CheckCircleIcon className="h-4 w-4 inline mr-1" />,
      suspended: <XCircleIcon className="h-4 w-4 inline mr-1" />,
      cancelled: <XCircleIcon className="h-4 w-4 inline mr-1" />,
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <button onClick={() => navigate('/dashboard')} className="hover:text-indigo-600">
              Dashboard
            </button>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">Facturation</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CreditCardIcon className="h-8 w-8 mr-3 text-indigo-600" />
                Abonnement & Facturation
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez votre abonnement et vos moyens de paiement pour {tenant?.name}
              </p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Retour aux paramètres
            </button>
          </div>
        </div>

        {/* Abonnement actuel */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Abonnement actuel</h2>
            {subscription && getStatusBadge(subscription.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-indigo-100 text-sm mb-1">Plan</p>
              <p className="text-2xl font-bold capitalize">{subscription?.plan || '-'}</p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-indigo-100 text-sm mb-1">Prix mensuel</p>
              <p className="text-2xl font-bold">
                {subscription?.stripeInfo?.amount
                  ? formatPrice(subscription.stripeInfo.amount / 100)
                  : 'Gratuit'}
              </p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-indigo-100 text-sm mb-1">
                {subscription?.status === 'trial' ? "Fin de l'essai" : 'Prochaine facturation'}
              </p>
              <p className="text-xl font-semibold">
                {subscription?.status === 'trial'
                  ? formatDate(subscription.trialEndsAt)
                  : subscription?.stripeInfo?.currentPeriodEnd
                  ? formatDate(subscription.stripeInfo.currentPeriodEnd)
                  : '-'}
              </p>
            </div>
          </div>

          {subscription?.hasStripeSubscription && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-medium shadow-md inline-flex items-center"
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Gérer mon abonnement
              </button>
              <button className="px-6 py-3 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 font-medium inline-flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Voir les factures
              </button>
            </div>
          )}

          {subscription?.status === 'trial' && (
            <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm">
                <strong>Essai gratuit actif !</strong> Profitez de toutes les fonctionnalités jusqu'au{' '}
                {formatDate(subscription.trialEndsAt)}. Aucune carte requise.
              </p>
            </div>
          )}
        </div>

        {/* Plans disponibles */}
        {(!subscription?.hasStripeSubscription || subscription?.status === 'trial') && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Choisissez votre plan</h2>
            <p className="text-gray-600 text-center mb-8">
              Tous les plans incluent 14 jours d'essai gratuit. Aucune carte bancaire requise.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                    key === 'professional'
                      ? 'border-indigo-600 scale-105'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {key === 'professional' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                      ⭐ Recommandé
                    </div>
                  )}

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
                    </div>

                    <div className="flex items-baseline mb-6">
                      <span className="text-5xl font-extrabold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="ml-2 text-gray-500 text-lg">/mois</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="flex-shrink-0 h-6 w-6 text-green-500 mr-3" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(key)}
                      disabled={loading || subscription?.plan === key}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all shadow-md ${
                        key === 'professional'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center`}
                    >
                      {loading ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : subscription?.plan === key ? (
                        'Plan actuel'
                      ) : (
                        'Choisir ce plan'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informations complémentaires */}
        <div className="mt-12 bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-2">💳 Paiement sécurisé</p>
              <p>Tous les paiements sont traités de manière sécurisée via Stripe.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">🔄 Annulation facile</p>
              <p>Vous pouvez annuler votre abonnement à tout moment, sans frais cachés.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">📧 Support client</p>
              <p>Notre équipe est disponible pour vous aider à tout moment.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">✨ Mises à jour incluses</p>
              <p>Accédez à toutes les nouvelles fonctionnalités automatiquement.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Protéger la page avec les permissions (Owner seulement)
export default withPermission(Billing, 'viewBilling');
