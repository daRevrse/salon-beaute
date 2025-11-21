/**
 * Hook React pour gérer les notifications push
 * Demande les permissions et gère l'abonnement
 */

import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// Convertit une clé VAPID base64 en Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Vérifie si les notifications push sont supportées
  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (!supported) {
      console.warn(
        "⚠️  Les notifications push ne sont pas supportées par ce navigateur"
      );
    }
  }, []);

  // Récupère l'abonnement existant au chargement
  useEffect(() => {
    if (!isSupported) return;

    const getExistingSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        setSubscription(existingSub);
      } catch (err) {
        console.error("Erreur récupération abonnement existant:", err);
      }
    };

    getExistingSubscription();
  }, [isSupported]);

  /**
   * Demande la permission pour les notifications
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError("Les notifications push ne sont pas supportées");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        console.log("✅ Permission accordée pour les notifications");
        return true;
      } else {
        console.log("❌ Permission refusée pour les notifications");
        setError("Permission refusée");
        return false;
      }
    } catch (err) {
      console.error("Erreur demande permission:", err);
      setError(err.message);
      return false;
    }
  }, [isSupported]);

  /**
   * S'abonne aux notifications push
   */
  const subscribe = useCallback(
    async ({ clientId, userId, tenantId } = {}) => {
      if (!isSupported) {
        setError("Les notifications push ne sont pas supportées");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Vérifier la permission
        if (permission !== "granted") {
          const granted = await requestPermission();
          if (!granted) {
            throw new Error("Permission refusée");
          }
        }

        // Récupérer la clé publique VAPID depuis le serveur
        const keyResponse = await api.get("/push/vapid-public-key");
        const vapidPublicKey = keyResponse.data.publicKey;

        if (!vapidPublicKey) {
          throw new Error("Clé VAPID non disponible");
        }

        // Attendre que le service worker soit prêt
        const registration = await navigator.serviceWorker.ready;

        // Vérifier si un abonnement existe déjà
        let pushSubscription = await registration.pushManager.getSubscription();

        if (!pushSubscription) {
          // Créer un nouvel abonnement
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });

          console.log("✅ Nouvel abonnement push créé");
        } else {
          console.log("ℹ️  Abonnement push existant trouvé");
        }

        // Envoyer l'abonnement au serveur
        const headers = {};
        if (tenantId) {
          headers["x-tenant-id"] = tenantId;
        }

        await api.post(
          "/push/subscribe",
          {
            subscription: pushSubscription.toJSON(),
            clientId,
            userId,
          },
          { headers }
        );

        setSubscription(pushSubscription);
        console.log("✅ Abonnement enregistré sur le serveur");

        return pushSubscription;
      } catch (err) {
        console.error("❌ Erreur lors de l'abonnement push:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isSupported, permission, requestPermission]
  );

  /**
   * Se désabonne des notifications push
   */
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      console.log("Aucun abonnement à supprimer");
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      // Désabonner côté navigateur
      await subscription.unsubscribe();

      // Informer le serveur
      await api.post("/push/unsubscribe", {
        endpoint: subscription.endpoint,
      });

      setSubscription(null);
      console.log("✅ Désabonnement réussi");
      return true;
    } catch (err) {
      console.error("❌ Erreur désabonnement:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  /**
   * Envoie une notification de test
   */
  const sendTestNotification = useCallback(async () => {
    if (!isSupported || permission !== "granted") {
      throw new Error("Notifications non autorisées");
    }

    try {
      await api.post("/push/test", {});
      console.log("✅ Notification de test envoyée");
      return true;
    } catch (err) {
      console.error("❌ Erreur envoi notification test:", err);
      throw err;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    subscription,
    loading,
    error,
    isSubscribed: subscription !== null,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};

export default usePushNotifications;
