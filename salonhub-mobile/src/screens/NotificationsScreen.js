import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const NotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    // Email notifications
    email_new_appointment: true,
    email_appointment_reminder: true,
    email_appointment_cancelled: true,
    email_new_client: false,
    email_daily_summary: true,

    // SMS notifications
    sms_appointment_reminder: true,
    sms_appointment_confirmed: false,
    sms_appointment_cancelled: false,

    // Push notifications
    push_new_appointment: true,
    push_appointment_reminder: true,
    push_staff_message: true,
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const stored = await SecureStore.getItemAsync('notificationSettings');
      if (stored) {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await SecureStore.setItemAsync('notificationSettings', JSON.stringify(settings));
      Alert.alert('Succès', 'Paramètres de notifications enregistrés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            Configurez les notifications que vous souhaitez recevoir par email, SMS et notifications push.
          </Text>
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={24} color="#EF4444" />
            <Text style={styles.sectionTitle}>Email</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Nouveau rendez-vous</Text>
              <Text style={styles.settingDescription}>
                Recevoir un email à chaque nouveau rendez-vous
              </Text>
            </View>
            <Switch
              value={settings.email_new_appointment}
              onValueChange={() => handleToggle('email_new_appointment')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.email_new_appointment ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rappel de rendez-vous</Text>
              <Text style={styles.settingDescription}>
                Recevoir un rappel 24h avant le rendez-vous
              </Text>
            </View>
            <Switch
              value={settings.email_appointment_reminder}
              onValueChange={() => handleToggle('email_appointment_reminder')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.email_appointment_reminder ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rendez-vous annulé</Text>
              <Text style={styles.settingDescription}>
                Notification d'annulation de rendez-vous
              </Text>
            </View>
            <Switch
              value={settings.email_appointment_cancelled}
              onValueChange={() => handleToggle('email_appointment_cancelled')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.email_appointment_cancelled ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Nouveau client</Text>
              <Text style={styles.settingDescription}>
                Notification lors de l'inscription d'un nouveau client
              </Text>
            </View>
            <Switch
              value={settings.email_new_client}
              onValueChange={() => handleToggle('email_new_client')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.email_new_client ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Résumé quotidien</Text>
              <Text style={styles.settingDescription}>
                Recevoir un résumé des rendez-vous du jour
              </Text>
            </View>
            <Switch
              value={settings.email_daily_summary}
              onValueChange={() => handleToggle('email_daily_summary')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.email_daily_summary ? '#6366F1' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* SMS Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble" size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>SMS</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rappel de rendez-vous</Text>
              <Text style={styles.settingDescription}>
                SMS envoyé au client 24h avant
              </Text>
            </View>
            <Switch
              value={settings.sms_appointment_reminder}
              onValueChange={() => handleToggle('sms_appointment_reminder')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.sms_appointment_reminder ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Confirmation de rendez-vous</Text>
              <Text style={styles.settingDescription}>
                SMS de confirmation au client
              </Text>
            </View>
            <Switch
              value={settings.sms_appointment_confirmed}
              onValueChange={() => handleToggle('sms_appointment_confirmed')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.sms_appointment_confirmed ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Annulation de rendez-vous</Text>
              <Text style={styles.settingDescription}>
                SMS d'annulation au client
              </Text>
            </View>
            <Switch
              value={settings.sms_appointment_cancelled}
              onValueChange={() => handleToggle('sms_appointment_cancelled')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.sms_appointment_cancelled ? '#6366F1' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Push Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Push</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Nouveau rendez-vous</Text>
              <Text style={styles.settingDescription}>
                Notification push instantanée
              </Text>
            </View>
            <Switch
              value={settings.push_new_appointment}
              onValueChange={() => handleToggle('push_new_appointment')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.push_new_appointment ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rappel de rendez-vous</Text>
              <Text style={styles.settingDescription}>
                Rappel 1h avant le rendez-vous
              </Text>
            </View>
            <Switch
              value={settings.push_appointment_reminder}
              onValueChange={() => handleToggle('push_appointment_reminder')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.push_appointment_reminder ? '#6366F1' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Messages du staff</Text>
              <Text style={styles.settingDescription}>
                Notifications des messages internes
              </Text>
            </View>
            <Switch
              value={settings.push_staff_message}
              onValueChange={() => handleToggle('push_staff_message')}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={settings.push_staff_message ? '#6366F1' : '#F3F4F6'}
            />
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
              <Text style={styles.saveButtonText}>Enregistrer</Text>
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
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6366F1',
    lineHeight: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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

export default NotificationsScreen;
