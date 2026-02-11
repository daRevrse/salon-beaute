import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import ActionButton from '../components/ActionButton';

const ClientsScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [search, clients]);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    if (!search) {
      setFilteredClients(clients);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.first_name?.toLowerCase().includes(searchLower) ||
        client.last_name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.phone?.includes(search)
    );
    setFilteredClients(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleClientPress = (clientId) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const handleEdit = (client) => {
    navigation.navigate('ClientForm', { clientId: client.id });
  };

  const handleDelete = (client) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${client.first_name} ${client.last_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clients/${client.id}`);
              Alert.alert('Succès', 'Client supprimé');
              loadClients();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le client');
            }
          },
        },
      ]
    );
  };

  const handleViewHistory = (client) => {
    navigation.navigate('ClientHistory', {
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`
    });
  };

  const handleCallClient = (phone) => {
    if (!phone) {
      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
      return;
    }
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone');
        }
      })
      .catch((err) => {
        console.error('Erreur lors de l\'appel:', err);
        Alert.alert('Erreur', 'Impossible d\'appeler ce numéro');
      });
  };

  const handleEmailClient = (email) => {
    if (!email) {
      Alert.alert('Erreur', 'Aucune adresse email disponible');
      return;
    }
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailUrl);
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
        }
      })
      .catch((err) => {
        console.error('Erreur lors de l\'envoi de l\'email:', err);
        Alert.alert('Erreur', 'Impossible d\'envoyer un email');
      });
  };

  const handleWhatsAppClient = (phone) => {
    if (!phone) {
      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
      return;
    }
    // Remove spaces and special characters from phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // WhatsApp URL format: https://wa.me/PHONENUMBER
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
        }
      })
      .catch((err) => {
        console.error('Erreur lors de l\'ouverture de WhatsApp:', err);
        Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderClient = ({ item }) => {
    const isExpanded = expandedClient === item.id;

    return (
      <View style={styles.clientCard}>
        <TouchableOpacity
          style={styles.clientHeader}
          onPress={() => handleClientPress(item.id)}
          activeOpacity={0.7}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.first_name?.charAt(0) || 'C'}
              {item.last_name?.charAt(0) || 'L'}
            </Text>
          </View>

          {/* Client Info */}
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {item.first_name} {item.last_name}
            </Text>
            <View style={styles.clientDetailsRow}>
              {item.email && (
                <View style={styles.infoItem}>
                  <Ionicons name="mail-outline" size={14} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
                </View>
              )}
            </View>
            <View style={styles.clientDetailsRow}>
              {item.phone && (
                <View style={styles.infoItem}>
                  <Ionicons name="call-outline" size={14} color="#6B7280" />
                  <Text style={styles.infoText}>{item.phone}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Expand Icon */}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#9CA3AF"
          />
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Additional Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DATE D'INSCRIPTION</Text>
                <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
              </View>

              {item.date_of_birth && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>DATE DE NAISSANCE</Text>
                  <Text style={styles.detailValue}>{formatDate(item.date_of_birth)}</Text>
                </View>
              )}

              {item.address && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ADRESSE</Text>
                  <Text style={styles.detailValue}>{item.address}</Text>
                </View>
              )}

              {item.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>NOTES</Text>
                  <Text style={styles.detailValue}>{item.notes}</Text>
                </View>
              )}
            </View>

            {/* Contact Actions */}
            <View style={styles.contactActionsContainer}>
              <Text style={styles.contactActionsTitle}>CONTACTER</Text>
              <View style={styles.contactActionsRow}>
                {item.phone && (
                  <>
                    <TouchableOpacity
                      style={styles.contactActionButton}
                      onPress={() => handleCallClient(item.phone)}
                    >
                      <Ionicons name="call" size={20} color="#10B981" />
                      <Text style={styles.contactActionText}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.contactActionButton, styles.whatsappButton]}
                      onPress={() => handleWhatsAppClient(item.phone)}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                      <Text style={styles.contactActionText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.email && (
                  <TouchableOpacity
                    style={styles.contactActionButton}
                    onPress={() => handleEmailClient(item.email)}
                  >
                    <Ionicons name="mail" size={20} color="#6366F1" />
                    <Text style={styles.contactActionText}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <ActionButton
                label="Historique"
                icon="time-outline"
                variant="primary"
                size="sm"
                onPress={() => handleViewHistory(item)}
              />
              <ActionButton
                label="Modifier"
                icon="create-outline"
                variant="primary"
                size="sm"
                onPress={() => handleEdit(item)}
              />
              <ActionButton
                label="Supprimer"
                icon="trash-outline"
                variant="outline"
                size="sm"
                onPress={() => handleDelete(item)}
              />
            </View>
          </View>
        )}
      </View>
    );
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
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ClientForm')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom, email ou téléphone..."
          onClear={handleClearSearch}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color="#6366F1" />
          <Text style={styles.statValue}>{clients.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="search" size={20} color="#10B981" />
          <Text style={styles.statValue}>{filteredClients.length}</Text>
          <Text style={styles.statLabel}>Résultats</Text>
        </View>
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={search ? 'Aucun résultat' : 'Aucun client'}
            description={
              search
                ? `Aucun client ne correspond à "${search}"`
                : "Vous n'avez pas encore ajouté de clients"
            }
            actionLabel={search ? undefined : "Ajouter un client"}
            onActionPress={search ? undefined : () => navigation.navigate('ClientForm')}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  list: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  clientDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  detailsSection: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  contactActionsContainer: {
    marginBottom: 16,
  },
  contactActionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  contactActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  whatsappButton: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  contactActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default ClientsScreen;
