import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { BellIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';

const TestNotification = () => {
  const socket = useSocket();
  const { user, tenant } = useAuth();
  const [status, setStatus] = useState('idle');
  const [subscribeStatus, setSubscribeStatus] = useState('idle');
  const [fcmToken, setFcmToken] = useState(pwaService.fcmToken);

  const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
  const isVapidLoaded = !!vapidKey && vapidKey !== 'default-public-key';

  const handleTestNotification = async () => {
    if (!socket?.connected) {
      setStatus('error');
      alert("Socket non connecté. Vérifiez votre connexion.");
      return;
    }

    setStatus('sending');

    try {
      // 1. Déclencher un événement local via socket pour tester le Bell
      socket.emit('test_notification', {
        tenant_id: user?.tenant_id || tenant?.id,
        message: 'Ceci est une notification de test ! 🧪'
      });

      // 2. Tester une notification push locale (Navigateur)
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          await pwaService.showLocalNotification('Test SalonHub 🔔', {
            body: 'Si vous voyez ceci, les notifications locales (Service Worker) fonctionnent !',
            icon: '/logo192.png'
          });
        } else {
          console.warn("Permission de notification non accordée pour le test local");
        }
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleForceSubscribe = async () => {
    setSubscribeStatus('sending');
    try {
      // S'abonner à VAPID et FCM
      const sub = await pwaService.subscribeToPushNotifications();
      
      // Mettre à jour le token localement pour l'affichage
      setFcmToken(pwaService.fcmToken);

      if (sub || pwaService.fcmToken) {
        setSubscribeStatus('success');
        alert(`Abonnement push réussi !${pwaService.fcmToken ? ' (FCM Token obtenu)' : ' (VAPID seulement)'}`);
      } else {
        setSubscribeStatus('error');
        alert("Échec de l'abonnement. Vérifiez les permissions du navigateur.");
      }
    } catch (err) {
      console.error(err);
      setSubscribeStatus('error');
    } finally {
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    }
  };

  const handleTestBackendSync = async () => {
    setStatus('sending');
    try {
      const response = await pwaService.sendTestNotification();
      if (response.success) {
        setStatus('success');
      } else {
        setStatus('error');
        alert(`Erreur backend: ${response.error || 'Inconnue'}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
            <BellIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Diagnostic Notifications</h3>
            <p className="text-sm text-slate-500">Vérifiez l'état technique de vos alertes</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isVapidLoaded ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          VAPID: {isVapidLoaded ? 'OK' : 'MANQUANT'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          socket?.connected ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase opacity-60">Temps Réel (Socket)</span>
            <span className="text-sm font-medium">{socket?.connected ? 'Connecté' : 'Déconnecté'}</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          Notification.permission === 'granted' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${Notification.permission === 'granted' ? 'bg-blue-500' : 'bg-slate-400'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase opacity-60">Permissions Push</span>
            <span className="text-sm font-medium">
              {Notification.permission === 'granted' ? 'Autorisé' : 
               Notification.permission === 'denied' ? 'Bloqué' : 'Non demandé'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-xs font-mono text-slate-500 space-y-1 overflow-hidden">
        <div>TENANT_ID: <span className="text-slate-700">{user?.tenant_id || tenant?.id || 'NON_DEFINI'}</span></div>
        <div>VAPID_KEY: <span className="text-slate-700">{isVapidLoaded ? 'OK' : 'MANQUANT'}</span></div>
        <div>FCM_TOKEN: <span className="text-violet-600 break-all">{fcmToken ? `${fcmToken.substring(0, 20)}...` : 'NON_GENERE'}</span></div>
        {fcmToken && (
           <div className="mt-2 text-[8px] leading-tight text-slate-400 select-all border-t border-slate-200 pt-1">
             Full FCM: {fcmToken}
           </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleTestBackendSync}
          disabled={status === 'sending'}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all
            ${status === 'success' ? 'bg-emerald-500 text-white' : 
              status === 'error' ? 'bg-red-500 text-white' : 
              'bg-slate-800 hover:bg-slate-900 text-white shadow-soft'}
          `}
        >
          {status === 'sending' ? (
            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : status === 'success' ? (
            <>Test Réussi ! ✅</>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Tester Push via Backend
            </>
          )}
        </button>

        <button
          onClick={handleForceSubscribe}
          disabled={subscribeStatus === 'sending'}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold border-2 transition-all
            ${subscribeStatus === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 
              subscribeStatus === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 
              'border-slate-200 hover:border-slate-800 text-slate-700'}
          `}
        >
          {subscribeStatus === 'sending' ? (
            <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-slate-800 rounded-full" />
          ) : (
            <>Forcer Abonnement Push</>
          )}
        </button>
      </div>
    </div>
  );
};

export default TestNotification;
