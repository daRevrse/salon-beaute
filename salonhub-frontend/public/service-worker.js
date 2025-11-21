/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'salonhub-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('❌ Erreur lors du cache:', error);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de cache: Network First, puis Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la réponse
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, utilise le cache
        return caches.match(event.request);
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('🔔 Notification push reçue:', event);

  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'SalonHub',
        body: event.data.text(),
        icon: '/logo192.png'
      };
    }
  }

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'salonhub-notification',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SalonHub', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Clic sur notification:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Vérifie si une fenêtre est déjà ouverte
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvre une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gestion de la synchronisation en arrière-plan (pour les rappels)
self.addEventListener('sync', (event) => {
  console.log('🔄 Synchronisation en arrière-plan:', event.tag);

  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  try {
    // Récupère les rappels en attente depuis IndexedDB
    const db = await openDB();
    const pendingReminders = await getPendingReminders(db);

    // Envoie les notifications pour les rappels
    for (const reminder of pendingReminders) {
      await self.registration.showNotification('Rappel de rendez-vous', {
        body: `${reminder.clientName} - ${reminder.serviceName} à ${reminder.time}`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: `appointment-${reminder.id}`,
        data: {
          url: '/appointments',
          appointmentId: reminder.id
        }
      });

      // Marque le rappel comme envoyé
      await markReminderAsSent(db, reminder.id);
    }
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
  }
}

// Utilitaires IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SalonHubDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
  });
}

function getPendingReminders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reminders'], 'readonly');
    const store = transaction.objectStore('reminders');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const now = new Date();
      const pending = request.result.filter(r => !r.sent && new Date(r.time) <= now);
      resolve(pending);
    };
  });
}

function markReminderAsSent(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reminders'], 'readwrite');
    const store = transaction.objectStore('reminders');
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const reminder = request.result;
      if (reminder) {
        reminder.sent = true;
        store.put(reminder);
      }
      resolve();
    };
  });
}
