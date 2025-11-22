/**
 * Page Services
 * Gestion des prestations du salon
 */

import React, { useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import { useCurrency } from "../contexts/CurrencyContext";
import { usePermissions } from "../contexts/PermissionContext";
import { useServices } from "../hooks/useServices";
import ImageUploader from "../components/common/ImageUploader";
import { ImageWithFallback } from "../utils/imageUtils";
import {
  ScissorsIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  TagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// --- NOUVEAUX IMPORTS ---
import { useToast } from "../hooks/useToast";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";

const Services = () => {
  const { formatPrice: formatCurrency } = useCurrency();
  const { can } = usePermissions();
  const {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    toggleService,
    fetchServices,
  } = useServices();

  // --- HOOK TOAST ---
  const { toast, success, error, hideToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");

  // --- ETAT POUR CONFIRMATION SUPPRESSION ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    price: "",
    category: "",
    is_active: true,
    image_url: "",
  });

  // Catégories uniques
  const categories = [
    ...new Set(services.map((s) => s.category).filter(Boolean)),
  ];

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || "",
        duration: service.duration,
        price: service.price,
        category: service.category || "",
        is_active: service.is_active,
        image_url: service.image_url || "",
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        duration: "",
        price: "",
        category: "",
        is_active: true,
        image_url: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const serviceData = {
      ...formData,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
    };

    if (editingService) {
      const result = await updateService(editingService.id, serviceData);
      if (result.success) {
        success("Service modifié avec succès");
        handleCloseModal();
      } else {
        error(result.error || "Erreur lors de la modification");
      }
    } else {
      const result = await createService(serviceData);
      if (result.success) {
        success("Service créé avec succès");
        handleCloseModal();
      } else {
        error(result.error || "Erreur lors de la création");
      }
    }
  };

  // --- GESTION SUPPRESSION ---
  const initiateDelete = (id) => {
    setServiceToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      const result = await deleteService(serviceToDelete);
      if (result.success) {
        success("Service supprimé avec succès");
        setShowDeleteConfirm(false);
        setServiceToDelete(null);
      } else {
        error(result.error || "Erreur lors de la suppression");
      }
    }
  };

  const handleToggle = async (id) => {
    const result = await toggleService(id);
    // Optionnel: afficher un toast aussi pour le toggle
    // if (result.success) success("Statut mis à jour");
  };

  const handleFilter = (category) => {
    setFilterCategory(category);
    fetchServices({ category: category || undefined });
  };

  const formatPrice = (price) => {
    return formatCurrency(price);
  };

  const filteredServices = filterCategory
    ? services.filter((s) => s.category === filterCategory)
    : services;

  return (
    <DashboardLayout>
      {/* TOAST CONTAINER */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {/* MODALE CONFIRMATION SUPPRESSION */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le service"
        message="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        confirmText="Supprimer"
        type="danger"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="mt-2 text-gray-600">
              Gérez vos prestations et tarifs
            </p>
          </div>
          {can.createService && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Nouveau service
            </button>
          )}
        </div>
        {/* Filtres */}
        <div className="mb-6 flex items-center space-x-2">
          <button
            onClick={() => handleFilter("")}
            className={`px-4 py-2 rounded-md border transition-colors ${
              !filterCategory
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilter(cat)}
              className={`px-4 py-2 rounded-md capitalize border transition-colors ${
                filterCategory === cat
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille de services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">
              Aucun service trouvé
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow ${
                  !service.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Image du service */}
                <div className="h-32 w-full mb-4 overflow-hidden rounded-lg bg-gray-100">
                  <ImageWithFallback
                    src={service.image_url?.replace("/api", "")}
                    alt={service.name}
                    fallbackType="service"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    {service.category && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                        <TagIcon className="h-3 w-3 inline mr-1" />
                        {service.category}
                      </span>
                    )}
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={service.is_active}
                      onChange={() => handleToggle(service.id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </label>
                </div>

                {service.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {service.description}
                  </p>
                )}

                <div className="flex justify-between items-center mb-4">
                  <div className="text-2xl font-bold text-purple-600 flex items-center">
                    <CurrencyDollarIcon className="h-6 w-6 mr-1" />
                    {formatPrice(service.price)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {service.duration} min
                  </div>
                </div>

                {can.editService && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-1" />
                      Modifier
                    </button>
                    {can.deleteService && (
                      <button
                        onClick={() => initiateDelete(service.id)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal (inchangée sauf style mineur) */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white animate-scale-in">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingService ? "Modifier le service" : "Nouveau service"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Uploader d'image */}
                <ImageUploader
                  target="service-image"
                  imageUrl={formData.image_url}
                  onImageUpload={(url) =>
                    setFormData({ ...formData, image_url: url })
                  }
                  onDelete={() => setFormData({ ...formData, image_url: "" })}
                  label="Image de mise en avant (optionnel)"
                  aspectRatio="aspect-[16/9]"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: Coupe Femme"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Description du service"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      Prix en Euro *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="35.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Les prix s'afficheront dans votre devise (
                      {formatCurrency(0).replace("0", "").trim()})
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    Catégorie
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: coupe, coloration, soin"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Service actif (disponible à la réservation)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Services;
