/**
 * Premium Forgot Password Page - SalonHub
 * Purple Dynasty Theme
 */

import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function ForgotPassword() {
  const navigate = useNavigate();
  const { tenant } = useParams();
  const [email, setEmail] = useState("");
  const [salonSlug, setSalonSlug] = useState(tenant || "");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast, hideToast, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !salonSlug) {
      showError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/password/forgot`, {
        email,
        tenant_slug: salonSlug,
      });

      if (response.data.success) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Erreur forgot password:", error);
      showError(
        error.response?.data?.error || "Erreur lors de l'envoi de l'email"
      );
    } finally {
      setLoading(false);
    }
  };

  // Success State
  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-100 relative overflow-hidden flex items-center justify-center px-4">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-200/60 to-indigo-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-200/50 to-violet-200/30 blur-3xl" />
          <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        </div>

        <div className="relative max-w-md w-full">
          {/* Success Card */}
          <div className="card-premium p-8 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 mb-6 animate-scale-in">
              <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="font-display text-2xl text-slate-800 mb-4">
              Email envoye !
            </h2>

            <p className="text-slate-600 mb-2">
              Un email avec un lien de reinitialisation a ete envoye a
            </p>
            <p className="font-semibold text-slate-800 mb-6">{email}</p>

            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 mb-6">
              <p className="text-sm text-slate-600">
                Verifiez votre boite de reception et vos spams. Le lien est valide pendant 1 heure.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate(salonSlug ? `/${salonSlug}/login` : "/login")}
                className="btn-premium w-full"
              >
                Retour a la connexion
              </button>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full text-slate-600 hover:text-violet-700 font-medium py-2 transition-colors"
              >
                Renvoyer un email
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            duration={toast.duration}
          />
        )}
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-slate-100 relative overflow-hidden flex items-center justify-center px-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-200/60 to-indigo-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-200/50 to-violet-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-3 mb-8 group">
            <img src="/logo.png" alt="SalonHub" className="w-12 h-12 rounded-xl shadow-soft group-hover:shadow-glow transition-shadow duration-300 object-cover" />
            <span className="font-display text-2xl text-slate-800 tracking-tight">SalonHub</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 mb-4">
            <EnvelopeIcon className="w-8 h-8 text-violet-700" />
          </div>
          <h1 className="font-display text-display-sm text-slate-800 mb-3">
            Mot de passe oublie ?
          </h1>
          <p className="text-slate-500">
            Entrez votre email pour recevoir un lien de reinitialisation
          </p>
        </div>

        {/* Form Card */}
        <div className="card-premium p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Salon Slug */}
            <div>
              <label className="label-premium">Nom du salon</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <BuildingStorefrontIcon className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  type="text"
                  value={salonSlug}
                  onChange={(e) => setSalonSlug(e.target.value.toLowerCase().trim())}
                  required
                  disabled={!!tenant}
                  className="input-premium input-premium-icon disabled:bg-violet-50 disabled:cursor-not-allowed"
                  placeholder="nom-du-salon"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Le nom de votre salon tel qu'il apparait dans l'URL
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="label-premium">Adresse email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-premium input-premium-icon"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Submit */}
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
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Envoyer le lien
                  <PaperAirplaneIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </span>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to={salonSlug ? `/${salonSlug}/login` : "/login"}
              className="inline-flex items-center text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors group"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Retour a la connexion
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Vous n'avez pas recu l'email ?{" "}
            <span className="text-slate-600">
              Verifiez vos spams ou contactez votre administrateur.
            </span>
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
}

export default ForgotPassword;
