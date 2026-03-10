/**
 * CreateSalonModal - Modal de création d'un nouveau salon (Mobile)
 * Accessible depuis le SalonSwitcher quand l'utilisateur est owner (plan Custom)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const BUSINESS_TYPES = [
  { value: 'beauty', label: 'Beauté', icon: 'cut-outline', color: '#8B5CF6' },
  { value: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', color: '#F59E0B' },
  { value: 'medical', label: 'Médical', icon: 'medkit-outline', color: '#06B6D4' },
  { value: 'training', label: 'Formation', icon: 'school-outline', color: '#10B981' },
];

const CreateSalonModal = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    business_type: 'beauty',
    phone: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Le nom du salon est obligatoire');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/salons', {
        name: form.name.trim(),
        business_type: form.business_type,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      });

      if (response.data.success) {
        Alert.alert(
          'Salon créé !',
          `${response.data.data.name} a été créé avec succès. Vous pouvez y basculer depuis le sélecteur de salon.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess?.(response.data.data);
                handleClose();
              },
            },
          ]
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Erreur lors de la création du salon';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      business_type: 'beauty',
      phone: '',
      email: '',
      address: '',
    });
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons name="sparkles" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.title}>Nouveau salon</Text>
                  <Text style={styles.subtitle}>
                    Créez un établissement supplémentaire
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Erreur */}
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Nom */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Nom du salon <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(v) => handleChange('name', v)}
                    placeholder="Ex: Mon Salon Paris 15"
                    placeholderTextColor="#D1D5DB"
                    autoFocus
                  />
                </View>
              </View>

              {/* Type d'activité */}
              <View style={styles.field}>
                <Text style={styles.label}>Type d'activité</Text>
                <View style={styles.typesGrid}>
                  {BUSINESS_TYPES.map((type) => {
                    const isSelected = form.business_type === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.typeButton,
                          isSelected && styles.typeButtonActive,
                        ]}
                        onPress={() => handleChange('business_type', type.value)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={type.icon}
                          size={20}
                          color={isSelected ? '#6366F1' : '#9CA3AF'}
                        />
                        <Text
                          style={[
                            styles.typeLabel,
                            isSelected && styles.typeLabelActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Téléphone */}
              <View style={styles.field}>
                <Text style={styles.label}>Téléphone</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(v) => handleChange('phone', v)}
                    placeholder="Optionnel"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email du salon</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(v) => handleChange('email', v)}
                    placeholder="Optionnel"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Adresse */}
              <View style={styles.field}>
                <Text style={styles.label}>Adresse</Text>
                <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#9CA3AF"
                    style={[styles.inputIcon, { marginTop: 12 }]}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={form.address}
                    onChangeText={(v) => handleChange('address', v)}
                    placeholder="Optionnel"
                    placeholderTextColor="#D1D5DB"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Info */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Le salon sera créé avec une période d'essai de 14 jours.
                  Vous pourrez y basculer depuis le sélecteur de salon.
                </Text>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!form.name.trim() || loading) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!form.name.trim() || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Créer le salon</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 56,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    width: '48%',
  },
  typeButtonActive: {
    borderColor: '#A5B4FC',
    backgroundColor: '#EEF2FF',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeLabelActive: {
    color: '#4338CA',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 34,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateSalonModal;
