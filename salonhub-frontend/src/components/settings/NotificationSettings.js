/**
 * Composant pour gérer les paramètres de notifications
 * Permet à l'utilisateur d'activer/désactiver les notifications push
 */

import React, { useState } from "react";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useAuth } from "../../contexts/AuthContext";

const NotificationSettings = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const { user } = useAuth();
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  const handleEnableNotifications = async () => {
    try {
      await subscribe({
        userId: user?.id,
        tenantId: user?.tenant_id,
      });
    } catch (err) {
      console.error("Erreur activation notifications:", err);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await unsubscribe();
    } catch (err) {
      console.error("Erreur désactivation notifications:", err);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    setTestMessage("");

    try {
      await sendTestNotification();
      setTestMessage("Notification de test envoyée ! Vérifiez vos notifications.");
    } catch (err) {
      setTestMessage("Erreur lors de l'envoi de la notification de test.");
    } finally {
      setTestLoading(false);
      setTimeout(() => setTestMessage(""), 5000);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notifications Push
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Votre navigateur ne supporte pas les notifications push.
            Veuillez utiliser un navigateur moderne comme Chrome, Firefox, ou Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Notifications Push
      </h3>

      <p className="text-sm text-gray-600 mb-6">
        Recevez des notifications en temps réel pour les nouveaux rendez-vous,
        les confirmations et les rappels, même lorsque l'application est fermée.
      </p>

      {/* Statut */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isSubscribed
                  ? "bg-green-500"
                  : permission === "denied"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isSubscribed
                  ? "Notifications activées"
                  : permission === "denied"
                  ? "Notifications bloquées"
                  : "Notifications désactivées"}
              </p>
              <p className="text-xs text-gray-500">
                {isSubscribed
                  ? "Vous recevrez des notifications push"
                  : permission === "denied"
                  ? "Débloquez les notifications dans les paramètres du navigateur"
                  : "Activez les notifications pour rester informé"}
              </p>
            </div>
          </div>

          {permission !== "denied" && (
            <button
              onClick={
                isSubscribed
                  ? handleDisableNotifications
                  : handleEnableNotifications
              }
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSubscribed
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading
                ? "Chargement..."
                : isSubscribed
                ? "Désactiver"
                : "Activer"}
            </button>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Notification de test */}
      {isSubscribed && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Tester les notifications
          </h4>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleTestNotification}
              disabled={testLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {testLoading ? "Envoi..." : "Envoyer une notification de test"}
            </button>
            {testMessage && (
              <p className="text-sm text-green-600">{testMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions si bloqué */}
      {permission === "denied" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Comment débloquer les notifications ?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Cliquez sur l'icône de cadenas dans la barre d'adresse</li>
            <li>Changez l'autorisation des notifications à "Autoriser"</li>
            <li>Rechargez la page</li>
          </ul>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Types de notifications
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span className="text-sm text-gray-600">
              Nouveaux rendez-vous réservés en ligne
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span className="text-sm text-gray-600">
              Confirmations de rendez-vous
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span className="text-sm text-gray-600">
              Rappels avant les rendez-vous (24h et 2h)
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span className="text-sm text-gray-600">
              Annulations et modifications
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSettings;
