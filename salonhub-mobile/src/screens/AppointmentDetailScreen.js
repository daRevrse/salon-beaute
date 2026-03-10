import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ActionButton from '../components/ActionButton';

const AppointmentDetailScreen = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      setAppointment(response.data?.data);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger le rendez-vous');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: 'confirmed' });
      Alert.alert('Succès', 'Rendez-vous confirmé');
      loadAppointment();
    } catch (error) {
      console.error('Erreur confirmation:', error);
      Alert.alert('Erreur', 'Impossible de confirmer le rendez-vous');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Confirmer l\'annulation',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await api.patch(`/appointments/${appointmentId}/status`, {
                status: 'cancelled',
                cancellation_reason: 'Annulé par le gestionnaire'
              });
              Alert.alert('Succès', 'Rendez-vous annulé');
              loadAppointment();
            } catch (error) {
              console.error('Erreur annulation:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler le rendez-vous');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      'Marquer comme terminé',
      'Ce rendez-vous a-t-il été complété ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminé',
          onPress: async () => {
            setProcessing(true);
            try {
              await api.patch(`/appointments/${appointmentId}/status`, { status: 'completed' });
              Alert.alert('Succès', 'Rendez-vous marqué comme terminé');
              loadAppointment();
            } catch (error) {
              console.error('Erreur:', error);
              Alert.alert('Erreur', 'Impossible de terminer le rendez-vous');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await api.delete(`/appointments/${appointmentId}`);
              Alert.alert('Succès', 'Rendez-vous supprimé');
              navigation.goBack();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le rendez-vous');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AppointmentForm', { appointmentId });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Rendez-vous introuvable</Text>
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
        <Text style={styles.headerTitle}>Détails du rendez-vous</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <StatusBadge status={appointment.status} />
          <Text style={styles.statusDate}>
            Créé le {formatDate(appointment.created_at)}
          </Text>
        </View>

        {/* Date & Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Date et heure</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(appointment.appointment_date)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Heure de début</Text>
              <Text style={styles.infoValue}>{formatTime(appointment.start_time)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Heure de fin</Text>
              <Text style={styles.infoValue}>{formatTime(appointment.end_time)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durée</Text>
              <Text style={styles.infoValue}>{appointment.duration} minutes</Text>
            </View>
          </View>
        </View>

        {/* Client Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Client</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>
                  {appointment.client?.first_name?.charAt(0)}
                  {appointment.client?.last_name?.charAt(0)}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {appointment.client?.first_name} {appointment.client?.last_name}
                </Text>
                {appointment.client?.email && (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={16} color="#6B7280" />
                    <Text style={styles.contactText}>{appointment.client.email}</Text>
                  </View>
                )}
                {appointment.client?.phone && (
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                    <Text style={styles.contactText}>{appointment.client.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Service Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cut" size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Service</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.serviceName}>{appointment.service?.name}</Text>
            {appointment.service?.description && (
              <Text style={styles.serviceDescription}>{appointment.service.description}</Text>
            )}
            <View style={styles.divider} />
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="pricetag-outline" size={18} color="#6366F1" />
                <Text style={styles.servicePrice}>{appointment.total_price || appointment.service?.price} F CFA</Text>
              </View>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.serviceDuration}>{appointment.duration} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Employee Section */}
        {appointment.employee && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Employé</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.employeeName}>
                {appointment.employee.first_name} {appointment.employee.last_name}
              </Text>
              {appointment.employee.email && (
                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>{appointment.employee.email}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes Section */}
        {appointment.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color="#6B7280" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {appointment.status === 'pending' && (
          <ActionButton
            label="Confirmer"
            icon="checkmark"
            variant="success"
            onPress={handleConfirm}
            disabled={processing}
            loading={processing}
          />
        )}
        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
          <ActionButton
            label="Annuler"
            icon="close"
            variant="danger"
            onPress={handleCancel}
            disabled={processing}
          />
        )}
        {appointment.status === 'confirmed' && (
          <ActionButton
            label="Terminer"
            icon="checkmark-done"
            variant="primary"
            onPress={handleComplete}
            disabled={processing}
          />
        )}
        <ActionButton
          label="Supprimer"
          icon="trash-outline"
          variant="outline"
          onPress={handleDelete}
          disabled={processing}
        />
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
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
  editButton: {
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
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  clientHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  serviceDuration: {
    fontSize: 15,
    color: '#6B7280',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default AppointmentDetailScreen;
