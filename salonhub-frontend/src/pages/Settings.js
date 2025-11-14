/**
 * Page de paramètres du salon AMÉLIORÉE
 * Layout avec onglets: Général, Facturation, Horaires
 */

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency, CURRENCIES } from "../contexts/CurrencyContext";
import ImageUploader from "../components/common/ImageUploader";
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
} from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
  const { tenant } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

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
  const [salonInfo, setSalonInfo] = useState({
    business_name: "",
    phone: "",
    email: "",
    address: "",
  });
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

  useEffect(() => {
    fetchSettings();
    fetchSalonInfo();
    if (activeTab === "staff") {
      fetchStaff();
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
        });
        if (salon.logo_url) {
          setLogoUrl(salon.logo_url);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des infos du salon:", err);
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
        // Modification
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

        setMessage("Employé modifié avec succès !");
      } else {
        // Création
        await axios.post(`${API_URL}/auth/staff`, staffFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessage("Employé ajouté avec succès !");
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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/auth/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Employé supprimé avec succès !");
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

      // Sauvegarder les paramètres généraux
      await axios.put(
        `${API_URL}/settings`,
        {
          business_hours: businessHours,
          slot_duration: slotDuration,
          currency: selectedCurrency,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Sauvegarder le logo et infos du salon si modifiés
      if (
        logoUrl ||
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
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      changeCurrency(selectedCurrency);

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Cog6ToothIcon className="h-8 w-8 text-gray-900 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Paramètres du salon
            </h1>
            <p className="mt-2 text-gray-600">
              Configurez l'identité, la facturation et les horaires de votre
              salon
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <XMarkIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("general")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "general"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BuildingStorefrontIcon className="h-5 w-5 inline mr-2" />
                Général
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "billing"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <CreditCardIcon className="h-5 w-5 inline mr-2" />
                Facturation
              </button>
              <button
                onClick={() => setActiveTab("hours")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "hours"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ClockIcon className="h-5 w-5 inline mr-2" />
                Horaires
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "staff"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <UsersIcon className="h-5 w-5 inline mr-2" />
                Staff
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Onglet Général */}
            {activeTab === "general" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center border-b pb-3">
                    <BuildingStorefrontIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    Identité du salon
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo */}
                    <div>
                      <ImageUploader
                        target="tenant-logo"
                        imageUrl={logoUrl?.replace("/api", "")}
                        onImageUpload={setLogoUrl}
                        onDelete={() => setLogoUrl(null)}
                        label="Logo ou Bannière du Salon"
                        aspectRatio="aspect-[16/9]"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Ce logo apparaîtra sur votre page de réservation.
                      </p>
                    </div>

                    {/* Info salon */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du salon
                        </label>
                        <input
                          type="text"
                          value={tenant?.name || ""}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Contactez le support pour modifier le nom
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL de réservation
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            /book/
                          </span>
                          <input
                            type="text"
                            value={tenant?.slug || ""}
                            disabled
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Facturation */}
            {activeTab === "billing" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center border-b pb-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    Configuration de la facturation
                  </h2>

                  <div className="max-w-md space-y-6">
                    {/* Devise */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Devise
                      </label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {Object.entries(CURRENCIES).map(([code, info]) => (
                          <option key={code} value={code}>
                            {info.symbol} - {info.name} ({code})
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        La devise est utilisée pour tous vos prix et
                        statistiques.
                      </p>
                    </div>

                    {/* Abonnement */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Abonnement actuel
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Plan:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {tenant?.subscription_plan === "professional"
                              ? "Professional"
                              : tenant?.subscription_plan === "enterprise"
                              ? "Enterprise"
                              : "Essential"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Statut:</span>
                          <span
                            className={`text-sm font-medium ${
                              tenant?.subscription_status === "active"
                                ? "text-green-600"
                                : tenant?.subscription_status === "trial"
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
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
                        className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Gérer l'abonnement
                      </button>
                    </div>

                    {/* Informations de paiement */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Informations de paiement
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Gérez vos méthodes de paiement et votre historique de
                        facturation.
                      </p>
                      <button
                        onClick={() => navigate("/billing")}
                        className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                      >
                        Accéder à la facturation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Horaires */}
            {activeTab === "hours" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center border-b pb-3">
                    <ClockIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    Planning et Créneaux
                  </h2>

                  {/* Durée des créneaux */}
                  <div className="mb-8 pb-8 border-b">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-600" />
                      Durée des créneaux
                    </h3>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Durée d'un créneau (minutes)
                      </label>
                      <select
                        value={slotDuration}
                        onChange={(e) =>
                          setSlotDuration(Number(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        Les clients pourront réserver à des intervalles de{" "}
                        {slotDuration} minutes
                      </p>
                    </div>
                  </div>

                  {/* Horaires d'ouverture */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                      Horaires d'ouverture
                    </h3>
                    <div className="space-y-4">
                      {DAYS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="w-32">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={!businessHours[key].closed}
                                onChange={(e) =>
                                  handleDayChange(
                                    key,
                                    "closed",
                                    !e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                {label}
                              </span>
                            </label>
                          </div>

                          {!businessHours[key].closed ? (
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Ouverture
                                </label>
                                <input
                                  type="time"
                                  value={businessHours[key].open}
                                  onChange={(e) =>
                                    handleDayChange(key, "open", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Fermeture
                                </label>
                                <input
                                  type="time"
                                  value={businessHours[key].close}
                                  onChange={(e) =>
                                    handleDayChange(
                                      key,
                                      "close",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 text-sm text-gray-400 italic">
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

            {/* Onglet Staff */}
            {activeTab === "staff" && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-6 border-b pb-3">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <UsersIcon className="h-6 w-6 text-indigo-600 mr-3" />
                      Gestion du personnel
                    </h2>
                    <button
                      onClick={() => handleOpenStaffModal()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Ajouter un employé
                    </button>
                  </div>

                  {/* Liste du staff */}
                  <div className="space-y-4">
                    {staff.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Aucun employé pour le moment
                        </p>
                        <button
                          onClick={() => handleOpenStaffModal()}
                          className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Ajouter le premier employé
                        </button>
                      </div>
                    ) : (
                      staff.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-700 font-semibold text-lg">
                                  {member.first_name?.charAt(0)}
                                  {member.last_name?.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {member.first_name} {member.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {member.email}
                                </p>
                                {member.phone && (
                                  <p className="text-sm text-gray-500">
                                    {member.phone}
                                  </p>
                                )}
                              </div>
                              <div>
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    member.role === "owner"
                                      ? "bg-purple-100 text-purple-800"
                                      : member.role === "admin"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {member.role === "owner"
                                    ? "Propriétaire"
                                    : member.role === "admin"
                                    ? "Admin"
                                    : "Employé"}
                                </span>
                              </div>
                            </div>

                            {member.role !== "owner" && (
                              <div className="flex items-center space-x-2 ml-4">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={member.is_active}
                                    onChange={() =>
                                      handleToggleStaff(
                                        member.id,
                                        member.is_active
                                      )
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-600">
                                    Actif
                                  </span>
                                </label>
                                <button
                                  onClick={() => handleOpenStaffModal(member)}
                                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Modifier"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(member.id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Supprimer"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
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
          </div>

          {/* Actions - Toujours visibles */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
            >
              {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Staff */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingStaff ? "Modifier l'employé" : "Ajouter un employé"}
            </h3>

            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={staffFormData.first_name}
                  onChange={(e) =>
                    setStaffFormData({
                      ...staffFormData,
                      first_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={staffFormData.last_name}
                  onChange={(e) =>
                    setStaffFormData({
                      ...staffFormData,
                      last_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaff}
                  value={staffFormData.email}
                  onChange={(e) =>
                    setStaffFormData({
                      ...staffFormData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {editingStaff && (
                  <p className="mt-1 text-xs text-gray-500">
                    L'email ne peut pas être modifié
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={staffFormData.phone}
                  onChange={(e) =>
                    setStaffFormData({
                      ...staffFormData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  required
                  value={staffFormData.role}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="staff">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={staffFormData.password}
                    onChange={(e) =>
                      setStaffFormData({
                        ...staffFormData,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 caractères
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseStaffModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement..."
                    : editingStaff
                    ? "Modifier"
                    : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Settings;
