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
  Platform,
  KeyboardAvoidingView,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const ServiceFormScreen = ({ navigation, route }) => {
  const { serviceId } = route.params || {};
  const isEditing = !!serviceId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    is_active: true,
  });

  useEffect(() => {
    if (isEditing) {
      loadService();
    }
  }, [serviceId]);

  const loadService = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/services/${serviceId}`);
      if (response.data?.success && response.data?.data) {
        const service = response.data.data;
        setFormData({
          name: service.name || '',
          description: service.description || '',
          category: service.category || '',
          price: service.price?.toString() || '',
          duration: service.duration?.toString() || '',
          is_active: service.is_active !== undefined ? service.is_active : true,
        });
        if (service.image_url) {
          setImageUri(service.image_url);
        }
      }
    } catch (error) {
      console.error('Erreur chargement service:', error);
      Alert.alert('Erreur', 'Impossible de charger le service');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Supprimer l\'image',
      'Êtes-vous sûr de vouloir supprimer cette image ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => setImageUri(null),
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du service');
      return;
    }
    if (!formData.price.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le prix');
      return;
    }
    if (!formData.duration.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer la durée');
      return;
    }

    const price = parseFloat(formData.price);
    const duration = parseInt(formData.duration);

    if (isNaN(price) || price < 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Erreur', 'La durée doit être un nombre positif');
      return;
    }

    setSubmitting(true);
    try {
      // For now, send as JSON without image upload
      // Image upload will be added in a future update when backend supports it
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
        price: price,
        duration: duration,
        is_active: formData.is_active,
      };

      if (isEditing) {
        await api.put(`/services/${serviceId}`, serviceData);
        Alert.alert('Succès', 'Service modifié avec succès');
      } else {
        await api.post('/services', serviceData);
        Alert.alert('Succès', 'Service créé avec succès');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde service:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Impossible de sauvegarder le service';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le service' : 'Nouveau service'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image du service</Text>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="sync" size={20} color="#6366F1" />
                  <Text style={styles.imageActionText}>Changer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageActionButton, styles.imageActionButtonDanger]}
                  onPress={handleRemoveImage}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={[styles.imageActionText, styles.imageActionTextDanger]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              <Text style={styles.imagePickerText}>Ajouter une image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de base</Text>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Nom du service <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cut-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Coupe classique"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pricetags-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Coiffure, Soin, Barbe..."
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez le service..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Pricing & Duration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarification et durée</Text>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Prix (F CFA) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Durée (minutes) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut</Text>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Ionicons
                name={formData.is_active ? "checkmark-circle" : "close-circle"}
                size={20}
                color={formData.is_active ? "#10B981" : "#EF4444"}
              />
              <Text style={styles.switchLabelText}>
                {formData.is_active ? 'Service actif' : 'Service inactif'}
              </Text>
            </View>
            <Switch
              value={formData.is_active}
              onValueChange={(value) => setFormData({ ...formData, is_active: value })}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={formData.is_active ? '#6366F1' : '#F3F4F6'}
            />
          </View>
          <Text style={styles.helperText}>
            Les services inactifs ne seront pas visibles dans les listes de réservation
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            Les champs marqués d'un astérisque (*) sont obligatoires.
          </Text>
        </View>

        {/* Spacing for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={isEditing ? "checkmark" : "add"} size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Enregistrer les modifications' : 'Créer le service'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  imagePicker: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  imagePreviewContainer: {
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  imageActionButtonDanger: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  imageActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  imageActionTextDanger: {
    color: '#EF4444',
  },
  formGroup: {
    marginBottom: 16,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4F46E5',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceFormScreen;
