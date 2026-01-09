import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import api from '../services/api';
import FilterButton from '../components/FilterButton';
import ActionButton from '../components/ActionButton';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

// Configuration du calendrier en français
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

const AppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [selectedStatus, selectedDate, appointments]);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Filter by date if selected
    if (selectedDate) {
      filtered = filtered.filter(apt => {
        let aptDate = apt.appointment_date;
        // Extraire juste la date si c'est un timestamp
        if (aptDate && aptDate.includes('T')) {
          aptDate = aptDate.split('T')[0];
        }
        return aptDate === selectedDate;
      });
    }

    setFilteredAppointments(filtered);
  };

  const getMarkedDates = () => {
    const marked = {};

    appointments.forEach(apt => {
      // S'assurer que la date est au format YYYY-MM-DD
      let date = apt.appointment_date;

      if (!date) return; // Ignorer si pas de date

      // Si la date contient un timestamp, extraire juste la partie date
      if (date.includes('T')) {
        date = date.split('T')[0];
      }

      if (!marked[date]) {
        marked[date] = { marked: true, dots: [] };
      }

      // Ajouter un point de couleur selon le statut
      const color =
        apt.status === 'pending' ? '#F59E0B' :
        apt.status === 'confirmed' ? '#10B981' :
        apt.status === 'completed' ? '#3B82F6' :
        '#6B7280';

      marked[date].dots.push({ color });
    });

    // Ajouter la date sélectionnée
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#6366F1',
      };
    }

    return marked;
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    setViewMode('list'); // Passer en mode liste pour voir les RDV du jour
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const getStatusCounts = () => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
    };
  };

  const handleActionPress = async (appointmentId, action) => {
    setProcessingIds(prev => [...prev, appointmentId]);

    try {
      let requestData = {};
      let successMessage = '';

      switch (action) {
        case 'confirm':
          requestData = { status: 'confirmed' };
          successMessage = 'Rendez-vous confirmé';
          break;
        case 'cancel':
          requestData = { status: 'cancelled', cancellation_reason: 'Annulé par le gestionnaire' };
          successMessage = 'Rendez-vous annulé';
          break;
        case 'complete':
          requestData = { status: 'completed' };
          successMessage = 'Rendez-vous terminé';
          break;
        case 'delete':
          Alert.alert(
            'Confirmer la suppression',
            'Êtes-vous sûr de vouloir supprimer ce rendez-vous ?',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await api.delete(`/appointments/${appointmentId}`);
                    Alert.alert('Succès', 'Rendez-vous supprimé');
                    loadAppointments();
                  } catch (error) {
                    Alert.alert('Erreur', 'Impossible de supprimer le rendez-vous');
                  }
                },
              },
            ]
          );
          setProcessingIds(prev => prev.filter(id => id !== appointmentId));
          return;
      }

      const response = await api.patch(`/appointments/${appointmentId}/status`, requestData);
      if (response.data.success) {
        Alert.alert('Succès', successMessage);
        loadAppointments();
      }
    } catch (error) {
      console.error(`Erreur ${action}:`, error);
      Alert.alert('Erreur', `Impossible de ${action} le rendez-vous`);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== appointmentId));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const renderAppointment = ({ item }) => {
    const isProcessing = processingIds.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
        activeOpacity={0.7}
      >
        {/* Date & Time */}
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentColumn}>
            <Text style={styles.columnLabel}>DATE & HEURE</Text>
            <Text style={styles.appointmentDate}>
              {formatDate(item.appointment_date)}
            </Text>
            <Text style={styles.appointmentTime}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentColumn}>
            <Text style={styles.columnLabel}>CLIENT</Text>
            <Text style={styles.clientName}>
              {item.client_first_name} {item.client_last_name}
            </Text>
            {item.client_phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color="#6B7280" />
                <Text style={styles.clientPhone}>{item.client_phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Service */}
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentColumn}>
            <Text style={styles.columnLabel}>SERVICE</Text>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            <Text style={styles.serviceDuration}>{item.duration} min</Text>
          </View>
        </View>

        {/* Employee */}
        {item.staff_first_name && (
          <View style={styles.appointmentRow}>
            <View style={styles.appointmentColumn}>
              <Text style={styles.columnLabel}>EMPLOYÉ</Text>
              <Text style={styles.employeeName}>
                {item.staff_first_name} {item.staff_last_name}
              </Text>
            </View>
          </View>
        )}

        {/* Status */}
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentColumn}>
            <Text style={styles.columnLabel}>STATUT</Text>
            <StatusBadge status={item.status} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.columnLabel}>ACTIONS</Text>
          <View style={styles.actionsRow}>
            {item.status === 'pending' && (
              <ActionButton
                label="Confirmer"
                icon="checkmark"
                variant="success"
                size="sm"
                onPress={() => handleActionPress(item.id, 'confirm')}
                disabled={isProcessing}
                loading={isProcessing}
              />
            )}
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <ActionButton
                label="Annuler"
                icon="close"
                variant="danger"
                size="sm"
                onPress={() => handleActionPress(item.id, 'cancel')}
                disabled={isProcessing}
              />
            )}
            {item.status === 'confirmed' && (
              <ActionButton
                label="Terminer"
                icon="checkmark-done"
                variant="primary"
                size="sm"
                onPress={() => handleActionPress(item.id, 'complete')}
                disabled={isProcessing}
              />
            )}
            <ActionButton
              label="Supprimer"
              icon="trash-outline"
              variant="outline"
              size="sm"
              onPress={() => handleActionPress(item.id, 'delete')}
              disabled={isProcessing}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <View style={styles.container}>
      {/* Header with Add Button and View Toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rendez-vous</Text>
        <View style={styles.headerActions}>
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons name="calendar" size={18} color={viewMode === 'calendar' ? '#fff' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Add Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AppointmentForm')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Nouveau</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {selectedDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setSelectedDate(null)}
            >
              <Ionicons name="close-circle" size={16} color="#6366F1" />
              <Text style={styles.clearDateText}>
                {new Date(selectedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </Text>
            </TouchableOpacity>
          )}
          <FilterButton
            label="Tous"
            active={selectedStatus === 'all'}
            count={statusCounts.all}
            onPress={() => setSelectedStatus('all')}
          />
          <FilterButton
            label="En attente"
            active={selectedStatus === 'pending'}
            count={statusCounts.pending}
            onPress={() => setSelectedStatus('pending')}
            color="#F59E0B"
          />
          <FilterButton
            label="Confirmés"
            active={selectedStatus === 'confirmed'}
            count={statusCounts.confirmed}
            onPress={() => setSelectedStatus('confirmed')}
            color="#10B981"
          />
          <FilterButton
            label="Complétés"
            active={selectedStatus === 'completed'}
            count={statusCounts.completed}
            onPress={() => setSelectedStatus('completed')}
            color="#3B82F6"
          />
        </ScrollView>
      </View>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Calendar
            current={selectedDate || new Date().toISOString().split('T')[0]}
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: '#F9FAFB',
              calendarBackground: '#fff',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#6366F1',
              selectedDayTextColor: '#fff',
              todayTextColor: '#6366F1',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              dotColor: '#6366F1',
              selectedDotColor: '#fff',
              arrowColor: '#6366F1',
              monthTextColor: '#1F2937',
              indicatorColor: '#6366F1',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />

          {/* Légende */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Légende :</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>En attente</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Confirmé</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Complété</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Aucun rendez-vous"
              description={
                selectedDate
                  ? `Aucun rendez-vous le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`
                  : selectedStatus === 'all'
                  ? "Vous n'avez pas encore de rendez-vous"
                  : `Aucun rendez-vous ${selectedStatus === 'pending' ? 'en attente' : selectedStatus === 'confirmed' ? 'confirmé' : 'complété'}`
              }
            />
          }
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#6366F1',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  clearDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  calendar: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: {
    padding: 16,
  },
  appointmentCard: {
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
  appointmentRow: {
    marginBottom: 12,
  },
  appointmentColumn: {
    gap: 4,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  clientPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceDuration: {
    fontSize: 13,
    color: '#6B7280',
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionsContainer: {
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default AppointmentsScreen;
