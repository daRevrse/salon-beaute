import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const BillingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      // Load subscription info
      const subResponse = await api.get('/billing/subscription');
      if (subResponse.data.success) {
        setSubscription(subResponse.data.data);
      }

      // Load invoices
      const invResponse = await api.get('/billing/invoices');
      if (invResponse.data.success) {
        setInvoices(invResponse.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Aucune information de facturation trouvée');
      } else {
        console.error('Erreur chargement facturation:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (plan) => {
    switch (plan) {
      case 'free':
        return 'Gratuit';
      case 'basic':
        return 'Basique';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Entreprise';
      default:
        return plan;
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free':
        return '#6B7280';
      case 'basic':
        return '#3B82F6';
      case 'premium':
        return '#8B5CF6';
      case 'enterprise':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

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

  const handleUpgrade = () => {
    Alert.alert(
      'Mise à niveau',
      'Contactez notre équipe commerciale pour mettre à niveau votre abonnement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Contacter', onPress: () => console.log('Contact commercial') },
      ]
    );
  };

  const handleDownloadInvoice = (invoice) => {
    Alert.alert('Info', `Téléchargement de la facture ${invoice.invoice_number}...`);
    // TODO: Implement invoice download
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
        <Text style={styles.headerTitle}>Facturation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnement actuel</Text>

          {subscription ? (
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planBadge}>
                  <Ionicons name="star" size={20} color={getPlanColor(subscription.plan)} />
                  <Text style={[styles.planName, { color: getPlanColor(subscription.plan) }]}>
                    Plan {getPlanName(subscription.plan)}
                  </Text>
                </View>
                {subscription.status === 'active' ? (
                  <View style={styles.statusBadge}>
                    <View style={styles.activeIndicator} />
                    <Text style={styles.statusText}>Actif</Text>
                  </View>
                ) : (
                  <View style={styles.inactiveStatusBadge}>
                    <View style={styles.inactiveIndicator} />
                    <Text style={styles.inactiveStatusText}>Inactif</Text>
                  </View>
                )}
              </View>

              <View style={styles.planDetails}>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Montant</Text>
                  <Text style={styles.planDetailValue}>
                    {formatCurrency(subscription.amount || 0)} FCFA/mois
                  </Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Date de début</Text>
                  <Text style={styles.planDetailValue}>{formatDate(subscription.start_date)}</Text>
                </View>
                {subscription.end_date && (
                  <View style={styles.planDetailRow}>
                    <Text style={styles.planDetailLabel}>Prochaine facturation</Text>
                    <Text style={styles.planDetailValue}>{formatDate(subscription.end_date)}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
                <Text style={styles.upgradeButtonText}>Mettre à niveau</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noPlanCard}>
              <Ionicons name="card-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noPlanText}>Aucun abonnement actif</Text>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>Choisir un plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>

          <View style={styles.paymentCard}>
            <View style={styles.paymentMethod}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="card" size={24} color="#6366F1" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardType}>Carte bancaire</Text>
                <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addPaymentButton}>
              <Ionicons name="add-circle-outline" size={20} color="#6366F1" />
              <Text style={styles.addPaymentText}>Ajouter une méthode de paiement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invoices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique de facturation</Text>

          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <View key={invoice.id} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                    <Text style={styles.invoiceDate}>{formatDate(invoice.created_at)}</Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>
                      {formatCurrency(invoice.amount)} FCFA
                    </Text>
                    <View
                      style={[
                        styles.invoiceStatusBadge,
                        invoice.status === 'paid' && styles.paidBadge,
                        invoice.status === 'pending' && styles.pendingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.invoiceStatusText,
                          invoice.status === 'paid' && styles.paidText,
                          invoice.status === 'pending' && styles.pendingText,
                        ]}
                      >
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownloadInvoice(invoice)}
                >
                  <Ionicons name="download-outline" size={18} color="#6366F1" />
                  <Text style={styles.downloadText}>Télécharger PDF</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyInvoices}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune facture</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  inactiveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inactiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  inactiveStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  planDetails: {
    gap: 12,
    marginBottom: 16,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  planDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  noPlanText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 13,
    color: '#6B7280',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  invoiceStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  invoiceStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paidText: {
    color: '#10B981',
  },
  pendingText: {
    color: '#F59E0B',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  emptyInvoices: {
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
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default BillingScreen;
