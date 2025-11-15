/**
 * Page Profil Utilisateur
 * Gestion du profil avec avatar, informations personnelles et statistiques
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/common/DashboardLayout";
import ImageUploader from "../components/common/ImageUploader";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  ScissorsIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // 'info', 'password', 'stats'

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    avatar_url: null,
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    totalServices: 0,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Charger les informations utilisateur
      if (user) {
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
          avatar_url: user.avatar_url || "",
        });

        // Charger les statistiques (si staff)
        if (user.role === "staff" || user.role === "owner") {
          const appointmentsRes = await api.get("/appointments");
          const allAppointments = appointmentsRes.data.data || [];

          const userAppointments = allAppointments.filter(
            (apt) => apt.staff_id === user.id
          );

          const completed = userAppointments.filter(
            (a) => a.status === "completed"
          ).length;
          const upcoming = userAppointments.filter(
            (a) =>
              (a.status === "pending" || a.status === "confirmed") &&
              new Date(a.appointment_date) >= new Date()
          ).length;

          setStats({
            totalAppointments: userAppointments.length,
            completedAppointments: completed,
            upcomingAppointments: upcoming,
            totalServices: 0, // À implémenter si besoin
          });
        }
      }
    } catch (err) {
      console.error("Erreur chargement profil:", err);
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.put("/auth/profile", formData);

      if (response.data.success) {
        setMessage("Profil mis à jour avec succès !");
        // Mettre à jour le contexte utilisateur
        if (updateUser) {
          updateUser(response.data.data);
        }
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error("Erreur mise à jour profil:", err);
      setError(err.response?.data?.error || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      setSaving(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setSaving(false);
      return;
    }

    try {
      await api.put("/auth/password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      setMessage("Mot de passe modifié avec succès !");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Erreur changement mot de passe:", err);
      setError(
        err.response?.data?.error || "Erreur lors du changement de mot de passe"
      );
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
        {/* Header avec avatar */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url?.replace("/api", "")}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full border-4 border-white bg-white bg-opacity-20 flex items-center justify-center">
                  <UserCircleIcon className="h-16 w-16 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {formData.first_name} {formData.last_name}
              </h1>
              <p className="mt-2 text-indigo-100 flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {formData.email}
              </p>
              <p className="mt-1 text-indigo-100 flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2" />
                {formData.phone || "Non renseigné"}
              </p>
            </div>
            {(user?.role === "staff" || user?.role === "owner") && (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {stats.totalAppointments}
                  </p>
                  <p className="text-sm text-indigo-100 mt-1">Total RDV</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {stats.completedAppointments}
                  </p>
                  <p className="text-sm text-indigo-100 mt-1">Complétés</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {stats.upcomingAppointments}
                  </p>
                  <p className="text-sm text-indigo-100 mt-1">À venir</p>
                </div>
              </div>
            )}
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
                onClick={() => setActiveTab("info")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "info"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <UserCircleIcon className="h-5 w-5 inline mr-2" />
                Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "password"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <KeyIcon className="h-5 w-5 inline mr-2" />
                Sécurité
              </button>
              {(user?.role === "staff" || user?.role === "owner") && (
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "stats"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
                  Statistiques
                </button>
              )}
            </nav>
          </div>

          <div className="p-8">
            {/* Onglet Informations personnelles */}
            {activeTab === "info" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Colonne gauche: Avatar */}
                  <div>
                    <ImageUploader
                      target="user-avatar"
                      imageUrl={formData.avatar_url?.replace("/api", "")}
                      onImageUpload={(url) =>
                        setFormData({ ...formData, avatar_url: url })
                      }
                      onDelete={() =>
                        setFormData({ ...formData, avatar_url: null })
                      }
                      label="Photo de profil"
                      aspectRatio="aspect-square"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Cette photo apparaîtra sur votre profil.
                    </p>
                  </div>

                  {/* Colonne droite: Informations */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom *
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          required
                          value={formData.last_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => navigate("/app/dashboard")}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}

            {/* Onglet Mot de passe */}
            {activeTab === "password" && (
              <form
                onSubmit={handleSavePassword}
                className="max-w-md space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    required
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    required
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    required
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() =>
                      setPasswordData({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                      })
                    }
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {saving ? "Enregistrement..." : "Modifier le mot de passe"}
                  </button>
                </div>
              </form>
            )}

            {/* Onglet Statistiques */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mes statistiques
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">
                          Total RDV
                        </p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">
                          {stats.totalAppointments}
                        </p>
                      </div>
                      <CalendarDaysIcon className="h-12 w-12 text-blue-500 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">
                          Complétés
                        </p>
                        <p className="text-3xl font-bold text-green-900 mt-2">
                          {stats.completedAppointments}
                        </p>
                      </div>
                      <CheckIcon className="h-12 w-12 text-green-500 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">
                          À venir
                        </p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">
                          {stats.upcomingAppointments}
                        </p>
                      </div>
                      <ClockIcon className="h-12 w-12 text-purple-500 opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Vos performances et statistiques détaillées seront
                    disponibles prochainement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
