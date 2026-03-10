import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import {
  registerForPushNotificationsAsync,
  unregisterPushNotifications,
  refreshTokenRegistration,
} from '../services/pushNotificationService';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useRef(null);
  const previousTenantId = useRef(null);

  // Setter pour la navigation ref (appelé depuis App.js)
  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

  // Enregistrer les push notifications quand l'utilisateur se connecte
  useEffect(() => {
    if (!user) {
      // Cleanup quand l'utilisateur se déconnecte
      cleanup();
      return;
    }

    // Enregistrer les push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listener : notification reçue en foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification reçue:', notification.request.content.title);
      });

    // Listener : utilisateur tape sur la notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.appointmentId && navigationRef.current) {
          navigationRef.current.navigate('AppointmentDetail', {
            appointmentId: data.appointmentId,
          });
        }
      });

    // Stocker le tenant_id initial
    previousTenantId.current = user.tenant_id;

    return () => {
      cleanup();
    };
  }, [user]);

  // Re-enregistrer le token quand l'utilisateur change de salon
  useEffect(() => {
    if (
      user &&
      previousTenantId.current &&
      user.tenant_id !== previousTenantId.current
    ) {
      // Le salon a changé — re-enregistrer le token avec le nouveau tenant_id
      refreshTokenRegistration();
      previousTenantId.current = user.tenant_id;
    }
  }, [user?.tenant_id]);

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
