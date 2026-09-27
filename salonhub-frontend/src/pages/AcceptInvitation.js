/**
 * AcceptInvitation - Activation d'un compte employé
 *
 * L'employé arrive depuis le lien d'invitation (email / WhatsApp), choisit
 * son mot de passe, puis est connecté directement sur son planning.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageUtils";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  XCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/auth/invitations/${token}`)
      .then((res) => setInvitation(res.data.data))
      .catch((err) =>
        setLoadError(err.response?.data?.error || "Invitation introuvable")
      );
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/auth/invitations/${token}/accept`, { password });
      const result = await login(res.data.data.email, password, true);
      if (result.success) {
        navigate("/appointments", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Impossible d'activer le compte");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {invitation?.salon_logo ? (
            <img
              src={getImageUrl(invitation.salon_logo)}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-soft"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 shadow-soft">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="font-display text-2xl text-slate-800">
            {invitation ? `Bienvenue ${invitation.first_name} !` : "Activation du compte"}
          </h1>
          {invitation && (
            <p className="text-slate-500 mt-2">
              Vous rejoignez l'équipe de <strong>{invitation.salon_name}</strong>.
              Choisissez votre mot de passe pour accéder à votre planning.
            </p>
          )}
        </div>

        <div className="card-premium p-6 sm:p-8">
          {loadError ? (
            <div className="text-center space-y-4">
              <XCircleIcon className="h-10 w-10 text-red-500 mx-auto" />
              <p className="text-slate-700">{loadError}</p>
              <Link to="/login" className="btn-premium inline-flex">
                Aller à la connexion
              </Link>
            </div>
          ) : !invitation ? (
            <div className="flex justify-center py-8" role="status" aria-label="Chargement">
              <div className="w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert-error-premium">
                  <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div>
                <label className="label-premium" htmlFor="invite-email">Email</label>
                <input
                  id="invite-email"
                  type="email"
                  value={invitation.email}
                  readOnly
                  autoComplete="username"
                  className="input-premium bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="label-premium" htmlFor="invite-password">Mot de passe</label>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="invite-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    className="input-premium input-premium-icon pr-12"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label-premium" htmlFor="invite-confirm">Confirmer le mot de passe</label>
                <input
                  id="invite-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="input-premium"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-premium w-full">
                {submitting ? "Activation..." : "Activer mon compte"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
