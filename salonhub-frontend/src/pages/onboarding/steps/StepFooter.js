/**
 * StepFooter - Barre d'actions partagée des étapes d'onboarding
 * Boutons : Retour (optionnel) · Passer · Continuer
 */

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const StepFooter = ({
  onBack,
  onSkip,
  onContinue,
  continueLabel = "Continuer",
  saving = false,
  continueDisabled = false,
}) => {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Retour
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          Passer
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={saving || continueDisabled}
          className="btn-premium group"
        >
          {saving ? (
            <span className="flex items-center">
              <svg
                className="animate-elegant-spin -ml-1 mr-2 h-5 w-5 text-white"
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
              Enregistrement...
            </span>
          ) : (
            <span className="flex items-center">
              {continueLabel}
              <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepFooter;
