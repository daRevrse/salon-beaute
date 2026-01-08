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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import FilterButton from '../components/FilterButton';
import EmptyState from '../components/EmptyState';

const ClientHistoryScreen = ({ navigation, route }) => {
  const { clientId, clientName } = route.params;

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadClientAppointments();
  }, [clientId]);

  useEffect(() => {
    filterAppointments();
  }, [selectedStatus, appointments]);

  const loadClientAppointments = async () => {
    try {
      const response = await api.get(`/clients/${clientId}/appointments`);
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      // If endpoint doesn't exist, fallback to filtering all appointments
      try {
        const allResponse = await api.get('/appointments');
        if (allResponse.data.success) {
          const clientAppts = allResponse.data.data.filter(
            (apt) => apt.client_id === clientId
          );
          setAppointments(clientAppts);
        }
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.appointment_date} ${a.start_time}`);
      const dateB = new Date(`${b.appointment_date} ${b.start_time}`);
      return dateB - dateA;
    });

    setFilteredAppointments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientAppointments();
  };

  const getStatusCounts = () => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const renderAppointment = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header with Date and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={18} color="#6366F1" />
            <Text style={styles.dateText}>{formatDate(item.appointment_date)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Time */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
        </View>

        {/* Service */}
        <View style={styles.infoRow}>
          <Ionicons name="cut-outline" size={16} color="#6B7280" />
          <Text style={styles.serviceName}>{item.service_name}</Text>
          <Text style={styles.duration}>{item.duration} min</Text>
        </View>

        {/* Employee */}
        {item.staff_first_name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {item.staff_first_name} {item.staff_last_name}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Prix:</Text>
          <Text style={styles.priceValue}>{item.total_price || item.price || '—'} F CFA</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Historique</Text>
          <Text style={styles.headerSubtitle}>{clientName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Total RDV</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statusCounts.completed}</Text>
          <Text style={styles.statLabel}>Complétés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statusCounts.cancelled}</Text>
          <Text style={styles.statLabel}>Annulés</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
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
          <FilterButton
            label="Annulés"
            active={selectedStatus === 'cancelled'}
            count={statusCounts.cancelled}
            onPress={() => setSelectedStatus('cancelled')}
            color="#EF4444"
          />
        </ScrollView>
      </View>

      {/* Appointments List */}
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
              selectedStatus === 'all'
                ? "Ce client n'a pas encore de rendez-vous"
                : `Aucun rendez-vous ${selectedStatus === 'pending' ? 'en attente' : selectedStatus === 'confirmed' ? 'confirmé' : selectedStatus === 'completed' ? 'complété' : 'annulé'}`
            }
          />
        }
      />
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  duration: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
});

export default ClientHistoryScreen;
