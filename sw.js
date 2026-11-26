// Service worker de Chloé Planner : garde l'application sur l'appareil pour qu'elle s'ouvre sans réseau.
// Gabarit : `vite.config.ts` (plugin « service worker ») le copie dans dist/sw.js après la construction,
// en y mettant la liste des fichiers construits et une version tirée de leur contenu.
// Les chemins sont relatifs au dossier du service worker : le site peut vivre sous n'importe quel préfixe.
const CACHE = 'chloe-planner-0173dfce920a';
const FICHIERS = [
  "./",
  "apple-touch-icon.png",
  "assets/index-D78IJVXb.js",
  "assets/index-Dfgc6MQ-.css",
  "assets/sqlite3-BgB0NfVZ.wasm",
  "assets/travailleur-CnWO9ZyS.js",
  "icone-192.png",
  "icone-512.png",
  "icone-maskable-512.png",
  "icone.svg",
  "index.html",
  "manifest.webmanifest"
];

// Installation : tout le site est mis en cache d'un coup. Un fichier manquant fait échouer l'installation
// (l'ancienne version reste alors en service) plutôt que de laisser un site incomplet hors ligne.
self.addEventListener('install', (évènement) => {
  évènement.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FICHIERS.map((fichier) => new Request(fichier, { cache: 'reload' })))),
  );
});

// Activation : les caches des versions précédentes partent. Sans `skipWaiting`, la nouvelle version ne
// prend la main qu'une fois toutes les pages de l'ancienne fermées : jamais deux versions mélangées.
self.addEventListener('activate', (évènement) => {
  évènement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom.startsWith('chloe-planner-') && nom !== CACHE).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

// La page propose la nouvelle version (« Recharger ») : elle prend alors la main sur l'ancienne.
self.addEventListener('message', (évènement) => {
  if (évènement.data === 'skipWaiting') self.skipWaiting();
});

// Requêtes : le cache d'abord. Une page demandée (ouverture, rechargement) reçoit `index.html`.
self.addEventListener('fetch', (évènement) => {
  const requête = évènement.request;
  if (requête.method !== 'GET' || new URL(requête.url).origin !== self.location.origin) return;
  évènement.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const trouvée = await cache.match(requête, { ignoreSearch: true });
      if (trouvée) return trouvée;
      if (requête.mode === 'navigate') {
        const accueil = await cache.match(new URL('index.html', self.registration.scope).href);
        if (accueil) return accueil;
      }
      return fetch(requête);
    }),
  );
});
