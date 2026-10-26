"use strict";

/* Ultraball · service worker
   - Archivos de la app: red primero (siempre ves la última versión) y, si no hay red, caché.
   - PokéAPI: caché inmediata + actualización en segundo plano (los Pokémon ya vistos funcionan sin conexión).
   - Sprites: caché primero. */

const CACHE_ESTATICO = "ultraball-estatico-v1";
const CACHE_API = "ultraball-api-v1";
const CACHE_IMAGENES = "ultraball-imagenes-v1";
const CACHES_ACTUALES = [CACHE_ESTATICO, CACHE_API, CACHE_IMAGENES];

const MAX_API = 800;
const MAX_IMAGENES = 400;
const ESPERA_RED_MS = 4000;

const TIPOS = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
    "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const ARCHIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./datos.json",
    "./manifest.json",
    "./icon-180.png",
    "./icon-192.png",
    "./icon-512.png",
    "./splash/splash-1080x2340.png",
    "./splash/splash-1125x2436.png",
    "./splash/splash-1170x2532.png",
    "./splash/splash-1179x2556.png",
    "./splash/splash-1206x2622.png",
    "./splash/splash-1242x2208.png",
    "./splash/splash-1242x2688.png",
    "./splash/splash-1260x2736.png",
    "./splash/splash-1284x2778.png",
    "./splash/splash-1290x2796.png",
    "./splash/splash-1320x2868.png",
    "./splash/splash-640x1136.png",
    "./splash/splash-750x1334.png",
    "./splash/splash-828x1792.png",
    ...TIPOS.map(tipo => `./assets/backgrounds/${tipo}.gif`)
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_ESTATICO)
            /* Cada archivo por separado: si falta uno (p. ej. un GIF) no se cae toda la instalación */
            .then(cache => Promise.allSettled(ARCHIVOS.map(archivo => cache.add(archivo))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(claves => Promise.all(
                claves
                    .filter(clave => !CACHES_ACTUALES.includes(clave))
                    .map(clave => caches.delete(clave))
            ))
            .then(() => self.clients.claim())
    );
});

async function recortar(nombreCache, maximo) {
    const cache = await caches.open(nombreCache);
    const claves = await cache.keys();

    for (const clave of claves.slice(0, Math.max(0, claves.length - maximo))) {
        await cache.delete(clave);
    }
}

function esRespuestaGuardable(respuesta) {
    return respuesta && (respuesta.ok || respuesta.type === "opaque");
}

function redConLimite(peticion, ms) {
    return new Promise((resolver, rechazar) => {
        const temporizador = setTimeout(() => rechazar(new Error("tiempo agotado")), ms);

        fetch(peticion).then(
            respuesta => {
                clearTimeout(temporizador);
                resolver(respuesta);
            },
            error => {
                clearTimeout(temporizador);
                rechazar(error);
            }
        );
    });
}

async function redPrimero(event) {
    const peticion = event.request;
    const cache = await caches.open(CACHE_ESTATICO);

    try {
        const respuesta = await redConLimite(peticion, ESPERA_RED_MS);

        if (respuesta.ok) {
            event.waitUntil(cache.put(peticion, respuesta.clone()));
        }

        return respuesta;
    } catch {
        const guardada = await cache.match(peticion, { ignoreSearch: true });

        if (guardada) {
            return guardada;
        }

        if (peticion.mode === "navigate") {
            const inicio = await cache.match("./index.html");

            if (inicio) {
                return inicio;
            }
        }

        return fetch(peticion);
    }
}

async function guardadaYActualiza(event, nombreCache, maximo) {
    const peticion = event.request;
    const cache = await caches.open(nombreCache);
    const guardada = await cache.match(peticion);

    const actualizacion = fetch(peticion)
        .then(async respuesta => {
            if (esRespuestaGuardable(respuesta)) {
                await cache.put(peticion, respuesta.clone());
                await recortar(nombreCache, maximo);
            }

            return respuesta;
        })
        .catch(() => null);

    if (guardada) {
        event.waitUntil(actualizacion);
        return guardada;
    }

    const respuesta = await actualizacion;
    return respuesta || Response.error();
}

async function cachePrimero(event, nombreCache, maximo) {
    const peticion = event.request;
    const cache = await caches.open(nombreCache);
    const guardada = await cache.match(peticion);

    if (guardada) {
        return guardada;
    }

    const respuesta = await fetch(peticion);

    if (esRespuestaGuardable(respuesta)) {
        event.waitUntil(cache.put(peticion, respuesta.clone()).then(() => recortar(nombreCache, maximo)));
    }

    return respuesta;
}

self.addEventListener("fetch", event => {
    const peticion = event.request;

    if (peticion.method !== "GET") {
        return;
    }

    const url = new URL(peticion.url);

    if (url.origin === self.location.origin) {
        event.respondWith(redPrimero(event));
        return;
    }

    if (url.hostname === "pokeapi.co") {
        event.respondWith(guardadaYActualiza(event, CACHE_API, MAX_API));
        return;
    }

    if (url.hostname === "raw.githubusercontent.com") {
        event.respondWith(cachePrimero(event, CACHE_IMAGENES, MAX_IMAGENES));
    }
});
