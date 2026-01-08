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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const BusinessSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [bannerUri, setBannerUri] = useState(null);

  const [formData, setFormData] = useState({
    business_name: '',
    business_phone: '',
    business_email: '',
    business_address: '',
    business_description: '',
    booking_url: '',
  });

  useEffect(() => {
    loadBusinessSettings();
  }, []);

  const loadBusinessSettings = async () => {
    try {
      const response = await api.get('/business/settings');
      if (response.data.success && response.data.data) {
        setFormData({
          business_name: response.data.data.business_name || '',
          business_phone: response.data.data.business_phone || '',
          business_email: response.data.data.business_email || '',
          business_address: response.data.data.business_address || '',
          business_description: response.data.data.business_description || '',
          booking_url: response.data.data.booking_url || '',
        });
        setLogoUri(response.data.data.logo_url || null);
        setBannerUri(response.data.data.banner_url || null);
      }
    } catch (error) {
      // If 404, it means no settings exist yet, which is fine
      // User can create them by filling the form
      if (error.response?.status === 404) {
        console.log('Aucune configuration trouvée, vous pouvez créer vos paramètres');
      } else {
        console.error('Erreur chargement paramètres:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger les paramètres. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async (type) => {
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
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') {
        setLogoUri(result.assets[0].uri);
      } else {
        setBannerUri(result.assets[0].uri);
      }
      // TODO: Upload image to server when backend supports it
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.business_name.trim()) {
      Alert.alert('Erreur', 'Le nom du salon est obligatoire');
      return;
    }

    if (formData.business_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.business_email.trim())) {
        Alert.alert('Erreur', 'Veuillez entrer un email valide');
        return;
      }
    }

    setSubmitting(true);
    try {
      const settingsData = {
        business_name: formData.business_name.trim(),
        business_phone: formData.business_phone.trim() || null,
        business_email: formData.business_email.trim() || null,
        business_address: formData.business_address.trim() || null,
        business_description: formData.business_description.trim() || null,
        booking_url: formData.booking_url.trim() || null,
      };

      await api.put('/business/settings', settingsData);
      Alert.alert('Succès', 'Paramètres du salon enregistrés avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Impossible de sauvegarder les paramètres';
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
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres Généraux</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            Ces informations seront affichées sur votre page de réservation en ligne et dans les emails envoyés à vos clients.
          </Text>
        </View>

        {/* Identity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité du salon</Text>

          {/* Logo Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Logo du Salon</Text>
            <TouchableOpacity
              style={styles.imageUploadContainer}
              onPress={() => handlePickImage('logo')}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.placeholderText}>Cliquez pour ajouter une image</Text>
                  <Text style={styles.placeholderSubtext}>(Max 5MB - JPEG, PNG, GIF, WebP)</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Logo carré qui apparaîtra comme icône de votre salon.
            </Text>
          </View>

          {/* Banner Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bannière du Salon</Text>
            <TouchableOpacity
              style={[styles.imageUploadContainer, styles.bannerContainer]}
              onPress={() => handlePickImage('banner')}
            >
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.placeholderText}>Cliquez pour ajouter une image</Text>
                  <Text style={styles.placeholderSubtext}>(Max 5MB - JPEG, PNG, GIF, WebP)</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Bannière large qui apparaîtra sur votre page de réservation.
            </Text>
          </View>
        </View>

        {/* Business Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du salon</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Nom du salon <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mon Salon de Beauté"
                value={formData.business_name}
                onChangeText={(text) => setFormData({ ...formData, business_name: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Téléphone du salon</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+221 XX XXX XX XX"
                value={formData.business_phone}
                onChangeText={(text) => setFormData({ ...formData, business_phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email du salon</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="contact@monsalon.com"
                value={formData.business_email}
                onChangeText={(text) => setFormData({ ...formData, business_email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Adresse</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse complète du salon"
                value={formData.business_address}
                onChangeText={(text) => setFormData({ ...formData, business_address: text })}
                multiline
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez votre salon en quelques mots..."
                value={formData.business_description}
                onChangeText={(text) => setFormData({ ...formData, business_description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Online Booking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réservation en ligne</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>URL de réservation</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="link-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="monsalon.salonhub.com"
                value={formData.booking_url}
                onChangeText={(text) => setFormData({ ...formData, booking_url: text })}
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.helperText}>
              Cette URL permettra à vos clients de prendre rendez-vous en ligne
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
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
    backgroundColor: '#F9FAFB',
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerContainer: {
    height: 160,
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusinessSettingsScreen;
