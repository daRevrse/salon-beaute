/**
 * Premium Login Page - SalonHub
 * Purple Dynasty Theme - Multi-Sector Platform
 */

import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const Login = () => {
  const navigate = useNavigate();
  const { tenant } = useParams();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb - top right */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-200/60 to-indigo-200/40 blur-3xl" />
        {/* Smaller orb - bottom left */}
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-200/50 to-violet-200/30 blur-3xl" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-pattern-dots opacity-30" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12 bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-violet-600/5 to-transparent rounded-full" />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-glow">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-display text-2xl text-white tracking-tight">SalonHub</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 space-y-8">
            <div>
              <h1 className="font-display text-display-md text-white mb-4 leading-tight">
                La plateforme<br />
                <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                  multi-secteur
                </span>
              </h1>
              <p className="text-violet-200/80 text-lg max-w-md leading-relaxed">
                Gerez votre activite avec elegance. Une solution adaptee a chaque secteur : beaute, restauration, formation et sante.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                "Agenda intelligent & reservations",
                "Gestion clientele premium",
                "Analyses & statistiques avancees"
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-violet-200/70"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-sm tracking-wide">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 text-violet-300/50 text-sm">
            <p>&copy; 2024 SalonHub. Tous droits reserves.</p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-soft">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-display text-2xl text-slate-800 tracking-tight">SalonHub</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="font-display text-display-sm text-slate-800 mb-3">
                Bon retour
              </h2>
              <p className="text-slate-500">
                Connectez-vous a votre espace
              </p>
            </div>

            {/* Form Card */}
            <div className="card-premium p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="alert-error-premium">
                    <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="label-premium">
                    Adresse email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <EnvelopeIcon
                        className={`h-5 w-5 transition-colors duration-300 ${
                          focusedField === "email"
                            ? "text-violet-600"
                            : "text-slate-300"
                        }`}
                      />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className="input-premium input-premium-icon"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="label-premium">
                      Mot de passe
                    </label>
                    <Link
                      to={tenant ? `/${tenant}/forgot-password` : "/forgot-password"}
                      className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      Mot de passe oublie ?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon
                        className={`h-5 w-5 transition-colors duration-300 ${
                          focusedField === "password"
                            ? "text-violet-600"
                            : "text-slate-300"
                        }`}
                      />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="input-premium input-premium-icon"
                      placeholder="Votre mot de passe"
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-violet-300 text-violet-600
                             focus:ring-violet-500 focus:ring-offset-0 cursor-pointer
                             transition-colors"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-3 text-sm text-slate-600 cursor-pointer select-none"
                  >
                    Se souvenir de moi
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full group"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
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
                      Connexion en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Se connecter
                      <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="divider-premium">
                <span className="text-xs text-slate-400 uppercase tracking-wider">ou</span>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-slate-600">
                  Pas encore de compte ?{" "}
                  <Link
                    to={tenant ? `/${tenant}/register` : "/register"}
                    className="link-premium"
                  >
                    Creer un compte
                  </Link>
                </p>
              </div>
            </div>

            {/* Features Pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                { icon: CheckCircleIcon, text: "14 jours gratuits" },
                { icon: CheckCircleIcon, text: "Sans engagement" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full
                           border border-violet-200/50 text-sm text-slate-600"
                >
                  <item.icon className="h-4 w-4 text-violet-600" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
