import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const StaffScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await api.get('/auth/staff');
      if (response.data.success) {
        setStaff(response.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Aucun employé trouvé');
        setStaff([]);
      } else {
        console.error('Erreur chargement staff:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const handleToggleActive = async (staffMember) => {
    try {
      await api.put(`/auth/staff/${staffMember.id}`, {
        is_active: !staffMember.is_active,
      });
      loadStaff();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const handleDeleteStaff = (staffMember) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer ${staffMember.first_name} ${staffMember.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/auth/staff/${staffMember.id}`);
              Alert.alert('Succès', 'Employé supprimé');
              loadStaff();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'employé');
            }
          },
        },
      ]
    );
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'manager':
        return 'Responsable';
      case 'employee':
        return 'Employé';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return '#6366F1';
      case 'manager':
        return '#6366F1';
      case 'employee':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const renderStaffMember = (member) => (
    <View key={member.id} style={styles.staffCard}>
      {/* Avatar & Info */}
      <View style={styles.staffHeader}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(member.role) }]}>
          <Text style={styles.avatarText}>
            {member.first_name?.charAt(0)}
            {member.last_name?.charAt(0)}
          </Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>
            {member.first_name} {member.last_name}
          </Text>
          <Text style={styles.staffEmail}>{member.email}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) + '15' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                {getRoleName(member.role)}
              </Text>
            </View>
            {member.is_active ? (
              <View style={styles.activeBadge}>
                <View style={styles.activeIndicator} />
                <Text style={styles.activeText}>Actif</Text>
              </View>
            ) : (
              <View style={styles.inactiveBadge}>
                <View style={styles.inactiveIndicator} />
                <Text style={styles.inactiveText}>Inactif</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Contact Info */}
      {member.phone && (
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={16} color="#6B7280" />
          <Text style={styles.contactText}>{member.phone}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleActive(member)}
        >
          <Ionicons
            name={member.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
            size={20}
            color="#6366F1"
          />
          <Text style={styles.actionButtonText}>
            {member.is_active ? 'Désactiver' : 'Activer'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteStaff(member)}
          disabled={member.role === 'owner'}
        >
          <Ionicons name="trash-outline" size={20} color={member.role === 'owner' ? '#D1D5DB' : '#EF4444'} />
          <Text style={[styles.actionButtonText, member.role === 'owner' && styles.disabledText]}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion du Staff</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('StaffForm')}
        >
          <Ionicons name="add" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            Gérez votre équipe et leurs permissions. Les propriétaires ne peuvent pas être supprimés.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{staff.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{staff.filter(s => s.is_active).length}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{staff.filter(s => !s.is_active).length}</Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
        </View>

        {/* Staff List */}
        {staff.length > 0 ? (
          staff.map(renderStaffMember)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun employé</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore ajouté d'employés
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6366F1',
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  staffHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  disabledText: {
    color: '#D1D5DB',
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default StaffScreen;
