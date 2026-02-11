import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'expoPushToken';

// Configurer le comportement des notifications en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  // Obtenir le token
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
    console.log('Push token:', token);
  } catch (error) {
    console.error('Erreur récupération push token:', error);
  }

  return token;
}

export async function unregisterPushNotifications() {
  try {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Erreur suppression push token:', error);
  }
}

export async function getStoredPushToken() {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}
