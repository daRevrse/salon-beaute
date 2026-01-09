import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api, { API_URL } from "../services/api";
import FilterButton from "../components/FilterButton";
import ActionButton from "../components/ActionButton";
import EmptyState from "../components/EmptyState";

const ServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [selectedCategory, services]);

  const loadServices = async () => {
    try {
      const response = await api.get("/services");
      console.log("Services chargés:", response.data);
      if (response.data.success) {
        const servicesData = response.data.data;
        setServices(servicesData);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(servicesData.map((s) => s.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Erreur chargement services:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterServices = () => {
    if (selectedCategory === "all") {
      setFilteredServices(services);
    } else {
      setFilteredServices(
        services.filter((s) => s.category === selectedCategory)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const getCategoryCounts = () => {
    const counts = {
      all: services.length,
    };

    categories.forEach((category) => {
      counts[category] = services.filter((s) => s.category === category).length;
    });

    return counts;
  };

  const handleEdit = (service) => {
    navigation.navigate("ServiceForm", { serviceId: service.id });
  };

  const handleDelete = (service) => {
    Alert.alert(
      "Confirmer la suppression",
      `Êtes-vous sûr de vouloir supprimer "${service.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/services/${service.id}`);
              Alert.alert("Succès", "Service supprimé");
              loadServices();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le service");
            }
          },
        },
      ]
    );
  };

  const renderService = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.8}
    >
      {/* Service Image */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: API_URL.replace("/api", "") + item.image_url }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cut" size={32} color="#D1D5DB" />
          </View>
        )}
        {/* Status Badge Overlay */}
        <View style={styles.statusOverlay}>
          {item.is_active ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeIndicator} />
              <Text style={styles.activeText}>Actif</Text>
            </View>
          ) : (
            <View style={styles.inactiveBadge}>
              <View style={styles.inactiveIndicator} />
              <Text style={styles.inactiveText}>Inactif</Text>
            </View>
          )}
        </View>
      </View>

      {/* Service Content */}
      <View style={styles.serviceContent}>
        {/* Header */}
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Price & Duration */}
        <View style={styles.serviceInfo}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix</Text>
            <Text style={styles.price}>{item.price} FCFA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Durée</Text>
            <Text style={styles.duration}>{item.duration} min</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionButtonDanger]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const categoryCounts = getCategoryCounts();

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("ServiceForm")}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterButton
            label="Tous"
            active={selectedCategory === "all"}
            count={categoryCounts.all}
            onPress={() => setSelectedCategory("all")}
          />
          {categories.map((category) => (
            <FilterButton
              key={category}
              label={category}
              active={selectedCategory === category}
              count={categoryCounts[category]}
              onPress={() => setSelectedCategory(category)}
              color="#8B5CF6"
            />
          ))}
        </ScrollView>
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cut-outline"
            title="Aucun service"
            description={
              selectedCategory === "all"
                ? "Vous n'avez pas encore créé de services"
                : `Aucun service dans la catégorie "${selectedCategory}"`
            }
            actionLabel="Créer un service"
            onActionPress={() => navigation.navigate("ServiceForm")}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: {
    padding: 12,
  },
  row: {
    justifyContent: "space-between",
  },
  serviceCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    maxWidth: "48%",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  statusOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  serviceContent: {
    padding: 14,
    gap: 10,
  },
  serviceHeader: {
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 20,
  },
  categoryBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  priceContainer: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
  },
  durationContainer: {
    flex: 1,
    alignItems: "center",
  },
  durationLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  duration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
  },
  inactiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  inactiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EF4444",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickActionButtonDanger: {
    backgroundColor: "#FEF2F2",
  },
});

export default ServicesScreen;
