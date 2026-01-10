import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'Nova Notificação', body: event.data.text() }
    }
  }

  const title = data.title || 'Agendamento';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
        url: data.url || '/admin'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const urlToOpen = event.notification.data.url;
      
      // Focus if already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client)
          return client.focus();
      }
      // Open if not
      if (clients.openWindow)
        return clients.openWindow(urlToOpen);
    })
  );
});
