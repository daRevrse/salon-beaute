import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Dimensions,
  Animated,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { useGoogleAuth, getPlatform } from "../services/googleAuthService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Onboarding showcase slides
// ─────────────────────────────────────────────
const SHOWCASE_SLIDES = [
  {
    id: "welcome",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    tagline: "SalonHub",
    headline: "Votre salon,\nvotre empire.",
    description:
      "La plateforme tout-en-un qui transforme la gestion de votre salon de beauté.",
    accent: "Essai gratuit 14 jours",
  },
  {
    id: "agenda",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    tagline: "Agenda intelligent",
    headline: "Fini le chaos\ndes rendez-vous.",
    description:
      "Planifiez, confirmez et suivez chaque rendez-vous. Vos clients reçoivent des rappels automatiques.",
    stats: [
      { value: "-70%", label: "de no-shows" },
      { value: "2x", label: "plus rapide" },
    ],
  },
  {
    id: "clients",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80",
    tagline: "Croissance client",
    headline: "Chaque client\ncompte.",
    description:
      "Historique complet, préférences, fidélisation. Construisez des relations durables avec votre clientèle.",
    stats: [
      { value: "+45%", label: "de rétention" },
      { value: "100%", label: "d'historique" },
    ],
  },
];

// ─────────────────────────────────────────────
// Form input helper (outside component to prevent re-mount on re-render)
// ─────────────────────────────────────────────
const FormInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  autoCapitalize = "sentences",
  onToggleSecure,
  showToggle,
}) => (
  <View style={styles.inputWrapper}>
    <Ionicons name={icon} size={18} color="#9CA3AF" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#B0B7C3"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
    />
    {onToggleSecure !== undefined && (
      <TouchableOpacity onPress={onToggleSecure} style={styles.eyeButton}>
        <Ionicons
          name={showToggle ? "eye-outline" : "eye-off-outline"}
          size={18}
          color="#9CA3AF"
        />
      </TouchableOpacity>
    )}
  </View>
);

