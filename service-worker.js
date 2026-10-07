const CACHE_NAME = "pokedex-v9-v2";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./assets/backgrounds/normal.gif",
    "./assets/backgrounds/fire.gif",
    "./assets/backgrounds/water.gif",
    "./assets/backgrounds/electric.gif",
    "./assets/backgrounds/grass.gif",
    "./assets/backgrounds/ice.gif",
    "./assets/backgrounds/fighting.gif",
    "./assets/backgrounds/poison.gif",
    "./assets/backgrounds/ground.gif",
    "./assets/backgrounds/flying.gif",
    "./assets/backgrounds/psychic.gif",
    "./assets/backgrounds/bug.gif",
    "./assets/backgrounds/rock.gif",
    "./assets/backgrounds/ghost.gif",
    "./assets/backgrounds/dragon.gif",
    "./assets/backgrounds/dark.gif",
    "./assets/backgrounds/steel.gif",
    "./assets/backgrounds/fairy.gif"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(claves => Promise.all(
                claves
                    .filter(clave => clave !== CACHE_NAME)
                    .map(clave => caches.delete(clave))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(respuesta => {
                const copia = respuesta.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
                return respuesta;
            })
            .catch(() => caches.match(event.request))
    );
});
