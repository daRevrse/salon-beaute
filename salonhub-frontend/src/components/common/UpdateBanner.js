/**
 * Bannière de mise à jour SW disponible
 */

import { useState, useEffect } from 'react';
import pwaService from '../../services/pwaService';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

const UpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Écouter l'événement de mise à jour disponible
    const handleUpdate = () => {
      setShowBanner(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
    };
  }, []);

  const handleUpdate = async () => {
    await pwaService.updateServiceWorker();
    // La page sera rechargée automatiquement
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1 min-w-0">
              <span className="flex p-2 rounded-lg bg-white bg-opacity-20">
                <ArrowPathIcon className="h-6 w-6" />
              </span>
              <p className="ml-3 font-medium text-white truncate">
                <span className="inline">Une nouvelle version de SalonHub est disponible !</span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
              <button
                onClick={handleUpdate}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white w-full sm:w-auto"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Mettre à jour maintenant
              </button>
              <button
                onClick={handleDismiss}
                className="flex items-center justify-center p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
