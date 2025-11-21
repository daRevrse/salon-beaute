/**
 * Composant Paramètres PWA et Notifications
 */

import { useState, useEffect } from 'react';
import pwaService from '../../services/pwaService';
import {
  BellIcon,
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const PWASettings = () => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPWAStatus();

    // Écouter l'événement d'installation
    pwaService.listenForInstallPrompt(() => {
      setCanInstallPWA(true);
    });

    // Écouter les changements de permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((result) => {
        setNotificationPermission(result.state);
        result.addEventListener('change', () => {
          setNotificationPermission(result.state);
        });
      });
    }
  }, []);

  const checkPWAStatus = async () => {
    setLoading(true);

    // Vérifier si l'app est installée
    setIsPWAInstalled(pwaService.isInstalled());

    // Vérifier si l'installation est possible
    setCanInstallPWA(pwaService.canInstall());

    // Vérifier la permission des notifications
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Vérifier l'abonnement push
    if (pwaService.serviceWorkerRegistration) {
      const subscription = await pwaService.serviceWorkerRegistration.pushManager.getSubscription();
      setPushSubscription(subscription);
    }

    setLoading(false);
  };

  const handleInstallPWA = async () => {
    const outcome = await pwaService.showInstallPrompt();
    if (outcome === 'accepted') {
      setIsPWAInstalled(true);
      setCanInstallPWA(false);
    }
  };

  const handleEnableNotifications = async () => {
    const permission = await pwaService.requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      // S'abonner aux notifications push
      const subscription = await pwaService.subscribeToPushNotifications();
      setPushSubscription(subscription);

      // Afficher une notification de test
      await pwaService.showLocalNotification('Notifications activées', {
        body: 'Vous recevrez désormais les rappels de rendez-vous',
        icon: '/logo192.png',
      });
    }
  };

  const handleDisableNotifications = async () => {
    await pwaService.unsubscribeFromPushNotifications();
    setPushSubscription(null);
  };

  const handleTestNotification = async () => {
    await pwaService.showLocalNotification('Notification de test', {
      body: 'Ceci est une notification de test de SalonHub',
      icon: '/logo192.png',
    });
  };

  const getPermissionBadge = () => {
    const badges = {
      granted: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Activées
        </span>
      ),
      denied: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircleIcon className="h-4 w-4 mr-1" />
          Refusées
        </span>
      ),
      default: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <InformationCircleIcon className="h-4 w-4 mr-1" />
          Non configurées
        </span>
      ),
    };

    return badges[notificationPermission] || badges.default;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Installation PWA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Installation de l'application</h3>
              <p className="text-sm text-gray-500 mt-1">
                Installez SalonHub sur votre appareil pour un accès rapide
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {isPWAInstalled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Application installée</p>
                <p className="text-sm text-green-700 mt-1">
                  SalonHub est installé sur votre appareil et accessible depuis votre écran d'accueil.
                </p>
              </div>
            </div>
          ) : canInstallPWA ? (
            <div>
              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Installer l'application
              </button>
              <p className="text-sm text-gray-500 mt-3">
                L'installation permet d'accéder rapidement à SalonHub depuis votre écran d'accueil, comme une application native.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Installation non disponible</p>
                <p className="text-sm text-blue-700 mt-1">
                  L'installation PWA n'est pas disponible sur ce navigateur ou appareil.
                  Pour installer l'application, utilisez Chrome, Edge ou Safari sur mobile.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Push */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications push</h3>
              <p className="text-sm text-gray-500 mt-1">
                Recevez des rappels de rendez-vous et des notifications importantes
              </p>
            </div>
          </div>
          {getPermissionBadge()}
        </div>

        <div className="mt-4 space-y-4">
          {notificationPermission === 'granted' ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Notifications activées</p>
                  <p className="text-sm text-green-700 mt-1">
                    Vous recevrez des rappels automatiques avant vos rendez-vous.
                    {pushSubscription && ' Abonnement aux notifications push actif.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTestNotification}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <BellIcon className="h-5 w-5 mr-2" />
                  Tester les notifications
                </button>
                <button
                  onClick={handleDisableNotifications}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Désactiver
                </button>
              </div>
            </>
          ) : notificationPermission === 'denied' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Notifications bloquées</p>
                <p className="text-sm text-red-700 mt-1">
                  Vous avez refusé les notifications. Pour les réactiver, vous devez modifier les paramètres de votre navigateur.
                </p>
                <p className="text-sm text-red-600 mt-2 font-medium">
                  Chrome/Edge: Paramètres → Confidentialité et sécurité → Paramètres du site → Notifications
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Activez les notifications</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Les notifications vous permettent de recevoir des rappels automatiques pour vos rendez-vous.
                  </p>
                </div>
              </div>

              <button
                onClick={handleEnableNotifications}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <BellIcon className="h-5 w-5 mr-2" />
                Activer les notifications
              </button>
            </>
          )}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">À propos des notifications</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Les notifications sont envoyées automatiquement 24h avant un rendez-vous</p>
          <p>• Vous pouvez tester les notifications à tout moment</p>
          <p>• Les notifications fonctionnent même quand l'application est fermée</p>
          <p>• Aucune donnée personnelle n'est partagée avec des services tiers</p>
        </div>
      </div>
    </div>
  );
};

export default PWASettings;
