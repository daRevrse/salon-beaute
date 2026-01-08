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
  { id: 0, name: 'Dimanche', shortName: 'Dim' },
  { id: 1, name: 'Lundi', shortName: 'Lun' },
  { id: 2, name: 'Mardi', shortName: 'Mar' },
  { id: 3, name: 'Mercredi', shortName: 'Mer' },
  { id: 4, name: 'Jeudi', shortName: 'Jeu' },
  { id: 5, name: 'Vendredi', shortName: 'Ven' },
  { id: 6, name: 'Samedi', shortName: 'Sam' },
];

const BusinessHoursScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [businessHours, setBusinessHours] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(null); // { dayId, type: 'open' | 'close' }

  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      const response = await api.get('/business-hours');
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setBusinessHours(response.data.data);
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
    const defaultHours = DAYS_OF_WEEK.map(day => ({
      day_of_week: day.id,
      is_open: day.id >= 1 && day.id <= 5, // Monday to Friday open by default
      open_time: '09:00:00',
      close_time: '18:00:00',
    }));
    setBusinessHours(defaultHours);
  };

  const handleToggleDay = (dayId) => {
    setBusinessHours(prev =>
      prev.map(item =>
        item.day_of_week === dayId
          ? { ...item, is_open: !item.is_open }
          : item
      )
    );
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }

    if (selectedTime && showTimePicker) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;

      setBusinessHours(prev =>
        prev.map(item =>
          item.day_of_week === showTimePicker.dayId
            ? { ...item, [showTimePicker.type === 'open' ? 'open_time' : 'close_time']: timeString }
            : item
        )
      );
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await api.post('/business-hours', { hours: businessHours });
      Alert.alert('Succès', 'Horaires d\'ouverture enregistrés avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde horaires:', error);
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

  const getDayHours = (dayId) => {
    return businessHours.find(item => item.day_of_week === dayId) || {
      day_of_week: dayId,
      is_open: false,
      open_time: '09:00:00',
      close_time: '18:00:00',
    };
  };

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
          const dayHours = getDayHours(day.id);
          return (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayNameContainer}>
                  <Text style={styles.dayName}>{day.name}</Text>
                  {!dayHours.is_open && (
                    <Text style={styles.closedText}>Fermé</Text>
                  )}
                </View>
                <Switch
                  value={dayHours.is_open}
                  onValueChange={() => handleToggleDay(day.id)}
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={dayHours.is_open ? '#6366F1' : '#F3F4F6'}
                />
              </View>

              {dayHours.is_open && (
                <View style={styles.timeContainer}>
                  {/* Open Time */}
                  <View style={styles.timeGroup}>
                    <Text style={styles.timeLabel}>Ouverture</Text>
                    <TouchableOpacity
                      style={styles.timePicker}
                      onPress={() => setShowTimePicker({ dayId: day.id, type: 'open' })}
                    >
                      <Ionicons name="time-outline" size={20} color="#6366F1" />
                      <Text style={styles.timeText}>{formatTime(dayHours.open_time)}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Close Time */}
                  <View style={styles.timeGroup}>
                    <Text style={styles.timeLabel}>Fermeture</Text>
                    <TouchableOpacity
                      style={styles.timePicker}
                      onPress={() => setShowTimePicker({ dayId: day.id, type: 'close' })}
                    >
                      <Ionicons name="time-outline" size={20} color="#6366F1" />
                      <Text style={styles.timeText}>{formatTime(dayHours.close_time)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const dayHours = getDayHours(showTimePicker.dayId);
            const timeString = showTimePicker.type === 'open' ? dayHours.open_time : dayHours.close_time;
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0);
            return date;
          })()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={true}
        />
      )}

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
              <Text style={styles.saveButtonText}>Enregistrer les horaires</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  dayNameContainer: {
    flex: 1,
  },
  dayName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  closedText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  timeContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  timeGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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

export default BusinessHoursScreen;
