/**
 * Restaurant Menus Management
 * Bistro Chic Edition - Rich, Warm & Elegant
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { getImageUrl } from "../../utils/imageUtils";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FireIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon,
  PhotoIcon,
  CakeIcon,
  BeakerIcon,
  GiftIcon,
  HeartIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

// Category icons using Heroicons components
const CategoryIcon = ({ category, className = "h-5 w-5" }) => {
  const icons = {
    "Entrées": <SparklesIcon className={className} />,
    "Plats principaux": <BuildingStorefrontIcon className={className} />,
    "Desserts": <CakeIcon className={className} />,
    "Boissons": <BeakerIcon className={className} />,
    "Vins": <BeakerIcon className={className} />,
    "Cocktails": <BeakerIcon className={className} />,
    "Apéritifs": <BeakerIcon className={className} />,
    "Accompagnements": <Squares2X2Icon className={className} />,
    "Menus enfants": <GiftIcon className={className} />,
    "Spécialités": <StarIcon className={className} />,
    "Autres": <BuildingStorefrontIcon className={className} />,
  };
  return icons[category] || <BuildingStorefrontIcon className={className} />;
};

const Menus = () => {
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    preparation_time: 15,
    calories: "",
    allergens: "",
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_spicy: false,
    is_featured: false,
    is_available: true,
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Catégories prédéfinies
  const categories = [
    "Entrées",
    "Plats principaux",
    "Desserts",
    "Boissons",
    "Vins",
    "Cocktails",
    "Apéritifs",
    "Accompagnements",
    "Menus enfants",
    "Spécialités",
  ];

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/restaurant/menus");
      setMenuItems(response.data.data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      showToast("Erreur lors du chargement du menu", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time) || 15,
        calories: formData.calories ? parseInt(formData.calories) : null,
        image_url: imageUrl,
      };

      if (editingItem) {
        await api.put(`/restaurant/menus/${editingItem.id}`, payload);
        showToast("Plat mis à jour avec succès");
      } else {
        await api.post("/restaurant/menus", payload);
        showToast("Plat ajouté au menu avec succès");
      }
      setShowModal(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error("Error saving menu item:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/restaurant/menus/${confirmDelete.id}`);
      showToast("Plat supprimé du menu");
      setConfirmDelete(null);
      fetchMenuItems();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await api.patch(`/restaurant/menus/${item.id}/availability`, {
        is_available: !item.is_available,
      });
      showToast(`"${item.name}" ${item.is_available ? "retiré du menu" : "disponible"}`);
      fetchMenuItems();
    } catch (error) {
      console.error("Error toggling availability:", error);
      showToast("Erreur lors du changement de disponibilité", "error");
    }
  };

  const toggleFeatured = async (item) => {
    try {
      await api.patch(`/restaurant/menus/${item.id}/featured`, {
        is_featured: !item.is_featured,
      });
      showToast(`"${item.name}" ${item.is_featured ? "retiré des" : "ajouté aux"} favoris`);
      fetchMenuItems();
    } catch (error) {
      console.error("Error toggling featured:", error);
      showToast("Erreur lors du changement", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      preparation_time: 15,
      calories: "",
      allergens: "",
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_spicy: false,
      is_featured: false,
      is_available: true,
      image_url: "",
    });
    setEditingItem(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formDataUpload = new FormData();
    formDataUpload.append("image", imageFile);
    formDataUpload.append("type", "menu");

    try {
      setUploadingImage(true);
      const response = await api.post("/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.url || response.data.path;
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Erreur lors du téléchargement de l'image", "error");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      price: item.price.toString(),
      preparation_time: item.preparation_time || 15,
      calories: item.calories ? item.calories.toString() : "",
      allergens: item.allergens || "",
      is_vegetarian: item.is_vegetarian || false,
      is_vegan: item.is_vegan || false,
      is_gluten_free: item.is_gluten_free || false,
      is_spicy: item.is_spicy || false,
      is_featured: item.is_featured || false,
      is_available: item.is_available !== false,
      image_url: item.image_url || "",
    });
    setImagePreview(item.image_url ? getImageUrl(item.image_url) : null);
    setImageFile(null);
    setShowModal(true);
  };

  // Filtered items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "available" && item.is_available) ||
      (filterStatus === "unavailable" && !item.is_available) ||
      (filterStatus === "featured" && item.is_featured);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const uniqueCategories = [...new Set(menuItems.map((i) => i.category).filter(Boolean))];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BuildingStorefrontIcon className="h-8 w-8 text-amber-200" />
                <h1 className="text-2xl font-bold text-white">La Carte</h1>
              </div>
              <p className="text-amber-100/80">
                {menuItems.length} plat{menuItems.length > 1 ? "s" : ""} •{" "}
                <span className="text-emerald-300">{menuItems.filter((i) => i.is_available).length} disponible{menuItems.filter((i) => i.is_available).length > 1 ? "s" : ""}</span>
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <StarIconSolid className="h-4 w-4 text-amber-300" />
                  <span className="text-white text-sm">{menuItems.filter(i => i.is_featured).length} Favoris</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <HeartIcon className="h-4 w-4 text-emerald-300" />
                  <span className="text-white text-sm">{menuItems.filter(i => i.is_vegetarian || i.is_vegan).length} Végétariens</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white text-amber-800 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Nouveau Plat
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un plat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Toutes les catégories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Tous les statuts</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">Indisponibles</option>
              <option value="featured">Favoris</option>
            </select>

            {/* View mode toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-amber-700"
                }`}
                title="Vue grille"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-amber-700"
                }`}
                title="Vue liste"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items Display */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          </div>
        ) : Object.keys(itemsByCategory).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingStorefrontIcon className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucun plat trouvé</h3>
            <p className="text-slate-500 mb-4">Ajoutez votre premier plat au menu</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              Ajouter un plat
            </button>
          </div>
        ) : (
          Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <CategoryIcon category={category} className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">{category}</h2>
                <span className="bg-amber-100 text-amber-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {items.length}
                </span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Grid View */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`group bg-white rounded-2xl shadow-soft border-2 overflow-hidden transition-all hover:shadow-soft-lg ${
                        item.is_available ? "border-slate-200 hover:border-amber-300" : "border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Card Header with Image or Gradient */}
                      <div className="relative h-36 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CategoryIcon category={item.category} className="h-16 w-16 text-amber-300/50" />
                          </div>
                        )}

                        {/* Featured Badge */}
                        {item.is_featured && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            <StarIconSolid className="h-3 w-3" />
                            Favori
                          </div>
                        )}

                        {/* Spicy Badge */}
                        {item.is_spicy && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full">
                            <FireIcon className="h-3.5 w-3.5" />
                          </div>
                        )}

                        {/* Price Tag */}
                        <div className="absolute bottom-0 right-0 bg-amber-800/90 text-white font-bold px-3 py-1.5 rounded-tl-xl">
                          {formatPrice(item.price)}
                        </div>

                        {/* Availability Overlay */}
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1.5 rounded-full font-medium text-sm">
                              Indisponible
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-slate-500 text-sm line-clamp-2 mb-3">{item.description}</p>
                        )}

                        {/* Dietary Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.is_vegetarian && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <HeartIcon className="h-3 w-3" /> Végétarien
                            </span>
                          )}
                          {item.is_vegan && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <SparklesIcon className="h-3 w-3" /> Vegan
                            </span>
                          )}
                          {item.is_gluten_free && (
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              Sans gluten
                            </span>
                          )}
                          {item.allergens && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              <ExclamationTriangleIcon className="h-3 w-3" /> Allergènes
                            </span>
                          )}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" /> {item.preparation_time || 15} min
                          </span>
                          {item.calories && (
                            <span className="flex items-center gap-1">
                              <FireIcon className="h-3.5 w-3.5" /> {item.calories} kcal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between">
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleFeatured(item)}
                            className={`p-2 rounded-lg transition-colors ${
                              item.is_featured ? "text-amber-600 bg-amber-100" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title={item.is_featured ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            {item.is_featured ? <StarIconSolid className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => toggleAvailability(item)}
                            className={`p-2 rounded-lg transition-colors ${
                              item.is_available ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-emerald-600 bg-emerald-50"
                            }`}
                            title={item.is_available ? "Marquer indisponible" : "Marquer disponible"}
                          >
                            {item.is_available ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(item)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`group bg-white rounded-xl shadow-soft border-l-4 overflow-hidden transition-all hover:shadow-soft-lg ${
                        item.is_available ? "border-l-amber-500" : "border-l-slate-300 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 p-3">
                        {/* Image/Icon */}
                        <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <CategoryIcon category={item.category} className="h-6 w-6 text-amber-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-800">{item.name}</h3>
                            {item.is_featured && (
                              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                <StarIconSolid className="h-3 w-3" /> Favori
                              </span>
                            )}
                            {item.is_spicy && <FireIcon className="h-4 w-4 text-red-500" />}
                            {item.is_vegetarian && <HeartIcon className="h-4 w-4 text-emerald-500" />}
                          </div>
                          {item.description && (
                            <p className="text-slate-500 text-sm truncate mt-0.5">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><ClockIcon className="h-3 w-3" /> {item.preparation_time || 15} min</span>
                            {item.calories && <span className="flex items-center gap-1"><FireIcon className="h-3 w-3" /> {item.calories} kcal</span>}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right px-3">
                          <span className="text-lg font-bold text-amber-600">{formatPrice(item.price)}</span>
                          <span className={`block text-xs font-medium ${item.is_available ? "text-emerald-600" : "text-red-500"}`}>
                            {item.is_available ? "Disponible" : "Indisponible"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleFeatured(item)} className={`p-2 rounded-lg transition-colors ${item.is_featured ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"}`}>
                            {item.is_featured ? <StarIconSolid className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />}
                          </button>
                          <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {editingItem ? <PencilSquareIcon className="h-6 w-6 text-amber-600" /> : <PlusIcon className="h-6 w-6 text-amber-600" />}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      {editingItem ? "Modifier le plat" : "Nouveau plat"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                      {editingItem ? "Apportez vos modifications" : "Ajoutez un plat à votre carte"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Image du plat
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <PhotoIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                        <ArrowUpTrayIcon className="h-5 w-5 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">
                          {imageFile ? "Changer l'image" : "Télécharger une image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-slate-400 mt-2">JPG, PNG. Max 5MB</p>
                      {imageFile && (
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(formData.image_url ? getImageUrl(formData.image_url) : null); }}
                          className="text-xs text-red-500 hover:text-red-600 mt-1"
                        >
                          Annuler la sélection
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom du plat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Salade César, Burger Gourmet..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez les ingrédients et la préparation..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Prix <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Prep time & Calories */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" /> Temps de préparation
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={formData.preparation_time}
                        onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <FireIcon className="h-4 w-4" /> Calories
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.calories}
                        onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                        placeholder="Optionnel"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kcal</span>
                    </div>
                  </div>
                </div>

                {/* Allergens */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" /> Allergènes
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="Ex: Gluten, Lactose, Noix..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Dietary options */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Options alimentaires</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.is_vegetarian}
                        onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                        className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Végétarien</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.is_vegan}
                        onChange={(e) => setFormData({ ...formData, is_vegan: e.target.checked })}
                        className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-slate-700">Vegan</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.is_gluten_free}
                        onChange={(e) => setFormData({ ...formData, is_gluten_free: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Sans gluten</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.is_spicy}
                        onChange={(e) => setFormData({ ...formData, is_spicy: e.target.checked })}
                        className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-700">Épicé</span>
                    </label>
                  </div>
                </div>

                {/* Featured & Available */}
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                    formData.is_featured ? "bg-amber-50 border-amber-300" : "border-slate-200 hover:border-amber-200"
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="h-4 w-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <StarIcon className="h-4 w-4" /> Favori
                      </span>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                    formData.is_available ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-200"
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        {formData.is_available ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                        {formData.is_available ? "Disponible" : "Indisponible"}
                      </span>
                    </div>
                  </label>
                </div>
              </form>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploadingImage}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50"
                >
                  {uploadingImage ? "Envoi en cours..." : editingItem ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Supprimer du menu"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete?.name}" du menu ? Cette action est irréversible.`}
          confirmText="Supprimer"
          confirmStyle="danger"
        />

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: "", type: "" })}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Menus;