const OnboardingScreen = ({ navigation, route }) => {
  const { signIn, registerWithGoogle } = useAuth();
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Google auth data passed from LoginScreen
  const googleUser = route?.params?.googleUser || null;
  const googleIdToken = route?.params?.idToken || null;
  const isGoogleFlow = !!googleUser;

  // Current phase: "showcase" (slides 0-2), "salon" (step 4), "account" (step 5)
  const [phase, setPhase] = useState(isGoogleFlow ? "salon" : "showcase");
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Salon form
  const [salonName, setSalonName] = useState("");
  const [salonEmail, setSalonEmail] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [salonPostalCode, setSalonPostalCode] = useState("");

  // Account form - pre-fill from Google if available
  const [firstName, setFirstName] = useState(googleUser?.first_name || "");
  const [lastName, setLastName] = useState(googleUser?.last_name || "");
  const [email, setEmail] = useState(googleUser?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  // Google auth hook (for showcase phase)
  const { request: googleRequest, response: googleResponse, promptAsync: googlePromptAsync } = useGoogleAuth();
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google OAuth response from showcase
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      if (id_token) {
        handleGoogleFromShowcase(id_token);
      }
    } else if (googleResponse?.type === "error" || googleResponse?.type === "dismiss") {
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleFromShowcase = async (idToken) => {
    setGoogleLoading(true);
    const result = await signInWithGoogle(idToken, getPlatform());
    setGoogleLoading(false);

    if (result.success) return; // Logged in, navigation auto

    if (result.needsRegistration) {
      // Pre-fill and go to salon phase
      setFirstName(result.googleUser.first_name || "");
      setLastName(result.googleUser.last_name || "");
      setEmail(result.googleUser.email || "");
      // Store idToken in a ref-like way via route params simulation
      navigation.setParams({ googleUser: result.googleUser, idToken });
      transitionTo("salon");
      return;
    }

    Alert.alert("Erreur", result.error || "Erreur de connexion Google");
  };

  // Animated values for phase transitions
  const phaseOpacity = useRef(new Animated.Value(1)).current;

  const plans = [
    {
      id: "essential",
      name: "Essential",
      price: "3,99",
      period: "/mois",
      icon: "flash-outline",
      features: [
        "Rendez-vous illimités",
        "1 utilisateur",
        "Page de réservation",
        "Support email",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "9,99",
      period: "/mois",
      icon: "star-outline",
      features: [
        "3 utilisateurs",
        "Statistiques avancées",
        "Paiement en ligne",
        "Rappels automatiques",
      ],
      recommended: true,
    },
    {
      id: "custom",
      name: "Sur mesure",
      price: null,
      period: "",
      icon: "diamond-outline",
      features: [
        "Utilisateurs illimités",
        "Multi-salons",
        "Support prioritaire",
        "API & intégrations",
      ],
      isCustom: true,
    },
  ];

  // ─────────────────────────────────────────────
  // Phase transitions
  // ─────────────────────────────────────────────
  const transitionTo = useCallback(
    (nextPhase) => {
      Animated.timing(phaseOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setPhase(nextPhase);
        Animated.timing(phaseOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    },
    [phaseOpacity]
  );

  const handleShowcaseNext = useCallback(() => {
    if (showcaseIndex < SHOWCASE_SLIDES.length - 1) {
      const nextIndex = showcaseIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setShowcaseIndex(nextIndex);
    } else {
      transitionTo("salon");
    }
  }, [showcaseIndex, transitionTo]);

  const handleShowcaseSkip = useCallback(() => {
    transitionTo("salon");
  }, [transitionTo]);

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  const validateSalon = () => {
    if (!salonName || !salonEmail || !salonPhone) {
      Alert.alert("Champs requis", "Le nom, email et téléphone du salon sont obligatoires.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(salonEmail)) {
      Alert.alert("Email invalide", "Veuillez entrer un email valide pour le salon.");
      return false;
    }
    return true;
  };

  const validateAccount = () => {
    if (!firstName || !lastName || !email) {
      Alert.alert("Champs requis", "Veuillez remplir le prénom, nom et email.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Email invalide", "Veuillez entrer un email valide.");
      return false;
    }
    // Skip password validation for Google flow
    if (!isGoogleFlow && !route?.params?.googleUser) {
      if (!password || !confirmPassword) {
        Alert.alert("Champs requis", "Veuillez remplir le mot de passe.");
        return false;
      }
      if (password.length < 6) {
        Alert.alert("Mot de passe", "Le mot de passe doit contenir au moins 6 caractères.");
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert("Mot de passe", "Les mots de passe ne correspondent pas.");
        return false;
      }
    }
    return true;
  };

  const handleSalonNext = () => {
    if (validateSalon()) {
      transitionTo("account");
    }
  };

  // ─────────────────────────────────────────────
  // Registration + auto-login
  // ─────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validateAccount()) return;

    const currentGoogleUser = route?.params?.googleUser || googleUser;
    const currentIdToken = route?.params?.idToken || googleIdToken;
    const currentIsGoogle = !!currentGoogleUser;

    setLoading(true);
    try {
      if (currentIsGoogle && currentIdToken) {
        // Google registration flow
        const salonData = {
          salon_name: salonName,
          salon_email: salonEmail,
          salon_phone: salonPhone || "",
          salon_address: salonAddress || "",
          salon_city: salonCity || "",
          salon_postal_code: salonPostalCode || "",
          subscription_plan: selectedPlan,
        };

        const result = await registerWithGoogle(currentIdToken, salonData, getPlatform());

        await SecureStore.setItemAsync("onboardingSeen", "true");

        if (!result.success) {
          Alert.alert("Erreur", result.error || "Une erreur est survenue.");
        }
      } else {
        // Standard email/password registration
        const registerData = {
          salon_name: salonName,
          salon_email: salonEmail,
          salon_phone: salonPhone || "",
          salon_address: salonAddress || "",
          salon_city: salonCity || "",
          salon_postal_code: salonPostalCode || "",
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          subscription_plan: selectedPlan,
        };

        const response = await api.post("/auth/register", registerData);

        if (response.data.success) {
          await SecureStore.setItemAsync("onboardingSeen", "true");

          const loginResult = await signIn(email, password);
          if (!loginResult.success) {
            Alert.alert(
              "Compte créé !",
              "Votre essai gratuit de 14 jours a commencé. Connectez-vous pour commencer.",
              [{ text: "Se connecter", onPress: () => navigation.navigate("Login") }]
            );
          }
        } else {
          Alert.alert(
            "Erreur",
            response.data.message || "Une erreur est survenue."
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Une erreur est survenue lors de la création du compte.";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Showcase slide renderer
  // ─────────────────────────────────────────────
  const renderShowcaseSlide = useCallback(
    ({ item, index }) => (
      <View style={styles.slideContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.slideImage}
          resizeMode="cover"
        />
        {/* Dark scrim from bottom */}
        <View style={styles.slideScrim} />

        {/* Content overlaid at bottom */}
        <View style={styles.slideContent}>
          {/* Tagline pill */}
          <View style={styles.taglinePill}>
            <Text style={styles.taglineText}>{item.tagline}</Text>
          </View>

          <Text style={styles.slideHeadline}>{item.headline}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>

          {/* Stats row */}
          {item.stats && (
            <View style={styles.statsRow}>
              {item.stats.map((stat, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Accent badge for first slide */}
          {item.accent && (
            <View style={styles.accentBadge}>
              <Ionicons name="gift-outline" size={16} color="#fff" />
              <Text style={styles.accentText}>{item.accent}</Text>
            </View>
          )}
        </View>
      </View>
    ),
    []
  );

  // ─────────────────────────────────────────────
  // Pagination dots
  // ─────────────────────────────────────────────
  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SHOWCASE_SLIDES.map((_, i) => {
        const inputRange = [
          (i - 1) * SCREEN_WIDTH,
          i * SCREEN_WIDTH,
          (i + 1) * SCREEN_WIDTH,
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: "clamp",
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { width: dotWidth, opacity: dotOpacity },
            ]}
          />
        );
      })}
    </View>
  );

  // ─────────────────────────────────────────────
  // PHASE: Showcase (slides 1-3)
  // ─────────────────────────────────────────────
  if (phase === "showcase") {
    return (
      <Animated.View style={[styles.showcaseContainer, { opacity: phaseOpacity }]}>
        <StatusBar barStyle="light-content" />

        <FlatList
          ref={flatListRef}
          data={SHOWCASE_SLIDES}
          renderItem={renderShowcaseSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setShowcaseIndex(idx);
          }}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Bottom controls */}
        <View style={styles.showcaseControls}>
          {renderDots()}

          <View style={styles.showcaseButtons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleShowcaseSkip}
            >
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextShowcaseButton}
              onPress={handleShowcaseNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextShowcaseText}>
                {showcaseIndex === SHOWCASE_SLIDES.length - 1
                  ? "Commencer"
                  : "Suivant"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.showcaseGoogleButton}
            onPress={() => {
              if (googleRequest) {
                setGoogleLoading(true);
                googlePromptAsync();
              }
            }}
            disabled={googleLoading || !googleRequest}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1F2937" size="small" />
            ) : (
              <>
                <Image
                  source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                  style={styles.showcaseGoogleIcon}
                />
                <Text style={styles.showcaseGoogleText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity
            style={styles.showcaseLoginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.showcaseLoginText}>
              Déjà un compte ?{" "}
              <Text style={styles.showcaseLoginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: Salon info
  // ─────────────────────────────────────────────
  if (phase === "salon") {
    return (
      <Animated.View style={[styles.formPhase, { opacity: phaseOpacity }]}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress indicator */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "50%" }]} />
            </View>

            {/* Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity
                onPress={() => transitionTo("showcase")}
                style={styles.formBackButton}
              >
                <Ionicons name="arrow-back" size={22} color="#1F2937" />
              </TouchableOpacity>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1 / 2</Text>
              </View>
            </View>

            {/* Hero section */}
            <View style={styles.formHeroSection}>
              <View style={styles.formIconCircle}>
                <Ionicons name="business" size={28} color="#6366F1" />
              </View>
              <Text style={styles.formTitle}>Parlez-nous de{"\n"}votre salon</Text>
              <Text style={styles.formSubtitle}>
                Ces informations nous aident à configurer votre espace.
              </Text>
            </View>

            {/* Form fields */}
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Nom du salon *</Text>
              <FormInput
                icon="storefront-outline"
                placeholder="Ex: Salon Élégance"
                value={salonName}
                onChangeText={setSalonName}
              />

              <Text style={styles.fieldLabel}>Email du salon *</Text>
              <FormInput
                icon="mail-outline"
                placeholder="contact@votresalon.com"
                value={salonEmail}
                onChangeText={setSalonEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Téléphone *</Text>
              <FormInput
                icon="call-outline"
                placeholder="+221 77 123 45 67"
                value={salonPhone}
                onChangeText={setSalonPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Adresse</Text>
              <FormInput
                icon="location-outline"
                placeholder="Rue et numéro"
                value={salonAddress}
                onChangeText={setSalonAddress}
              />

              <View style={styles.rowFields}>
                <View style={styles.rowFieldLeft}>
                  <Text style={styles.fieldLabel}>Ville</Text>
                  <FormInput
                    icon="navigate-outline"
                    placeholder="Dakar"
                    value={salonCity}
                    onChangeText={setSalonCity}
                  />
                </View>
                <View style={styles.rowFieldPostal}>
                  <Text style={styles.fieldLabel}>Code postal</Text>
                  <FormInput
                    icon="keypad-outline"
                    placeholder="10000"
                    value={salonPostalCode}
                    onChangeText={setSalonPostalCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.primaryCTA}
              onPress={handleSalonNext}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryCTAText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkText}>Déjà inscrit ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLinkBold}>Se connecter</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: Account + Plan selection
  // ─────────────────────────────────────────────
  return (
    <Animated.View style={[styles.formPhase, { opacity: phaseOpacity }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress indicator */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>

          {/* Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity
              onPress={() => transitionTo("salon")}
              style={styles.formBackButton}
            >
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2 / 2</Text>
            </View>
          </View>

          {/* Hero section */}
          <View style={styles.formHeroSection}>
            <View style={styles.formIconCircle}>
              <Ionicons name="person-add" size={28} color="#6366F1" />
            </View>
            <Text style={styles.formTitle}>Créez votre{"\n"}compte</Text>
            <Text style={styles.formSubtitle}>
              Dernière étape avant de lancer votre essai gratuit.
            </Text>
          </View>

          {/* Account form */}
          <View style={styles.formCard}>
            <View style={styles.rowFields}>
              <View style={styles.rowFieldLeft}>
                <Text style={styles.fieldLabel}>Prénom *</Text>
                <FormInput
                  icon="person-outline"
                  placeholder="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.rowFieldRight}>
                <Text style={styles.fieldLabel}>Nom *</Text>
                <FormInput
                  icon="person-outline"
                  placeholder="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Email *</Text>
            {(isGoogleFlow || route?.params?.googleUser) ? (
              <View style={[styles.inputWrapper, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <Text style={[styles.input, { lineHeight: 44, color: '#6B7280' }]}>{email}</Text>
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              </View>
            ) : (
              <FormInput
                icon="mail-outline"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}

            {/* Password fields - hidden for Google flow */}
            {!(isGoogleFlow || route?.params?.googleUser) && (
              <>
                <Text style={styles.fieldLabel}>Mot de passe *</Text>
                <FormInput
                  icon="lock-closed-outline"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onToggleSecure={() => setShowPassword(!showPassword)}
                  showToggle={showPassword}
                />

                <Text style={styles.fieldLabel}>Confirmer *</Text>
                <FormInput
                  icon="lock-closed-outline"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
                  showToggle={showConfirmPassword}
                />
              </>
            )}

            {/* Google account indicator */}
            {(isGoogleFlow || route?.params?.googleUser) && (
              <View style={styles.googleIndicator}>
                <Image
                  source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                  style={{ width: 16, height: 16, marginRight: 8 }}
                />
                <Text style={{ fontSize: 13, color: '#6B7280' }}>
                  Inscription via Google — pas de mot de passe requis
                </Text>
              </View>
            )}
          </View>

          {/* Plan selection */}
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>Choisissez votre plan</Text>
            <View style={styles.planTrialBadge}>
              <Ionicons name="time-outline" size={14} color="#6366F1" />
              <Text style={styles.planTrialText}>
                14 jours gratuits — aucune carte requise
              </Text>
            </View>

            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.7}
                >
                  {plan.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Populaire</Text>
                    </View>
                  )}

                  <View style={styles.planCardHeader}>
                    <View
                      style={[
                        styles.planIconCircle,
                        isSelected && styles.planIconCircleSelected,
                      ]}
                    >
                      <Ionicons
                        name={plan.icon}
                        size={20}
                        color={isSelected ? "#fff" : "#6366F1"}
                      />
                    </View>
                    <View style={styles.rowFieldRight}>
                      <Text
                        style={[
                          styles.planName,
                          isSelected && styles.planNameSelected,
                        ]}
                      >
                        {plan.name}
                      </Text>
                      <Text style={styles.planPriceRow}>
                        {plan.isCustom ? (
                          <Text style={[styles.planPrice, { fontSize: 16 }]}>Contactez-nous</Text>
                        ) : (
                          <>
                            <Text style={styles.planPrice}>{plan.price}€</Text>
                            <Text style={styles.planPeriod}>{plan.period}</Text>
                          </>
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  {isSelected && (
                    <View style={styles.planFeaturesExpanded}>
                      {plan.features.map((f, i) => (
                        <View key={i} style={styles.planFeatureRow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#10B981"
                          />
                          <Text style={styles.planFeatureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[styles.primaryCTA, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={styles.primaryCTAText}>
                  Lancer mon essai gratuit
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            En créant un compte, vous acceptez nos{" "}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text> et
            notre{" "}
            <Text style={styles.termsLink}>Politique de confidentialité</Text>.
          </Text>

          <View style={styles.loginLinkRow}>
            <Text style={styles.loginLinkText}>Déjà inscrit ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLinkBold}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

// ───────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Showcase ──────────────────────────────────
  showcaseContainer: {
    flex: 1,
    backgroundColor: "#0B0B0F",
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  slideScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    // Stronger at bottom for text readability
  },
  slideContent: {
    position: "absolute",
    bottom: 200,
    left: 24,
    right: 24,
  },
  taglinePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(99,102,241,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  taglineText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  slideHeadline: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideDescription: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 4,
  },
  statItem: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  accentBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
  },
  accentText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Showcase controls ─────────────────────────
  showcaseControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 32,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  showcaseButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
  },
  nextShowcaseButton: {
    flex: 2,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#6366F1",
    gap: 8,
  },
  nextShowcaseText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  showcaseLoginLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  showcaseLoginText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  showcaseLoginBold: {
    color: "#fff",
    fontWeight: "700",
  },
  showcaseGoogleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 48,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  showcaseGoogleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  showcaseGoogleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  googleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F0F0FF",
    borderRadius: 8,
  },

  // ── Form phases ───────────────────────────────
  formPhase: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: Platform.OS === "ios" ? 60 : 44,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  formBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepBadgeText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Form hero ─────────────────────────────────
  formHeroSection: {
    marginBottom: 24,
  },
  formIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 36,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },

  // ── Form card ─────────────────────────────────
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FAFBFC",
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    height: "100%",
  },
  eyeButton: {
    padding: 4,
    marginLeft: 4,
  },
  rowFields: {
    flexDirection: "row",
  },
  rowFieldLeft: {
    flex: 1,
    marginRight: 10,
  },
  rowFieldRight: {
    flex: 1,
  },
  rowFieldPostal: {
    flex: 0.6,
  },

  // ── Primary CTA ───────────────────────────────
  primaryCTA: {
    backgroundColor: "#6366F1",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryCTAText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Login link ────────────────────────────────
  loginLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLinkBold: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "700",
  },

  // ── Terms ─────────────────────────────────────
  termsText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  termsLink: {
    color: "#6366F1",
    fontWeight: "600",
  },

  // ── Plan section ──────────────────────────────
  planSection: {
    marginBottom: 24,
  },
  planSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  planTrialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  planTrialText: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#FAFAFF",
  },
  recommendedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  recommendedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  planIconCircleSelected: {
    backgroundColor: "#6366F1",
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  planNameSelected: {
    color: "#6366F1",
  },
  planPriceRow: {
    fontSize: 14,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  planPeriod: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#6366F1",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6366F1",
  },
  planFeaturesExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2FF",
    gap: 8,
  },
  planFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planFeatureText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default OnboardingScreen;
