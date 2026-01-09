import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Mon Compte',
      items: [
        {
          icon: 'person-circle-outline',
          title: 'Mon profil',
          subtitle: 'Informations personnelles, sécurité',
          color: '#6366F1',
          onPress: () => navigation.navigate('Profile'),
        },
      ],
    },
    {
      title: 'Paramètres du Salon',
      items: [
        {
          icon: 'business-outline',
          title: 'Général',
          subtitle: 'Logo, nom du salon, URL de réservation',
          color: '#8B5CF6',
          onPress: () => navigation.navigate('BusinessSettings'),
        },
        {
          icon: 'card-outline',
          title: 'Facturation',
          subtitle: 'Plan, méthodes de paiement, factures',
          color: '#10B981',
          onPress: () => navigation.navigate('Billing'),
        },
        {
          icon: 'time-outline',
          title: 'Horaires d\'ouverture',
          subtitle: 'Configuration des jours et heures',
          color: '#F59E0B',
          onPress: () => navigation.navigate('BusinessHours'),
        },
        {
          icon: 'people-outline',
          title: 'Staff',
          subtitle: 'Gérer les employés et permissions',
          color: '#3B82F6',
          onPress: () => navigation.navigate('Staff'),
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Email, SMS, Push',
          color: '#EF4444',
          onPress: () => navigation.navigate('Notifications'),
        },
      ],
    },
    {
      title: 'Marketing',
      items: [
        {
          icon: 'pricetag-outline',
          title: 'Promotions',
          subtitle: 'Codes promo et réductions',
          color: '#8B5CF6',
          onPress: () => navigation.navigate('Promotions'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Aide & Support',
          subtitle: 'Centre d\'aide, contactez-nous',
          color: '#6B7280',
          onPress: () => Alert.alert('Info', 'Écran Aide - À implémenter'),
        },
        {
          icon: 'information-circle-outline',
          title: 'À propos',
          subtitle: 'Version, conditions d\'utilisation',
          color: '#6B7280',
          onPress: () => Alert.alert('Info', 'SalonHub Mobile v1.0.0\n\n© 2025 SalonHub. Tous droits réservés.'),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Header */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.first_name?.charAt(0)}
              {user?.last_name?.charAt(0)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'owner' ? 'Propriétaire' : 'Employé'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      {menuSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <MenuItem
              key={itemIndex}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              color={item.color}
              onPress={item.onPress}
              isLast={itemIndex === section.items.length - 1}
            />
          ))}
        </View>
      ))}

      {/* Sign Out Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>Déconnexion</Text>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>SalonHub Mobile v1.0.0</Text>
    </ScrollView>
  );
};

const MenuItem = ({ icon, title, subtitle, color, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#6366F115',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  signOutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    paddingVertical: 24,
  },
});

export default SettingsScreen;
