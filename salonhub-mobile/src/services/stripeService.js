import api from './api';

/**
 * Service Stripe pour gérer les paiements
 */

// Récupérer le PaymentIntent depuis le backend
export const createPaymentIntent = async (planId) => {
  try {
    const response = await api.post('/stripe/create-checkout-session', {
      plan: planId,
    });

    if (response.data.success) {
      return {
        success: true,
        clientSecret: response.data.data.clientSecret,
        amount: response.data.data.amount,
      };
    }

    return {
      success: false,
      error: response.data.message || 'Erreur lors de la création du paiement',
    };
  } catch (error) {
    console.error('Erreur createPaymentIntent:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur de connexion au serveur',
    };
  }
};

// Confirmer le paiement après l'inscription
export const confirmSubscription = async (planId, paymentMethodId) => {
  try {
    const response = await api.post('/stripe/verify-session', {
      plan: planId,
      paymentMethodId,
    });

    if (response.data.success) {
      return {
        success: true,
        subscription: response.data.data.subscription,
      };
    }

    return {
      success: false,
      error: response.data.message || 'Erreur lors de la confirmation',
    };
  } catch (error) {
    console.error('Erreur confirmSubscription:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur de connexion au serveur',
    };
  }
};

// Récupérer la clé publique Stripe
export const getStripePublishableKey = async () => {
  try {
    const response = await api.get('/stripe/plans');

    if (response.data.success) {
      return {
        success: true,
        publishableKey: response.data.data.publishableKey,
      };
    }

    return {
      success: false,
      error: 'Impossible de récupérer la configuration Stripe',
    };
  } catch (error) {
    console.error('Erreur getStripePublishableKey:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    };
  }
};

// Récupérer les informations d'un plan
export const getPlanDetails = (planId) => {
  const plans = {
    essential: {
      id: 'essential',
      name: 'Essential',
      price: 3.99,
      priceId: 'price_essential',
      features: ['Rendez-vous illimités', '1 utilisateur', 'Page de réservation', 'Support email'],
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      priceId: 'price_pro',
      features: ['3 utilisateurs', 'Statistiques avancées', 'Paiement en ligne', 'Rappels automatiques'],
    },
    custom: {
      id: 'custom',
      name: 'Sur mesure',
      price: null,
      priceId: null,
      isCustom: true,
      features: ['Utilisateurs illimités', 'Multi-salons', 'Support prioritaire', 'API & intégrations'],
    },
    // Legacy fallbacks
    professional: {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      priceId: 'price_pro',
      features: ['3 utilisateurs', 'Statistiques avancées', 'Paiement en ligne', 'Rappels automatiques'],
    },
    enterprise: {
      id: 'custom',
      name: 'Sur mesure',
      price: null,
      priceId: null,
      isCustom: true,
      features: ['Utilisateurs illimités', 'Multi-salons', 'Support prioritaire', 'API & intégrations'],
    },
  };

  return plans[planId] || plans.pro;
};
