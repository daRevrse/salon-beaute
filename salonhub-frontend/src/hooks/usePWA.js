import { useState, useEffect } from 'react';
import pwaService from '../services/pwaService';

/**
 * usePWA - Hook pour gérer l'état d'installation de la PWA
 */
const usePWA = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé ou en mode PWA
    const checkStatus = () => {
      const installed = pwaService.isInstalled();
      setIsInstalled(installed);
      
      const pwaMode = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
      setIsPWA(pwaMode);
    };

    checkStatus();

    // Écouter le prompt d'installation
    const handleInstallPrompt = (e) => {
      setCanInstall(true);
    };

    pwaService.listenForInstallPrompt(handleInstallPrompt);

    // Si le prompt est déjà disponible dans le service
    if (pwaService.canInstall()) {
      setCanInstall(true);
    }

    // Écouter l'événement d'installation réussie
    window.addEventListener('appinstalled', () => {
      setCanInstall(false);
      setIsInstalled(true);
      console.log('✨ PWA installée avec succès');
    });

    return () => {
      // Le service gère ses propres listeners d'événements window
    };
  }, []);

  const installApp = async () => {
    if (canInstall) {
      const outcome = await pwaService.showInstallPrompt();
      if (outcome === 'accepted') {
        setCanInstall(false);
      }
      return outcome;
    }
    return null;
  };

  return {
    canInstall,
    isInstalled,
    isPWA,
    installApp
  };
};

export default usePWA;
