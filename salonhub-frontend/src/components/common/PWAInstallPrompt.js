import React, { useState, useEffect } from 'react';
import usePWA from '../../hooks/usePWA';
import { 
  ArrowDownTrayIcon, 
  XMarkIcon, 
  ShareIcon, 
  PlusSquareIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

/**
 * PWAInstallPrompt - Composant d'incitation à l'installation
 * Affiche un bandeau élégant pour installer l'app (Android/Chrome)
 * ou des instructions pour iOS (Safari).
 */
const PWAInstallPrompt = () => {
  const { canInstall, isInstalled, isPWA, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Ne pas afficher si déjà en mode PWA ou déjà installé
    if (isPWA || isInstalled) {
      setShowPrompt(false);
      return;
    }

    // Afficher après un petit délai pour ne pas agresser l'utilisateur
    const timer = setTimeout(() => {
      if (canInstall || (ios && !isInstalled)) {
        // Vérifier si l'utilisateur a déjà décliné dans cette session
        const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, isPWA]);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    const outcome = await installApp();
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-slide-up">
      <div className="bg-white/90 backdrop-blur-md border border-violet-100 shadow-glow-lg rounded-2xl overflow-hidden">
        {/* Header avec bouton fermer */}
        <div className="flex justify-between items-start p-4 pb-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg text-white shadow-soft">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800">Installer SalonHub</h3>
              <p className="text-xs text-slate-500">Accédez plus rapidement à votre gestion</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isIOS ? (
            /* Instructions iOS */
            <div className="bg-violet-50/50 rounded-xl p-3 border border-violet-100/50">
              <p className="text-sm text-slate-700 leading-relaxed">
                Pour installer l'application sur votre iPhone :
              </p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded text-indigo-600">
                    <ShareIcon className="h-4 w-4" />
                  </div>
                  <span>Appuyez sur le bouton <strong>Partager</strong></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded text-indigo-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </div>
                  <span>Sélectionnez <strong>Sur l'écran d'accueil</strong></span>
                </div>
              </div>
            </div>
          ) : (
            /* Bouton Android/Chrome */
            <div className="text-sm text-slate-600">
              Profitez d'une expérience plus fluide, hors ligne et sans barre de recherche.
            </div>
          )}

          {!isIOS && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Installer maintenant
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
