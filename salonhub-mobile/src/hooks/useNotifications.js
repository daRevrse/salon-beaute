import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STORAGE_KEY = 'salonhub_notifications';
const MAX_NOTIFICATIONS = 100;

const useNotifications = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const initialized = useRef(false);

  // Charger les notifications depuis SecureStore
  const loadNotifications = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        const localUnread = parsed.filter(n => !n.read).length;
        setUnreadCount(localUnread + adminUnreadCount);
        return parsed;
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
    return [];
  }, [adminUnreadCount]);

  // Sauvegarder les notifications dans SecureStore
  const saveNotifications = useCallback(async (notifs) => {
    try {
      const trimmed = notifs.slice(0, MAX_NOTIFICATIONS);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Erreur sauvegarde notifications:', error);
    }
  }, []);

  // Récupérer le nombre de notifications admin non lues
  const fetchAdminUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications/admin-inbox/unread-count');
      if (response.data.success) {
        const count = response.data.data.total || 0;
        setAdminUnreadCount(count);
        // Recalculate total unread
        setNotifications(prev => {
          const localUnread = prev.filter(n => !n.read).length;
          setUnreadCount(localUnread + count);
          return prev;
        });
      }
    } catch (error) {
      // Silently fail - endpoint may not exist on older backends
    }
  }, [user]);

  // Récupérer les notifications admin (annonces + messages)
  const fetchAdminInbox = useCallback(async () => {
    if (!user) return [];
    try {
      const response = await api.get('/notifications/admin-inbox');
      if (response.data.success) {
        return response.data.data || [];
      }
    } catch (error) {
      console.error('Erreur chargement admin inbox:', error);
    }
    return [];
  }, [user]);

  // Marquer une notification admin comme lue via API
  const markAdminAsRead = useCallback(async (item) => {
    try {
      const endpoint =
        item.type === 'admin_announcement'
          ? `/notifications/admin-inbox/announcements/${item.adminId}/read`
          : `/notifications/admin-inbox/messages/${item.adminId}/read`;
      await api.put(endpoint);
      setAdminUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        setUnreadCount(prevTotal => Math.max(0, prevTotal - 1));
        return newCount;
      });
    } catch (error) {
      console.error('Erreur marquer admin notif comme lu:', error);
    }
  }, []);

  // Ajouter une notification
  const addNotification = useCallback(async (notif) => {
    const newNotif = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notif,
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  }, [saveNotifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (id) => {
    // Check if this is an admin notification
    const notif = notifications.find(n => n.id === id);
    if (notif && (notif.type === 'admin_announcement' || notif.type === 'admin_message') && notif.adminId) {
      await markAdminAsRead(notif);
    }

    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && target.read) return prev; // Already read
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
    // Only decrement for local notifs (admin decrement handled in markAdminAsRead)
    if (notif && notif.type !== 'admin_announcement' && notif.type !== 'admin_message') {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [saveNotifications, notifications, markAdminAsRead]);

  // Tout marquer comme lu
  const markAllAsRead = useCallback(async () => {
    // Mark admin notifications as read via API
    const adminUnread = notifications.filter(
      n => !n.read && (n.type === 'admin_announcement' || n.type === 'admin_message') && n.adminId
    );
    for (const item of adminUnread) {
      try {
        const endpoint =
          item.type === 'admin_announcement'
            ? `/notifications/admin-inbox/announcements/${item.adminId}/read`
            : `/notifications/admin-inbox/messages/${item.adminId}/read`;
        await api.put(endpoint);
      } catch (err) {
        // continue
      }
    }
    setAdminUnreadCount(0);

    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(0);
  }, [saveNotifications, notifications]);

  // Supprimer toutes les notifications
  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    setAdminUnreadCount(0);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  // Charger au montage
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadNotifications();
      fetchAdminUnreadCount();
    }
  }, [loadNotifications, fetchAdminUnreadCount]);

  // Écouter les événements socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewAppointment = (data) => {
      const apt = data.appointment || {};
      const clientName = apt.client_first_name && apt.client_last_name
        ? `${apt.client_first_name} ${apt.client_last_name}`
        : 'Un client';

      addNotification({
        type: 'new_appointment',
        title: 'Nouveau rendez-vous',
        body: data.message || `${clientName} a pris rendez-vous`,
        data: {
          appointmentId: apt.id || null,
          clientName,
          serviceName: apt.service_name || null,
          date: apt.appointment_date || null,
          time: apt.start_time || null,
        },
      });
    };

    const handleAppointmentUpdated = (data) => {
      const { action, appointmentId, status, message } = data;

      const typeMap = {
        updated: 'appointment_modified',
        status_changed: `appointment_${status || 'updated'}`,
        deleted: 'appointment_deleted',
      };

      const titleMap = {
        updated: 'RDV modifié',
        status_changed: status === 'confirmed' ? 'RDV confirmé'
          : status === 'cancelled' ? 'RDV annulé'
          : status === 'completed' ? 'RDV terminé'
          : 'RDV mis à jour',
        deleted: 'RDV supprimé',
      };

      addNotification({
        type: typeMap[action] || 'appointment_updated',
        title: titleMap[action] || 'Rendez-vous mis à jour',
        body: message || 'Un rendez-vous a été modifié',
        data: {
          appointmentId: appointmentId || null,
          action,
          status: status || null,
        },
      });
    };

    const handleAdminNotification = (data) => {
      const isAnnouncement = data.type === 'announcement';
      addNotification({
        type: isAnnouncement ? 'admin_announcement' : 'admin_message',
        title: data.title || (isAnnouncement ? 'Nouvelle annonce' : 'Nouveau message'),
        body: data.content?.replace(/<[^>]+>/g, '').substring(0, 200) || '',
        adminId: data.id,
        data: {
          adminId: data.id,
          type: data.type,
          content: data.content,
        },
      });
      setAdminUnreadCount(prev => prev + 1);
    };

    socket.on('new_appointment', handleNewAppointment);
    socket.on('appointment_updated', handleAppointmentUpdated);
    socket.on('admin_notification', handleAdminNotification);

    return () => {
      socket.off('new_appointment', handleNewAppointment);
      socket.off('appointment_updated', handleAppointmentUpdated);
      socket.off('admin_notification', handleAdminNotification);
    };
  }, [socket, user, addNotification]);

  return {
    notifications,
    unreadCount,
    adminUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: loadNotifications,
    refreshAdmin: fetchAdminUnreadCount,
    fetchAdminInbox,
  };
};

export default useNotifications;
