/**
 * Page Services - Purple Dynasty Theme
 * Multi-Sector Adaptive Service/Menu/Formation Management
 */

import React, { useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../contexts/PermissionContext";
import { useServices } from "../hooks/useServices";
import ImageUploader from "../components/common/ImageUploader";
import { ImageWithFallback, getImageUrl } from "../utils/imageUtils";
import { getBusinessTypeConfig } from "../utils/businessTypeConfig";
import { useToast } from "../hooks/useToast";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  TagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckCircleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const Services = () => {
  const { tenant } = useAuth();
  const { formatPrice: formatCurrency } = useCurrency();
  const { can } = usePermissions();

  const businessType = tenant?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const BusinessIcon = config.icon;
  const term = config.terminology;

  const {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    toggleService,
    fetchServices,
  } = useServices();
  const { toast, success, error, hideToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
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

  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))];

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
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
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
        success(`${term.service} modifié avec succès`);
        handleCloseModal();
      } else {
        error(result.error || "Erreur lors de la modification");
      }
    } else {
      const result = await createService(serviceData);
      if (result.success) {
        success(`${term.service} créé avec succès`);
        handleCloseModal();
      } else {
        error(result.error || "Erreur lors de la création");
      }
    }
  };

  const initiateDelete = (id) => {
    setServiceToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      const result = await deleteService(serviceToDelete);
      if (result.success) {
        success(`${term.service} supprimé avec succès`);
        setShowDeleteConfirm(false);
        setServiceToDelete(null);
      } else {
        error(result.error || "Erreur lors de la suppression");
      }
    }
  };

  const handleToggle = async (id) => {
    await toggleService(id);
  };

  const handleFilter = (category) => {
    setFilterCategory(category);
    fetchServices({ category: category || undefined });
  };

  const filteredServices = filterCategory
    ? services.filter((s) => s.category === filterCategory)
    : services;

  // Placeholder examples based on business type
  const getPlaceholder = () => {
    switch (businessType) {
      case "restaurant":
        return { name: "Pizza Margherita", category: "Pizzas, Pâtes, Desserts" };
      case "training":
        return { name: "Formation React Avancé", category: "Web, Mobile, Data" };
      case "medical":
        return { name: "Consultation générale", category: "Consultation, Examen, Suivi" };
      default:
        return { name: "Coupe Femme", category: "Coupe, Coloration, Soin" };
    }
  };

  const placeholder = getPlaceholder();

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={term.serviceDelete}
        message={`Êtes-vous sûr de vouloir supprimer ce ${term.service.toLowerCase()} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        type="danger"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <BusinessIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                {term.services}
              </h1>
            </div>
            <p className="text-slate-500">
              Gérez vos {term.services.toLowerCase()} et tarifs
            </p>
          </div>
          {can.createService && (
            <button
              onClick={() => handleOpenModal()}
              className={`inline-flex items-center px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow transition-all duration-300`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {term.serviceAdd}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className={`h-5 w-5 ${config.textColor}`} />
            <span className="font-medium text-slate-700">{term.serviceCategory}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilter("")}
              className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-300 ${
                !filterCategory
                  ? `bg-gradient-to-r ${config.gradient} text-white border-transparent`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilter(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-xl capitalize border transition-all duration-300 ${
                  filterCategory === cat
                    ? `bg-gradient-to-r ${config.gradient} text-white border-transparent`
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center">
              <div className="w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin mx-auto"></div>
              <p className="mt-4 text-slate-500">Chargement...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="col-span-full p-12 text-center">
              <BusinessIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{term.noServices}</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 ${
                  !service.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Service Image */}
                <div className="h-40 w-full overflow-hidden bg-slate-100">
                  <ImageWithFallback
                    src={getImageUrl(service.image_url)}
                    alt={service.name}
                    fallbackType="service"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold text-slate-800 mb-1">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg ${config.lightBg} ${config.textColor} capitalize`}>
                          <TagIcon className="h-3 w-3 mr-1" />
                          {service.category}
                        </span>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={service.is_active}
                        onChange={() => handleToggle(service.id)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r ${config.gradient}`}></div>
                    </label>
                  </div>

                  {service.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <div className={`text-2xl font-bold ${config.textColor} flex items-center`}>
                      {formatCurrency(service.price)}
                    </div>
                    <div className="flex items-center text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                      <ClockIcon className="h-4 w-4 mr-1.5" />
                      {service.duration} min
                    </div>
                  </div>

                  {can.editService && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                        Modifier
                      </button>
                      {can.deleteService && (
                        <button
                          onClick={() => initiateDelete(service.id)}
                          className="px-4 py-2.5 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 pt-12">
            <div className="relative bg-white rounded-2xl shadow-soft-xl max-w-lg w-full animate-scale-in">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                    <BusinessIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-slate-800">
                    {editingService ? term.serviceEdit : term.serviceAdd}
                  </h3>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <XMarkIcon className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Image Uploader */}
                <ImageUploader
                  target="service-image"
                  imageUrl={formData.image_url}
                  onImageUpload={(url) => setFormData({ ...formData, image_url: url })}
                  onDelete={() => setFormData({ ...formData, image_url: "" })}
                  label="Image de mise en avant (optionnel)"
                  aspectRatio="aspect-[16/9]"
                />

                <div>
                  <label className="label-premium">Nom *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder={placeholder.name}
                  />
                </div>

                <div>
                  <label className="label-premium">Description</label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder={`Description du ${term.service.toLowerCase()}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-premium flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1.5" />
                      {term.serviceDuration} (min) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={handleChange}
                      className="input-premium"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="label-premium flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1.5" />
                      {term.servicePrice} *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="input-premium"
                      placeholder="35.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-premium flex items-center">
                    <TagIcon className="h-4 w-4 mr-1.5" />
                    {term.serviceCategory}
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder={placeholder.category}
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className={`h-5 w-5 rounded border-slate-300 ${config.textColor} focus:ring-violet-500`}
                  />
                  <label htmlFor="is_active" className="ml-3 text-sm text-slate-700">
                    <span className="font-medium">Actif</span>
                    <span className="text-slate-500 ml-1">- disponible à la réservation</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn-premium-secondary">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading} className="btn-premium">
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
