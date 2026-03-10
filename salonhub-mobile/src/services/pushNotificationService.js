import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const PUSH_TOKEN_KEY = 'expoPushToken';

// Configurer le comportement des notifications en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Enregistre l'appareil pour recevoir des push notifications
 * 1. Demande les permissions
 * 2. Obtient le token Expo
 * 3. Envoie le token au backend pour l'enregistrer
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  // Les push ne fonctionnent que sur un appareil physique
  if (!Device.isDevice) {
    console.log('Push notifications nécessitent un appareil physique');
    return null;
  }

  // Configurer le channel Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Défaut',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  // Vérifier/demander les permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission push refusée');
    return null;
  }

  // Obtenir le token Expo
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('Pas de projectId EAS — push token non disponible en dev Expo Go');
      return null;
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    token = pushToken.data;

    // Sauvegarder le token localement
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    console.log('Push token obtenu:', token);

    // Enregistrer le token auprès du backend
    await registerTokenWithBackend(token);
  } catch (error) {
    console.error('Erreur récupération push token:', error);
  }

  return token;
}

/**
 * Envoie le token Expo push au backend pour l'enregistrer en base
 */
async function registerTokenWithBackend(token) {
  try {
    const response = await api.post('/push/register-mobile', {
      token,
      deviceName: Device.modelName || Device.deviceName || null,
      platform: Platform.OS, // 'ios' ou 'android'
    });

    if (response.data.success) {
      console.log('Token push enregistré sur le backend:', response.data.message);
    }
  } catch (error) {
    // Ne pas bloquer l'app si l'enregistrement échoue
    console.error(
      'Erreur enregistrement token backend:',
      error.response?.data?.error || error.message
    );
  }
}

/**
 * Désenregistre l'appareil (lors de la déconnexion)
 * 1. Supprime le token du backend
 * 2. Supprime le token local
 */
export async function unregisterPushNotifications() {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);

    // Supprimer du backend si on a un token
    if (token) {
      try {
        await api.post('/push/unregister-mobile', { token });
        console.log('Token push supprimé du backend');
      } catch (error) {
        // Silencieux — le token sera nettoyé automatiquement
        console.error(
          'Erreur suppression token backend:',
          error.response?.data?.error || error.message
        );
      }
    }

    // Supprimer le token local
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Erreur suppression push token:', error);
  }
}

/**
 * Récupère le token stocké localement
 */
export async function getStoredPushToken() {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Re-enregistre le token auprès du backend
 * Utile après un switch de salon (le tenant_id change)
 */
export async function refreshTokenRegistration() {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (token) {
      await registerTokenWithBackend(token);
    }
  } catch (error) {
    console.error('Erreur refresh token registration:', error);
  }
}
