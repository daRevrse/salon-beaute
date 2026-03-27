// Scripts Firebase
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Ces valeurs doivent correspondre à votre config Firebase
// On pourrait les injecter dynamiquement lors du build si besoin
// Pour l'instant, on les met en dur ou on utilise les valeurs par défaut
firebase.initializeApp({
    apiKey: "AIzaSyDAElArbdzOoiJ7wbHip8MifjnNY3xeSe0",
    authDomain: "salonhub-701f4.firebaseapp.com",
    projectId: "salonhub-701f4",
    storageBucket: "salonhub-701f4.firebasestorage.app",
    messagingSenderId: "374879511321",
    appId: "1:374879511321:web:634fb6101d65356be41b88"
});

const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.data?.icon || '/logo192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
