import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlanDetails } from '../services/stripeService';
import api from '../services/api';

// Note: Le SDK Stripe nécessite un build natif (Expo Dev Build ou EAS Build)
// Cette version fonctionne avec Expo Go en mode "essai sans carte"
const STRIPE_AVAILABLE = false; // Mettre à true après un build natif

const PaymentScreen = ({ route, navigation }) => {
  const { planId, userData } = route.params;
  const [loading, setLoading] = useState(false);

  const plan = getPlanDetails(planId);

  const handleStartTrial = async () => {
    setLoading(true);

    try {
      // Préparer les données pour l'API
      const registerData = {
        // Données du salon
        salon_name: userData.salonName,
        salon_email: userData.salonEmail,
        salon_phone: userData.salonPhone || '',
        salon_address: userData.salonAddress || '',
        salon_city: userData.salonCity || '',
        salon_postal_code: userData.salonPostalCode || '',

        // Données utilisateur
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,

        // Plan d'abonnement
        subscription_plan: userData.plan,
      };

      // Créer le compte
      const response = await api.post('/auth/register', registerData);

      setLoading(false);

      if (response.data.success) {
        Alert.alert(
          'Compte créé!',
          'Votre essai gratuit de 14 jours a commencé. Bienvenue sur SalonHub!',
          [
            {
              text: 'Se connecter',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Erreur',
          response.data.message || 'Une erreur est survenue lors de la création du compte'
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('Erreur inscription:', error);

      // Afficher un message d'erreur plus détaillé
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Une erreur est survenue lors de la création du compte';

      Alert.alert('Erreur', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#6366F1" />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Ionicons name="gift-outline" size={40} color="#6366F1" />
          </View>
          <Text style={styles.title}>Commencer l'essai gratuit</Text>
          <Text style={styles.subtitle}>
            14 jours d'essai gratuit - Aucune carte requise
          </Text>
        </View>

        {/* Plan Récapitulatif */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            {plan.id === 'professional' && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Populaire</Text>
              </View>
            )}
          </View>
          <View style={styles.planPricing}>
            <Text style={styles.planPrice}>{plan.price}€</Text>
            <Text style={styles.planPeriod}>/mois</Text>
          </View>
          <View style={styles.planFeatures}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trial Info */}
        <View style={styles.trialBox}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <View style={styles.trialContent}>
            <Text style={styles.trialTitle}>Essai gratuit de 14 jours</Text>
            <Text style={styles.trialText}>
              Profitez de toutes les fonctionnalités gratuitement pendant 14 jours.
              Aucune carte bancaire requise. Vous pourrez ajouter un moyen de paiement plus tard.
            </Text>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>Pendant votre essai:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureItemText}>Accès complet au plan {plan.name}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureItemText}>Aucune carte bancaire requise</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureItemText}>Annulation à tout moment</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureItemText}>Support par email inclus</Text>
            </View>
          </View>
        </View>

        {/* Start Trial Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleStartTrial}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#fff" />
              <Text style={styles.payButtonText}>
                Commencer mon essai gratuit
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.termsLink}>Conditions d'utilisation</Text> et
          notre <Text style={styles.termsLink}>Politique de confidentialité</Text>
        </Text>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  popularBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  planFeatures: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
  },
  trialBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F1FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  trialContent: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  featuresBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureItemText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  payButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  termsLink: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default PaymentScreen;
