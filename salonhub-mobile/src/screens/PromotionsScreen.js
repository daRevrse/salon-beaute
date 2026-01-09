import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const PromotionsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, expired

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await api.get('/promotions');
      if (response.data.success) {
        setPromotions(response.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Aucune promotion trouvée');
        setPromotions([]);
      } else {
        console.error('Erreur chargement promotions:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromotions();
  };

  const getStats = () => {
    const total = promotions.length;
    const active = promotions.filter(p => p.is_active && (!p.end_date || new Date(p.end_date) >= new Date())).length;
    const totalUsage = promotions.reduce((sum, p) => sum + (p.usage_count || 0), 0);
    const totalReduction = promotions.reduce((sum, p) => sum + (p.total_saved || 0), 0);

    return { total, active, totalUsage, totalReduction };
  };

  const stats = getStats();

  const filteredPromotions = promotions.filter(promo => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return promo.is_active && (!promo.end_date || new Date(promo.end_date) >= new Date());
    }
    if (filter === 'expired') {
      return !promo.is_active || (promo.end_date && new Date(promo.end_date) < new Date());
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPromotion = (promo) => {
    const isExpired = promo.end_date && new Date(promo.end_date) < new Date();
    const isActive = promo.is_active && !isExpired;

    return (
      <TouchableOpacity
        key={promo.id}
        style={styles.promoCard}
        onPress={() => navigation.navigate('PromotionForm', { promotionId: promo.id })}
      >
        <View style={styles.promoHeader}>
          <View style={styles.promoIcon}>
            <Ionicons name="pricetag" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.promoInfo}>
            <Text style={styles.promoCode}>{promo.code}</Text>
            <Text style={styles.promoName}>{promo.name}</Text>
          </View>
          {isActive ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeIndicator} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          ) : (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expirée</Text>
            </View>
          )}
        </View>

        <View style={styles.promoDetails}>
          <View style={styles.promoDetailRow}>
            <Text style={styles.promoDetailLabel}>Réduction</Text>
            <Text style={styles.promoDetailValue}>
              {promo.discount_type === 'percentage'
                ? `${promo.discount_value}%`
                : `${formatCurrency(promo.discount_value)} FCFA`}
            </Text>
          </View>
          {promo.end_date && (
            <View style={styles.promoDetailRow}>
              <Text style={styles.promoDetailLabel}>Expire le</Text>
              <Text style={styles.promoDetailValue}>{formatDate(promo.end_date)}</Text>
            </View>
          )}
          <View style={styles.promoDetailRow}>
            <Text style={styles.promoDetailLabel}>Utilisations</Text>
            <Text style={styles.promoDetailValue}>
              {promo.usage_count || 0}
              {promo.max_uses ? ` / ${promo.max_uses}` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
        <Text style={styles.headerTitle}>Promotions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PromotionForm')}
        >
          <Ionicons name="add" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="pricetag" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Promotions</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Actives</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.totalUsage}</Text>
            <Text style={styles.statLabel}>Utilisations</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="stats-chart" size={32} color="#fff" />
            <Text style={styles.statValue}>{formatCurrency(stats.totalReduction)}</Text>
            <Text style={styles.statLabel}>Réductions FCFA</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
              Actives
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'expired' && styles.filterTabActive]}
            onPress={() => setFilter('expired')}
          >
            <Text style={[styles.filterTabText, filter === 'expired' && styles.filterTabTextActive]}>
              Expirées
            </Text>
          </TouchableOpacity>
        </View>

        {/* Promotions List */}
        {filteredPromotions.length > 0 ? (
          filteredPromotions.map(renderPromotion)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucune promotion</Text>
            <Text style={styles.emptyText}>
              Créez votre première promotion pour attirer plus de clients
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('PromotionForm')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer une promotion</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB - Floating Action Button */}
      {filteredPromotions.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('PromotionForm')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#8B5CF6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  promoCard: {
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
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoInfo: {
    flex: 1,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  promoName: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  expiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  promoDetails: {
    gap: 8,
  },
  promoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  promoDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default PromotionsScreen;
