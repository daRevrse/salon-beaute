/**
 * SALONHUB - Google Auth Service (Expo)
 * OAuth 2.0 via expo-auth-session (sans Firebase)
 */

import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

// Client IDs Google OAuth 2.0
// Remplacez par vos vrais Client IDs depuis Google Cloud Console
const GOOGLE_WEB_CLIENT_ID =
  "899928455254-csf2pmcn4kq1p6hi5nn67078mg0f3rjt.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  "VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  "899928455254-gvqv5t17aano293hbngcgfvm68nt81il.apps.googleusercontent.com";

/**
 * Hook pour l'authentification Google
 * Utilise expo-auth-session/providers/google
 *
 * @returns {{ request, response, promptAsync }}
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });

  return { request, response, promptAsync };
}

/**
 * Retourne la plateforme courante pour le backend
 */
export function getPlatform() {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  return "web";
}
