import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import {
  registerForPushNotificationsAsync,
  unregisterPushNotifications,
} from '../services/pushNotificationService';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useRef(null);

  // Setter pour la navigation ref (appelé depuis App.js)
  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

  useEffect(() => {
    if (!user) {
      // Cleanup quand l'utilisateur se déconnecte
      cleanup();
      return;
    }

    // Enregistrer les push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listener : notification reçue en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Listener : utilisateur tape sur la notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.appointmentId && navigationRef.current) {
        navigationRef.current.navigate('AppointmentDetail', {
          appointmentId: data.appointmentId,
        });
      }
    });

    return () => {
      cleanup();
    };
  }, [user]);

  const cleanup = () => {
    if (notificationListener.current) {
      notificationListener.current.remove();
      notificationListener.current = null;
    }
    if (responseListener.current) {
      responseListener.current.remove();
      responseListener.current = null;
    }
  };

  return (
    <NotificationContext.Provider value={{ expoPushToken, setNavigationRef }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
