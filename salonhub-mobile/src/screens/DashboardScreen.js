import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [popularServices, setPopularServices] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger tous les RDV
      const appointmentsRes = await api.get('/appointments');
      const allAppointments = appointmentsRes.data?.data || [];

      // Charger tous les clients
      const clientsRes = await api.get('/clients');
      const allClients = clientsRes.data?.data || [];

      // Charger tous les services
      const servicesRes = await api.get('/services');
      const allServices = servicesRes.data?.data || [];

      // Calculer la date d'aujourd'hui
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // RDV du jour
      const todayApts = allAppointments.filter(apt => apt.appointment_date === currentDate);
      setTodayAppointments(todayApts);

      // Clients récents (5 derniers)
      const sortedClients = [...allClients].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentClients(sortedClients.slice(0, 5));

      // Calculer les stats
      const todayCompleted = todayApts.filter(apt => apt.status === 'completed');
      const todayRevenue = todayCompleted.reduce((sum, apt) => {
        const price = apt.total_price || apt.price || 0;
        return sum + parseFloat(price);
      }, 0);

      const monthlyCompleted = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === currentMonth &&
               aptDate.getFullYear() === currentYear &&
               apt.status === 'completed';
      });

      const monthlyRevenue = monthlyCompleted.reduce((sum, apt) => {
        const price = apt.total_price || apt.price || 0;
        return sum + parseFloat(price);
      }, 0);

      const monthlyCancelled = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === currentMonth &&
               aptDate.getFullYear() === currentYear &&
               apt.status === 'cancelled';
      }).length;

      // Services populaires
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

      setStats({
        todayAppointments: todayApts.length,
        totalClients: allClients.length,
        activeServices: allServices.filter(s => s.is_active).length,
        pendingAppointments: todayApts.filter(apt => apt.status === 'pending').length,
        monthlyRevenue,
        todayRevenue,
        completedThisMonth: monthlyCompleted.length,
        cancelledThisMonth: monthlyCancelled,
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setStats({
        todayAppointments: 0,
        totalClients: 0,
        activeServices: 0,
        pendingAppointments: 0,
        monthlyRevenue: 0,
        todayRevenue: 0,
        completedThisMonth: 0,
        cancelledThisMonth: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleHelp = () => {
    Alert.alert(
      'Aide & Support',
      'Pour obtenir de l\'aide:\n\n• Consultez notre guide d\'utilisation\n• Contactez le support technique\n• Email: support@salonhub.com\n• Tél: +221 XX XXX XX XX',
      [
        {
          text: 'Contacter le support',
          onPress: () => Linking.openURL('mailto:support@salonhub.com'),
        },
        { text: 'Fermer', style: 'cancel' },
      ]
    );
  };

  const handlePublicPage = async () => {
    try {
      // Récupérer les paramètres du salon pour obtenir l'URL publique
      const response = await api.get('/settings/salon');
      const salonData = response.data?.data;

      if (salonData?.public_url) {
        Linking.openURL(salonData.public_url);
      } else {
        Alert.alert(
          'Page publique',
          'Votre page publique n\'est pas encore configurée. Voulez-vous la configurer maintenant?',
          [
            {
              text: 'Configurer',
              onPress: () => navigation.navigate('BusinessSettings'),
            },
            { text: 'Plus tard', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur page publique:', error);
      Alert.alert(
        'Page publique',
        'Fonctionnalité en cours de développement. Vous pourrez bientôt créer et partager votre page publique pour permettre à vos clients de prendre rendez-vous en ligne.'
      );
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Découvrez ${user?.business_name || 'notre salon'} et prenez rendez-vous facilement!\n\nTéléchargez SalonHub: https://salonhub.app`,
        title: 'Partager mon salon',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Partagé via:', result.activityType);
        } else {
          console.log('Partagé avec succès');
        }
      }
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager pour le moment');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bienvenue, {user?.first_name} !</Text>
          <Text style={styles.subtitle}>Voici un aperçu de votre activité.</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleHelp}>
            <Ionicons name="help-circle-outline" size={24} color="#6366F1" />
            <Text style={styles.actionButtonLabel}>Aide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handlePublicPage}>
            <Ionicons name="globe-outline" size={24} color="#6366F1" />
            <Text style={styles.actionButtonLabel}>Page publique</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#6366F1" />
            <Text style={styles.actionButtonLabel}>Partager</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Action Cards - Row 1 */}
      <View style={styles.statsRow}>
        <QuickActionCard
          icon="calendar"
          iconColor="#fff"
          title="RDV aujourd'hui"
          value={stats?.todayAppointments || 0}
          color="#6366F1"
          linkText="Voir le planning →"
          onPress={() => navigation.navigate('Appointments')}
        />
        <QuickActionCard
          icon="people"
          iconColor="#fff"
          title="Total clients"
          value={stats?.totalClients || 0}
          color="#10B981"
          linkText="Gérer les clients →"
          onPress={() => navigation.navigate('Clients')}
        />
      </View>

      {/* Quick Action Cards - Row 2 */}
      <View style={styles.statsRow}>
        <QuickActionCard
          icon="cut"
          iconColor="#fff"
          title="Services actifs"
          value={stats?.activeServices || 0}
          color="#8B5CF6"
          linkText="Gérer les services →"
          onPress={() => navigation.navigate('Services')}
        />
        <QuickActionCard
          icon="time"
          iconColor="#fff"
          title="En attente"
          value={stats?.pendingAppointments || 0}
          color="#F59E0B"
          linkText="Valider les RDV →"
          onPress={() => navigation.navigate('Appointments')}
        />
      </View>

      {/* Revenue Cards */}
      <View style={styles.revenueContainer}>
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash" size={20} color="#10B981" />
            <Text style={styles.revenueLabel}>Revenu aujourd'hui</Text>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(stats?.todayRevenue || 0)} F CFA</Text>
          <Text style={styles.revenueSubtext}>→ RDV complétés</Text>
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="trending-up" size={20} color="#3B82F6" />
            <Text style={styles.revenueLabel}>Revenu ce mois</Text>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(stats?.monthlyRevenue || 0)} F CFA</Text>
          <Text style={styles.revenueSubtext}>{stats?.completedThisMonth || 0} RDV complétés</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatsCard
          icon="checkmark-circle"
          title="Complétés ce mois"
          value={stats?.completedThisMonth || 0}
          subtitle="→ Rendez-vous terminés"
          color="#10B981"
        />
        <StatsCard
          icon="close-circle"
          title="Annulés ce mois"
          value={stats?.cancelledThisMonth || 0}
          subtitle="→ À surveiller"
          color="#EF4444"
        />
      </View>

      {/* Today's Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={24} color="#1F2937" />
          <Text style={styles.sectionTitle}>Rendez-vous d'aujourd'hui</Text>
        </View>
        <TouchableOpacity style={styles.sectionLink} onPress={() => navigation.navigate('Appointments')}>
          <Text style={styles.linkText}>Voir tout</Text>
        </TouchableOpacity>

        {todayAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
            <Text style={styles.emptyText}>Aucun rendez-vous prévu pour aujourd'hui.</Text>
          </View>
        ) : (
          todayAppointments.slice(0, 3).map((apt) => (
            <AppointmentItem key={apt.id} appointment={apt} navigation={navigation} />
          ))
        )}
      </View>

      {/* Popular Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={24} color="#1F2937" />
          <Text style={styles.sectionTitle}>Services populaires</Text>
        </View>
        <TouchableOpacity style={styles.sectionLink} onPress={() => navigation.navigate('Services')}>
          <Text style={styles.linkText}>Voir tout</Text>
        </TouchableOpacity>

        {popularServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trending-up-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune donnée disponible</Text>
          </View>
        ) : (
          popularServices.map((service, index) => (
            <ServiceItem key={service.id} service={service} rank={index + 1} />
          ))
        )}
      </View>

      {/* Recent Clients */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={24} color="#1F2937" />
          <Text style={styles.sectionTitle}>Clients récents</Text>
        </View>
        <TouchableOpacity style={styles.sectionLink} onPress={() => navigation.navigate('Clients')}>
          <Text style={styles.linkText}>Voir tout</Text>
        </TouchableOpacity>

        {recentClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun client</Text>
          </View>
        ) : (
          recentClients.map((client) => (
            <ClientItem key={client.id} client={client} />
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const QuickActionCard = ({ icon, iconColor, title, value, color, linkText, onPress }) => (
  <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress}>
    <View style={styles.actionCardTop}>
      <Text style={styles.actionCardTitle}>{title}</Text>
      <Ionicons name={icon} size={32} color={iconColor} />
    </View>
    <Text style={styles.actionCardValue}>{value}</Text>
    <Text style={styles.actionCardLink}>{linkText}</Text>
  </TouchableOpacity>
);

const StatsCard = ({ icon, title, value, subtitle, color }) => (
  <View style={styles.statsCard}>
    <View style={styles.statsCardHeader}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statsCardValue}>{value}</Text>
    <Text style={styles.statsCardTitle}>{title}</Text>
    <Text style={styles.statsCardSubtitle}>{subtitle}</Text>
  </View>
);

const AppointmentItem = ({ appointment, navigation }) => (
  <TouchableOpacity
    style={styles.listItem}
    onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
  >
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle}>
        {appointment.client?.first_name} {appointment.client?.last_name}
      </Text>
      <Text style={styles.listItemSubtitle}>{appointment.service?.name}</Text>
    </View>
    <View style={[styles.statusBadge, getStatusStyle(appointment.status)]}>
      <Text style={styles.statusText}>{getStatusLabel(appointment.status)}</Text>
    </View>
  </TouchableOpacity>
);

const ServiceItem = ({ service, rank }) => (
  <View style={styles.listItem}>
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle}>{service.name}</Text>
      <Text style={styles.listItemSubtitle}>{service.price} F CFA</Text>
    </View>
    <View style={styles.bookingCount}>
      <Text style={styles.bookingNumber}>{service.bookingCount}</Text>
      <Text style={styles.bookingLabel}>réservations</Text>
    </View>
  </View>
);

const ClientItem = ({ client }) => (
  <View style={styles.listItem}>
    <View style={styles.clientAvatar}>
      <Text style={styles.clientAvatarText}>
        {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
      </Text>
    </View>
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle}>
        {client.first_name} {client.last_name}
      </Text>
      <Text style={styles.listItemSubtitle}>{client.email}</Text>
    </View>
  </View>
);

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };
  return labels[status] || status;
};

const getStatusStyle = (status) => {
  const styles = {
    pending: { backgroundColor: '#FEF3C7' },
    confirmed: { backgroundColor: '#D1FAE5' },
    completed: { backgroundColor: '#DBEAFE' },
    cancelled: { backgroundColor: '#FEE2E2' },
  };
  return styles[status] || {};
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    flex: 1,
  },
  actionCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  actionCardLink: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  revenueContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardHeader: {
    marginBottom: 8,
  },
  statsCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  statsCardSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    position: 'relative',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionLink: {
    position: 'absolute',
    top: 24,
    right: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  bookingCount: {
    alignItems: 'flex-end',
  },
  bookingNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  bookingLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default DashboardScreen;
