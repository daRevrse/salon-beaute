/**
 * OnboardingChecklistCard - Carte de reprise de configuration (dashboard)
 *
 * Remplace l'ancienne alerte rouge anxiogène : présente de façon rassurante
 * les étapes restantes (Infos / Horaires / Services) avec une barre de
 * progression, et permet de reprendre l'assistant là où on s'est arrêté.
 * Masquée lorsque l'onboarding est terminé ou que l'utilisateur la ferme.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import useOnboardingProgress from "../../hooks/useOnboardingProgress";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  XMarkIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const DISMISS_KEY = "onboardingChecklistDismissed";

const OnboardingChecklistCard = () => {
  const {
    loading,
    salonInfoDone,
    hoursDone,
    servicesDone,
    doneCount,
    totalSteps,
    completed,
  } = useOnboardingProgress();

  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );

  if (loading || completed || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const percent = Math.round((doneCount / totalSteps) * 100);

  const steps = [
    {
      key: "info",
      label: "Renseigner les infos de votre salon",
      done: salonInfoDone,
    },
    { key: "hours", label: "Configurer vos horaires d'ouverture", done: hoursDone },
    { key: "services", label: "Ajouter vos premiers services", done: servicesDone },
  ];

  return (
    <div className="mb-6 bg-white border border-violet-100 rounded-2xl shadow-soft overflow-hidden animate-fade-in">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <RocketLaunchIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-800">
                Terminez la configuration de votre salon
              </h3>
              <p className="text-sm text-slate-500">
                {doneCount} étape{doneCount > 1 ? "s" : ""} sur {totalSteps} —
                bientôt prêt à recevoir des réservations !
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Masquer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="mt-4 mb-5 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-violet-600 w-10 text-right">
            {percent}%
          </span>
        </div>

        {/* Étapes */}
        <div className="space-y-2">
          {steps.map((step) => (
            <Link
              key={step.key}
              to={`/onboarding?step=${step.key}`}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
                step.done
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-slate-200 hover:border-violet-300 hover:bg-violet-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircleSolid className="h-6 w-6 text-emerald-500" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6 text-slate-300" />
                )}
                <span
                  className={`text-sm font-medium ${
                    step.done ? "text-slate-500 line-through" : "text-slate-700"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!step.done && (
                <ChevronRightIcon className="h-5 w-5 text-slate-400" />
              )}
            </Link>
          ))}
        </div>

        <Link
          to="/onboarding"
          className="mt-5 inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:shadow-glow transition-all duration-300"
        >
          Continuer la configuration
          <ChevronRightIcon className="h-5 w-5 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default OnboardingChecklistCard;
