/**
 * SALONHUB - Page "Mot de passe oublié"
 * Permet à l'utilisateur de demander un lien de réinitialisation
 */

import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
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

    // Validation
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

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
        <div className="max-w-md w-full">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email envoyé !
            </h2>

            <p className="text-gray-600 mb-6">
              Un email avec un lien de réinitialisation a été envoyé à{" "}
              <span className="font-semibold text-gray-900">{email}</span>.
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Vérifiez votre boîte de réception et vos spams. Le lien est valide
              pendant 1 heure.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate(salonSlug ? `/${salonSlug}/login` : "/login")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Retour à la connexion
              </button>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition"
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <EnvelopeIcon className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Salon Slug */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du salon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={salonSlug}
                  onChange={(e) => setSalonSlug(e.target.value.toLowerCase().trim())}
                  required
                  disabled={!!tenant}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="nom-du-salon"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Le nom de votre salon tel qu'il apparaît dans l'URL
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to={salonSlug ? `/${salonSlug}/login` : "/login"}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm transition"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Vous n'avez pas reçu l'email ?{" "}
            <span className="text-gray-700">
              Vérifiez vos spams ou contactez votre administrateur.
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
