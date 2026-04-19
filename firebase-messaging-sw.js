// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
   apiKey: "AIzaSyDdZV7b_23WAuu6kiKfpLxdL-v9zpgWjBM",
   authDomain: "disciplin-chat.firebaseapp.com",
   projectId: "disciplin-chat",
    storageBucket: "disciplin-chat.firebasestorage.app",
    messagingSenderId: "595537471459",
    appId: "1:595537471459:web:4c6c35e907c947a8d222d6"
});

const messaging = firebase.messaging();

// Handle background messages (when app is closed or tab is not active)
messaging.onBackgroundMessage(function(payload) {
    const { title, body, icon } = payload.notification;
    self.registration.showNotification(title, {
        body  : body || 'Time to check in on Disciplin.',
        icon  : icon || 'https://miseducatemen.wordpress.com/wp-content/uploads/2025/08/favicon.jpg',
        badge : 'https://miseducatemen.wordpress.com/wp-content/uploads/2025/08/favicon.jpg',
        tag   : 'disciplin-reminder',
        renotify: true,
        data  : { url: 'https://disciplinme.vercel.app' }
    });
});

// When user taps the notification, open the app
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                if (clientList[i].url && 'focus' in clientList[i]) {
                    return clientList[i].focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('https://disciplinme.vercel.app');
            }
        })
    );
});
