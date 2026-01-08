import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RegisterScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Salon information
  const [salonName, setSalonName] = useState("");
  const [salonEmail, setSalonEmail] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [salonPostalCode, setSalonPostalCode] = useState("");

  // Step 2: Account information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: Plan selection
  const [selectedPlan, setSelectedPlan] = useState("professional");

  const plans = [
    {
      id: "essential",
      name: "Essential",
      price: "9,99€",
      features: ["100 clients max", "Réservations en ligne", "Gestion agenda"],
    },
    {
      id: "professional",
      name: "Professional",
      price: "29,99€",
      features: [
        "Clients illimités",
        "Personnel illimité",
        "Statistiques avancées",
      ],
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "69,99€",
      features: [
        "Multi-établissements",
        "API & intégrations",
        "Support prioritaire",
      ],
    },
  ];

  const validateStep1 = () => {
    if (
      !salonName ||
      !salonEmail ||
      !salonPhone ||
      !salonAddress ||
      !salonCity ||
      !salonPostalCode
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs du salon");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(salonEmail)) {
      Alert.alert("Erreur", "Email du salon invalide");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs du compte");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Erreur", "Email invalide");
      return false;
    }
    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    // Au lieu de créer le compte maintenant, on passe à l'écran de paiement
    // Le compte sera créé après le paiement réussi
    const userData = {
      // Salon info
      salonName,
      salonEmail,
      salonPhone,
      salonAddress,
      salonCity,
      salonPostalCode,
      // User info
      firstName,
      lastName,
      email,
      password,
      // Plan
      plan: selectedPlan,
    };

    // Naviguer vers l'écran de paiement avec les données
    navigation.navigate("Payment", {
      planId: selectedPlan,
      userData,
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepItem}>
        <View
          style={[
            styles.stepCircle,
            currentStep >= 1 && styles.stepCircleActive,
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              currentStep >= 1 && styles.stepNumberActive,
            ]}
          >
            1
          </Text>
        </View>
        <Text style={styles.stepLabel}>Salon</Text>
      </View>

      <View
        style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]}
      />

      <View style={styles.stepItem}>
        <View
          style={[
            styles.stepCircle,
            currentStep >= 2 && styles.stepCircleActive,
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              currentStep >= 2 && styles.stepNumberActive,
            ]}
          >
            2
          </Text>
        </View>
        <Text style={styles.stepLabel}>Compte</Text>
      </View>

      <View
        style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]}
      />

      <View style={styles.stepItem}>
        <View
          style={[
            styles.stepCircle,
            currentStep >= 3 && styles.stepCircleActive,
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              currentStep >= 3 && styles.stepNumberActive,
            ]}
          >
            3
          </Text>
        </View>
        <Text style={styles.stepLabel}>Plan</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations du salon</Text>
      <Text style={styles.stepSubtitle}>
        Commencez par nous parler de votre salon
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom du salon</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="business-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Nom de votre salon"
            placeholderTextColor="#9CA3AF"
            value={salonName}
            onChangeText={setSalonName}
            
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email du salon</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="contact@salon.com"
            placeholderTextColor="#9CA3AF"
            value={salonEmail}
            onChangeText={setSalonEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Téléphone</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="call-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="06 12 34 56 78"
            placeholderTextColor="#9CA3AF"
            value={salonPhone}
            onChangeText={setSalonPhone}
            keyboardType="phone-pad"
            
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Adresse</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="location-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="123 Rue de la Paix"
            placeholderTextColor="#9CA3AF"
            value={salonAddress}
            onChangeText={setSalonAddress}
            
          />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Ville</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#9CA3AF"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Paris"
              placeholderTextColor="#9CA3AF"
              value={salonCity}
              onChangeText={setSalonCity}
              
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Code postal</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#9CA3AF"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="75001"
              placeholderTextColor="#9CA3AF"
              value={salonPostalCode}
              onChangeText={setSalonPostalCode}
              keyboardType="numeric"
              
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Créez votre compte</Text>
      <Text style={styles.stepSubtitle}>
        Vos informations personnelles d'accès
      </Text>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Prénom</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#9CA3AF"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Nom</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#9CA3AF"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              
            />
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="votre@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9CA3AF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choisissez votre plan</Text>
      <Text style={styles.stepSubtitle}>
        14 jours d'essai gratuit - Aucune carte requise
      </Text>

      {plans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan === plan.id && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan(plan.id)}
        >
          {plan.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommandé</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}/mois</Text>
            </View>
            <View
              style={[
                styles.radioCircle,
                selectedPlan === plan.id && styles.radioCircleSelected,
              ]}
            >
              {selectedPlan === plan.id && <View style={styles.radioInner} />}
            </View>
          </View>

          <View style={styles.planFeatures}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>Créez votre compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez SalonHub en quelques clics
          </Text>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <View style={styles.formContainer}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                
              >
                <Ionicons name="arrow-back" size={20} color="#6366F1" />
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>
            )}

            {currentStep < 3 ? (
              <TouchableOpacity
                style={[styles.nextButton, currentStep === 1 && { flex: 1 }]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Suivant</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleRegister}
              >
                <Text style={styles.nextButtonText}>Continuer vers le paiement</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 40,
    height: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: "#6366F1",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: "#6366F1",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#1F2937",
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  rowInputs: {
    flexDirection: "row",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#6366F1",
    backgroundColor: "#fff",
  },
  backButtonText: {
    color: "#6366F1",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    borderRadius: 10,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  planCard: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  planCardSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#F0F1FF",
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    color: "#6366F1",
    fontWeight: "600",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#6366F1",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6366F1",
  },
  planFeatures: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#6B7280",
  },
});

export default RegisterScreen;
