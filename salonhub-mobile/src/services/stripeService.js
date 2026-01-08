import api from './api';

/**
 * Service Stripe pour gérer les paiements
 */

// Récupérer le PaymentIntent depuis le backend
export const createPaymentIntent = async (planId) => {
  try {
    const response = await api.post('/payments/create-payment-intent', {
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
    const response = await api.post('/payments/confirm-subscription', {
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
    const response = await api.get('/payments/config');

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
      price: 9.99,
      priceId: 'price_essential', // À remplacer par le vrai Price ID de Stripe
      features: ['100 clients max', 'Réservations en ligne', 'Gestion agenda'],
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      price: 29.99,
      priceId: 'price_professional', // À remplacer par le vrai Price ID de Stripe
      features: ['Clients illimités', 'Personnel illimité', 'Statistiques avancées'],
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 69.99,
      priceId: 'price_enterprise', // À remplacer par le vrai Price ID de Stripe
      features: ['Multi-établissements', 'API & intégrations', 'Support prioritaire'],
    },
  };

  return plans[planId] || plans.professional;
};
