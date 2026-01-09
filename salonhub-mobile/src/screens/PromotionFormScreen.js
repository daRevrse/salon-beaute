import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

const PromotionFormScreen = ({ route, navigation }) => {
  const { promotionId } = route.params || {};
  const isEditing = !!promotionId;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage', // percentage, fixed_amount
    discount_value: '',
    applies_to: 'all_services', // all_services, specific_services
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    usage_per_client: '1',
    valid_from: new Date(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
    is_active: true,
    is_public: true,
  });

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadPromotion();
    }
  }, []);

  const loadPromotion = async () => {
    try {
      const response = await api.get(`/promotions/${promotionId}`);
      if (response.data.success) {
        const promo = response.data.data;
        setFormData({
          code: promo.code || '',
          title: promo.title || '',
          description: promo.description || '',
          discount_type: promo.discount_type || 'percentage',
          discount_value: promo.discount_value?.toString() || '',
          applies_to: promo.applies_to || 'all_services',
          min_purchase_amount: promo.min_purchase_amount?.toString() || '',
          max_discount_amount: promo.max_discount_amount?.toString() || '',
          usage_limit: promo.usage_limit?.toString() || '',
          usage_per_client: promo.usage_per_client?.toString() || '1',
          valid_from: new Date(promo.valid_from),
          valid_until: new Date(promo.valid_until),
          is_active: promo.is_active === 1 || promo.is_active === true,
          is_public: promo.is_public === 1 || promo.is_public === true,
        });
      }
    } catch (error) {
      console.error('Erreur chargement promotion:', error);
      Alert.alert('Erreur', 'Impossible de charger la promotion');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.code.trim()) {
      Alert.alert('Erreur', 'Le code promo est obligatoire');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      Alert.alert('Erreur', 'La valeur de réduction doit être supérieure à 0');
      return;
    }

    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      Alert.alert('Erreur', 'Le pourcentage ne peut pas dépasser 100%');
      return;
    }

    setSubmitting(true);
    try {
      const promotionData = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        applies_to: formData.applies_to,
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_per_client: parseInt(formData.usage_per_client) || 1,
        valid_from: formData.valid_from.toISOString().split('T')[0],
        valid_until: formData.valid_until.toISOString().split('T')[0],
        is_active: formData.is_active,
        is_public: formData.is_public,
      };

      if (isEditing) {
        await api.put(`/promotions/${promotionId}`, promotionData);
        Alert.alert('Succès', 'Promotion modifiée avec succès');
      } else {
        await api.post('/promotions', promotionData);
        Alert.alert('Succès', 'Promotion créée avec succès');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde promotion:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Impossible de sauvegarder la promotion';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette promotion ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/promotions/${promotionId}`);
              Alert.alert('Succès', 'Promotion supprimée');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la promotion');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la promotion' : 'Nouvelle promotion'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Code promo */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Code promo <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.code}
            onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
            placeholder="Ex: PROMO20"
            autoCapitalize="characters"
            editable={!isEditing} // Le code ne peut pas être modifié
          />
        </View>

        {/* Titre */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Ex: Réduction de 20%"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Description de l'offre"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Type de réduction */}
        <View style={styles.section}>
          <Text style={styles.label}>Type de réduction</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                formData.discount_type === 'percentage' && styles.segmentActive,
              ]}
              onPress={() => setFormData({ ...formData, discount_type: 'percentage' })}
            >
              <Text
                style={[
                  styles.segmentText,
                  formData.discount_type === 'percentage' && styles.segmentTextActive,
                ]}
              >
                Pourcentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                formData.discount_type === 'fixed_amount' && styles.segmentActive,
              ]}
              onPress={() => setFormData({ ...formData, discount_type: 'fixed_amount' })}
            >
              <Text
                style={[
                  styles.segmentText,
                  formData.discount_type === 'fixed_amount' && styles.segmentTextActive,
                ]}
              >
                Montant fixe
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Valeur de réduction */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Valeur de réduction <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.discount_value}
            onChangeText={(text) => setFormData({ ...formData, discount_value: text })}
            placeholder={formData.discount_type === 'percentage' ? 'Ex: 20' : 'Ex: 1000'}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            {formData.discount_type === 'percentage' ? 'En pourcentage (%)' : 'En FCFA'}
          </Text>
        </View>

        {/* Montant minimum d'achat */}
        <View style={styles.section}>
          <Text style={styles.label}>Montant minimum d'achat (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={formData.min_purchase_amount}
            onChangeText={(text) => setFormData({ ...formData, min_purchase_amount: text })}
            placeholder="Ex: 5000"
            keyboardType="numeric"
          />
        </View>

        {/* Montant maximum de réduction */}
        {formData.discount_type === 'percentage' && (
          <View style={styles.section}>
            <Text style={styles.label}>Montant maximum de réduction (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={formData.max_discount_amount}
              onChangeText={(text) => setFormData({ ...formData, max_discount_amount: text })}
              placeholder="Ex: 10000"
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Nombre d'utilisations */}
        <View style={styles.section}>
          <Text style={styles.label}>Nombre total d'utilisations (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={formData.usage_limit}
            onChangeText={(text) => setFormData({ ...formData, usage_limit: text })}
            placeholder="Illimité si vide"
            keyboardType="numeric"
          />
        </View>

        {/* Utilisations par client */}
        <View style={styles.section}>
          <Text style={styles.label}>Utilisations par client</Text>
          <TextInput
            style={styles.input}
            value={formData.usage_per_client}
            onChangeText={(text) => setFormData({ ...formData, usage_per_client: text })}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        {/* Date de début */}
        <View style={styles.section}>
          <Text style={styles.label}>Date de début</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowFromPicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.dateText}>{formatDate(formData.valid_from)}</Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={formData.valid_from}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowFromPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData({ ...formData, valid_from: selectedDate });
                }
              }}
            />
          )}
        </View>

        {/* Date de fin */}
        <View style={styles.section}>
          <Text style={styles.label}>Date de fin</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowUntilPicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.dateText}>{formatDate(formData.valid_until)}</Text>
          </TouchableOpacity>
          {showUntilPicker && (
            <DateTimePicker
              value={formData.valid_until}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowUntilPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData({ ...formData, valid_until: selectedDate });
                }
              }}
            />
          )}
        </View>

        {/* Active */}
        <View style={styles.switchSection}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Promotion active</Text>
            <Text style={styles.hint}>La promotion peut être utilisée</Text>
          </View>
          <Switch
            value={formData.is_active}
            onValueChange={(value) => setFormData({ ...formData, is_active: value })}
            trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
            thumbColor="#fff"
          />
        </View>

        {/* Publique */}
        <View style={styles.switchSection}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Visible publiquement</Text>
            <Text style={styles.hint}>Apparaît dans la page de réservation</Text>
          </View>
          <Switch
            value={formData.is_public}
            onValueChange={(value) => setFormData({ ...formData, is_public: value })}
            trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
            thumbColor="#fff"
          />
        </View>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, submitting && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>{isEditing ? 'Modifier' : 'Créer'}</Text>
              </>
            )}
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={handleDelete}
              disabled={submitting}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#8B5CF6',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 8,
  },
  switchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  switchLabel: {
    flex: 1,
  },
  actions: {
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: '#8B5CF6',
  },
  buttonDanger: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PromotionFormScreen;
