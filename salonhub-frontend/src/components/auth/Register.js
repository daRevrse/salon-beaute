/**
 * Premium Register Page - SalonHub
 * Purple Dynasty Theme - 3-Step Multi-Sector Wizard
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  BuildingStorefrontIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  SparklesIcon,
  ScissorsIcon,
  AcademicCapIcon,
  HeartIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Business Types Configuration
const BUSINESS_TYPES = [
  {
    id: "beauty",
    name: "Beaute & Bien-etre",
    description: "Salons de coiffure, instituts, spa, barbershops",
    icon: ScissorsIcon,
    color: "violet",
    gradient: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    borderColor: "border-violet-500",
    textColor: "text-violet-600",
    comingSoon: false,
  },
  {
    id: "restaurant",
    name: "Restauration",
    description: "Restaurants, cafes, bars, traiteurs",
    icon: BuildingStorefrontIcon,
    color: "amber",
    gradient: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50",
    borderColor: "border-amber-500",
    textColor: "text-amber-600",
    comingSoon: true,
  },
  {
    id: "training",
    name: "Formation",
    description: "Centres de formation, ecoles, coaching",
    icon: AcademicCapIcon,
    color: "emerald",
    gradient: "from-emerald-500 to-green-500",
    lightBg: "bg-emerald-50",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-600",
    comingSoon: true,
  },
  {
    id: "medical",
    name: "Sante & Medical",
    description: "Cabinets medicaux, cliniques, praticiens",
    icon: HeartIcon,
    color: "cyan",
    gradient: "from-cyan-500 to-teal-500",
    lightBg: "bg-cyan-50",
    borderColor: "border-cyan-500",
    textColor: "text-cyan-600",
    comingSoon: true,
  },
];

const STEPS = [
  { id: 1, name: "Activite", icon: Squares2X2Icon },
  { id: 2, name: "Etablissement", icon: BuildingStorefrontIcon },
  { id: 3, name: "Compte", icon: UserIcon },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, registerWithGoogle, loading } = useAuth();

  // Check if coming from Google login flow
  const isGoogleFlow = searchParams.get("google") === "true";
  const [googleToken, setGoogleToken] = useState(null);
  const [googleUserData, setGoogleUserData] = useState(null);

  useEffect(() => {
    if (isGoogleFlow) {
      const storedGoogleUser = sessionStorage.getItem("googleUser");
      const storedGoogleToken = sessionStorage.getItem("googleToken");
      if (storedGoogleUser) {
        const parsed = JSON.parse(storedGoogleUser);
        setGoogleUserData(parsed);
        setGoogleToken(storedGoogleToken);
        setFormData((prev) => ({
          ...prev,
          first_name: parsed.first_name || "",
          last_name: parsed.last_name || "",
          email: parsed.email || "",
        }));
      }
    }
  }, [isGoogleFlow]);

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Business Type
    business_type: "",
    // Salon/Establishment
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
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const selectBusinessType = (typeId) => {
    // Prevent selection of coming-soon sectors
    const type = BUSINESS_TYPES.find((bt) => bt.id === typeId);
    if (type?.comingSoon) return;

    setFormData({
      ...formData,
      business_type: typeId,
    });
    if (error) setError("");
  };

  const validateStep = (step) => {
    setError("");

    if (step === 1) {
      if (!formData.business_type) {
        setError("Veuillez selectionner votre type d'activite");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.salon_name || !formData.salon_email) {
        setError("Le nom et l'email de l'etablissement sont obligatoires");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.salon_email)) {
        setError("Format email invalide");
        return false;
      }
    }

    if (step === 3) {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        setError("Le prenom, nom et email sont obligatoires");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Format email invalide");
        return false;
      }
      // Skip password validation for Google flow
      if (!isGoogleFlow) {
        if (!formData.password) {
          setError("Le mot de passe est obligatoire");
          return false;
        }
        if (formData.password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caracteres");
          return false;
        }
        if (formData.password !== formData.password_confirm) {
          setError("Les mots de passe ne correspondent pas");
          return false;
        }
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

    if (!validateStep(3)) return;

    let result;

    if (isGoogleFlow && googleToken) {
      // Google registration
      const { password, password_confirm, first_name, last_name, email, ...salonData } = formData;
      result = await registerWithGoogle(googleToken, salonData);
      // Clean up session storage
      sessionStorage.removeItem("googleUser");
      sessionStorage.removeItem("googleToken");
    } else {
      // Standard registration
      const { password_confirm, ...registerData } = formData;
      result = await register(registerData);
    }

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  // Get establishment label based on business type
  const getEstablishmentLabel = () => {
    switch (formData.business_type) {
      case "beauty":
        return "salon";
      case "restaurant":
        return "restaurant";
      case "training":
        return "centre de formation";
      case "medical":
        return "cabinet";
      default:
        return "etablissement";
    }
  };


  // Get current business type config
  const currentBusinessType = BUSINESS_TYPES.find(
    (bt) => bt.id === formData.business_type
  );

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-hidden">
      {/* Decorative Background - Purple Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-200/50 to-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-200/40 to-indigo-200/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-violet-100/30 to-transparent" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
      </div>

      <div className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/login" className="inline-flex items-center gap-3 mb-8 group">
              <img src="/logo.png" alt="SalonHub" className="w-12 h-12 rounded-xl shadow-soft group-hover:shadow-glow transition-shadow duration-300 object-cover" />
              <span className="font-display text-2xl text-slate-800 tracking-tight">SalonHub</span>
            </Link>
            <h1 className="font-display text-display-sm sm:text-display-md text-slate-800 mb-3">
              Creez votre compte
            </h1>
            <p className="text-slate-500 text-lg">
              14 jours d'essai gratuit, sans carte bancaire
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-10 px-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`
                          w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center
                          border-2 transition-all duration-500 ease-premium
                          ${isCompleted
                            ? "bg-gradient-to-br from-violet-500 to-indigo-600 border-violet-500 shadow-glow"
                            : isCurrent
                            ? "bg-white border-violet-400 shadow-soft-lg"
                            : "bg-white/50 border-slate-200"
                          }
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircleSolid className="w-6 h-6 text-white" />
                        ) : (
                          <Icon
                            className={`w-6 h-6 transition-colors duration-300 ${
                              isCurrent ? "text-violet-600" : "text-slate-300"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`mt-3 text-xs sm:text-sm font-medium transition-colors duration-300 ${
                          isCurrent ? "text-violet-700" : isCompleted ? "text-violet-600" : "text-slate-400"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className="flex-1 mx-2 sm:mx-4 mb-8">
                        <div className="h-0.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-violet-400 to-indigo-500 transition-all duration-500 ease-premium ${
                              currentStep > step.id ? "w-full" : "w-0"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="card-premium p-6 sm:p-8 lg:p-10">
            {/* Error Message */}
            {error && (
              <div className="alert-error-premium mb-6">
                <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Business Type Selection */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 mb-4">
                      <Squares2X2Icon className="h-8 w-8 text-violet-700" />
                    </div>
                    <h3 className="font-display text-2xl text-slate-800 mb-2">
                      Quelle est votre activite ?
                    </h3>
                    <p className="text-slate-500">
                      Selectionnez le type qui correspond a votre etablissement
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BUSINESS_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.business_type === type.id;
                      const isDisabled = type.comingSoon;

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => selectBusinessType(type.id)}
                          disabled={isDisabled}
                          className={`
                            relative flex items-start gap-4 p-6 rounded-2xl
                            transition-all duration-300 ease-premium text-left
                            border-2
                            ${isDisabled
                              ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
                              : isSelected
                              ? `${type.borderColor} ${type.lightBg} shadow-soft-lg cursor-pointer`
                              : "border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-1 hover:shadow-soft-lg cursor-pointer"
                            }
                          `}
                        >
                          {/* Coming Soon Badge */}
                          {isDisabled && (
                            <div className="absolute top-3 right-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
                                <SparklesIcon className="h-3 w-3" />
                                Soon
                              </span>
                            </div>
                          )}

                          {/* Selected Indicator */}
                          {isSelected && !isDisabled && (
                            <div className="absolute top-4 right-4">
                              <CheckCircleSolid className={`h-6 w-6 ${type.textColor}`} />
                            </div>
                          )}

                          {/* Icon */}
                          <div
                            className={`
                              w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                              ${isDisabled
                                ? "bg-slate-100"
                                : isSelected
                                ? `bg-gradient-to-br ${type.gradient}`
                                : type.lightBg
                              }
                            `}
                          >
                            <Icon
                              className={`w-7 h-7 ${
                                isDisabled
                                  ? "text-slate-400"
                                  : isSelected
                                  ? "text-white"
                                  : type.textColor
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-8">
                            <span className={`font-display text-lg block mb-1 ${isDisabled ? "text-slate-400" : "text-slate-800"}`}>
                              {type.name}
                            </span>
                            <span className={`text-sm block ${isDisabled ? "text-slate-400" : "text-slate-500"}`}>
                              {type.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Establishment Info */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-center mb-8">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                        currentBusinessType
                          ? `bg-gradient-to-br ${currentBusinessType.gradient}`
                          : "bg-gradient-to-br from-violet-500 to-indigo-600"
                      }`}
                    >
                      {currentBusinessType ? (
                        <currentBusinessType.icon className="h-8 w-8 text-white" />
                      ) : (
                        <BuildingStorefrontIcon className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <h3 className="font-display text-2xl text-slate-800 mb-2">
                      Votre {getEstablishmentLabel()}
                    </h3>
                    <p className="text-slate-500">
                      Informations de votre etablissement
                    </p>
                  </div>

                  <div>
                    <label className="label-premium">Nom de l'etablissement *</label>
                    <input
                      type="text"
                      name="salon_name"
                      required
                      value={formData.salon_name}
                      onChange={handleChange}
                      className="input-premium"
                      placeholder={
                        formData.business_type === "beauty"
                          ? "Salon Beaute Paris"
                          : formData.business_type === "restaurant"
                          ? "Le Petit Bistrot"
                          : formData.business_type === "training"
                          ? "Academy Pro Formation"
                          : formData.business_type === "medical"
                          ? "Cabinet Medical du Centre"
                          : "Nom de l'etablissement"
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-premium">Email professionnel *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-slate-300" />
                        </div>
                        <input
                          type="email"
                          name="salon_email"
                          required
                          value={formData.salon_email}
                          onChange={handleChange}
                          className="input-premium input-premium-icon"
                          placeholder="contact@etablissement.fr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-premium">Telephone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <PhoneIcon className="h-5 w-5 text-slate-300" />
                        </div>
                        <input
                          type="tel"
                          name="salon_phone"
                          value={formData.salon_phone}
                          onChange={handleChange}
                          className="input-premium input-premium-icon"
                          placeholder="01 23 45 67 89"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-premium">Adresse</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-slate-300" />
                      </div>
                      <input
                        type="text"
                        name="salon_address"
                        value={formData.salon_address}
                        onChange={handleChange}
                        className="input-premium input-premium-icon"
                        placeholder="123 Rue de la Paix"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-premium">Ville</label>
                      <input
                        type="text"
                        name="salon_city"
                        value={formData.salon_city}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="Paris"
                      />
                    </div>

                    <div>
                      <label className="label-premium">Code postal</label>
                      <input
                        type="text"
                        name="salon_postal_code"
                        value={formData.salon_postal_code}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="75001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: User Account */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 mb-4">
                      <UserIcon className="h-8 w-8 text-violet-700" />
                    </div>
                    <h3 className="font-display text-2xl text-slate-800 mb-2">
                      Votre compte
                    </h3>
                    <p className="text-slate-500">
                      Creez vos identifiants de connexion
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-premium">Prenom *</label>
                      <input
                        type="text"
                        name="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="Marie"
                      />
                    </div>

                    <div>
                      <label className="label-premium">Nom *</label>
                      <input
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-premium">Votre email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-slate-300" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`input-premium input-premium-icon ${isGoogleFlow ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                        placeholder="vous@exemple.com"
                        readOnly={isGoogleFlow}
                      />
                      {isGoogleFlow && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password fields - hidden for Google flow */}
                  {!isGoogleFlow && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="label-premium">Mot de passe *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-slate-300" />
                          </div>
                          <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="input-premium input-premium-icon"
                            placeholder="Min. 8 caracteres"
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">
                          Au moins 8 caracteres
                        </p>
                      </div>

                      <div>
                        <label className="label-premium">Confirmer *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-slate-300" />
                          </div>
                          <input
                            type="password"
                            name="password_confirm"
                            required
                            value={formData.password_confirm}
                            onChange={handleChange}
                            className="input-premium input-premium-icon"
                            placeholder="Meme mot de passe"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Google account indicator */}
                  {isGoogleFlow && (
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <p className="text-sm text-slate-600">
                        Inscription via Google — pas de mot de passe requis
                      </p>
                    </div>
                  )}
                </div>
              )}


              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-8 border-t border-slate-200">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn-premium-secondary group"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                    Precedent
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="btn-premium-secondary group"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                    Connexion
                  </Link>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-premium group"
                  >
                    Suivant
                    <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-premium group"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-elegant-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                            strokeWidth="3"
                          />
                          <path
                            className="opacity-90"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creation...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Creer mon compte
                        <CheckCircleIcon className="h-5 w-5 ml-2" />
                      </span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>
              En creant un compte, vous acceptez nos{" "}
              <a href="#" className="link-premium">
                Conditions d'utilisation
              </a>{" "}
              et notre{" "}
              <a href="#" className="link-premium">
                Politique de confidentialite
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
