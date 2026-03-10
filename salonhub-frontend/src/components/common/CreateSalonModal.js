/**
 * CreateSalonModal - Modal de création d'un nouveau salon
 * Accessible depuis le SalonSwitcher quand l'utilisateur est propriétaire (plan Custom)
 */

import { useState, Fragment } from "react";
import api from "../../services/api";
import {
  XMarkIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const BUSINESS_TYPES = [
  { value: "beauty", label: "Beauté / Coiffure", emoji: "💇" },
  { value: "restaurant", label: "Restaurant / Café", emoji: "🍽️" },
  { value: "medical", label: "Médical / Santé", emoji: "🏥" },
  { value: "training", label: "Formation", emoji: "🎓" },
];

const CreateSalonModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    business_type: "beauty",
    phone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Le nom du salon est obligatoire");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/salons", {
        name: form.name.trim(),
        business_type: form.business_type,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      });

      if (response.data.success) {
        setSuccess(response.data.data);
        // Appeler le callback après un court délai pour afficher le succès
        setTimeout(() => {
          onSuccess?.(response.data.data);
          handleClose();
        }, 1500);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de la création du salon";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: "",
      business_type: "beauty",
      phone: "",
      email: "",
      address: "",
    });
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Nouveau salon
                </h2>
                <p className="text-xs text-slate-400">
                  Créez un établissement supplémentaire
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Contenu */}
          {success ? (
            /* Écran de succès */
            <div className="px-6 py-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                Salon créé !
              </h3>
              <p className="text-sm text-slate-500">
                <strong>{success.name}</strong> est prêt. Vous pouvez y
                basculer depuis le sélecteur de salon.
              </p>
            </div>
          ) : (
            /* Formulaire */
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Erreur */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Nom du salon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom du salon <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ex: Mon Salon Paris 15"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Type d'activité */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Type d'activité
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        handleChange("business_type", type.value)
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all ${
                        form.business_type === type.value
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span className="font-medium truncate">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Téléphone
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Optionnel"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email du salon
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Optionnel"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Adresse
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Optionnel"
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">
                  Le salon sera créé avec une période d'essai de 14 jours.
                  Vous pourrez y basculer depuis le sélecteur de salon dans
                  la barre de navigation.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          opacity="0.25"
                        />
                        <path
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Création...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      Créer le salon
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateSalonModal;
