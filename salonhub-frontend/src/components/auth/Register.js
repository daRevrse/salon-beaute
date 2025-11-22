/**
 * Page Register - Formulaire multi-étapes (Wizard)
 * Inscription moderne avec progression visuelle
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  BuildingStorefrontIcon,
  UserIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const STEPS = [
  { id: 1, name: "Salon", icon: BuildingStorefrontIcon },
  { id: 2, name: "Compte", icon: UserIcon },
  { id: 3, name: "Plan", icon: CreditCardIcon },
];

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const { formatPrice } = useCurrency();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Salon
    salon_name: "",
    salon_email: "",
    salon_phone: "",
    salon_address: "",
    salon_city: "",
    salon_postal_code: "",

    // Owner
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",

    // Plan
    subscription_plan: "professional",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const validateStep = (step) => {
    setError("");

    if (step === 1) {
      if (!formData.salon_name || !formData.salon_email) {
        setError("Le nom et l'email du salon sont obligatoires");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.salon_email)) {
        setError("Format email invalide");
        return false;
      }
    }

    if (step === 2) {
      if (
        !formData.first_name ||
        !formData.last_name ||
        !formData.email ||
        !formData.password
      ) {
        setError("Tous les champs sont obligatoires");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Format email invalide");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères");
        return false;
      }
      if (formData.password !== formData.password_confirm) {
        setError("Les mots de passe ne correspondent pas");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateStep(2)) return;

    // Préparation données
    const { password_confirm, ...registerData } = formData;

    // Tentative inscription
    const result = await register(registerData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg">
            {/* <span className="text-2xl font-bold text-white">SH</span> */}
            <img src="logo.png" alt="Logo SalonHub" className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
            Créer votre compte
          </h2>
          <p className="text-gray-600">
            14 jours d'essai gratuit, sans carte bancaire
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : isCurrent
                          ? "bg-indigo-600 border-indigo-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleSolid className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <Icon
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            isCurrent ? "text-white" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs sm:text-sm font-medium ${
                        isCurrent ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 sm:mx-4 mb-6 transition-all ${
                        currentStep > step.id ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Salon Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-6">
                  <BuildingStorefrontIcon className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Informations du salon
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Commençons par les détails de votre établissement
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom du salon *
                  </label>
                  <input
                    type="text"
                    name="salon_name"
                    required
                    value={formData.salon_name}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Salon Beauté Paris"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email du salon *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="salon_email"
                        required
                        value={formData.salon_email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="contact@salon.fr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="salon_phone"
                        value={formData.salon_phone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="salon_address"
                      value={formData.salon_address}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="123 Rue de la Paix"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="salon_city"
                      value={formData.salon_city}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="salon_postal_code"
                      value={formData.salon_postal_code}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="75001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: User Account */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-6">
                  <UserIcon className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Votre compte
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Créez vos identifiants de connexion
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Marie"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Votre email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Min. 8 caractères"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Au moins 8 caractères
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmer *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password_confirm"
                        required
                        value={formData.password_confirm}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Même mot de passe"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Plan Selection */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-6">
                  <SparklesIcon className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Choisissez votre plan
                  </h3>
                  <p className="text-gray-600 mt-1">
                    14 jours d'essai gratuit sur tous les plans
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Plan Essential */}
                  <label
                    className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.subscription_plan === "essential"
                        ? "border-indigo-600 bg-indigo-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscription_plan"
                      value="essential"
                      checked={formData.subscription_plan === "essential"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {formData.subscription_plan === "essential" && (
                      <CheckCircleSolid className="absolute top-4 right-4 h-6 w-6 text-indigo-600" />
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      Essential
                    </span>
                    <div className="mt-4 mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(29)}
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>100 clients max</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Réservations en ligne</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Gestion agenda</span>
                      </li>
                    </ul>
                  </label>

                  {/* Plan Professional */}
                  <label
                    className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.subscription_plan === "professional"
                        ? "border-indigo-600 bg-indigo-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscription_plan"
                      value="professional"
                      checked={formData.subscription_plan === "professional"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Populaire
                    </div>
                    {formData.subscription_plan === "professional" && (
                      <CheckCircleSolid className="absolute top-4 right-4 h-6 w-6 text-indigo-600" />
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      Professional
                    </span>
                    <div className="mt-4 mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(59)}
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Clients illimités</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Personnel illimité</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Statistiques avancées</span>
                      </li>
                    </ul>
                  </label>

                  {/* Plan Enterprise */}
                  <label
                    className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.subscription_plan === "enterprise"
                        ? "border-indigo-600 bg-indigo-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscription_plan"
                      value="enterprise"
                      checked={formData.subscription_plan === "enterprise"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {formData.subscription_plan === "enterprise" && (
                      <CheckCircleSolid className="absolute top-4 right-4 h-6 w-6 text-indigo-600" />
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      Enterprise
                    </span>
                    <div className="mt-4 mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(99)}
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Multi-établissements</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>API & intégrations</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Support prioritaire</span>
                      </li>
                    </ul>
                  </label>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Période d'essai gratuite
                  </h4>
                  <p className="text-sm text-gray-700">
                    Profitez de 14 jours d'essai gratuit sur tous les plans.
                    Aucune carte bancaire requise. Vous pourrez changer de plan
                    à tout moment.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Précédent
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Connexion
                </Link>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
                >
                  Suivant
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Création...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <CheckCircleIcon className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            En créant un compte, vous acceptez nos{" "}
            <a
              href="#"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Conditions d'utilisation
            </a>{" "}
            et notre{" "}
            <a
              href="#"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Politique de confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
