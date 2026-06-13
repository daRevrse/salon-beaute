/**
 * OnboardingWizard - Assistant de configuration post-inscription
 *
 * Accompagne le nouvel utilisateur dans la configuration de son établissement
 * (infos → horaires → services) avant d'accéder au tableau de bord.
 * Chaque étape est SKIPPABLE ; un lien "Je terminerai plus tard" mène au dashboard.
 * La reprise se fait via ?step=<key> (utilisé par la checklist du dashboard).
 *
 * Adaptatif multi-secteur via businessTypeConfig (v1 peaufinée : Beauté / violet).
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getBusinessTypeConfig } from "../../utils/businessTypeConfig";
import {
  CheckIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import SalonInfoStep from "./steps/SalonInfoStep";
import HoursStep from "./steps/HoursStep";
import ServicesStep from "./steps/ServicesStep";
import FinishStep from "./steps/FinishStep";

const STEPS = [
  { key: "info", label: "Infos", icon: BuildingStorefrontIcon },
  { key: "hours", label: "Horaires", icon: ClockIcon },
  { key: "services", label: "Services", icon: SparklesIcon },
];
const STEP_KEYS = STEPS.map((s) => s.key);

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenant, user } = useAuth();
  const config = getBusinessTypeConfig(tenant?.business_type);
  const term = config.terminology;

  const initialStep = (() => {
    const s = searchParams.get("step");
    return STEP_KEYS.includes(s) || s === "finish" ? s : "info";
  })();
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goTo = (key) => {
    setCurrentStep(key);
    setSearchParams(key === "info" ? {} : { step: key }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentIndex = STEP_KEYS.indexOf(currentStep);
  const isFinish = currentStep === "finish";

  const next = () => {
    if (currentIndex >= 0 && currentIndex < STEP_KEYS.length - 1) {
      goTo(STEP_KEYS[currentIndex + 1]);
    } else {
      goTo("finish");
    }
  };
  const back = () => {
    if (currentIndex > 0) goTo(STEP_KEYS[currentIndex - 1]);
  };
  const skipAll = () => navigate("/dashboard");

  const percent = isFinish
    ? 100
    : Math.round((currentIndex / STEP_KEYS.length) * 100);

  const stepProps = {
    config,
    term,
    onNext: next,
    onSkip: next,
    onBack: currentIndex > 0 ? back : null,
  };

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-hidden">
      {/* Décor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-200/50 to-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-200/40 to-indigo-200/20 blur-3xl" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
      </div>

      <div className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SalonHub"
                className="w-10 h-10 rounded-xl shadow-soft object-cover"
              />
              <span className="font-display text-xl text-slate-800 tracking-tight">
                SalonHub
              </span>
            </div>
            {!isFinish && (
              <button
                onClick={skipAll}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Je terminerai plus tard →
              </button>
            )}
          </div>

          {!isFinish && (
            <>
              {/* Titre */}
              <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-3xl text-slate-800 mb-2">
                  Configurons votre {term.establishment.toLowerCase()}
                </h1>
                <p className="text-slate-500">
                  Quelques étapes rapides pour être prêt à recevoir vos{" "}
                  {term.appointments.toLowerCase()}. Vous pouvez passer une
                  étape et y revenir plus tard.
                </p>
              </div>

              {/* Barre de progression */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-violet-600 w-10 text-right">
                    {percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => goTo(step.key)}
                        className="flex items-center gap-2 group"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                            isDone
                              ? "bg-gradient-to-br from-violet-500 to-indigo-600 border-violet-500 text-white"
                              : isCurrent
                              ? "bg-white border-violet-400 text-violet-600 shadow-soft"
                              : "bg-white/60 border-slate-200 text-slate-300"
                          }`}
                        >
                          {isDone ? (
                            <CheckIcon className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium hidden sm:inline ${
                            isCurrent
                              ? "text-violet-700"
                              : isDone
                              ? "text-violet-600"
                              : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Contenu de l'étape */}
          <div className="card-premium p-6 sm:p-8">
            {currentStep === "info" && <SalonInfoStep {...stepProps} />}
            {currentStep === "hours" && <HoursStep {...stepProps} />}
            {currentStep === "services" && <ServicesStep {...stepProps} />}
            {currentStep === "finish" && (
              <FinishStep config={config} term={term} user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
