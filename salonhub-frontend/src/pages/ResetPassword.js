/**
 * SALONHUB - Page "Réinitialisation de mot de passe"
 * Permet à l'utilisateur de définir un nouveau mot de passe avec un token
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function ResetPassword() {
  const navigate = useNavigate();
  const { tenant } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { toast, hideToast, success: showSuccess, error: showError } = useToast();

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      showError("Token manquant dans l'URL");
      setVerifying(false);
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/password/verify-token/${token}`
      );

      if (response.data.success) {
        setTokenValid(true);
        setUserData(response.data.data);
      }
    } catch (error) {
      console.error("Erreur verify token:", error);
      setTokenValid(false);
      showError(
        error.response?.data?.error ||
          "Le lien de réinitialisation est invalide ou a expiré"
      );
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (password.length < 8) {
      showError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas");
      return;
    }

    setResetting(true);

    try {
      const response = await axios.post(`${API_URL}/password/reset`, {
        token,
        password,
      });

      if (response.data.success) {
        showSuccess("Mot de passe réinitialisé avec succès !");
        setResetSuccess(true);

        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate(`/${tenant}/login`);
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur reset password:", error);
      showError(
        error.response?.data?.error ||
          "Erreur lors de la réinitialisation du mot de passe"
      );
    } finally {
      setResetting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "", width: "0%" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { label: "Faible", color: "bg-red-500", width: "33%" };
    if (strength <= 3) return { label: "Moyen", color: "bg-yellow-500", width: "66%" };
    return { label: "Fort", color: "bg-green-500", width: "100%" };
  };

  const strength = getPasswordStrength();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <XCircleIcon className="w-12 h-12 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Lien invalide ou expiré
            </h2>

            <p className="text-gray-600 mb-6">
              Ce lien de réinitialisation n'est plus valide. Les liens expirent
              après 1 heure pour des raisons de sécurité.
            </p>

            <div className="space-y-3">
              <Link
                to={`/${tenant}/forgot-password`}
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                Demander un nouveau lien
              </Link>

              <Link
                to={`/${tenant}/login`}
                className="block w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition text-center"
              >
                Retour à la connexion
              </Link>
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

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Mot de passe réinitialisé !
            </h2>

            <p className="text-gray-600 mb-2">
              Votre mot de passe a été mis à jour avec succès.
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Vous allez être redirigé vers la page de connexion...
            </p>

            <Link
              to={`/${tenant}/login`}
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Se connecter maintenant
            </Link>
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

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <LockClosedIcon className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h1>
          {userData && (
            <p className="text-gray-600">
              Bonjour <span className="font-semibold">{userData.first_name}</span>,
              définissez votre nouveau mot de passe
            </p>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Minimum 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Force du mot de passe</span>
                    <span className={`text-xs font-semibold ${
                      strength.label === "Faible" ? "text-red-600" :
                      strength.label === "Moyen" ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${strength.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <p className={`mt-2 text-xs flex items-center ${
                  password === confirmPassword ? "text-green-600" : "text-red-600"
                }`}>
                  {password === confirmPassword ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Les mots de passe correspondent
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      Les mots de passe ne correspondent pas
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={resetting || password !== confirmPassword || password.length < 8}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to={`/${tenant}/login`}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition"
            >
              Retour à la connexion
            </Link>
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

export default ResetPassword;
