/**
 * FinishStep - Écran final de l'assistant
 * Si le salon est prêt (horaires + services), marque l'onboarding comme
 * terminé (PUT /settings/onboarding/complete) et propose de partager le lien
 * de réservation. Sinon, liste ce qui manque avec un accès direct à l'étape.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import useOnboardingProgress from "../../../hooks/useOnboardingProgress";
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const FinishStep = ({ config, term, onGoToStep }) => {
  const navigate = useNavigate();
  const { tenant, refreshTenant } = useAuth();
  const [copied, setCopied] = useState(false);
  const { loading, ready, hoursDone, servicesDone } = useOnboardingProgress();

  // Marquer l'onboarding terminé uniquement si le salon peut recevoir des réservations
  useEffect(() => {
    if (loading || !ready) return undefined;
    let active = true;
    api
      .put("/settings/onboarding/complete")
      .then(() => {
        if (active && refreshTenant) refreshTenant();
      })
      .catch((err) =>
        console.error("Erreur marquage onboarding terminé:", err)
      );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ready]);

  const bookingUrl = `${window.location.origin}/book/${tenant?.slug || ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* noop */
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Réservez en ligne : ${bookingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin" />
      </div>
    );
  }

  if (!ready) {
    const missing = [
      !hoursDone && { key: "hours", label: "Renseigner vos horaires d'ouverture" },
      !servicesDone && { key: "services", label: `Ajouter vos ${term.services.toLowerCase()}` },
    ].filter(Boolean);
    return (
      <div className="text-center animate-fade-in-up py-2">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-100 mb-5">
          <ExclamationTriangleIcon className="h-9 w-9 text-amber-600" />
        </div>
        <h2 className="font-display text-2xl text-slate-800 mb-2">Presque prêt !</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Pour que vos {term.clients.toLowerCase()} puissent réserver en ligne, il reste à configurer :
        </p>
        <div className="max-w-md mx-auto space-y-2 mb-8 text-left">
          {missing.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onGoToStep?.(item.key)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <ArrowRightIcon className="h-4 w-4 text-amber-700" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Je terminerai plus tard depuis le tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="text-center animate-fade-in-up py-2">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-5">
        <CheckCircleIcon className="h-9 w-9 text-white" />
      </div>

      <h2 className="font-display text-2xl text-slate-800 mb-2">
        Votre {term.establishment.toLowerCase()} est prêt ! 🎉
      </h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Partagez votre lien de réservation avec vos clients pour commencer à
        recevoir des {term.appointments.toLowerCase()}.
      </p>

      {/* Lien de réservation */}
      <div className="mb-6 text-left max-w-lg mx-auto">
        <label htmlFor="finishstep-votre-lien-de-reservation" className="text-sm font-medium text-slate-700 mb-2 block">
          Votre lien de réservation
        </label>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          <input id="finishstep-votre-lien-de-reservation"
            type="text"
            readOnly
            value={bookingUrl}
            className="flex-1 min-w-0 px-4 py-3 bg-slate-50 text-sm text-slate-600 border-0 focus:outline-none"
          />
          <button aria-label="Copier le lien"
            onClick={handleCopy}
            className="px-4 py-3 bg-white border-l border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
          </button>
        </div>
        {copied && (
          <p className="mt-2 text-sm text-emerald-600 font-medium">
            Lien copié !
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleShareWhatsApp}
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
        >
          Partager sur WhatsApp
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-premium group w-full sm:w-auto"
        >
          <span className="flex items-center justify-center">
            Aller au tableau de bord
            <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default FinishStep;
