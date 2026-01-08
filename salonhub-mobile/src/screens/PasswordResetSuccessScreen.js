import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

const PasswordResetSuccessScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [loading, setLoading] = useState(false);

  const handleResendEmail = async () => {
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setLoading(false);
      Alert.alert("Succès", "L'email a été renvoyé avec succès");
    } catch (error) {
      setLoading(false);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Une erreur est survenue"
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconBox}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Email envoyé !</Text>

        {/* Message */}
        <Text style={styles.message}>
          Nous avons envoyé un lien de réinitialisation à
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#6366F1"
          />
          <Text style={styles.infoText}>
            Vérifiez également votre dossier spam si vous ne trouvez pas l'email
          </Text>
        </View>

        {/* Back to Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.loginButtonText}>Retour à la connexion</Text>
        </TouchableOpacity>

        {/* Resend Link */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Vous n'avez pas reçu l'email ? </Text>
          <TouchableOpacity onPress={handleResendEmail} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.resendLink}>Renvoyer un email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Timer Info */}
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <Text style={styles.timerText}>
            Le lien expirera dans 1 heure
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconBox: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366F1",
    textAlign: "center",
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F1FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 280,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
  },
  resendLink: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 13,
    color: "#6B7280",
  },
});

export default PasswordResetSuccessScreen;
