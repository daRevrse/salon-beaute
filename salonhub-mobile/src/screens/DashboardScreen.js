import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ActionButton from '../components/ActionButton';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [showBusinessHoursAlert, setShowBusinessHoursAlert] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les RDV du jour
      const todayRes = await api.get('/appointments/today');
      const todayApts = todayRes.data?.data || [];
      setTodayAppointments(todayApts);

      // Charger tous les clients
      const clientsRes = await api.get('/clients');
      const allClients = clientsRes.data?.data || [];
      // Trier par date de création (les plus récents en premier) et prendre les 5 premiers
      const sortedClients = allClients.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentClients(sortedClients.slice(0, 5));

      // Charger tous les services
      const servicesRes = await api.get('/services');
      const allServices = servicesRes.data?.data || [];

      // Charger tous les RDV pour calculer le CA et les services populaires
      const appointmentsRes = await api.get('/appointments');
      const allAppointments = appointmentsRes.data?.data || [];

      // Calculer le CA du mois en cours
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      const monthlyRevenue = allAppointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate.getMonth() === currentMonth &&
                 aptDate.getFullYear() === currentYear &&
                 apt.status === 'completed';
        })
        .reduce((sum, apt) => {
          // Use total_price if available, otherwise fall back to service price
          const price = apt.total_price || apt.price || 0;
          return sum + parseFloat(price);
        }, 0);

      // Calculer le CA du jour
      const todayCompletedAppointments = allAppointments.filter(apt => {
        return apt.appointment_date === currentDate && apt.status === 'completed';
      });
      const todayRevenue = todayCompletedAppointments.reduce((sum, apt) => {
        const price = apt.total_price || apt.price || 0;
        return sum + parseFloat(price);
      }, 0);

      // Compter les RDV complétés ce mois
      const completedThisMonth = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === currentMonth &&
               aptDate.getFullYear() === currentYear &&
               apt.status === 'completed';
      }).length;

      // Compter les RDV annulés ce mois
      const cancelledThisMonth = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === currentMonth &&
               aptDate.getFullYear() === currentYear &&
               apt.status === 'cancelled';
      }).length;

      // Calculer les services populaires
      const serviceCount = {};
      allAppointments.forEach(apt => {
        if (apt.service_id) {
          serviceCount[apt.service_id] = (serviceCount[apt.service_id] || 0) + 1;
        }
      });
      const topServices = Object.entries(serviceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([serviceId, count]) => {
          const service = allServices.find(s => s.id === parseInt(serviceId));
          return service ? { ...service, bookingCount: count } : null;
        })
        .filter(Boolean);
      setPopularServices(topServices);

      // Mettre à jour les stats
      setStats({
        todayAppointments: todayApts.length,
        totalClients: allClients.length,
        activeServices: allServices.filter(s => !s.is_deleted).length,
        monthlyRevenue: monthlyRevenue,
        todayRevenue: todayRevenue,
        todayCompleted: todayCompletedAppointments.length,
        completedThisMonth: completedThisMonth,
        cancelledThisMonth: cancelledThisMonth,
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // Définir des valeurs par défaut en cas d'erreur
      setStats({
        todayAppointments: 0,
        totalClients: 0,
        activeServices: 0,
        monthlyRevenue: 0,
        todayRevenue: 0,
        todayCompleted: 0,
        completedThisMonth: 0,
        cancelledThisMonth: 0,
      });
      setTodayAppointments([]);
      setRecentClients([]);
      setPopularServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
        </View>
      </View>

      {/* Business Hours Alert */}
      {showBusinessHoursAlert && (
        <View style={styles.alertContainer}>
          <AlertBanner
            type="warning"
            icon="time-outline"
            title="Configuration requise: Horaires d'ouverture"
            message="Vos horaires d'ouverture ne sont pas configurés. Sans cette configuration, vos clients ne pourront PAS réserver en ligne !"
            actionText="Configurer mes horaires maintenant"
            onActionPress={() => navigation.navigate('Settings')}
            dismissable={true}
            onDismiss={() => setShowBusinessHoursAlert(false)}
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('AppointmentForm')}
        >
          <Ionicons name="add-circle" size={24} color="#6366F1" />
          <Text style={styles.quickActionText}>Nouveau rendez-vous</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards - Row 1 */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="calendar"
          title="Rendez-vous"
          subtitle="Aujourd'hui"
          value={stats?.todayAppointments || 0}
          color="#6366F1"
          onPress={() => navigation.navigate('Appointments')}
        />
        <StatCard
          icon="people"
          title="Clients"
          subtitle="Total"
          value={stats?.totalClients || 0}
          color="#10B981"
          onPress={() => navigation.navigate('Clients')}
        />
      </View>

      {/* Stats Cards - Row 2 */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="cash"
          title="Revenu aujourd'hui"
          subtitle={`${stats?.todayCompleted || 0} RDV complétés`}
          value={`${formatCurrency(stats?.todayRevenue || 0)} F`}
          color="#10B981"
          isAmount={true}
        />
        <StatCard
          icon="trending-up"
          title="Revenu ce mois"
          subtitle={`${stats?.completedThisMonth || 0} RDV complétés`}
          value={`${formatCurrency(stats?.monthlyRevenue || 0)} F`}
          color="#3B82F6"
          isAmount={true}
        />
      </View>

      {/* Stats Cards - Row 3 */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="checkmark-circle"
          title="Complétés ce mois"
          subtitle="Rendez-vous terminés"
          value={stats?.completedThisMonth || 0}
          color="#10B981"
        />
        <StatCard
          icon="close-circle"
          title="Annulés ce mois"
          subtitle="À surveiller"
          value={stats?.cancelledThisMonth || 0}
          color="#EF4444"
        />
      </View>

      {/* Today's Appointments Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rendez-vous d'aujourd'hui</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAllLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {todayAppointments.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Aucun rendez-vous prévu pour aujourd'hui"
          />
        ) : (
          todayAppointments.slice(0, 3).map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} navigation={navigation} />
          ))
        )}
      </View>

      {/* Popular Services Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services populaires</Text>
        {popularServices.length === 0 ? (
          <EmptyState
            icon="trending-up-outline"
            title="Aucune donnée disponible"
          />
        ) : (
          popularServices.map((service, index) => (
            <ServiceCard key={service.id} service={service} rank={index + 1} />
          ))
        )}
      </View>

      {/* Recent Clients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clients récents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Clients')}>
            <Text style={styles.seeAllLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentClients.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Aucun client"
          />
        ) : (
          recentClients.map((client) => (
            <ClientCard key={client.id} client={client} formatDate={formatDate} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const StatCard = ({ icon, title, subtitle, value, color, onPress, isAmount }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={[styles.statValue, isAmount && styles.statValueSmall]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const AppointmentCard = ({ appointment, navigation }) => (
  <TouchableOpacity
    style={styles.appointmentCard}
    onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
    activeOpacity={0.7}
  >
    <View style={styles.appointmentHeader}>
      <View style={styles.appointmentTime}>
        <Ionicons name="time-outline" size={16} color="#6B7280" />
        <Text style={styles.appointmentTimeText}>
          {new Date(appointment.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {new Date(appointment.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <StatusBadge status={appointment.status} />
    </View>
    <View style={styles.appointmentBody}>
      <View style={styles.appointmentRow}>
        <Ionicons name="person-outline" size={18} color="#6B7280" />
        <Text style={styles.appointmentText}>
          {appointment.client?.first_name} {appointment.client?.last_name}
        </Text>
      </View>
      {appointment.client?.phone && (
        <View style={styles.appointmentRow}>
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <Text style={styles.appointmentText}>{appointment.client.phone}</Text>
        </View>
      )}
      <View style={styles.appointmentRow}>
        <Ionicons name="cut-outline" size={18} color="#6B7280" />
        <Text style={styles.appointmentText}>
          {appointment.service?.name} • {appointment.duration} min
        </Text>
      </View>
      {appointment.employee && (
        <View style={styles.appointmentRow}>
          <Ionicons name="person-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.appointmentText}>
            {appointment.employee.first_name} {appointment.employee.last_name}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const ServiceCard = ({ service, rank }) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceRank}>
      <Text style={styles.serviceRankText}>#{rank}</Text>
    </View>
    <View style={styles.serviceContent}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.serviceDetails}>
        <View style={styles.serviceDetailItem}>
          <Ionicons name="pricetag-outline" size={14} color="#8B5CF6" />
          <Text style={styles.servicePrice}>{service.price} F CFA</Text>
        </View>
        <View style={styles.serviceDetailItem}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.serviceDuration}>{service.duration} min</Text>
        </View>
      </View>
    </View>
    <View style={styles.serviceBookings}>
      <Text style={styles.serviceBookingsCount}>{service.bookingCount}</Text>
      <Text style={styles.serviceBookingsLabel}>réservations</Text>
    </View>
  </View>
);

const ClientCard = ({ client, formatDate }) => (
  <View style={styles.clientCard}>
    <View style={styles.clientAvatar}>
      <Text style={styles.clientAvatarText}>
        {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
      </Text>
    </View>
    <View style={styles.clientContent}>
      <Text style={styles.clientName}>
        {client.first_name} {client.last_name}
      </Text>
      {client.email && (
        <View style={styles.clientRow}>
          <Ionicons name="mail-outline" size={14} color="#6B7280" />
          <Text style={styles.clientText}>{client.email}</Text>
        </View>
      )}
      {client.phone && (
        <View style={styles.clientRow}>
          <Ionicons name="call-outline" size={14} color="#6B7280" />
          <Text style={styles.clientText}>{client.phone}</Text>
        </View>
      )}
      <View style={styles.clientRow}>
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text style={styles.clientText}>Inscrit le {formatDate(client.created_at)}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statValueSmall: {
    fontSize: 18,
  },
  alertContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentBody: {
    gap: 8,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentText: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  serviceDuration: {
    fontSize: 13,
    color: '#6B7280',
  },
  serviceBookings: {
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  serviceBookingsCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  serviceBookingsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  clientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientContent: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default DashboardScreen;
