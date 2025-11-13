/**
 * SALONHUB - Configuration Stripe
 * Gestion paiements et abonnements
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Plans d'abonnement SalonHub
const PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER, // À créer dans Stripe Dashboard
    features: ["100 clients maximum", "Gestion rendez-vous", "Support email"],
  },
  professional: {
    name: "Professional",
    price: 59,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL,
    features: [
      "Clients illimités",
      "Site web inclus",
      "Rappels SMS",
      "Support prioritaire",
    ],
  },
  business: {
    name: "Business",
    price: 99,
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    features: [
      "Multi-salons",
      "Paiement en ligne",
      "Statistiques avancées",
      "Support téléphonique",
    ],
  },
};

// Helper: Créer une session de paiement
const createCheckoutSession = async (tenantId, plan, successUrl, cancelUrl) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: tenantId.toString(),
      metadata: {
        tenant_id: tenantId,
        plan: plan,
      },
    });

    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Erreur création session Stripe:", error);
    return { success: false, error: error.message };
  }
};

// Helper: Créer un portal client (pour gérer l'abonnement)
const createCustomerPortalSession = async (customerId, returnUrl) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Erreur création portal:", error);
    return { success: false, error: error.message };
  }
};

// Helper: Annuler un abonnement
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true, cancelAt: subscription.cancel_at };
  } catch (error) {
    console.error("Erreur annulation abonnement:", error);
    return { success: false, error: error.message };
  }
};

// Helper: Réactiver un abonnement
const reactivateSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur réactivation abonnement:", error);
    return { success: false, error: error.message };
  }
};

// Helper: Récupérer infos abonnement
const getSubscriptionInfo = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      success: true,
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null,
      },
    };
  } catch (error) {
    console.error("Erreur récupération abonnement:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  stripe,
  PLANS,
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionInfo,
};
