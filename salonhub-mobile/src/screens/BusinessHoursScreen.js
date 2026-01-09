import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

const DAYS_OF_WEEK = [
  { key: 'sunday', name: 'Dimanche', shortName: 'Dim' },
  { key: 'monday', name: 'Lundi', shortName: 'Lun' },
  { key: 'tuesday', name: 'Mardi', shortName: 'Mar' },
  { key: 'wednesday', name: 'Mercredi', shortName: 'Mer' },
  { key: 'thursday', name: 'Jeudi', shortName: 'Jeu' },
  { key: 'friday', name: 'Vendredi', shortName: 'Ven' },
  { key: 'saturday', name: 'Samedi', shortName: 'Sam' },
];

const BusinessHoursScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [businessHours, setBusinessHours] = useState({});
  const [showTimePicker, setShowTimePicker] = useState(null); // { dayKey, type: 'open' | 'close' }

  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data && response.data.business_hours) {
        setBusinessHours(response.data.business_hours);
      } else {
        // Initialize with default values if no data
        initializeDefaultHours();
      }
    } catch (error) {
      // If 404 or any error, initialize with default values
      if (error.response?.status === 404 || !error.response) {
        console.log('Aucune configuration trouvée, initialisation avec valeurs par défaut');
      } else {
        console.error('Erreur chargement horaires:', error);
      }
      initializeDefaultHours();
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultHours = () => {
    const defaultHours = {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    };
    setBusinessHours(defaultHours);
  };

  const handleToggleDay = (dayKey) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        closed: !prev[dayKey]?.closed,
      },
    }));
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }

    if (selectedTime && showTimePicker) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      setBusinessHours(prev => ({
        ...prev,
        [showTimePicker.dayKey]: {
          ...prev[showTimePicker.dayKey],
          [showTimePicker.type]: timeString,
        },
      }));
    }

    if (Platform.OS === 'ios') {
      // Keep picker open on iOS
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString; // Already in HH:mm format
  };

  const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date;
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await api.put('/settings', { business_hours: businessHours });
      Alert.alert('Succès', 'Horaires d\'ouverture enregistrés avec succès');
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Impossible de sauvegarder les horaires';
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Horaires d'ouverture</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6366F1" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Configurez les jours et heures d'ouverture de votre salon. Ces horaires seront utilisés pour la prise de rendez-vous en ligne.
            </Text>
            <Text style={styles.infoSubtext}>
              Par défaut : Lundi-Vendredi de 9h à 18h
            </Text>
          </View>
        </View>

        {/* Days List */}
        {DAYS_OF_WEEK.map(day => {
          const dayHours = businessHours[day.key] || { open: '09:00', close: '18:00', closed: false };
          const isOpen = !dayHours.closed;

          return (
            <View key={day.key} style={styles.dayCard}>
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day.name}</Text>
                  {!isOpen && <Text style={styles.closedLabel}>Fermé</Text>}
                </View>
                <Switch
                  value={isOpen}
                  onValueChange={() => handleToggleDay(day.key)}
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={isOpen ? '#6366F1' : '#F3F4F6'}
                />
              </View>

              {/* Time Pickers */}
              {isOpen && (
                <View style={styles.timeContainer}>
                  {/* Open Time */}
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>Ouverture</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker({ dayKey: day.key, type: 'open' })}
                    >
                      <Ionicons name="time-outline" size={20} color="#6366F1" />
                      <Text style={styles.timeText}>{formatTime(dayHours.open)}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Close Time */}
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>Fermeture</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker({ dayKey: day.key, type: 'close' })}
                    >
                      <Ionicons name="time-outline" size={20} color="#6366F1" />
                      <Text style={styles.timeText}>{formatTime(dayHours.close)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

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
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={parseTime(businessHours[showTimePicker.dayKey]?.[showTimePicker.type] || '09:00')}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
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
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#4F46E5',
    lineHeight: 18,
    marginBottom: 6,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  dayCard: {
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  closedLabel: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
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

export default BusinessHoursScreen;
