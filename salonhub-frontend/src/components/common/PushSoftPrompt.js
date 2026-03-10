/**
 * Composant PushSoftPrompt
 * Invite discrètement l'utilisateur à activer les notifications
 */

import React, { useState, useEffect } from 'react';
import pwaService from '../../services/pwaService';
import { BellIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

const PushSoftPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Vérifier la permission actuelle
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Afficher le prompt si la permission est 'default' (pas encore demandé)
      // et si l'utilisateur est connecté (on suppose que si ce composant est rendu, 
      // c'est dans un contexte où c'est pertinent)
      if (Notification.permission === 'default') {
        // Attendre un peu avant d'afficher pour ne pas agresser l'utilisateur
        const timer = setTimeout(() => {
          // Ne pas afficher si déjà refusé dans cette session (via state local)
          const dismissed = sessionStorage.getItem('push-prompt-dismissed');
          if (!dismissed) {
            setIsVisible(true);
          }
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnable = async () => {
    const result = await pwaService.requestNotificationPermission();
    setPermission(result);
    setIsVisible(false);

    if (result === 'granted') {
      await pwaService.subscribeToPushNotifications();
      // Notification de succès
      await pwaService.showLocalNotification('Notifications activées ! ✅', {
        body: 'Merci ! Vous recevrez désormais vos alertes en temps réel.',
        icon: '/logo192.png'
      });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('push-prompt-dismissed', 'true');
  };

  if (!isVisible || permission !== 'default') return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-2xl shadow-premium border border-violet-100 p-5 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-100/50 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
            <BellIcon className="h-6 w-6 text-violet-600 animate-ring" />
          </div>
          
          <div className="flex-grow pr-6">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-800">Restez informé</h4>
              <SparklesIcon className="h-3 w-3 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Activez les notifications pour ne jamais manquer un rendez-vous ou une mise à jour importante de votre salon.
            </p>
            
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleEnable}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg
                         transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                Activer
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg
                         transition-all duration-200 active:scale-95"
              >
                Plus tard
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushSoftPrompt;
