import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useNotifications from '../hooks/useNotifications';

const getNotifStyle = (type) => {
  switch (type) {
    case 'new_appointment':
      return { icon: 'calendar', color: '#6366F1', bg: '#EEF2FF' };
    case 'appointment_modified':
      return { icon: 'create-outline', color: '#3B82F6', bg: '#DBEAFE' };
    case 'appointment_confirmed':
      return { icon: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5' };
    case 'appointment_cancelled':
      return { icon: 'close-circle', color: '#EF4444', bg: '#FEE2E2' };
    case 'appointment_completed':
      return { icon: 'checkmark-done-circle', color: '#3B82F6', bg: '#DBEAFE' };
    case 'appointment_deleted':
      return { icon: 'trash', color: '#EF4444', bg: '#FEE2E2' };
    case 'admin_announcement':
      return { icon: 'megaphone', color: '#E11D48', bg: '#FFF1F2' };
    case 'admin_message':
      return { icon: 'chatbubble-ellipses', color: '#6366F1', bg: '#EEF2FF' };
    default:
      return { icon: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
  }
};

const formatTimeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const NotificationListScreen = ({ navigation }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, refresh, refreshAdmin, fetchAdminInbox } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [adminItems, setAdminItems] = useState([]);

  // Charger les notifications admin depuis l'API au montage
  useEffect(() => {
    loadAdminInbox();
  }, []);

  const loadAdminInbox = async () => {
    const items = await fetchAdminInbox();
    setAdminItems(items);
  };

  // Fusionner les notifications locales avec les admin API
  const getMergedNotifications = () => {
    // On a déjà les notifications locales (incluant celles reçues via socket)
    // Pour les admin, on fusionne ceux de l'API qui ne sont pas déjà dans les locales
    const localAdminIds = new Set(
      notifications
        .filter(n => n.type === 'admin_announcement' || n.type === 'admin_message')
        .map(n => `${n.type === 'admin_announcement' ? 'announcement' : 'message'}-${n.adminId}`)
    );

    const apiOnly = adminItems
      .filter(item => !localAdminIds.has(`${item.type}-${item.id}`))
      .map(item => ({
        id: `api_${item.type}_${item.id}`,
        type: item.type === 'announcement' ? 'admin_announcement' : 'admin_message',
        title: item.title,
        body: item.content?.replace(/<[^>]+>/g, '').substring(0, 200) || '',
        read: item.is_read,
        createdAt: item.created_at,
        adminId: item.id,
        data: {
          adminId: item.id,
          type: item.type,
          content: item.content,
        },
      }));

    const merged = [...notifications, ...apiOnly];
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return merged;
  };

  const allNotifications = getMergedNotifications();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshAdmin(), loadAdminInbox()]);
    setRefreshing(false);
  };

  const handlePress = (item) => {
    if (!item.read) {
      markAsRead(item.id);
    }

    // If admin notification, show detail modal
    if (item.type === 'admin_announcement' || item.type === 'admin_message') {
      setSelectedNotif(item);
      return;
    }

    // Navigate to appointment detail if applicable
    if (item.data?.appointmentId) {
      navigation.navigate('AppointmentDetail', { appointmentId: item.data.appointmentId });
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Effacer les notifications',
      'Voulez-vous supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const renderBadge = (type) => {
    if (type === 'admin_announcement') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FFF1F2' }]}>
          <Text style={[styles.badgeText, { color: '#E11D48' }]}>Annonce</Text>
        </View>
      );
    }
    if (type === 'admin_message') {
      return (
        <View style={[styles.badge, { backgroundColor: '#EEF2FF' }]}>
          <Text style={[styles.badgeText, { color: '#6366F1' }]}>Message</Text>
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item }) => {
    const style = getNotifStyle(item.type);
    const isAdmin = item.type === 'admin_announcement' || item.type === 'admin_message';
    const hasTarget = isAdmin || !!item.data?.appointmentId;

    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.read && styles.notifItemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={hasTarget ? 0.7 : 1}
      >
        {!item.read && <View style={styles.unreadDot} />}
        <View style={[styles.iconContainer, { backgroundColor: style.bg }]}>
          <Ionicons name={style.icon} size={22} color={style.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <View style={styles.titleRow}>
              {renderBadge(item.type)}
              <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.body}
          </Text>
          {!isAdmin && item.data?.serviceName && (
            <Text style={styles.notifMeta}>
              {item.data.serviceName}
              {item.data.time ? ` · ${item.data.time.slice(0, 5)}` : ''}
            </Text>
          )}
        </View>
        {hasTarget && (
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={56} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyText}>
        Les notifications de vos rendez-vous{'\n'}et messages apparaîtront ici.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {allNotifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Unread bar */}
      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadBarText}>
            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={allNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={allNotifications.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
      />

      {/* Admin notification detail modal */}
      <Modal
        visible={!!selectedNotif}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {selectedNotif?.type === 'admin_announcement' ? (
                  <View style={[styles.modalBadge, { backgroundColor: '#FFF1F2' }]}>
                    <Ionicons name="megaphone" size={16} color="#E11D48" />
                    <Text style={[styles.modalBadgeText, { color: '#E11D48' }]}>Annonce</Text>
                  </View>
                ) : (
                  <View style={[styles.modalBadge, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="chatbubble-ellipses" size={16} color="#6366F1" />
                    <Text style={[styles.modalBadgeText, { color: '#6366F1' }]}>Message</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedNotif(null)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>
            <Text style={styles.modalDate}>
              {selectedNotif?.createdAt
                ? new Date(selectedNotif.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalBodyText}>
                {selectedNotif?.data?.content?.replace(/<[^>]+>/g, '') || selectedNotif?.body || ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
  },
  unreadBarText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  listContent: {
    padding: 16,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notifItemUnread: {
    backgroundColor: '#FAFBFF',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    position: 'absolute',
    top: 14,
    left: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  notifBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 2,
  },
  notifMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  modalDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalBodyText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});

export default NotificationListScreen;
