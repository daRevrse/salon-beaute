/**
 * Premium Reset Password Page - SalonHub
 * Purple Dynasty Theme
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
  SparklesIcon,
  ShieldCheckIcon,
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
          "Le lien de reinitialisation est invalide ou a expire"
      );
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      showError("Le mot de passe doit contenir au moins 8 caracteres");
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
        showSuccess("Mot de passe reinitialise avec succes !");
        setResetSuccess(true);

        setTimeout(() => {
          navigate(`/${tenant}/login`);
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur reset password:", error);
      showError(
        error.response?.data?.error ||
          "Erreur lors de la reinitialisation du mot de passe"
      );
    } finally {
      setResetting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "", width: "0%", gradient: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return {
      label: "Faible",
      color: "text-red-600",
      width: "33%",
      gradient: "from-red-400 to-red-500"
    };
    if (strength <= 3) return {
      label: "Moyen",
      color: "text-amber-600",
      width: "66%",
      gradient: "from-amber-400 to-amber-500"
    };
    return {
      label: "Fort",
      color: "text-emerald-600",
      width: "100%",
      gradient: "from-emerald-400 to-emerald-500"
    };
  };

  const strength = getPasswordStrength();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl border-2 border-violet-200 border-t-violet-600 animate-elegant-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verification du lien...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-slate-100 relative overflow-hidden flex items-center justify-center px-4">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-red-200/40 to-violet-200/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-violet-200/30 to-red-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        </div>

        <div className="relative max-w-md w-full">
          <div className="card-premium p-8 text-center">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-6">
              <XCircleIcon className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="font-display text-2xl text-slate-800 mb-4">
              Lien invalide ou expire
            </h2>

            <p className="text-slate-600 mb-6">
              Ce lien de reinitialisation n'est plus valide. Les liens expirent
              apres 1 heure pour des raisons de securite.
            </p>

            <div className="space-y-3">
              <Link
                to={`/${tenant}/forgot-password`}
                className="btn-premium w-full inline-flex items-center justify-center"
              >
                Demander un nouveau lien
              </Link>

              <Link
                to={`/${tenant}/login`}
                className="block w-full text-slate-600 hover:text-violet-700 font-medium py-2 transition-colors text-center"
              >
                Retour a la connexion
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
      <div className="min-h-screen bg-slate-100 relative overflow-hidden flex items-center justify-center px-4">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-200/40 to-violet-200/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-violet-200/30 to-emerald-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        </div>

        <div className="relative max-w-md w-full">
          <div className="card-premium p-8 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 mb-6 animate-scale-in">
              <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="font-display text-2xl text-slate-800 mb-4">
              Mot de passe reinitialise !
            </h2>

            <p className="text-slate-600 mb-2">
              Votre mot de passe a ete mis a jour avec succes.
            </p>

            <p className="text-sm text-slate-500 mb-6">
              Vous allez etre redirige vers la page de connexion...
            </p>

            <Link
              to={`/${tenant}/login`}
              className="btn-premium inline-flex items-center justify-center"
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
            <ShieldCheckIcon className="w-8 h-8 text-violet-700" />
          </div>
          <h1 className="font-display text-display-sm text-slate-800 mb-3">
            Nouveau mot de passe
          </h1>
          {userData && (
            <p className="text-slate-500">
              Bonjour <span className="font-semibold text-slate-700">{userData.first_name}</span>,
              definissez votre nouveau mot de passe
            </p>
          )}
        </div>

        {/* Form Card */}
        <div className="card-premium p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div>
              <label className="label-premium">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="input-premium input-premium-icon pr-12"
                  placeholder="Minimum 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Force du mot de passe</span>
                    <span className={`text-xs font-semibold ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-violet-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${strength.gradient} rounded-full transition-all duration-500 ease-premium`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label-premium">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-premium input-premium-icon pr-12"
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <div className={`mt-2 flex items-center gap-1.5 text-xs ${
                  password === confirmPassword ? "text-emerald-600" : "text-red-600"
                }`}>
                  {password === confirmPassword ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Les mots de passe correspondent
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4" />
                      Les mots de passe ne correspondent pas
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={resetting || password !== confirmPassword || password.length < 8}
              className="btn-premium w-full group"
            >
              {resetting ? (
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
                  Reinitialisation...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Reinitialiser le mot de passe
                  <ShieldCheckIcon className="ml-2 h-5 w-5" />
                </span>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to={`/${tenant}/login`}
              className="text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors"
            >
              Retour a la connexion
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
