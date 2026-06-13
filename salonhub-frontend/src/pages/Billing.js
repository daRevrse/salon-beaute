/**
 * Page Billing — « Plans et facturation »
 * Inspirée du pattern Untitled UI : carte Plan + carte Moyen de paiement,
 * puis tableau d'historique de facturation.
 */

import { useState, useEffect, useCallback } from 'react';
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
  DocumentTextIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  StarIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const Billing = () => {
  const { tenant, refreshSubscription } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState({});
  const [invoices, setInvoices] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [plansRes, subRes, invoicesRes] = await Promise.all([
        api.get('/stripe/plans'),
        api.get('/stripe/subscription'),
        api.get('/stripe/invoices').catch(() => ({ data: { data: [] } })),
      ]);

      setPlans(plansRes.data.data);
      setSubscription(subRes.data.data);
      setInvoices(invoicesRes.data?.data || []);

      await refreshSubscription();
    } catch (err) {
      console.error('Erreur chargement billing:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshSubscription]);

  const verifyPayment = useCallback(
    async (sessionId) => {
      try {
        const response = await api.post('/stripe/verify-session', { sessionId });
        if (response.data.success) {
          window.history.replaceState({}, document.title, '/billing');
          loadData();
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
      }
    },
    [loadData]
  );

  useEffect(() => {
    loadData();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true' && urlParams.get('session_id')) {
      verifyPayment(urlParams.get('session_id'));
    }
  }, [loadData, verifyPayment]);

  const handleSubscribe = async (planKey) => {
    try {
      setLoading(true);
      const response = await api.post('/stripe/create-checkout-session', { plan: planKey });
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrialDaysRemaining = () => {
    if (!subscription?.trialEndsAt) return null;
    const trialEnd = new Date(subscription.trialEndsAt);
    const now = new Date();
    if (trialEnd <= now) return 0;
    return Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };
  const trialDaysRemaining = getTrialDaysRemaining();

  const status = subscription?.status;
  const currentPlan = subscription?.plan ? plans[subscription.plan] : null;
  const planLabel =
    currentPlan?.name ||
    (subscription?.plan
      ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
      : 'Aucun plan');
  const paymentMethod = subscription?.stripeInfo?.paymentMethod;

  const planPrice = () => {
    if (currentPlan && !currentPlan.isCustom && currentPlan.price != null) {
      return formatPrice(currentPlan.price);
    }
    if (subscription?.stripeInfo?.amount != null) {
      return formatPrice(subscription.stripeInfo.amount / 100);
    }
    return status === 'trial' ? formatPrice(0) : '—';
  };

  const statusBadge = () => {
    const map = {
      trial: { label: 'Essai', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: SparklesIcon },
      active: { label: 'Actif', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircleIcon },
      suspended: { label: 'Suspendu', cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircleIcon },
      cancelled: { label: 'Annulé', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: XCircleIcon },
      expired: { label: 'Expiré', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: XCircleIcon },
    };
    const s = map[status] || map.expired;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${s.cls}`}>
        <s.Icon className="h-3.5 w-3.5" />
        {s.label}
      </span>
    );
  };

  const invoiceStatusBadge = (st) => {
    const map = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      open: 'bg-amber-50 text-amber-700 border-amber-200',
      draft: 'bg-slate-100 text-slate-600 border-slate-200',
      void: 'bg-slate-100 text-slate-500 border-slate-200',
      uncollectible: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels = { paid: 'Payé', open: 'En attente', draft: 'Brouillon', void: 'Annulée', uncollectible: 'Impayée' };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${map[st] || map.draft}`}>
        {st === 'paid' && <CheckCircleIcon className="h-3.5 w-3.5" />}
        {labels[st] || st}
      </span>
    );
  };

  const showPlansGrid =
    !subscription?.hasStripeSubscription ||
    ['trial', 'expired', 'suspended', 'cancelled'].includes(status);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin mx-auto" />
            <p className="mt-4 text-slate-600 font-medium">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
            Plans et facturation
          </h1>
          <p className="mt-1 text-slate-500">
            Gérez votre formule et vos détails de facturation pour {tenant?.name}.
          </p>
        </div>

        {/* Alertes contextuelles */}
        {status === 'trial' && trialDaysRemaining > 0 && (
          <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
            trialDaysRemaining <= 3 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <SparklesIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${trialDaysRemaining <= 3 ? 'text-amber-600' : 'text-blue-600'}`} />
            <p className="text-sm text-slate-700">
              {trialDaysRemaining <= 3 ? (
                <><strong>Plus que {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} d'essai.</strong> Choisissez une formule ci-dessous pour continuer.</>
              ) : (
                <><strong>Essai gratuit actif</strong> — {trialDaysRemaining} jours restants (jusqu'au {formatDate(subscription.trialEndsAt)}). Aucune carte requise.</>
              )}
            </p>
          </div>
        )}
        {(status === 'expired' || (status === 'trial' && trialDaysRemaining === 0)) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700"><strong>Essai expiré.</strong> Votre page de réservation publique est désactivée. Choisissez une formule pour la réactiver.</p>
          </div>
        )}
        {status === 'suspended' && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700"><strong>Abonnement suspendu.</strong> Un problème de paiement a été détecté. Mettez à jour votre moyen de paiement.</p>
          </div>
        )}

        {/* Plan + Moyen de paiement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Carte Plan */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg font-semibold text-slate-800">{planLabel}</h2>
                  {subscription && statusBadge()}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {currentPlan?.features?.length
                    ? `${currentPlan.features.length} fonctionnalités incluses`
                    : 'Votre formule actuelle'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold font-display text-slate-800 leading-none">{planPrice()}</p>
                <p className="text-xs text-slate-400 mt-1">par mois</p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {status === 'trial'
                  ? `Fin d'essai : ${formatDate(subscription?.trialEndsAt)}`
                  : subscription?.stripeInfo?.currentPeriodEnd
                  ? `Prochaine facture : ${formatDate(subscription.stripeInfo.currentPeriodEnd)}`
                  : 'Aucune facturation programmée'}
              </p>
              {subscription?.hasStripeSubscription ? (
                <button
                  onClick={handleManageSubscription}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Gérer le plan
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href="#plans"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Choisir une formule
                </a>
              )}
            </div>
          </div>

          {/* Carte Moyen de paiement */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-slate-800">Moyen de paiement</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">Modifiez comment vous payez votre formule.</p>

            {paymentMethod ? (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {paymentMethod.brand}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 capitalize truncate">
                      {paymentMethod.brand} •••• {paymentMethod.last4}
                    </p>
                    <p className="text-xs text-slate-400">
                      Expire {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <CreditCardIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-4">Aucun moyen de paiement enregistré.</p>
                <button
                  onClick={subscription?.hasStripeSubscription ? handleManageSubscription : () => { const el = document.getElementById('plans'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Ajouter un moyen de paiement
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historique de facturation */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-800">Historique de facturation</h2>
              <p className="text-sm text-slate-500">Téléchargez vos reçus et factures.</p>
            </div>
            {subscription?.hasStripeSubscription && (
              <button
                onClick={handleManageSubscription}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tout télécharger</span>
              </button>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">Aucune facture pour le moment</p>
              <p className="mt-1 text-sm text-slate-400">Vos factures apparaîtront ici après votre premier paiement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Facture</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Montant</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium text-right">Téléchargement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {inv.number || `Facture`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(inv.created)}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{formatPrice(inv.amount)}</td>
                      <td className="px-6 py-4">{invoiceStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {(inv.invoice_pdf || inv.hosted_invoice_url) ? (
                          <a
                            href={inv.invoice_pdf || inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Télécharger</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formules disponibles */}
        {showPlansGrid && (
          <div id="plans" className="scroll-mt-8">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-slate-800">Choisissez votre formule</h2>
              <p className="text-slate-500 mt-1">14 jours d'essai gratuit. Aucune carte bancaire requise.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`bg-white rounded-2xl shadow-soft overflow-hidden border transition-all hover:shadow-soft-lg ${
                    key === 'pro' ? 'border-violet-500 ring-1 ring-violet-200' : 'border-slate-200'
                  }`}
                >
                  {key === 'pro' && (
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-center py-2 text-xs font-semibold flex items-center justify-center gap-1">
                      <StarIcon className="h-4 w-4" />
                      Recommandé
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display text-xl font-bold text-slate-800">{plan.name}</h3>
                      <CurrencyDollarIcon className="h-6 w-6 text-violet-500" />
                    </div>
                    {plan.isCustom ? (
                      <p className="text-2xl font-bold text-violet-600 mb-5">Sur devis</p>
                    ) : (
                      <p className="mb-5">
                        <span className="text-4xl font-extrabold text-slate-800">{formatPrice(plan.price)}</span>
                        <span className="ml-1 text-slate-400 text-sm">/mois</span>
                      </p>
                    )}
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2.5">
                          <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-emerald-500 mt-0.5" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.isCustom ? (
                      <a
                        href="mailto:info@flowkraftagency.com"
                        className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm border border-violet-500 text-violet-600 hover:bg-violet-50 transition-colors"
                      >
                        Contactez-nous
                      </a>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(key)}
                        disabled={loading || subscription?.plan === key}
                        className={`w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          key === 'pro'
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {loading ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : subscription?.plan === key ? (
                          'Formule actuelle'
                        ) : (
                          'Choisir cette formule'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Protéger la page avec les permissions (Owner seulement)
export default withPermission(Billing, 'viewBilling');
