import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api, { API_URL } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { uploadImage } from "../services/imageUpload";

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/me");
      console.log("Profil chargé:", response.data);
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
        setProfileImageUri(userData.avatar_url || null);
        // Update context if needed
        if (updateUser) {
          updateUser(userData);
        }
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      // Fallback to user from context
      if (user) {
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
        });
        setProfileImageUri(user.avatar_url || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Nous avons besoin de votre permission pour accéder à vos photos."
      );
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;

      // Afficher l'image localement immédiatement
      setProfileImageUri(imageUri);

      // Uploader l'image au serveur
      try {
        setSubmitting(true);
        console.log("📤 Upload de l'image...");
        const uploadedUrl = await uploadImage(imageUri, "user-avatar");
        console.log("✅ Image uploadée:", uploadedUrl);

        // Mettre à jour le profil avec la nouvelle URL
        console.log("📝 Mise à jour du profil avec avatar_url:", uploadedUrl);
        const response = await api.put("/auth/profile", {
          avatar_url: uploadedUrl,
        });
        console.log("✅ Profil mis à jour:", response.data);

        // Recharger le profil
        console.log("🔄 Rechargement du profil...");
        await loadProfile();

        Alert.alert("Succès", "Photo de profil mise à jour avec succès");
      } catch (error) {
        console.error("❌ Erreur upload avatar:", error);
        console.error("Détails:", error.response?.data || error.message);

        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Impossible d'uploader la photo de profil";
        Alert.alert("Erreur", errorMessage);

        // Restaurer l'ancienne image en cas d'erreur
        setProfileImageUri(formData.avatar_url || null);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert("Erreur", "Le prénom et le nom sont obligatoires");
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert("Erreur", "L'email est obligatoire");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert("Erreur", "Veuillez entrer un email valide");
      return;
    }

    setSubmitting(true);
    try {
      const profileData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        // avatar_url: profileImageUri, // TODO: Upload image when backend supports it
      };

      await api.put("/auth/profile", profileData);

      // Reload profile to get updated data
      await loadProfile();

      Alert.alert("Succès", "Profil mis à jour avec succès");
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Impossible de mettre à jour le profil";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (
      !passwordData.current_password ||
      !passwordData.new_password ||
      !passwordData.confirm_password
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs du mot de passe");
      return;
    }

    if (passwordData.new_password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le nouveau mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    setSubmitting(true);
    try {
      await api.put("/auth/profile/password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      Alert.alert("Succès", "Mot de passe modifié avec succès");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswordSection(false);
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Impossible de changer le mot de passe";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View style={styles.avatar}>
              {profileImageUri ? (
                <Image
                  source={{
                    uri: API_URL.replace("/api", "") + profileImageUri,
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {formData.first_name?.charAt(0)}
                  {formData.last_name?.charAt(0)}
                </Text>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#6366F1" />
            <Text style={styles.roleText}>
              {user?.role === "owner" ? "Propriétaire" : "Employé"}
            </Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                value={formData.first_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, first_name: text })
                }
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={formData.last_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, last_name: text })
                }
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="+221 XX XXX XX XX"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleUpdateProfile}
            disabled={submitting}
          >
            {submitting && !showPasswordSection ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Enregistrer les modifications
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>

          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <View style={styles.passwordToggleContent}>
              <Ionicons name="lock-closed-outline" size={20} color="#6366F1" />
              <Text style={styles.passwordToggleText}>
                Changer le mot de passe
              </Text>
            </View>
            <Ionicons
              name={showPasswordSection ? "chevron-up" : "chevron-down"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordSection}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mot de passe actuel *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe actuel"
                    value={passwordData.current_password}
                    onChangeText={(text) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: text,
                      })
                    }
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nouveau mot de passe *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 6 caractères"
                    value={passwordData.new_password}
                    onChangeText={(text) =>
                      setPasswordData({ ...passwordData, new_password: text })
                    }
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Confirmer le nouveau mot de passe *
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmez le mot de passe"
                    value={passwordData.confirm_password}
                    onChangeText={(text) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: text,
                      })
                    }
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  styles.submitButtonSecondary,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={submitting}
              >
                {submitting && showPasswordSection ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={20} color="#6366F1" />
                    <Text
                      style={[
                        styles.submitButtonText,
                        styles.submitButtonTextSecondary,
                      ]}
                    >
                      Changer le mot de passe
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "600",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    paddingVertical: 12,
  },
  passwordToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginBottom: 16,
  },
  passwordToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passwordToggleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },
  passwordSection: {
    marginTop: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  submitButtonSecondary: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  submitButtonTextSecondary: {
    color: "#6366F1",
  },
});

export default ProfileScreen;
