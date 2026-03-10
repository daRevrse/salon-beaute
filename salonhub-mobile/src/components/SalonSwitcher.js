/**
 * SalonSwitcher - Modal pour changer de salon actif (Mobile)
 * S'affiche quand l'utilisateur a accès à plusieurs salons
 * Inclut un bouton "Créer un salon" pour les owners plan Custom
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as Updates from 'expo-updates';
import CreateSalonModal from './CreateSalonModal';

const SalonSwitcher = ({ visible, onClose }) => {
  const { user, salons, switchSalon } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Déterminer si l'utilisateur peut créer un salon
  // Le salon actif doit être plan "custom" et l'utilisateur doit être "owner"
  const activeSalon = salons.find((s) => s.tenant_id === user?.tenant_id);
  const canCreateSalon =
    activeSalon?.subscription_plan === 'custom' &&
    activeSalon?.role === 'owner';

  const handleSwitch = async (targetTenantId) => {
    if (targetTenantId === user?.tenant_id) {
      onClose();
      return;
    }

    setSwitching(true);
    const result = await switchSalon(targetTenantId);
    setSwitching(false);

    if (result.success) {
      onClose();
      // Recharger l'app pour rafraîchir toutes les données
      Alert.alert(
        'Salon changé',
        `Vous êtes maintenant sur ${result.tenant?.name || 'le nouveau salon'}.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch {
                // Fallback : forcer le re-render en fermant le modal
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de changer de salon.');
    }
  };

  const handleCreateSuccess = async () => {
    // Fermer le switcher et recharger l'app
    onClose();
    try {
      await Updates.reloadAsync();
    } catch {
      // Fallback silencieux
    }
  };

  const renderSalonItem = ({ item }) => {
    const isActive = item.tenant_id === user?.tenant_id;

    return (
      <TouchableOpacity
        style={[styles.salonItem, isActive && styles.salonItemActive]}
        onPress={() => handleSwitch(item.tenant_id)}
        disabled={switching}
        activeOpacity={0.7}
      >
        {/* Icône / Logo */}
        <View
          style={[
            styles.salonIcon,
            isActive && styles.salonIconActive,
          ]}
        >
          <Ionicons
            name="business-outline"
            size={20}
            color={isActive ? '#6366F1' : '#9CA3AF'}
          />
        </View>

        {/* Info salon */}
        <View style={styles.salonInfo}>
          <Text
            style={[styles.salonName, isActive && styles.salonNameActive]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.salonMeta}>
            <Text style={styles.salonRole}>{item.role}</Text>
            {item.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Principal</Text>
              </View>
            )}
          </View>
        </View>

        {/* Check si actif */}
        {isActive && (
          <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Mes salons</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Loading overlay */}
            {switching && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Changement en cours...</Text>
              </View>
            )}

            {/* Liste */}
            <FlatList
              data={salons}
              keyExtractor={(item) => String(item.tenant_id)}
              renderItem={renderSalonItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />

            {/* Footer : Créer un salon + compteur */}
            <View style={styles.footer}>
              {canCreateSalon && (
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => {
                    onClose();
                    // Petit délai pour laisser le modal se fermer avant d'ouvrir le suivant
                    setTimeout(() => setShowCreateModal(true), 300);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#6366F1" />
                  <Text style={styles.createBtnText}>Créer un nouveau salon</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.footerText}>
                {salons.length} salon{salons.length > 1 ? 's' : ''} disponible
                {salons.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de création de salon */}
      <CreateSalonModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  salonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 2,
  },
  salonItemActive: {
    backgroundColor: '#EEF2FF',
  },
  salonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  salonIconActive: {
    backgroundColor: '#E0E7FF',
  },
  salonInfo: {
    flex: 1,
  },
  salonName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  salonNameActive: {
    color: '#4338CA',
  },
  salonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  salonRole: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  primaryBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default SalonSwitcher;
