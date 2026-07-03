// Service Worker do FinanceWS
// Essencial para o Google Chrome criar o WebAPK no Android e permitir a instalação no Nova Launcher

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through padrão (apenas repassa as requisições de rede)
  // Isso garante funcionamento normal de APIs dinâmicas e Supabase sem bugs de cache
  event.respondWith(fetch(event.request));
});
