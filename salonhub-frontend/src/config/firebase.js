import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const getEnv = (key, fallback) => {
  return (process.env && process.env[key]) || fallback;
};

const firebaseConfig = {
  apiKey: getEnv('REACT_APP_FIREBASE_API_KEY', "AIzaSyDAElArbdzOoiJ7wbHip8MifjnNY3xeSe0"),
  authDomain: getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', "salonhub-701f4.firebaseapp.com"),
  projectId: getEnv('REACT_APP_FIREBASE_PROJECT_ID', "salonhub-701f4"),
  storageBucket: getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET', "salonhub-701f4.firebasestorage.app"),
  messagingSenderId: getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', "374879511321"),
  appId: getEnv('REACT_APP_FIREBASE_APP_ID', "1:374879511321:web:634fb6101d65356be41b88")
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestFcmToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });
    if (currentToken) {
      console.log('✅ FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('⚠️ No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('❌ An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('🔔 FCM message received:', payload);
      resolve(payload);
    });
  });
