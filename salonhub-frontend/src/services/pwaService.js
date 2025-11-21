/**
 * Service de gestion PWA et Notifications Push
 */

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.serviceWorkerRegistration = null;
  }

  /**
   * Enregistrer le Service Worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        this.serviceWorkerRegistration = registration;
        console.log('✅ Service Worker enregistré:', registration);

        // Écouter les mises à jour du Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nouvelle version disponible');
              // Notifier l'utilisateur qu'une mise à jour est disponible
              this.notifyUpdate();
            }
          });
        });

        return registration;
      } catch (error) {
        console.error('❌ Erreur enregistrement Service Worker:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Demander la permission pour les notifications
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Les notifications ne sont pas supportées');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Permission notifications déjà accordée');
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission notifications:', permission);
      return permission;
    }

    return Notification.permission;
  }

  /**
   * S'abonner aux notifications push
   */
  async subscribeToPushNotifications() {
    if (!this.serviceWorkerRegistration) {
      console.error('❌ Service Worker non enregistré');
      return null;
    }

    try {
      // Demander la permission
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Permission notifications refusée');
        return null;
      }

      // S'abonner aux notifications push
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || 'default-public-key'
        )
      });

      console.log('✅ Abonné aux notifications push:', subscription);
      return subscription;
    } catch (error) {
      console.error('❌ Erreur abonnement push:', error);
      return null;
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribeFromPushNotifications() {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Désabonné des notifications push');
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur désabonnement push:', error);
    }
    return false;
  }

  /**
   * Afficher une notification locale
   */
  async showLocalNotification(title, options = {}) {
    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      return false;
    }

    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        tag: options.tag || 'salonhub-notification',
        data: options.data || {},
        ...options
      });
      return true;
    }

    return false;
  }

  /**
   * Écouter l'événement d'installation PWA
   */
  listenForInstallPrompt(callback) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('📱 PWA peut être installée');
      if (callback) callback(e);
    });
  }

  /**
   * Vérifier si l'app est installée
   */
  isInstalled() {
    // Vérifie si l'app est en mode standalone (installée)
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  /**
   * Vérifier si l'installation est possible
   */
  canInstall() {
    return this.deferredPrompt !== null;
  }

  /**
   * Afficher le prompt d'installation
   */
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('⚠️ Prompt d\'installation non disponible');
      return null;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('📱 Résultat installation:', outcome);

    this.deferredPrompt = null;
    return outcome;
  }

  /**
   * Planifier un rappel de rendez-vous
   */
  async scheduleAppointmentReminder(appointment) {
    if (!this.serviceWorkerRegistration) {
      console.warn('⚠️ Service Worker non disponible pour les rappels');
      return false;
    }

    try {
      // Stocker le rappel dans IndexedDB
      await this.storeReminder({
        id: appointment.id,
        clientName: `${appointment.client_first_name} ${appointment.client_last_name}`,
        serviceName: appointment.service_name,
        time: appointment.start_time,
        date: appointment.appointment_date,
        sent: false
      });

      // Enregistrer une synchronisation en arrière-plan
      if ('sync' in this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.sync.register('sync-appointments');
        console.log('✅ Rappel planifié pour:', appointment.client_first_name);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur planification rappel:', error);
      return false;
    }
  }

  /**
   * Stocker un rappel dans IndexedDB
   */
  async storeReminder(reminder) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SalonHubDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['reminders'], 'readwrite');
        const store = transaction.objectStore('reminders');
        const addRequest = store.put(reminder);

        addRequest.onerror = () => reject(addRequest.error);
        addRequest.onsuccess = () => resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Notifier d'une mise à jour disponible
   */
  notifyUpdate() {
    // Émission d'un événement personnalisé
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  /**
   * Recharger avec la nouvelle version
   */
  async updateServiceWorker() {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Recharger la page une fois le nouveau SW activé
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Convertir la clé VAPID
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PWAService();
