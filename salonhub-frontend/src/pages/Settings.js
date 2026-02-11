/**
 * Page Settings - Purple Dynasty Theme
 * Multi-Sector Adaptive with Promotions Tab
 */

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency, CURRENCIES } from "../contexts/CurrencyContext";
import { withPermission } from "../components/common/PermissionGate";
import { getBusinessTypeConfig } from "../utils/businessTypeConfig";
import ImageUploader from "../components/common/ImageUploader";
import PWASettings from "../components/settings/PWASettings";
import { getImageUrl } from "../utils/imageUtils";
import api from "../services/api";
import {
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  UsersIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  BellIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";

import { useToast } from "../hooks/useToast";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";

const API_URL = process.env.REACT_APP_API_URL;

const DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, refreshTenant, refreshUser } = useAuth();
  const { currency, changeCurrency, formatPrice } = useCurrency();
  const { toast, success, error: toastError, hideToast } = useToast();

  // Business type configuration
  const businessType = tenant?.business_type || "beauty";
  const config = getBusinessTypeConfig(businessType);
  const term = config.terminology;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Tab from URL
  const urlParams = new URLSearchParams(location.search);
  const tabFromUrl = urlParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "general");

  const [businessHours, setBusinessHours] = useState({
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "17:00", closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true },
  });

  const [slotDuration, setSlotDuration] = useState(30);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [logoUrl, setLogoUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [salonInfo, setSalonInfo] = useState({
    business_name: "",
    phone: "",
    email: "",
    address: "",
    slogan: "",
  });
  const [copied, setCopied] = useState(false);
  const [staff, setStaff] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "staff",
    password: "",
  });

  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [promoFormData, setPromoFormData] = useState({
    code: "",
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    usage_per_client: 1,
    valid_from: "",
    valid_until: "",
    is_active: true,
    is_public: true,
  });

  // Theme settings state
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: "#8B5CF6",
    secondaryColor: "#6366F1",
    fontFamily: "Inter",
    footerBgColor: "#1E293B",
    footerTextColor: "#FFFFFF",
  });

  // Font options for theme
  const FONT_OPTIONS = [
    { value: "Inter", label: "Inter (Moderne)" },
    { value: "Poppins", label: "Poppins (Elegant)" },
    { value: "Roboto", label: "Roboto (Classique)" },
    { value: "Playfair Display", label: "Playfair Display (Luxe)" },
    { value: "Montserrat", label: "Montserrat (Sans-serif)" },
  ];

  useEffect(() => {
    fetchSettings();
    fetchSalonInfo();
    if (activeTab === "staff") {
      fetchStaff();
    }
    if (activeTab === "promotions") {
      loadPromotions();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const settings = response.data;

      if (settings.business_hours) {
        setBusinessHours(settings.business_hours);
      }

      if (settings.slot_duration) {
        setSlotDuration(settings.slot_duration);
      }

      if (settings.currency) {
        setSelectedCurrency(settings.currency);
      }

      if (settings.theme_settings) {
        setThemeSettings(settings.theme_settings);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des paramètres:", err);
      setError(err.response?.data?.error || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalonInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/settings/salon`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        const salon = response.data.data;
        setSalonInfo({
          name: salon.name || "",
          phone: salon.phone || "",
          email: salon.email || "",
          address: salon.address || "",
          slogan: salon.slogan || "",
        });
        if (salon.logo_url) {
          setLogoUrl(salon.logo_url);
        }
        if (salon.banner_url) {
          setBannerUrl(salon.banner_url);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des infos:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/auth/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStaff(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du staff:", err);
    }
  };

  // Promotions functions
  const loadPromotions = async () => {
    setPromotionsLoading(true);
    try {
      const response = await api.get("/promotions");
      setPromotions(response.data.data);
    } catch (err) {
      console.error("Erreur chargement promotions:", err);
      toastError("Impossible de charger les promotions");
    } finally {
      setPromotionsLoading(false);
    }
  };

  const handleOpenPromoModal = (promotion = null) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setPromoFormData({
        code: promotion.code,
        title: promotion.title,
        description: promotion.description || "",
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        min_purchase_amount: promotion.min_purchase_amount || "",
        max_discount_amount: promotion.max_discount_amount || "",
        usage_limit: promotion.usage_limit || "",
        usage_per_client: promotion.usage_per_client,
        valid_from: promotion.valid_from?.split("T")[0] || "",
        valid_until: promotion.valid_until?.split("T")[0] || "",
        is_active: promotion.is_active,
        is_public: promotion.is_public,
      });
    } else {
      setEditingPromotion(null);
      setPromoFormData({
        code: "",
        title: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_purchase_amount: "",
        max_discount_amount: "",
        usage_limit: "",
        usage_per_client: 1,
        valid_from: "",
        valid_until: "",
        is_active: true,
        is_public: true,
      });
    }
    setShowPromoModal(true);
  };

  const handleClosePromoModal = () => {
    setShowPromoModal(false);
    setEditingPromotion(null);
  };

  const handlePromoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoFormData({
      ...promoFormData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingPromotion) {
        await api.put(`/promotions/${editingPromotion.id}`, promoFormData);
        success("Promotion modifiée avec succès !");
      } else {
        await api.post("/promotions", promoFormData);
        success("Promotion créée avec succès !");
      }

      handleClosePromoModal();
      loadPromotions();
    } catch (err) {
      toastError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const initiateDeletePromo = (id) => {
    setPromotionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeletePromo = async () => {
    if (promotionToDelete) {
      try {
        await api.delete(`/promotions/${promotionToDelete}`);
        success("Promotion supprimée avec succès !");
        loadPromotions();
        setShowDeleteConfirm(false);
        setPromotionToDelete(null);
      } catch (err) {
        toastError(err.response?.data?.error || "Erreur lors de la suppression");
      }
    }
  };

  const handleTogglePromoActive = async (promotion) => {
    try {
      await api.put(`/promotions/${promotion.id}`, {
        is_active: !promotion.is_active,
      });
      loadPromotions();
      success(promotion.is_active ? "Promotion désactivée" : "Promotion activée");
    } catch (err) {
      toastError(err.response?.data?.error || "Erreur lors de la modification");
    }
  };

  const getDiscountLabel = (promo) => {
    if (promo.discount_type === "percentage") {
      return `-${promo.discount_value}%`;
    } else {
      return `-${formatPrice(promo.discount_value)}`;
    }
  };

  // Staff functions
  const handleOpenStaffModal = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setStaffFormData({
        first_name: staffMember.first_name,
        last_name: staffMember.last_name,
        email: staffMember.email,
        phone: staffMember.phone || "",
        role: staffMember.role,
        password: "",
      });
    } else {
      setEditingStaff(null);
      setStaffFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "staff",
        password: "",
      });
    }
    setShowStaffModal(true);
  };

  const handleCloseStaffModal = () => {
    setShowStaffModal(false);
    setEditingStaff(null);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (editingStaff) {
        const updateData = {
          first_name: staffFormData.first_name,
          last_name: staffFormData.last_name,
          phone: staffFormData.phone,
          role: staffFormData.role,
        };

        await axios.put(
          `${API_URL}/auth/staff/${editingStaff.id}`,
          updateData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMessage(`${term.staffMember} modifié avec succès !`);
      } else {
        await axios.post(`${API_URL}/auth/staff`, staffFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessage(`${term.staffMember} ajouté avec succès !`);
      }

      fetchStaff();
      handleCloseStaffModal();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cet ${term.staffMember.toLowerCase()} ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/auth/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(`${term.staffMember} supprimé avec succès !`);
      fetchStaff();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  const handleToggleStaff = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/auth/staff/${id}`,
        { is_active: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la modification");
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/book/${tenant?.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDayChange = (day, field, value) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/settings`,
        {
          business_hours: businessHours,
          slot_duration: slotDuration,
          currency: selectedCurrency,
          theme_settings: themeSettings,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (
        logoUrl ||
        bannerUrl ||
        salonInfo.name ||
        salonInfo.phone ||
        salonInfo.email ||
        salonInfo.address
      ) {
        await axios.put(
          `${API_URL}/settings/salon`,
          {
            ...salonInfo,
            logo_url: logoUrl,
            banner_url: bannerUrl,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      changeCurrency(selectedCurrency);

      const [tenantResult, userResult] = await Promise.all([
        refreshTenant(),
        refreshUser(),
      ]);

      if (!tenantResult.success || !userResult.success) {
        console.warn("Erreur lors du rafraîchissement des données");
      }

      setMessage("Paramètres enregistrés avec succès !");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${config.borderColor} mx-auto`}></div>
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Toast Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeletePromo}
        title="Supprimer la promotion"
        message="Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible."
        confirmText="Supprimer"
        type="danger"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-6 sm:p-8 text-white shadow-soft-xl`}>
            <div className="flex items-center">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-4">
                <Cog6ToothIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">
                  Paramètres
                </h1>
                <p className="text-white/80 mt-1">
                  Configurez votre {term.establishment.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center">
            <CheckIcon className="h-5 w-5 text-emerald-600 mr-2" />
            <p className="text-emerald-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <XMarkIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-soft-xl border border-slate-200">
          <div className="border-b border-slate-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-max sm:min-w-0">
              {[
                { id: "general", label: "Général", icon: BuildingStorefrontIcon },
                { id: "billing", label: "Facturation", icon: CreditCardIcon },
                { id: "hours", label: "Horaires", icon: ClockIcon },
                { id: "staff", label: term.staff, icon: UsersIcon },
                { id: "promotions", label: "Promotions", icon: TagIcon },
                { id: "theme", label: "Thème", icon: PaintBrushIcon },
                { id: "pwa", label: "Notifications", icon: BellIcon },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? `${config.activeBorder} ${config.textColor}`
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <TabIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.substring(0, 5)}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 sm:mb-6 flex items-center border-b border-slate-200 pb-3">
                    <BuildingStorefrontIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.textColor} mr-2 sm:mr-3`} />
                    Identité de votre {term.establishment.toLowerCase()}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <ImageUploader
                        target="tenant-logo"
                        imageUrl={logoUrl}
                        onImageUpload={setLogoUrl}
                        onDelete={() => setLogoUrl(null)}
                        label="Logo"
                        aspectRatio="aspect-square"
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        Logo carré qui apparaîtra comme icône.
                      </p>
                    </div>

                    <div>
                      <ImageUploader
                        target="tenant-banner"
                        imageUrl={bannerUrl}
                        onImageUpload={setBannerUrl}
                        onDelete={() => setBannerUrl(null)}
                        label="Bannière"
                        aspectRatio="aspect-[16/9]"
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        Bannière pour votre page de réservation.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 mt-8">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {term.establishmentName}
                        </label>
                        <input
                          type="text"
                          value={tenant?.name || ""}
                          disabled
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Contactez le support pour modifier le nom
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          URL de réservation
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                            {window.location.origin}/book/
                          </span>
                          <input
                            type="text"
                            value={tenant?.slug || ""}
                            readOnly
                            className="flex-1 px-4 py-2.5 border-l-0 border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={handleCopy}
                            className={`px-4 py-2.5 border border-l-0 border-slate-200 rounded-r-xl ${config.lightBg} ${config.hoverBg} text-sm font-medium ${config.textColor}`}
                          >
                            {copied ? "Copié !" : "Copier"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={salonInfo.slogan}
                          onChange={(e) => setSalonInfo({ ...salonInfo, slogan: e.target.value })}
                          placeholder="Votre slogan ou phrase d'accroche"
                          className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                          maxLength={255}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Apparaitra sur votre page de reservation publique
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 sm:mb-6 flex items-center border-b border-slate-200 pb-3">
                    <CurrencyDollarIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.textColor} mr-2 sm:mr-3`} />
                    Configuration de la facturation
                  </h2>

                  <div className="max-w-md space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Devise
                      </label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                      >
                        {Object.entries(CURRENCIES).map(([code, info]) => (
                          <option key={code} value={code}>
                            {info.symbol} - {info.name} ({code})
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-sm text-slate-500">
                        La devise est utilisée pour tous vos prix et statistiques.
                      </p>
                    </div>

                    <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-6 text-white shadow-soft`}>
                      <h3 className="text-lg font-semibold mb-4">
                        Abonnement actuel
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/80">Plan:</span>
                          <span className="font-medium">
                            {tenant?.subscription_plan === "professional"
                              ? "Professional"
                              : tenant?.subscription_plan === "enterprise"
                              ? "Enterprise"
                              : "Essential"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/80">Statut:</span>
                          <span className="font-medium">
                            {tenant?.subscription_status === "active"
                              ? "Actif"
                              : tenant?.subscription_status === "trial"
                              ? "Essai gratuit"
                              : "Suspendu"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/billing")}
                        className="mt-4 w-full px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors font-medium"
                      >
                        Gérer l'abonnement
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Informations de paiement
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Gérez vos méthodes de paiement et votre historique de facturation.
                      </p>
                      <button
                        onClick={() => navigate("/billing")}
                        className={`w-full px-4 py-2.5 border ${config.borderColor} ${config.textColor} rounded-xl ${config.hoverBg} transition-colors font-medium`}
                      >
                        Accéder à la facturation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hours Tab */}
            {activeTab === "hours" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 sm:mb-6 flex items-center border-b border-slate-200 pb-3">
                    <ClockIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.textColor} mr-2 sm:mr-3`} />
                    Planning et Créneaux
                  </h2>

                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 mr-2 text-slate-600" />
                      Durée des créneaux
                    </h3>
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Durée d'un créneau de réservation
                      </label>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="5"
                            max="480"
                            value={slotDuration}
                            onChange={(e) => setSlotDuration(Math.max(5, Math.min(480, Number(e.target.value))))}
                            className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                            placeholder="30"
                          />
                        </div>
                        <select
                          value={slotDuration >= 60 && slotDuration % 60 === 0 ? "hours" : "minutes"}
                          onChange={(e) => {
                            if (e.target.value === "hours") {
                              setSlotDuration(Math.max(60, Math.round(slotDuration / 60) * 60));
                            }
                          }}
                          className={`px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                        >
                          <option value="minutes">minutes</option>
                          <option value="hours">heures</option>
                        </select>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[15, 30, 45, 60, 90, 120].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setSlotDuration(mins)}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              slotDuration === mins
                                ? `${config.lightBg} ${config.textColor} border-transparent`
                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {mins >= 60 ? `${mins / 60}h` : `${mins} min`}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-slate-500">
                        Les {term.clients.toLowerCase()} pourront réserver à des intervalles de {slotDuration >= 60 ? `${slotDuration / 60} heure(s)` : `${slotDuration} minutes`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-slate-600" />
                      Horaires d'ouverture
                    </h3>
                    <div className="space-y-4">
                      {DAYS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center space-x-4 pb-4 border-b border-slate-100 last:border-b-0"
                        >
                          <div className="w-32">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={!businessHours[key].closed}
                                onChange={(e) =>
                                  handleDayChange(key, "closed", !e.target.checked)
                                }
                                className={`h-4 w-4 ${config.textColor} ${config.focusRing} border-slate-300 rounded`}
                              />
                              <span className="ml-2 text-sm font-medium text-slate-700">
                                {label}
                              </span>
                            </label>
                          </div>

                          {!businessHours[key].closed ? (
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1">
                                  Ouverture
                                </label>
                                <input
                                  type="time"
                                  value={businessHours[key].open}
                                  onChange={(e) => handleDayChange(key, "open", e.target.value)}
                                  className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1">
                                  Fermeture
                                </label>
                                <input
                                  type="time"
                                  value={businessHours[key].close}
                                  onChange={(e) => handleDayChange(key, "close", e.target.value)}
                                  className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 text-sm text-slate-400 italic">
                              Fermé
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === "staff" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 border-b border-slate-200 pb-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center mb-3 sm:mb-0">
                      <UsersIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.textColor} mr-2 sm:mr-3`} />
                      Gestion du {term.staff.toLowerCase()}
                    </h2>
                    <button
                      onClick={() => handleOpenStaffModal()}
                      className={`w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-glow transition-all font-medium flex items-center justify-center`}
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      {term.staffAdd}
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {staff.length === 0 ? (
                      <div className={`text-center py-8 sm:py-12 ${config.lightBg} rounded-xl border ${config.lightBorderColor}`}>
                        <UsersIcon className={`h-10 w-10 sm:h-12 sm:w-12 ${config.textColor} mx-auto mb-3 sm:mb-4`} />
                        <p className="text-sm sm:text-base text-slate-600">
                          Aucun {term.staffMember.toLowerCase()} pour le moment
                        </p>
                        <button
                          onClick={() => handleOpenStaffModal()}
                          className={`mt-3 sm:mt-4 text-sm sm:text-base ${config.textColor} hover:${config.darkTextColor} font-medium`}
                        >
                          {term.staffAdd}
                        </button>
                      </div>
                    ) : (
                      staff.map((member) => (
                        <div
                          key={member.id}
                          className={`bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow-soft transition-shadow`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                              <div className={`h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full ${config.lightBg} flex items-center justify-center`}>
                                {member.avatar_url ? (
                                  <img
                                    src={getImageUrl(member.avatar_url)}
                                    alt={member.first_name}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className={`${config.darkTextColor} font-semibold text-sm sm:text-lg`}>
                                    {member.first_name?.charAt(0)}
                                    {member.last_name?.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between sm:block">
                                  <h3 className="font-semibold text-sm sm:text-base text-slate-800 truncate">
                                    {member.first_name} {member.last_name}
                                  </h3>
                                  <span
                                    className={`sm:hidden ml-2 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                                      member.role === "owner"
                                        ? `${config.lightBg} ${config.textColor}`
                                        : member.role === "admin"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-slate-100 text-slate-800"
                                    }`}
                                  >
                                    {member.role === "owner"
                                      ? "Proprio"
                                      : member.role === "admin"
                                      ? "Admin"
                                      : term.staffMember}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 truncate">
                                  {member.email}
                                </p>
                                {member.phone && (
                                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                                    {member.phone}
                                  </p>
                                )}
                              </div>
                              <div className="hidden sm:block">
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                    member.role === "owner"
                                      ? `${config.lightBg} ${config.textColor}`
                                      : member.role === "admin"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {member.role === "owner"
                                    ? "Propriétaire"
                                    : member.role === "admin"
                                    ? "Admin"
                                    : term.staffMember}
                                </span>
                              </div>
                            </div>

                            {member.role !== "owner" && (
                              <div className="flex items-center justify-between sm:justify-start space-x-2 sm:ml-4 pt-2 sm:pt-0 border-t sm:border-t-0">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={member.is_active}
                                    onChange={() => handleToggleStaff(member.id, member.is_active)}
                                    className={`h-4 w-4 ${config.textColor} ${config.focusRing} border-slate-300 rounded`}
                                  />
                                  <span className="ml-2 text-xs sm:text-sm text-slate-600">
                                    Actif
                                  </span>
                                </label>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <button
                                    onClick={() => handleOpenStaffModal(member)}
                                    className={`p-1.5 sm:p-2 text-slate-600 hover:${config.textColor} ${config.hoverBg} rounded-lg transition-colors`}
                                    title="Modifier"
                                  >
                                    <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(member.id)}
                                    className="p-1.5 sm:p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Promotions Tab */}
            {activeTab === "promotions" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 border-b border-slate-200 pb-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center mb-3 sm:mb-0">
                      <TagIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.textColor} mr-2 sm:mr-3`} />
                      Gestion des promotions
                    </h2>
                    <button
                      onClick={() => handleOpenPromoModal()}
                      className={`w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-glow transition-all font-medium flex items-center justify-center`}
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Nouvelle promotion
                    </button>
                  </div>

                  {promotionsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${config.borderColor}`}></div>
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className={`text-center py-8 sm:py-12 ${config.lightBg} rounded-xl border ${config.lightBorderColor}`}>
                      <TagIcon className={`h-10 w-10 sm:h-12 sm:w-12 ${config.textColor} mx-auto mb-3 sm:mb-4`} />
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Aucune promotion
                      </h3>
                      <p className="text-slate-500 mb-6">
                        Créez votre première promotion pour attirer plus de {term.clients.toLowerCase()}
                      </p>
                      <button
                        onClick={() => handleOpenPromoModal()}
                        className={`px-6 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300`}
                      >
                        Créer une promotion
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {promotions.map((promo) => {
                        const isExpired = new Date(promo.valid_until) < new Date();

                        return (
                          <div
                            key={promo.id}
                            className={`bg-white rounded-xl shadow-soft border-2 overflow-hidden transition-all hover:shadow-soft-xl ${
                              isExpired ? "border-slate-200 opacity-75" : config.lightBorderColor
                            }`}
                          >
                            <div
                              className={`p-4 text-center ${
                                isExpired ? "bg-slate-100 text-slate-600" : `bg-gradient-to-r ${config.gradient} text-white`
                              }`}
                            >
                              <div className="text-2xl font-bold">
                                {getDiscountLabel(promo)}
                              </div>
                              <div className="text-sm mt-1 uppercase tracking-wide font-semibold opacity-80">
                                {promo.code}
                              </div>
                            </div>

                            <div className="p-4">
                              <h3 className="text-lg font-bold text-slate-800 mb-1">
                                {promo.title}
                              </h3>
                              {promo.description && (
                                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                                  {promo.description}
                                </p>
                              )}

                              <div className="flex items-center space-x-2 mb-4">
                                {promo.is_active && !isExpired ? (
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center">
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Active
                                  </span>
                                ) : isExpired ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium flex items-center">
                                    <XCircleIcon className="h-3 w-3 mr-1" />
                                    Expirée
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                    Inactive
                                  </span>
                                )}

                                {promo.is_public && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                    Publique
                                  </span>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleTogglePromoActive(promo)}
                                  className={`flex-1 px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                                    promo.is_active
                                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  }`}
                                >
                                  {promo.is_active ? "Désactiver" : "Activer"}
                                </button>

                                <button
                                  onClick={() => handleOpenPromoModal(promo)}
                                  className={`px-3 py-2 ${config.lightBg} ${config.textColor} rounded-xl hover:${config.mediumBg} text-xs font-medium transition-colors`}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => initiateDeletePromo(promo.id)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-medium transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === "theme" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 sm:mb-6 flex items-center border-b border-slate-200 pb-3">
                    <PaintBrushIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.textColor} mr-2 sm:mr-3`} />
                    Thème de votre page de réservation
                  </h2>

                  <div className="max-w-md space-y-6">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Couleur principale
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeSettings.primaryColor}
                          onChange={(e) => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                          className="h-10 w-20 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={themeSettings.primaryColor}
                          onChange={(e) => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                          className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 ${config.focusRing} focus:border-transparent`}
                          placeholder="#8B5CF6"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Couleur des boutons et éléments principaux</p>
                    </div>

                    {/* Secondary Color */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Couleur secondaire
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeSettings.secondaryColor}
                          onChange={(e) => setThemeSettings({ ...themeSettings, secondaryColor: e.target.value })}
                          className="h-10 w-20 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={themeSettings.secondaryColor}
                          onChange={(e) => setThemeSettings({ ...themeSettings, secondaryColor: e.target.value })}
                          className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 ${config.focusRing} focus:border-transparent`}
                          placeholder="#6366F1"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Couleur des accents et dégradés</p>
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Police de caractères
                      </label>
                      <select
                        value={themeSettings.fontFamily}
                        onChange={(e) => setThemeSettings({ ...themeSettings, fontFamily: e.target.value })}
                        className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-slate-500">Police utilisée sur votre page publique</p>
                    </div>

                    {/* Footer Background Color */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Couleur de fond du pied de page
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeSettings.footerBgColor || "#1E293B"}
                          onChange={(e) => setThemeSettings({ ...themeSettings, footerBgColor: e.target.value })}
                          className="h-10 w-20 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={themeSettings.footerBgColor || "#1E293B"}
                          onChange={(e) => setThemeSettings({ ...themeSettings, footerBgColor: e.target.value })}
                          className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 ${config.focusRing} focus:border-transparent`}
                          placeholder="#1E293B"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Couleur d'arrière-plan du footer</p>
                    </div>

                    {/* Footer Text Color */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Couleur du texte du pied de page
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeSettings.footerTextColor || "#FFFFFF"}
                          onChange={(e) => setThemeSettings({ ...themeSettings, footerTextColor: e.target.value })}
                          className="h-10 w-20 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={themeSettings.footerTextColor || "#FFFFFF"}
                          onChange={(e) => setThemeSettings({ ...themeSettings, footerTextColor: e.target.value })}
                          className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 ${config.focusRing} focus:border-transparent`}
                          placeholder="#FFFFFF"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Couleur du texte dans le footer</p>
                    </div>

                    {/* Preview Card */}
                    <div className="mt-8 p-6 rounded-2xl border-2 border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700 mb-4">Aperçu</h3>
                      <div
                        className="p-4 rounded-xl text-white text-center font-medium shadow-soft mb-4"
                        style={{
                          background: `linear-gradient(135deg, ${themeSettings.primaryColor}, ${themeSettings.secondaryColor})`,
                          fontFamily: themeSettings.fontFamily
                        }}
                      >
                        Votre bouton de réservation
                      </div>
                      <div
                        className="p-4 rounded-xl text-center text-sm"
                        style={{
                          backgroundColor: themeSettings.footerBgColor || "#1E293B",
                          color: themeSettings.footerTextColor || "#FFFFFF",
                          fontFamily: themeSettings.fontFamily
                        }}
                      >
                        Aperçu du pied de page
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PWA Tab */}
            {activeTab === "pwa" && (
              <div>
                <PWASettings />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 rounded-b-2xl">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-700 hover:bg-slate-100 font-medium transition-colors order-2 sm:order-1"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-glow font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-soft transition-all text-sm sm:text-base order-1 sm:order-2`}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-soft-2xl animate-scale-in">
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4 rounded-t-2xl`}>
              <h3 className="text-lg font-display font-semibold text-white">
                {editingStaff ? `Modifier le ${term.staffMember.toLowerCase()}` : term.staffAdd}
              </h3>
            </div>

            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffFormData.first_name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, first_name: e.target.value })}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffFormData.last_name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, last_name: e.target.value })}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaff}
                  value={staffFormData.email}
                  onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed`}
                />
                {editingStaff && (
                  <p className="mt-1 text-xs text-slate-500">
                    L'email ne peut pas être modifié
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={staffFormData.phone}
                  onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Rôle *
                </label>
                <select
                  required
                  value={staffFormData.role}
                  onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                >
                  <option value="staff">{term.staffMember}</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Minimum 6 caractères
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseStaffModal}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium shadow-soft hover:shadow-glow disabled:opacity-50 transition-all`}
                >
                  {saving ? "Enregistrement..." : editingStaff ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-soft-2xl my-8 animate-scale-in">
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
              <h3 className="text-lg font-display font-semibold text-white">
                {editingPromotion ? "Modifier la promotion" : "Nouvelle promotion"}
              </h3>
              <button
                onClick={handleClosePromoModal}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            <form onSubmit={handlePromoSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Code promo *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={promoFormData.code}
                    onChange={handlePromoChange}
                    placeholder="NOEL2024"
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent uppercase`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Titre *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={promoFormData.title}
                    onChange={handlePromoChange}
                    placeholder="Offre de Noël"
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={promoFormData.description}
                  onChange={handlePromoChange}
                  placeholder="Description de l'offre..."
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent resize-none`}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Type de réduction *
                  </label>
                  <select
                    name="discount_type"
                    required
                    value={promoFormData.discount_type}
                    onChange={handlePromoChange}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed_amount">Montant fixe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Valeur *
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    required
                    min="0"
                    step="0.01"
                    value={promoFormData.discount_value}
                    onChange={handlePromoChange}
                    placeholder={promoFormData.discount_type === "percentage" ? "20" : "10.00"}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Début de validité *
                  </label>
                  <input
                    type="date"
                    name="valid_from"
                    required
                    value={promoFormData.valid_from}
                    onChange={handlePromoChange}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Fin de validité *
                  </label>
                  <input
                    type="date"
                    name="valid_until"
                    required
                    value={promoFormData.valid_until}
                    onChange={handlePromoChange}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Limite d'utilisation totale
                  </label>
                  <input
                    type="number"
                    name="usage_limit"
                    min="0"
                    value={promoFormData.usage_limit}
                    onChange={handlePromoChange}
                    placeholder="Illimité"
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Par {term.client.toLowerCase()} *
                  </label>
                  <input
                    type="number"
                    name="usage_per_client"
                    required
                    min="1"
                    value={promoFormData.usage_per_client}
                    onChange={handlePromoChange}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 ${config.focusRing} focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={promoFormData.is_active}
                    onChange={handlePromoChange}
                    className={`h-4 w-4 ${config.textColor} ${config.focusRing} border-slate-300 rounded`}
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Promotion active
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={promoFormData.is_public}
                    onChange={handlePromoChange}
                    className={`h-4 w-4 ${config.textColor} ${config.focusRing} border-slate-300 rounded`}
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Visible sur la page de réservation publique
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClosePromoModal}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium shadow-soft hover:shadow-glow disabled:opacity-50 transition-all`}
                >
                  {saving ? "Enregistrement..." : editingPromotion ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default withPermission(Settings, "viewSettings");
