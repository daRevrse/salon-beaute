/**
 * DashboardLayout - Premium Purple Dynasty Theme
 * Layout principal pour toutes les pages admin
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const SubscriptionBanner = () => {
  const { tenant, isSubscriptionActive, trialDaysRemaining, isOwner } = useAuth();

  if (!tenant || !isOwner) return null;

  const status = tenant.subscription_status;

  // Trial avec moins de 5 jours restants
  if (status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining <= 5 && trialDaysRemaining > 0) {
    return (
      <div className={`${trialDaysRemaining <= 2 ? 'bg-orange-500' : 'bg-amber-500'} text-white px-4 py-2`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              {trialDaysRemaining <= 2
                ? `Attention ! Il vous reste ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''} d'essai.`
                : `Votre essai gratuit expire dans ${trialDaysRemaining} jours.`}
            </span>
          </div>
          <Link
            to="/billing"
            className="text-sm font-semibold bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md transition-colors"
          >
            Choisir un plan
          </Link>
        </div>
      </div>
    );
  }

  // Trial expiré ou statut expired
  if (status === 'expired' || (status === 'trial' && trialDaysRemaining === 0)) {
    return (
      <div className="bg-red-600 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              Votre période d'essai est terminée. Votre page de réservation est désactivée.
            </span>
          </div>
          <Link
            to="/billing"
            className="text-sm font-semibold bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
          >
            Activer mon abonnement
          </Link>
        </div>
      </div>
    );
  }

  // Abonnement suspendu
  if (status === 'suspended') {
    return (
      <div className="bg-red-600 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              Votre abonnement est suspendu suite à un problème de paiement.
            </span>
          </div>
          <Link
            to="/billing"
            className="text-sm font-semibold bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
          >
            Mettre à jour le paiement
          </Link>
        </div>
      </div>
    );
  }

  // Abonnement annulé
  if (status === 'cancelled') {
    return (
      <div className="bg-gray-600 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              Votre abonnement a été annulé. Votre page de réservation est désactivée.
            </span>
          </div>
          <Link
            to="/billing"
            className="text-sm font-semibold bg-white text-gray-600 hover:bg-gray-50 px-3 py-1 rounded-md transition-colors"
          >
            Réactiver mon abonnement
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <SubscriptionBanner />
      <Navbar />
      <main className="relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-[0.03] pointer-events-none" />
        <div className="relative">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
