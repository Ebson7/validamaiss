/**
 * Firebase Cloud Messaging Service Worker
 * This file handles notifications in background tabs/screens.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Config pública do cliente Firebase (mesmos valores de firebase-applet-config.json).
// Estes valores são públicos por natureza (embarcados no app web); a segurança
// vem das regras do Firestore/FCM, não do sigilo destas chaves.
firebase.initializeApp({
  apiKey: "AIzaSyAA1FS4UBJThxREXox6-zZNmVrSnz4Vn50",
  authDomain: "gen-lang-client-0971671639.firebaseapp.com",
  projectId: "gen-lang-client-0971671639",
  storageBucket: "gen-lang-client-0971671639.firebasestorage.app",
  messagingSenderId: "128041021133",
  appId: "1:128041021133:web:661b8bdc4c7a5c4c424384"
});

// Retrieve an instance of Firebase Cloud Messaging.
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Desconto Imperdível no ValidaMais!';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Um mercado próximo adicionou produtos com validade curta e descontos incríveis. Confira!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to redirect the client
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
