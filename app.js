"use strict";

/* ==========================================================================
   Ultraball · Pokédex personal
   Datos en vivo desde PokéAPI + datos.json (nombres en español, tipos, listas)
   ========================================================================== */

const API = "https://pokeapi.co/api/v2";
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const NIVEL_STATS = 50;
const ESPECIES_MAXIMO_DEFECTO = 1025;
const TIEMPO_ESPERA_MS = 12000;
const SWIPE_ACTIVO = true; // gesto de deslizar para ir al Pokémon anterior/siguiente

const nombresTipos = {
    normal: "Normal",
    fire: "Fuego",
    water: "Agua",
    electric: "Eléctrico",
    grass: "Planta",
    ice: "Hielo",
    fighting: "Lucha",
    poison: "Veneno",
    ground: "Tierra",
    flying: "Volador",
    psychic: "Psíquico",
    bug: "Bicho",
    rock: "Roca",
    ghost: "Fantasma",
    dragon: "Dragón",
    dark: "Siniestro",
    steel: "Acero",
    fairy: "Hada"
};

const coloresTipos = {
    normal: "#a8a77a",
    fire: "#ee8130",
    water: "#6390f0",
    electric: "#f7d02c",
    grass: "#7ac74c",
    ice: "#96d9d6",
    fighting: "#c22e28",
    poison: "#a33ea1",
    ground: "#e2bf65",
    flying: "#a98ff3",
    psychic: "#f95587",
    bug: "#a6b91a",
    rock: "#b6a136",
    ghost: "#735797",
    dragon: "#6f35fc",
    dark: "#705746",
    steel: "#b7b7ce",
    fairy: "#d685ad"
};

const ordenTipos = Object.keys(nombresTipos);

const nombresStats = {
    hp: "PS",
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "At. Esp.",
    "special-defense": "Def. Esp.",
    speed: "Velocidad"
};

/* Respaldo por si datos.json no se pudiera cargar (normalmente se usa datos.json) */
const nombresItemsRespaldo = {
    "fire-stone": "Piedra Fuego",
    "water-stone": "Piedra Agua",
    "thunder-stone": "Piedra Trueno",
    "leaf-stone": "Piedra Hoja",
    "moon-stone": "Piedra Lunar",
    "sun-stone": "Piedra Solar",
    "ice-stone": "Piedra Hielo",
    "shiny-stone": "Piedra Día",
    "dusk-stone": "Piedra Noche",
    "dawn-stone": "Piedra Alba",
    "oval-stone": "Piedra Oval",
    "kings-rock": "Roca del Rey",
    "metal-coat": "Revestimiento Metálico",
    "dragon-scale": "Escama Dragón",
    "protector": "Protector",
    "electirizer": "Electrizador",
    "magmarizer": "Magmatizador",
    "deep-sea-tooth": "Diente Mar",
    "deep-sea-scale": "Escama Marina",
    "prism-scale": "Escama Bella",
    "reaper-cloth": "Tela Terrible"
};

/* Etiquetas de formas: "charizard-mega-x" -> "Mega X" */
const etiquetasFormas = {
    mega: "Mega",
    gmax: "Gigamax",
    x: "X",
    y: "Y",
    alola: "Alola",
    galar: "Galar",
    hisui: "Hisui",
    paldea: "Paldea",
    normal: "Normal",
    attack: "Ataque",
    defense: "Defensa",
    speed: "Velocidad",
    incarnate: "Avatar",
    therian: "Tótem",
    origin: "Origen",
    altered: "Modificada",
    sky: "Cielo",
    land: "Tierra",
    plant: "Planta",
    sandy: "Arena",
    trash: "Basura",
    male: "Macho",
    female: "Hembra",
    f: "Hembra",
    m: "Macho",
    single: "Brusco",
    rapid: "Fluido",
    strike: "",
    amped: "Aguda",
    low: "Grave",
    key: "",
    black: "Negra",
    white: "Blanca",
    ice: "Hielo",
    shadow: "Sombría",
    crowned: "Suprema",
    hero: "Heroico",
    zero: "Ingenua",
    "family-of-three": "Familia de tres",
    "family-of-four": "Familia de cuatro",
    "two-segment": "Dos segmentos",
    "three-segment": "Tres segmentos",
    school: "Banco",
    solo: "Individual",
    baile: "Apasionado",
    pom: "Animado",
    pau: "Hula",
    sensu: "Refinado",
    midday: "Diurna",
    midnight: "Nocturna",
    dusk: "Crepuscular",
    disguised: "Encubierta",
    busted: "Descubierta",
    ordinary: "Normal",
    resolute: "Brío",
    aria: "Lírica",
    pirouette: "Danza",
    blade: "Filo",
    shield: "Escudo",
    average: "Normal",
    small: "Pequeño",
    large: "Grande",
    super: "Enorme",
    "10": "10%",
    "50": "50%",
    complete: "Completa",
    ash: "Ash",
    original: "Original",
    cap: "Gorra",
    stellar: "Astral",
    terastal: "Teracristal",
    teal: "Turquesa",
    wellspring: "Fuente",
    hearthflame: "Horno",
    cornerstone: "Cimiento",
    bloodmoon: "Luna Sangrienta",
    bold: "Valiente"
};

const regiones = {
    kanto: "Kanto",
    johto: "Johto",
    hoenn: "Hoenn",
    sinnoh: "Sinnoh",
    unova: "Teselia",
    kalos: "Kalos",
    alola: "Alola",
    galar: "Galar",
    hisui: "Hisui",
    paldea: "Paldea"
};

/* ---------- Estado ---------- */

let datos = null;
let datosListos = Promise.resolve(false);
const indice = {
    especies: [],
    especiePorId: new Map(),
    especiePorNombre: new Map(),
    pokemonPorNombre: new Map(),
    formas: [],
    habilidades: [],
    habilidadPorNombre: new Map(),
    pokemonPorClave: new Map(),
    habilidadPorClave: new Map(),
    maximoEspecie: ESPECIES_MAXIMO_DEFECTO
};

const cachePokemon = new Map();
const cacheSpecies = new Map();
const cacheAbility = new Map();
const cacheType = new Map();
const cacheChain = new Map();
const pendientes = new Map();

let solicitudActual = 0;
let pokemonActual = null;
let especieActualId = 0;
let mostrandoShiny = false;
const historial = [];
const MAX_HISTORIAL = 50;

const elementos = {};

function iniciarElementos() {
    const ids = [
        "busquedaForm",
        "atrasBoton",
        "buscador",
        "limpiarBusqueda",
        "sugerencias",
        "estado",
        "error",
        "habilidadDetalle",
        "ficha",
        "fondoPokemon",
        "fondoArte",
        "pokemonSprite",
        "shinyBoton",
        "numeroPokedex",
        "nombrePokemon",
        "categoriaPokemon",
        "tiposPokemon",
        "formas",
        "habilidades",
        "stats",
        "totalStats",
        "evoluciones",
        "debilidades",
        "resistencias",
        "inmunidades",
        "ofensivas",
        "ataquesBloque",
        "ataquesMetodos",
        "ataquesGens",
        "ataquesJuegos",
        "ataquesCaption",
        "ataquesLista",
        "ataquesVacio",
        "ataquesMas"
    ];

    ids.forEach(id => {
        elementos[id] = document.getElementById(id);
    });
}

/* ---------- Utilidades de texto ---------- */

function normalizar(texto) {
    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .trim();
}

/* Clave de comparación: "Mr. Mime", "mr-mime" y "MrMime" dan la misma */
function clave(texto) {
    return normalizar(texto)
        .replace(/♀/g, "f")
        .replace(/♂/g, "m")
        .replace(/[^a-z0-9]/g, "");
}

/* Texto escrito por la persona -> nombre con formato de la API */
function nombreApi(texto) {
    return normalizar(texto)
        .replace(/♀/g, "-f")
        .replace(/♂/g, "-m")
        .replace(/['’.:]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function capitalizar(texto) {
    return String(texto ?? "")
        .split("-")
        .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join("-");
}

function prettificar(texto) {
    return capitalizar(String(texto ?? "")).replaceAll("-", " ");
}

function formatearNumero(id) {
    return `#${String(id).padStart(4, "0")}`;
}

function obtenerNombreLocalizado(nombres, fallback) {
    const espanol = nombres?.find(item => item.language?.name === "es");
    const ingles = nombres?.find(item => item.language?.name === "en");
    return espanol?.name || ingles?.name || fallback;
}

function extraerId(url) {
    const partes = String(url).split("/").filter(Boolean);
    return Number(partes.at(-1));
}

/* ---------- Almacenamiento seguro (Safari en modo privado lanza errores) ---------- */

function leerAlmacen(llave, porDefecto = null) {
    try {
        const valor = localStorage.getItem(llave);
        return valor === null ? porDefecto : valor;
    } catch {
        return porDefecto;
    }
}

function escribirAlmacen(llave, valor) {
    try {
        localStorage.setItem(llave, valor);
    } catch {
        /* sin almacenamiento: la app sigue funcionando */
    }
}

function registrarPokemon(nombre) {
    escribirAlmacen("ultimoPokemon", nombre);
}

/* ---------- Historial (botón de volver) ---------- */

function actualizarBotonAtras() {
    elementos.atrasBoton.hidden = historial.length < 2;
}

/* Tras mostrar algo con éxito: lo añade al historial, o (si veníamos de "volver") retira la pantalla que se deja */
function gestionarHistorial(tipo, nombre, opciones = {}) {
    if (opciones.atras) {
        historial.pop();
    } else {
        const ultima = historial.at(-1);

        if (!ultima || ultima.tipo !== tipo || ultima.nombre !== nombre) {
            historial.push({ tipo, nombre });

            if (historial.length > MAX_HISTORIAL) {
                historial.shift();
            }
        }
    }

    actualizarBotonAtras();
}

function volverAtras() {
    if (historial.length < 2) {
        return;
    }

    const anterior = historial.at(-2);

    if (anterior.tipo === "habilidad") {
        ponerTextoBuscador(nombreHabilidad(anterior.nombre));
        buscarHabilidad(anterior.nombre, { atras: true });
    } else {
        ponerTextoBuscador(nombrePokemon(anterior.nombre));
        buscarPokemon(anterior.nombre, { atras: true });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cargarUltimoPokemon() {
    return leerAlmacen("ultimoPokemon", "") || "zekrom";
}

/* ---------- Red ---------- */

async function obtenerJSON(url, cache) {
    if (cache?.has(url)) {
        return cache.get(url);
    }

    if (pendientes.has(url)) {
        return pendientes.get(url);
    }

    const promesa = (async () => {
        let ultimoError;

        for (let intento = 0; intento < 2; intento++) {
            const control = new AbortController();
            const temporizador = setTimeout(() => control.abort(), TIEMPO_ESPERA_MS);

            try {
                const respuesta = await fetch(url, { signal: control.signal });

                if (!respuesta.ok) {
                    const fallo = new Error(`Error ${respuesta.status}`);
                    fallo.codigo = respuesta.status;

                    if (respuesta.status < 500) {
                        throw fallo;
                    }

                    ultimoError = fallo;
                    continue;
                }

                const resultado = await respuesta.json();
                cache?.set(url, resultado);
                return resultado;
            } catch (error) {
                if (error.codigo && error.codigo < 500) {
                    throw error;
                }

                ultimoError = error;
            } finally {
                clearTimeout(temporizador);
            }
        }

        throw ultimoError;
    })().finally(() => pendientes.delete(url));

    pendientes.set(url, promesa);
    return promesa;
}

/* ---------- datos.json: nombres en español, listas y tabla de tipos ---------- */

function construirIndice(d) {
    datos = d;

    d.especies.forEach((entrada, id) => {
        if (!entrada) {
            return;
        }

        const especie = {
            id,
            name: entrada[0],
            es: entrada[1],
            defecto: entrada[2],
            claveEs: clave(entrada[1]),
            claveEn: clave(entrada[0])
        };

        indice.especies.push(especie);
        indice.especiePorId.set(id, especie);
        indice.especiePorNombre.set(especie.name, especie);

        for (const k of [especie.claveEs, especie.claveEn]) {
            if (!indice.pokemonPorClave.has(k)) {
                indice.pokemonPorClave.set(k, { tipo: "pokemon", nombre: especie.defecto });
            }
        }
    });

    indice.maximoEspecie = d.especies.length - 1;

    d.pokemon.forEach(([name, id, sid]) => {
        indice.pokemonPorNombre.set(name, { name, id, sid });
        const especie = indice.especiePorId.get(sid);

        if (!especie || especie.defecto === name) {
            return;
        }

        const etiqueta = nombrePokemon(name);
        const forma = {
            name,
            id,
            sid,
            etiqueta,
            clave: clave(etiqueta),
            claveEn: clave(name)
        };

        indice.formas.push(forma);

        for (const k of [forma.clave, forma.claveEn]) {
            if (!indice.pokemonPorClave.has(k)) {
                indice.pokemonPorClave.set(k, { tipo: "pokemon", nombre: name });
            }
        }
    });

    d.habilidades.forEach(([name, id, es]) => {
        const habilidad = { name, id, es, claveEs: clave(es), claveEn: clave(name) };
        indice.habilidades.push(habilidad);
        indice.habilidadPorNombre.set(name, habilidad);

        for (const k of [habilidad.claveEs, habilidad.claveEn]) {
            if (!indice.habilidadPorClave.has(k)) {
                indice.habilidadPorClave.set(k, { tipo: "habilidad", nombre: name });
            }
        }
    });
}

async function cargarDatos() {
    try {
        const respuesta = await fetch("datos.json");

        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}`);
        }

        construirIndice(await respuesta.json());
        return true;
    } catch (error) {
        console.error("No se pudo cargar datos.json (la app funciona, pero sin nombres en español):", error);
        return false;
    }
}

/* ---------- Nombres ---------- */

function etiquetaForma(nombrePokemonApi, nombreEspecie) {
    const sufijo = nombrePokemonApi.startsWith(`${nombreEspecie}-`)
        ? nombrePokemonApi.slice(nombreEspecie.length + 1)
        : nombrePokemonApi;

    if (etiquetasFormas[sufijo] !== undefined) {
        return etiquetasFormas[sufijo];
    }

    return sufijo
        .split("-")
        .map(token => etiquetasFormas[token] ?? capitalizar(token))
        .filter(Boolean)
        .join(" ");
}

function nombreEspecie(nombreApiEspecie) {
    return indice.especiePorNombre.get(nombreApiEspecie)?.es || prettificar(nombreApiEspecie);
}

function nombrePokemon(nombreApiPokemon) {
    const pokemon = indice.pokemonPorNombre.get(nombreApiPokemon);
    const especie = pokemon ? indice.especiePorId.get(pokemon.sid) : null;

    if (!especie) {
        return prettificar(nombreApiPokemon);
    }

    if (especie.defecto === nombreApiPokemon) {
        return especie.es;
    }

    const etiqueta = etiquetaForma(nombreApiPokemon, especie.name);
    return etiqueta ? `${especie.es} (${etiqueta})` : especie.es;
}

function nombreHabilidad(nombreApiHabilidad, detalle) {
    return indice.habilidadPorNombre.get(nombreApiHabilidad)?.es
        || obtenerNombreLocalizado(detalle?.names, prettificar(nombreApiHabilidad));
}

function traducirItem(nombre) {
    return datos?.objetos?.[nombre] || nombresItemsRespaldo[nombre] || prettificar(nombre);
}

function traducirMovimiento(nombre) {
    return datos?.movimientos?.[nombre] || prettificar(nombre);
}

function traducirLugar(nombre) {
    return datos?.lugares?.[nombre] || prettificar(nombre);
}

function traducirNaturaleza(nombre) {
    return datos?.naturalezas?.[nombre] || capitalizar(nombre);
}

function traducirTipo(nombre) {
    return nombresTipos[nombre] || capitalizar(nombre);
}

/* ---------- Búsqueda y sugerencias ---------- */

function crearResultadoPokemon(nombreApiPokemon, prefijo = "Pokémon") {
    const pokemon = indice.pokemonPorNombre.get(nombreApiPokemon);
    const numero = pokemon ? ` · ${formatearNumero(pokemon.sid)}` : "";

    return {
        tipo: "pokemon",
        nombre: nombreApiPokemon,
        etiqueta: nombrePokemon(nombreApiPokemon),
        detalle: `${prefijo}${numero}`
    };
}

function resultadoDeEspecie(especie) {
    return crearResultadoPokemon(especie.defecto);
}

function obtenerSugerenciasIniciales() {
    const disponibles = [...indice.especies];
    const sugerencias = [];

    while (sugerencias.length < 5 && disponibles.length > 0) {
        const posicion = Math.floor(Math.random() * disponibles.length);
        sugerencias.push(resultadoDeEspecie(disponibles.splice(posicion, 1)[0]));
    }

    return sugerencias;
}

function buscarCoincidencias(texto) {
    const consulta = clave(texto);

    if (!consulta) {
        return obtenerSugerenciasIniciales();
    }

    if (/^#?\d+$/.test(texto.trim())) {
        const cadena = String(Number(texto.trim().replace("#", "")));
        const exacta = indice.especiePorId.get(Number(cadena));
        const resultado = [];

        if (exacta) {
            resultado.push(resultadoDeEspecie(exacta));
        }

        for (const especie of indice.especies) {
            if (resultado.length >= 8) {
                break;
            }

            if (especie !== exacta && String(especie.id).startsWith(cadena)) {
                resultado.push(resultadoDeEspecie(especie));
            }
        }

        return resultado;
    }

    const pokemonEmpiezan = [];
    const habilidadesEmpiezan = [];
    const pokemonContienen = [];
    const habilidadesContienen = [];
    const formasContienen = [];

    for (const especie of indice.especies) {
        if (especie.claveEs.startsWith(consulta) || especie.claveEn.startsWith(consulta)) {
            pokemonEmpiezan.push(resultadoDeEspecie(especie));
        } else if (especie.claveEs.includes(consulta) || especie.claveEn.includes(consulta)) {
            pokemonContienen.push(resultadoDeEspecie(especie));
        }
    }

    for (const habilidad of indice.habilidades) {
        const resultado = {
            tipo: "habilidad",
            nombre: habilidad.name,
            etiqueta: habilidad.es,
            detalle: "Habilidad"
        };

        if (habilidad.claveEs.startsWith(consulta) || habilidad.claveEn.startsWith(consulta)) {
            habilidadesEmpiezan.push(resultado);
        } else if (habilidad.claveEs.includes(consulta) || habilidad.claveEn.includes(consulta)) {
            habilidadesContienen.push(resultado);
        }
    }

    for (const forma of indice.formas) {
        if (forma.clave.includes(consulta) || forma.claveEn.includes(consulta)) {
            formasContienen.push(crearResultadoPokemon(forma.name, "Forma"));
        }
    }

    return [
        ...pokemonEmpiezan,
        ...habilidadesEmpiezan,
        ...pokemonContienen,
        ...habilidadesContienen,
        ...formasContienen
    ].slice(0, 8);
}

function resolverEntrada(texto) {
    const entrada = texto.trim();
    const k = clave(entrada);

    if (!k) {
        return null;
    }

    if (/^#?\d+$/.test(entrada)) {
        const especie = indice.especiePorId.get(Number(entrada.replace("#", "")));
        return especie ? { tipo: "pokemon", nombre: especie.defecto } : null;
    }

    return indice.pokemonPorClave.get(k) || indice.habilidadPorClave.get(k) || null;
}

function actualizarSugerenciasIniciales() {
    const sugerencias = obtenerSugerenciasIniciales();
    renderizarSugerencias(sugerencias, sugerencias.length > 0);
}

function mostrarSugerencias(texto) {
    renderizarSugerencias(buscarCoincidencias(texto), true);
}

function ocultarSugerencias() {
    elementos.sugerencias.classList.remove("visible");
}

function renderizarSugerencias(coincidencias, mostrar) {
    elementos.sugerencias.innerHTML = "";

    if (!mostrar || coincidencias.length === 0) {
        ocultarSugerencias();
        return;
    }

    coincidencias.forEach(resultado => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = `sugerencia ${resultado.tipo === "habilidad" ? "sugerencia-habilidad" : ""}`;
        boton.dataset.nombre = resultado.nombre;

        const icono = document.createElement("span");
        icono.className = "sugerencia-icono";
        icono.textContent = resultado.tipo === "habilidad" ? "✦" : "◈";

        const contenido = document.createElement("span");
        contenido.className = "sugerencia-contenido";

        const nombre = document.createElement("span");
        nombre.className = "sugerencia-nombre";
        nombre.textContent = resultado.etiqueta;

        const detalle = document.createElement("small");
        detalle.className = "sugerencia-tipo";
        detalle.textContent = resultado.detalle;

        contenido.append(nombre, detalle);

        const flecha = document.createElement("span");
        flecha.className = "sugerencia-flecha";
        flecha.textContent = "→";

        boton.append(icono, contenido, flecha);
        boton.addEventListener("click", () => abrirResultado(resultado));
        elementos.sugerencias.appendChild(boton);
    });

    elementos.sugerencias.classList.add("visible");
}

function ponerTextoBuscador(texto) {
    elementos.buscador.value = texto;
    elementos.limpiarBusqueda.classList.toggle("visible", texto.length > 0);
}

function abrirResultado(resultado) {
    ocultarSugerencias();
    ponerTextoBuscador(resultado.etiqueta ?? resultado.nombre);

    if (resultado.tipo === "habilidad") {
        return buscarHabilidad(resultado.nombre);
    }

    return buscarPokemon(resultado.nombre);
}

function irAPokemon(nombreApiPokemon) {
    ponerTextoBuscador(nombrePokemon(nombreApiPokemon));
    buscarPokemon(nombreApiPokemon);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function irAHabilidad(nombreApiHabilidad) {
    ponerTextoBuscador(nombreHabilidad(nombreApiHabilidad));
    buscarHabilidad(nombreApiHabilidad);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function buscarEntrada(texto) {
    const entrada = texto.trim();

    if (!entrada) {
        return;
    }

    await datosListos;

    const resuelta = resolverEntrada(entrada) || buscarCoincidencias(entrada)[0];

    if (resuelta && clave(entrada)) {
        await abrirResultado(resuelta);
        return;
    }

    /* Sin datos.json o sin coincidencias: probar tal cual contra la API */
    const nombre = nombreApi(entrada);
    const resultadoPokemon = await buscarPokemon(nombre, { silencioso404: true });

    if (resultadoPokemon === "404") {
        const resultadoHabilidad = await buscarHabilidad(nombre, { silencioso404: true });

        if (resultadoHabilidad === "404") {
            mostrarNoEncontrado(entrada);
        }
    }
}

function mostrarNoEncontrado(entrada) {
    elementos.error.textContent =
        `No he encontrado “${entrada.trim()}”. Prueba con el nombre en español o en inglés, o con el número de la Pokédex.`;
}

function mostrarErrorDeRed() {
    elementos.error.textContent = navigator.onLine === false
        ? "Sin conexión. Solo funcionan los Pokémon que ya has consultado antes."
        : "No se ha podido conectar con PokéAPI. Comprueba tu conexión y vuelve a intentarlo.";
}

/* ---------- Carga de un Pokémon ---------- */

async function cargarPokemonApi(nombre) {
    try {
        return await obtenerJSON(`${API}/pokemon/${encodeURIComponent(nombre)}`, cachePokemon);
    } catch (error) {
        if (error.codigo !== 404) {
            throw error;
        }

        /* El nombre puede ser el de una especie con varias formas (p. ej. "deoxys") */
        const especie = await obtenerJSON(`${API}/pokemon-species/${encodeURIComponent(nombre)}`, cacheSpecies);
        const defecto = especie.varieties?.find(variedad => variedad.is_default)?.pokemon?.name;

        if (!defecto) {
            throw error;
        }

        return obtenerJSON(`${API}/pokemon/${encodeURIComponent(defecto)}`, cachePokemon);
    }
}

function normalizarRelacionesApi(tipoJson) {
    const relaciones = tipoJson.damage_relations;
    const nombres = lista => lista.map(ref => ref.name);

    return {
        dobleDe: nombres(relaciones.double_damage_from),
        mitadDe: nombres(relaciones.half_damage_from),
        nadaDe: nombres(relaciones.no_damage_from),
        dobleA: nombres(relaciones.double_damage_to)
    };
}

async function cargarRelacionesTipos(tiposPokemon) {
    const resultados = await Promise.allSettled(tiposPokemon.map(async item => {
        const incluidas = datos?.tipos?.[item.type.name];

        if (incluidas) {
            return incluidas;
        }

        return normalizarRelacionesApi(await obtenerJSON(item.type.url, cacheType));
    }));

    /* Si falta algún tipo, mejor no mostrar nada que mostrar datos erróneos */
    if (resultados.length === 0 || resultados.some(resultado => resultado.status !== "fulfilled")) {
        return null;
    }

    return resultados.map(resultado => resultado.value);
}

async function buscarPokemon(entrada, opciones = {}) {
    const nombre = nombreApi(entrada);
    const cargaInicial = opciones.inicial === true;

    if (!nombre) {
        return "error";
    }

    ocultarSugerencias();
    elementos.error.textContent = "";
    const idSolicitud = ++solicitudActual;

    mostrarEstado(cargaInicial ? "Preparando la Pokédex..." : `Buscando ${nombrePokemon(nombre)}...`);

    try {
        const [pokemon] = await Promise.all([cargarPokemonApi(nombre), datosListos]);

        if (idSolicitud !== solicitudActual) {
            return "obsoleta";
        }

        const [species, relaciones] = await Promise.all([
            obtenerJSON(pokemon.species.url, cacheSpecies).catch(error => {
                console.warn("No se pudo cargar la especie:", error);
                return null;
            }),
            cargarRelacionesTipos(pokemon.types)
        ]);

        if (idSolicitud !== solicitudActual) {
            return "obsoleta";
        }

        mostrarPokemon(pokemon, species);
        renderizarEfectividad(relaciones);
        ocultarEstado();
        registrarPokemon(pokemon.name);
        gestionarHistorial("pokemon", pokemon.name, opciones);

        /* La línea evolutiva se carga aparte: no retrasa el resto de la ficha */
        cargarEvoluciones(species, idSolicitud);
        return "ok";
    } catch (error) {
        console.error("Error cargando Pokémon:", error);

        if (idSolicitud !== solicitudActual) {
            return "obsoleta";
        }

        ocultarEstado();

        if (error.codigo === 404) {
            if (!opciones.silencioso404) {
                mostrarNoEncontrado(entrada);
            }

            return "404";
        }

        if (cargaInicial) {
            elementos.ficha.classList.remove("visible");
        }

        mostrarErrorDeRed();
        return "error";
    }
}

async function cargarEvoluciones(species, idSolicitud) {
    elementos.evoluciones.innerHTML = '<p class="evolucion-vacia">Cargando línea evolutiva...</p>';

    if (!species?.evolution_chain?.url) {
        elementos.evoluciones.innerHTML = species
            ? '<p class="evolucion-vacia">Este Pokémon no tiene evoluciones ni preevoluciones registradas.</p>'
            : '<p class="evolucion-vacia">No se ha podido cargar la línea evolutiva.</p>';
        return;
    }

    try {
        const cadena = await obtenerJSON(species.evolution_chain.url, cacheChain);

        if (idSolicitud !== solicitudActual) {
            return;
        }

        mostrarEvoluciones(cadena, species.name);
    } catch (error) {
        console.error("Error cargando evolución:", error);

        if (idSolicitud === solicitudActual) {
            elementos.evoluciones.innerHTML = '<p class="evolucion-vacia">No se ha podido cargar la línea evolutiva.</p>';
        }
    }
}

/* ---------- Habilidades (ficha de una habilidad) ---------- */

async function buscarHabilidad(entrada, opciones = {}) {
    const nombre = nombreApi(entrada);

    if (!nombre) {
        return "error";
    }

    ocultarSugerencias();
    elementos.error.textContent = "";
    const idSolicitud = ++solicitudActual;

    mostrarEstado(`Buscando habilidad ${nombreHabilidad(nombre)}...`);

    try {
        const habilidad = await obtenerJSON(`${API}/ability/${encodeURIComponent(nombre)}`, cacheAbility);

        if (idSolicitud !== solicitudActual) {
            return "obsoleta";
        }

        elementos.ficha.classList.remove("visible");
        renderizarDetalleHabilidad(habilidad);
        ocultarEstado();
        gestionarHistorial("habilidad", habilidad.name, opciones);
        return "ok";
    } catch (error) {
        console.error("Error cargando habilidad:", error);

        if (idSolicitud !== solicitudActual) {
            return "obsoleta";
        }

        ocultarEstado();

        if (error.codigo === 404) {
            if (!opciones.silencioso404) {
                mostrarNoEncontrado(entrada);
            }

            return "404";
        }

        mostrarErrorDeRed();
        return "error";
    }
}

function textoHabilidadEnEspanol(habilidad) {
    const entradas = (habilidad.flavor_text_entries || []).filter(item => item.language?.name === "es");
    const ultima = entradas.at(-1);

    return ultima ? ultima.flavor_text.replace(/[\n\f­]+/g, " ").replace(/\s+/g, " ").trim() : "";
}

function obtenerTextoLocalizado(lista, campo) {
    if (!Array.isArray(lista)) {
        return "";
    }

    const espanol = lista.find(item => item.language?.name === "es");
    const ingles = lista.find(item => item.language?.name === "en");
    return espanol?.[campo] || ingles?.[campo] || "";
}

function renderizarDetalleHabilidad(habilidad) {
    const nombre = nombreHabilidad(habilidad.name, habilidad);
    const textoEs = textoHabilidadEnEspanol(habilidad);
    const efectoEn = obtenerTextoLocalizado(habilidad.effect_entries, "effect");
    const principal = textoEs || efectoEn || "No hay una descripción disponible para esta habilidad.";
    const pokemon = [...habilidad.pokemon].sort((a, b) => extraerId(a.pokemon.url) - extraerId(b.pokemon.url));

    elementos.habilidadDetalle.innerHTML = "";
    elementos.habilidadDetalle.classList.add("visible");

    const cabecera = document.createElement("div");
    cabecera.className = "habilidad-detalle-cabecera";

    const etiqueta = document.createElement("span");
    etiqueta.className = "detalle-etiqueta";
    etiqueta.textContent = "HABILIDAD";

    const titulo = document.createElement("h2");
    titulo.textContent = nombre;

    const nombreEnApi = document.createElement("p");
    nombreEnApi.className = "detalle-subtitulo";
    nombreEnApi.textContent = capitalizar(habilidad.name);

    cabecera.append(etiqueta, titulo, nombreEnApi);

    const descripcion = document.createElement("div");
    descripcion.className = "habilidad-descripcion";

    const descripcionTitulo = document.createElement("span");
    descripcionTitulo.textContent = "¿QUÉ HACE?";

    const descripcionTexto = document.createElement("p");
    descripcionTexto.textContent = principal;

    descripcion.append(descripcionTitulo, descripcionTexto);

    if (textoEs && efectoEn) {
        const detalleTecnico = document.createElement("small");
        detalleTecnico.textContent = `En detalle (inglés): ${efectoEn}`;
        descripcion.appendChild(detalleTecnico);
    }

    const poseedores = document.createElement("div");
    poseedores.className = "habilidad-poseedores";

    const poseedoresCabecera = document.createElement("div");
    poseedoresCabecera.className = "poseedores-cabecera";

    const poseedoresTitulo = document.createElement("div");
    const poseedoresEtiqueta = document.createElement("span");
    poseedoresEtiqueta.textContent = "POKÉMON QUE LA POSEEN";
    const poseedoresTotal = document.createElement("small");
    poseedoresTotal.textContent = `${pokemon.length} Pokémon registrados`;
    poseedoresTitulo.append(poseedoresEtiqueta, poseedoresTotal);
    poseedoresCabecera.appendChild(poseedoresTitulo);

    const grid = document.createElement("div");
    grid.className = "poseedores-grid";

    pokemon.forEach(item => {
        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "poseedor-pokemon";

        const nombreMostrado = nombrePokemon(item.pokemon.name);
        const sprite = document.createElement("img");
        sprite.loading = "lazy";
        asignarSpriteConRespaldo(sprite, extraerId(item.pokemon.url), true);
        sprite.alt = `Sprite de ${nombreMostrado}`;

        const texto = document.createElement("span");
        texto.textContent = nombreMostrado;

        const tipo = document.createElement("small");
        tipo.textContent = item.is_hidden ? "Oculta" : "Disponible";

        tarjeta.append(sprite, texto, tipo);
        tarjeta.addEventListener("click", () => irAPokemon(item.pokemon.name));

        grid.appendChild(tarjeta);
    });

    poseedores.append(poseedoresCabecera, grid);
    elementos.habilidadDetalle.append(cabecera, descripcion, poseedores);

    document.title = `${nombre} · Habilidad · Ultraball`;
}

/* ---------- Sprites ---------- */

function urlsSprite(id, preferirPixel) {
    const urls = [];

    if (preferirPixel && id <= 649) {
        urls.push(`${SPRITES}/versions/generation-v/black-white/${id}.png`);
    }

    urls.push(
        `${SPRITES}/other/home/${id}.png`,
        `${SPRITES}/other/official-artwork/${id}.png`,
        `${SPRITES}/${id}.png`
    );

    return urls;
}

/* Si un sprite no existe (p. ej. no hay de Gen. V para Pokémon nuevos), prueba el siguiente */
function asignarSpriteConRespaldo(img, id, preferirPixel) {
    const urls = urlsSprite(id, preferirPixel);
    let posicion = 0;

    img.onerror = () => {
        posicion += 1;

        if (posicion < urls.length) {
            img.src = urls[posicion];
        } else {
            img.onerror = null;
        }
    };

    img.src = urls[0];
}

function obtenerSpritePrincipal(pokemon) {
    return pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ||
        pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.front_default ||
        pokemon.sprites.other?.home?.front_default ||
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.front_default;
}

function obtenerSpriteShiny(pokemon) {
    return pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_shiny ||
        pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.front_shiny ||
        pokemon.sprites.other?.home?.front_shiny ||
        pokemon.sprites.other?.["official-artwork"]?.front_shiny ||
        pokemon.sprites.front_shiny;
}

/* ---------- Ficha del Pokémon ---------- */

function nombreVisiblePokemon(pokemon, species) {
    const nombreEspecieApi = species?.name ?? pokemon.species.name;
    const id = extraerId(pokemon.species.url);
    const base = indice.especiePorId.get(id)?.es
        ?? obtenerNombreLocalizado(species?.names, prettificar(nombreEspecieApi));
    const defecto = species?.varieties?.find(variedad => variedad.is_default)?.pokemon?.name
        ?? indice.especiePorId.get(id)?.defecto
        ?? pokemon.name;

    if (pokemon.name === defecto) {
        return base;
    }

    const etiqueta = etiquetaForma(pokemon.name, nombreEspecieApi);
    return etiqueta ? `${base} (${etiqueta})` : base;
}

function mostrarPokemon(pokemon, species) {
    pokemonActual = pokemon;
    especieActualId = extraerId(pokemon.species.url);
    mostrandoShiny = false;

    const spriteShiny = obtenerSpriteShiny(pokemon);
    elementos.shinyBoton.classList.remove("activo");
    elementos.shinyBoton.setAttribute("aria-pressed", "false");
    elementos.shinyBoton.setAttribute("aria-label", "Mostrar versión shiny");
    elementos.shinyBoton.style.display = spriteShiny ? "" : "none";

    elementos.habilidadDetalle.classList.remove("visible");
    elementos.ficha.classList.add("visible");

    const nombre = nombreVisiblePokemon(pokemon, species);
    const genero = species?.genera ? obtenerNombreLocalizado(species.genera, "Pokémon") : "Pokémon";
    const imagen = obtenerSpritePrincipal(pokemon);
    const imagenFondo = pokemon.sprites.other?.["official-artwork"]?.front_default || imagen;

    const tipoPrincipal = pokemon.types[0]?.type?.name || "normal";
    const fondoTipo = `./assets/backgrounds/${tipoPrincipal}.gif`;

    elementos.nombrePokemon.textContent = nombre;
    elementos.numeroPokedex.textContent = formatearNumero(especieActualId);
    elementos.categoriaPokemon.textContent = genero;

    if (imagen) {
        elementos.pokemonSprite.onerror = null;
        elementos.pokemonSprite.src = imagen;
    } else {
        asignarSpriteConRespaldo(elementos.pokemonSprite, especieActualId, true);
    }

    elementos.pokemonSprite.alt = `Sprite de ${nombre}`;
    elementos.fondoPokemon.style.backgroundImage = `url("${fondoTipo}")`;
    elementos.fondoArte.style.backgroundImage = imagenFondo ? `url("${imagenFondo}")` : "none";

    document.documentElement.style.setProperty("--accent", coloresTipos[tipoPrincipal] || "#ffffff");

    document.title = `${nombre} · Ultraball`;
    document.querySelector('meta[name="theme-color"]').setAttribute("content", coloresTipos[tipoPrincipal] || "#233044");

    ajustarNombrePokemon();
    renderizarTiposPokemon(pokemon.types);
    renderizarFormas(pokemon, species);
    renderizarHabilidades(pokemon);
    renderizarStats(pokemon.stats);
    prepararAtaques(pokemon);
}

/* ---------- Ataques por generación ---------- */

/* Juegos de cada generación. El último de cada lista es el que se muestra por defecto. */
const GENERACIONES = [
    { n: 1, romano: "I", juegos: [["red-blue", "Rojo/Azul"], ["yellow", "Amarillo"]] },
    { n: 2, romano: "II", juegos: [["gold-silver", "Oro/Plata"], ["crystal", "Cristal"]] },
    { n: 3, romano: "III", juegos: [["colosseum", "Colosseum"], ["xd", "XD"], ["ruby-sapphire", "Rubí/Zafiro"], ["firered-leafgreen", "Rojo Fuego/Verde Hoja"], ["emerald", "Esmeralda"]] },
    { n: 4, romano: "IV", juegos: [["diamond-pearl", "Diamante/Perla"], ["heartgold-soulsilver", "HeartGold/SoulSilver"], ["platinum", "Platino"]] },
    { n: 5, romano: "V", juegos: [["black-white", "Negro/Blanco"], ["black-2-white-2", "Negro 2/Blanco 2"]] },
    { n: 6, romano: "VI", juegos: [["x-y", "X/Y"], ["omega-ruby-alpha-sapphire", "Rubí Omega/Zafiro Alfa"]] },
    { n: 7, romano: "VII", juegos: [["lets-go-pikachu-lets-go-eevee", "Let's Go"], ["sun-moon", "Sol/Luna"], ["ultra-sun-ultra-moon", "Ultrasol/Ultraluna"]] },
    { n: 8, romano: "VIII", juegos: [["legends-arceus", "Leyendas Arceus"], ["brilliant-diamond-shining-pearl", "Diamante Brillante/Perla Reluciente"], ["sword-shield", "Espada/Escudo"]] },
    { n: 9, romano: "IX", juegos: [["champions", "Champions"], ["scarlet-violet", "Escarlata/Púrpura"]] }
];

const METODOS_ATAQUE = [
    { clave: "level-up", etiqueta: "Nivel", pildora: "" },
    { clave: "machine", etiqueta: "MT/MO", pildora: "MT" },
    { clave: "egg", etiqueta: "Huevo", pildora: "Huevo" },
    { clave: "tutor", etiqueta: "Tutor", pildora: "Tutor" }
];

const CLASES_ATAQUE = { f: "Físico", e: "Especial", s: "Estado" };

/* Símbolos de clase de movimiento (físico / especial / estado), dibujados con SVG propio */
const ICONOS_CLASE = {
    f: '<path d="M12 3.2l2 4.1 4.4-1.4-1.4 4.4 4.1 2-4.1 2 1.4 4.4-4.4-1.4-2 4.1-2-4.1-4.4 1.4 1.4-4.4-4.1-2 4.1-2-1.4-4.4 4.4 1.4z" fill="#fff"/>',
    e: '<circle cx="12" cy="12" r="7.2" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="12" cy="12" r="2.6" fill="#fff"/>',
    s: '<ellipse cx="12" cy="12" rx="7.6" ry="4.4" fill="none" stroke="#fff" stroke-width="2.2" transform="rotate(-28 12 12)"/>'
};

function crearIconoClase(clase) {
    const icono = document.createElement("span");
    icono.className = `ataque-clase ataque-clase-${clase}`;
    icono.setAttribute("role", "img");
    icono.setAttribute("aria-label", CLASES_ATAQUE[clase]);
    icono.title = CLASES_ATAQUE[clase];
    icono.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONOS_CLASE[clase]}</svg>`;
    return icono;
}
const ATAQUES_POR_PAGINA = 30;

/* Preferencias que se mantienen al cambiar de Pokémon */
const ataquesEstado = { metodo: "level-up", gen: null, juego: null, limite: ATAQUES_POR_PAGINA };
let ataquesDisponibles = null;

/* { metodo: { juego: [{ nombre, nivel }] } } */
function indexarAtaques(pokemon) {
    const indice = {};

    for (const entrada of pokemon.moves || []) {
        for (const detalle of entrada.version_group_details || []) {
            const metodo = detalle.move_learn_method.name;
            const juego = detalle.version_group.name;

            if (!METODOS_ATAQUE.some(m => m.clave === metodo)) {
                continue;
            }

            ((indice[metodo] ||= {})[juego] ||= []).push({
                nombre: entrada.move.name,
                nivel: detalle.level_learned_at || 0
            });
        }
    }

    return indice;
}

/* Generaciones (y juegos de cada una) con datos para un método */
function generacionesConDatos(metodo) {
    const porJuego = ataquesDisponibles?.[metodo] || {};

    return GENERACIONES
        .map(gen => ({ ...gen, juegos: gen.juegos.filter(([clave]) => porJuego[clave]?.length) }))
        .filter(gen => gen.juegos.length);
}

function prepararAtaques(pokemon) {
    ataquesDisponibles = indexarAtaques(pokemon);
    ataquesEstado.limite = ATAQUES_POR_PAGINA;

    const metodos = METODOS_ATAQUE.filter(m => generacionesConDatos(m.clave).length);

    if (!metodos.length) {
        elementos.ataquesBloque.hidden = true;
        return;
    }

    elementos.ataquesBloque.hidden = false;

    if (!metodos.some(m => m.clave === ataquesEstado.metodo)) {
        ataquesEstado.metodo = metodos[0].clave;
    }

    renderizarAtaques();
}

function crearChipAtaque(texto, activo, alPulsar, etiquetaAria, clase = "seg-opcion", deshabilitado = false) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = clase + (activo ? " activa" : "");
    boton.disabled = deshabilitado;
    boton.textContent = texto;
    boton.setAttribute("aria-pressed", activo ? "true" : "false");

    if (etiquetaAria) {
        boton.setAttribute("aria-label", etiquetaAria);
    }

    boton.addEventListener("click", alPulsar);
    return boton;
}

function renderizarAtaques() {
    const metodo = ataquesEstado.metodo;
    const generaciones = generacionesConDatos(metodo);

    /* Generación elegida: la guardada si existe para este Pokémon, si no la más reciente */
    let gen = generaciones.find(g => g.n === ataquesEstado.gen) || generaciones.at(-1);
    ataquesEstado.gen = gen.n;

    const juego = gen.juegos.find(([clave]) => clave === ataquesEstado.juego) || gen.juegos.at(-1);
    ataquesEstado.juego = juego[0];

    /* Método */
    elementos.ataquesMetodos.innerHTML = "";
    const metodos = METODOS_ATAQUE.filter(m => generacionesConDatos(m.clave).length);

    if (metodos.length > 1) {
        metodos.forEach(m => elementos.ataquesMetodos.appendChild(
            crearChipAtaque(m.etiqueta, m.clave === metodo, () => {
                ataquesEstado.metodo = m.clave;
                ataquesEstado.limite = ATAQUES_POR_PAGINA;
                renderizarAtaques();
            })
        ));
    }

    elementos.ataquesMetodos.hidden = metodos.length < 2;

    /* Generación: siempre las nueve celdas; las que no tienen datos quedan apagadas */
    elementos.ataquesGens.innerHTML = "";
    GENERACIONES.forEach(g => {
        const hay = generaciones.some(x => x.n === g.n);

        elementos.ataquesGens.appendChild(
            crearChipAtaque(g.romano, g.n === gen.n, () => {
                ataquesEstado.gen = g.n;
                ataquesEstado.juego = null;
                ataquesEstado.limite = ATAQUES_POR_PAGINA;
                renderizarAtaques();
            }, `Generación ${g.n}`, "seg-opcion seg-gen", !hay)
        );
    });

    elementos.ataquesCaption.textContent = `Generación ${gen.romano} · ${gen.juegos.length > 1 ? "elige juego" : juego[1]}`;

    /* Juego (solo si la generación tiene más de uno con datos) */
    elementos.ataquesJuegos.innerHTML = "";
    gen.juegos.forEach(([clave, nombre]) => elementos.ataquesJuegos.appendChild(
        crearChipAtaque(nombre, clave === juego[0], () => {
            ataquesEstado.juego = clave;
            ataquesEstado.limite = ATAQUES_POR_PAGINA;
            renderizarAtaques();
        }, null, "ataques-juego")
    ));
    elementos.ataquesJuegos.hidden = gen.juegos.length < 2;

    renderizarListaAtaques(ataquesDisponibles[metodo][juego[0]], metodo);
}

function crearFilaAtaque(ataque, metodo) {
    const info = datos?.ataques?.[ataque.nombre];
    const fila = document.createElement("li");
    fila.className = "ataque-fila";

    const cuando = document.createElement("span");
    cuando.className = "ataque-cuando";

    if (metodo === "level-up") {
        cuando.textContent = ataque.nivel > 0 ? ataque.nivel : "Evo.";
        cuando.setAttribute("aria-label", ataque.nivel > 0 ? `Nivel ${ataque.nivel}` : "Al evolucionar");
    } else {
        cuando.textContent = METODOS_ATAQUE.find(m => m.clave === metodo).pildora;
        cuando.classList.add("ataque-cuando-texto");
    }

    const nombre = document.createElement("strong");
    nombre.className = "ataque-nombre";
    nombre.textContent = info?.[0] || prettificar(ataque.nombre);

    const etiquetas = document.createElement("span");
    etiquetas.className = "ataque-etiquetas";

    if (info?.[2]) {
        etiquetas.appendChild(crearIconoClase(info[2]));
    }

    if (info?.[1]) {
        etiquetas.appendChild(crearChipTipo(info[1]));
    }

    fila.append(cuando, nombre, etiquetas);
    return fila;
}

function renderizarListaAtaques(lista, metodo) {
    /* Por nivel (y, a igual nivel, por nombre); el resto, por nombre */
    const nombreDe = a => datos?.ataques?.[a.nombre]?.[0] || a.nombre;
    const ordenados = [...lista].sort((a, b) =>
        (metodo === "level-up" ? a.nivel - b.nivel : 0) || nombreDe(a).localeCompare(nombreDe(b), "es")
    );

    elementos.ataquesLista.innerHTML = "";
    elementos.ataquesVacio.hidden = ordenados.length > 0;

    ordenados.slice(0, ataquesEstado.limite)
        .forEach(a => elementos.ataquesLista.appendChild(crearFilaAtaque(a, metodo)));

    const restantes = ordenados.length - ataquesEstado.limite;
    elementos.ataquesMas.hidden = restantes <= 0;

    if (restantes > 0) {
        elementos.ataquesMas.textContent = `Mostrar los ${restantes} restantes`;
        elementos.ataquesMas.onclick = () => {
            ataquesEstado.limite = Infinity;
            renderizarListaAtaques(lista, metodo);
        };
    }
}

/* Los nombres largos (p. ej. Melenaleteo) se encogen hasta caber en una línea en vez de partirse a mitad de palabra */
function ajustarNombrePokemon() {
    const titulo = elementos.nombrePokemon;

    titulo.style.fontSize = "";
    titulo.classList.remove("nombre-partido");

    if (!titulo.clientWidth) {
        return;
    }

    let tamano = parseFloat(getComputedStyle(titulo).fontSize);

    while (titulo.scrollWidth > titulo.clientWidth + 1 && tamano > 22) {
        tamano -= 1;
        titulo.style.fontSize = `${tamano}px`;
    }

    if (titulo.scrollWidth > titulo.clientWidth + 1) {
        titulo.classList.add("nombre-partido");
    }
}

function renderizarTiposPokemon(tiposPokemon) {
    elementos.tiposPokemon.innerHTML = "";

    tiposPokemon.forEach(item => {
        elementos.tiposPokemon.appendChild(crearChipTipo(item.type.name));
    });
}

function crearChipTipo(nombreTipo, multiplicador = null) {
    const chip = document.createElement("span");
    chip.className = "tipo-chip";
    chip.dataset.tipo = nombreTipo;

    const texto = document.createElement("span");
    texto.textContent = traducirTipo(nombreTipo);
    chip.appendChild(texto);

    if (multiplicador !== null) {
        const multi = document.createElement("strong");
        multi.className = "tipo-multiplicador";
        multi.textContent = formatearMultiplicador(multiplicador);
        chip.appendChild(multi);
    }

    return chip;
}

function renderizarFormas(pokemon, species) {
    elementos.formas.innerHTML = "";

    const variedades = species?.varieties ?? [];

    if (variedades.length < 2) {
        elementos.formas.classList.remove("visible");
        return;
    }

    const nombreEspecieApi = species.name;

    variedades.forEach(variedad => {
        const nombreForma = variedad.pokemon.name;
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "forma-chip";

        if (nombreForma === pokemon.name) {
            boton.classList.add("activa");
            boton.setAttribute("aria-current", "true");
        }

        boton.textContent = nombreForma === nombreEspecieApi
            ? "Normal"
            : etiquetaForma(nombreForma, nombreEspecieApi) || "Normal";

        boton.addEventListener("click", () => {
            if (nombreForma !== pokemon.name) {
                irAPokemon(nombreForma);
            }
        });

        elementos.formas.appendChild(boton);
    });

    elementos.formas.classList.add("visible");
}

function renderizarHabilidades(pokemon) {
    elementos.habilidades.innerHTML = "";

    const ordenadas = [...pokemon.abilities].sort((a, b) => {
        if (a.is_hidden !== b.is_hidden) {
            return a.is_hidden ? 1 : -1;
        }
        return a.slot - b.slot;
    });

    ordenadas.forEach(referencia => {
        const tarjeta = document.createElement("article");
        tarjeta.className = `habilidad ${referencia.is_hidden ? "oculta" : ""}`;

        const etiqueta = document.createElement("span");
        etiqueta.className = "habilidad-etiqueta";
        etiqueta.textContent = referencia.is_hidden
            ? "Habilidad oculta"
            : referencia.slot === 1
                ? "Habilidad normal"
                : "Habilidad secundaria";

        const nombre = document.createElement("strong");
        nombre.textContent = nombreHabilidad(referencia.ability.name);

        tarjeta.append(etiqueta, nombre);
        tarjeta.addEventListener("click", () => irAHabilidad(referencia.ability.name));
        elementos.habilidades.appendChild(tarjeta);
    });

    if (ordenadas.length === 0) {
        elementos.habilidades.innerHTML = '<p class="vacio">Este Pokémon no tiene habilidades registradas.</p>';
    }
}

function renderizarStats(statsPokemon) {
    elementos.stats.innerHTML = "";

    const stats = statsPokemon.map(stat => ({
        nombre: stat.stat.name,
        base: stat.base_stat
    }));

    const basesOrdenadas = [...stats].sort((a, b) => b.base - a.base);
    const indicesFuertes = new Set(basesOrdenadas.slice(0, 2).map(stat => stat.nombre));
    const indicesMalas = new Set(basesOrdenadas.slice(-2).map(stat => stat.nombre));

    stats.forEach(stat => {
        const valores = calcularNivel50(stat.base, stat.nombre);
        let clase = "stat-mediocre";

        if (indicesFuertes.has(stat.nombre) && !indicesMalas.has(stat.nombre)) {
            clase = "stat-fuerte";
        } else if (indicesMalas.has(stat.nombre) && !indicesFuertes.has(stat.nombre)) {
            clase = "stat-mala";
        }

        const fila = document.createElement("article");
        fila.className = `stat-fila ${clase}`;

        const cabecera = document.createElement("div");
        cabecera.className = "stat-cabecera";

        const nombre = document.createElement("span");
        nombre.className = "stat-nombre";
        nombre.textContent = nombresStats[stat.nombre] || capitalizar(stat.nombre);

        const rango = document.createElement("span");
        rango.className = "stat-rango";
        rango.textContent = valores.min === valores.max ? `${valores.min}` : `${valores.min}–${valores.max}`;

        const base = document.createElement("strong");
        base.className = "stat-base";
        base.textContent = stat.base;

        cabecera.append(nombre, rango, base);

        const barra = document.createElement("div");
        barra.className = "stat-barra";

        const relleno = document.createElement("div");
        relleno.className = "stat-relleno";
        relleno.style.width = `${Math.min(100, (stat.base / 255) * 100)}%`;
        barra.appendChild(relleno);

        fila.append(cabecera, barra);
        elementos.stats.appendChild(fila);
    });

    const total = stats.reduce((totalBase, stat) => totalBase + stat.base, 0);
    elementos.totalStats.textContent = `${total} Puntos`;
}

/* Rango de la estadística a nivel 50: IV 0–31, EV 0–252 y naturaleza ×0.9 / ×1.1 */
function calcularNivel50(base, nombreStat) {
    const ivMinimo = 0;
    const ivMaximo = 31;
    const evMinimo = 0;
    const evMaximo = 252;
    const nivel = NIVEL_STATS;

    if (nombreStat === "hp") {
        /* Shedinja (PS base 1) siempre tiene 1 PS */
        if (base === 1) {
            return { min: 1, max: 1 };
        }

        const min = Math.floor(((2 * base + ivMinimo + Math.floor(evMinimo / 4)) * nivel) / 100) + nivel + 10;
        const max = Math.floor(((2 * base + ivMaximo + Math.floor(evMaximo / 4)) * nivel) / 100) + nivel + 10;
        return { min, max };
    }

    const baseMin = Math.floor(((2 * base + ivMinimo + Math.floor(evMinimo / 4)) * nivel) / 100) + 5;
    const baseMax = Math.floor(((2 * base + ivMaximo + Math.floor(evMaximo / 4)) * nivel) / 100) + 5;

    return {
        min: Math.floor(baseMin * 0.9),
        max: Math.floor(baseMax * 1.1)
    };
}

/* ---------- Línea evolutiva ---------- */

function mostrarEvoluciones(cadenaEvolucion, especieSeleccionada) {
    const raiz = cadenaEvolucion.chain;
    elementos.evoluciones.innerHTML = "";

    if (raiz.evolves_to.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "evolucion-vacia";
        vacio.textContent = "Este Pokémon no tiene evoluciones ni preevoluciones registradas.";
        elementos.evoluciones.appendChild(vacio);
        return;
    }

    if (raiz.species.name === "eevee") {
        renderizarEvolucionEevee(raiz, especieSeleccionada);
        return;
    }

    const arbol = document.createElement("div");
    arbol.className = "evo-arbol";
    arbol.appendChild(crearNodoEvolucion(raiz, especieSeleccionada));
    elementos.evoluciones.appendChild(arbol);
}

function crearTarjetaEvolucion(nodo, especieSeleccionada, claseExtra = "") {
    const id = extraerId(nodo.species.url);
    const nombre = nombreEspecie(nodo.species.name);
    const defecto = indice.especiePorId.get(id)?.defecto || nodo.species.name;

    const tarjeta = document.createElement("button");
    tarjeta.type = "button";
    tarjeta.className = `evolucion-pokemon ${claseExtra}`.trim();

    if (nodo.species.name === especieSeleccionada) {
        tarjeta.classList.add("seleccionado");
    }

    const sprite = document.createElement("img");
    sprite.loading = "lazy";
    sprite.alt = `Sprite de ${nombre}`;
    asignarSpriteConRespaldo(sprite, id, true);

    const texto = document.createElement("strong");
    texto.textContent = nombre;

    tarjeta.append(sprite, texto);
    tarjeta.addEventListener("click", () => irAPokemon(defecto));

    return tarjeta;
}

function crearCondicionEvolutiva(nodo) {
    const condicion = document.createElement("span");
    condicion.className = "evolucion-condicion";
    condicion.textContent = formatearCondiciones(nodo.evolution_details, nodo.species.name);
    return condicion;
}

/* Fila de un Pokémon dentro del árbol evolutivo: sprite a la izquierda, nombre y número */
function crearFilaEvolucion(nodo, especieSeleccionada) {
    const id = extraerId(nodo.species.url);
    const nombre = nombreEspecie(nodo.species.name);
    const defecto = indice.especiePorId.get(id)?.defecto || nodo.species.name;

    const fila = document.createElement("button");
    fila.type = "button";
    fila.className = "evo-fila";

    if (nodo.species.name === especieSeleccionada) {
        fila.classList.add("seleccionado");
        fila.setAttribute("aria-current", "true");
    }

    const sprite = document.createElement("img");
    sprite.loading = "lazy";
    sprite.alt = "";
    asignarSpriteConRespaldo(sprite, id, true);

    const texto = document.createElement("span");
    texto.className = "evo-nombre";
    texto.textContent = nombre;

    const numero = document.createElement("small");
    numero.textContent = formatearNumero(id);

    const datosFila = document.createElement("span");
    datosFila.className = "evo-datos";
    datosFila.append(texto, numero);

    fila.append(sprite, datosFila);
    fila.addEventListener("click", () => irAPokemon(defecto));

    return fila;
}

/* Un Pokémon y, debajo, sus evoluciones: cada una con su condición escrita en una línea propia */
function crearNodoEvolucion(nodo, especieSeleccionada) {
    const contenedor = document.createElement("div");
    contenedor.className = "evo-nodo";
    contenedor.appendChild(crearFilaEvolucion(nodo, especieSeleccionada));

    if (nodo.evolves_to.length === 0) {
        return contenedor;
    }

    const hijos = document.createElement("div");
    hijos.className = "evo-hijos";

    nodo.evolves_to.forEach(hijo => {
        const rama = document.createElement("div");
        rama.className = "evo-rama";

        const condicion = document.createElement("p");
        condicion.className = "evo-condicion";

        const flecha = document.createElement("span");
        flecha.className = "evo-flecha";
        flecha.setAttribute("aria-hidden", "true");
        flecha.textContent = "→";

        const textos = document.createElement("span");
        textos.className = "evo-textos";

        listarCondiciones(hijo.evolution_details, hijo.species.name).forEach((alternativa, posicion) => {
            const linea = document.createElement("span");
            linea.textContent = posicion === 0 ? alternativa : `o ${alternativa}`;
            textos.appendChild(linea);
        });

        condicion.append(flecha, textos);

        rama.append(condicion, crearNodoEvolucion(hijo, especieSeleccionada));
        hijos.appendChild(rama);
    });

    contenedor.appendChild(hijos);
    return contenedor;
}

function renderizarEvolucionEevee(raiz, especieSeleccionada) {
    const contenedor = document.createElement("div");
    contenedor.className = "evolucion-eevee";

    const centro = document.createElement("div");
    centro.className = "eevee-centro";
    centro.appendChild(crearTarjetaEvolucion(raiz, especieSeleccionada, "eevee-principal"));
    contenedor.appendChild(centro);

    /* Brújula alrededor de Eevee: cada flecha va entre Eevee y su evolución y apunta hacia ella */
    const posiciones = [
        ["nw", "↖"],
        ["n", "↑"],
        ["ne", "↗"],
        ["w", "←"],
        ["e", "→"],
        ["sw", "↙"],
        ["s", "↓"],
        ["se", "↘"]
    ];

    raiz.evolves_to.forEach((hijo, posicionHijo) => {
        const posicion = posiciones[posicionHijo] || posiciones[posiciones.length - 1];

        const rama = document.createElement("div");
        rama.className = `eevee-rama eevee-${posicion[0]}`;
        rama.appendChild(crearTarjetaEvolucion(hijo, especieSeleccionada));
        rama.appendChild(crearCondicionEvolutiva(hijo));

        const flecha = document.createElement("span");
        flecha.className = `eevee-flecha eevee-${posicion[0]}`;
        flecha.setAttribute("aria-hidden", "true");
        flecha.textContent = posicion[1];

        contenedor.append(rama, flecha);
    });

    elementos.evoluciones.appendChild(contenedor);
}

/* ---------- Condiciones de evolución ---------- */

/* PokéAPI guarda las condiciones de cada generación: nos quedamos solo con las vigentes */
function detallesVigentes(detalles) {
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return [];
    }

    const porDefecto = detalles.filter(detalle => detalle.is_default);

    if (porDefecto.length > 0) {
        return porDefecto;
    }

    const conVersion = detalles.filter(detalle => detalle.version_group?.url);

    if (conVersion.length > 0) {
        const masReciente = Math.max(...conVersion.map(detalle => extraerId(detalle.version_group.url)));
        return conVersion.filter(detalle => extraerId(detalle.version_group.url) === masReciente);
    }

    return detalles;
}

function nombreRegion(nombre) {
    return regiones[nombre] || capitalizar(nombre);
}

function nombreFormaRegional(nombreForma) {
    const region = Object.keys(regiones).find(r => String(nombreForma).endsWith(`-${r}`));
    return region ? nombreRegion(region) : null;
}

function describirDetalle(detalle, especieEvolucion = "") {
    const partes = [];
    const disparador = detalle.trigger?.name;
    const veces = detalle.min_move_count ? ` ${detalle.min_move_count} veces` : "";

    switch (disparador) {
        case "level-up":
            if (detalle.min_level !== null && detalle.min_level !== undefined) {
                partes.push(`Nivel ${detalle.min_level}`);
            }
            break;
        case "in-battle-level-up":
            partes.push(`Nivel ${detalle.min_level ?? "?"} en combate`);
            break;
        case "trade":
            partes.push(
                detalle.trade_species
                    ? `Intercambio por ${nombreEspecie(detalle.trade_species.name)}`
                    : detalle.held_item
                        ? `Intercambio con ${traducirItem(detalle.held_item.name)}`
                        : "Intercambio"
            );
            break;
        case "use-item":
            if (detalle.item) {
                partes.push(traducirItem(detalle.item.name));
            } else {
                partes.push("Usar objeto");
            }
            break;
        case "shed":
            partes.push("Hueco libre en el equipo + Poké Ball");
            break;
        case "spin":
            partes.push("Girar con un dulce");
            break;
        case "use-move":
            partes.push(`Usar ${traducirMovimiento(detalle.used_move?.name)}${veces}`);
            break;
        case "strong-style-move":
            partes.push(`Usar ${traducirMovimiento(detalle.used_move?.name)}${veces} (estilo fuerte)`);
            break;
        case "agile-style-move":
            partes.push(`Usar ${traducirMovimiento(detalle.used_move?.name)}${veces} (estilo rápido)`);
            break;
        case "recoil-damage":
            partes.push(`Recibir ${detalle.min_damage_taken ?? "?"} de daño por retroceso`);
            break;
        case "take-damage":
            partes.push(`Recibir ${detalle.min_damage_taken ?? "?"} de daño`);
            break;
        case "three-critical-hits":
            partes.push("Dar 3 golpes críticos en un combate");
            break;
        case "three-defeated-bisharp":
            partes.push("Derrotar a 3 Bisharp líderes");
            break;
        case "gimmighoul-coins":
            partes.push("Con 999 monedas de Gimmighoul");
            break;
        case "meltan-candies":
            partes.push("Dar 400 caramelos de Meltan");
            break;
        case "tower-of-darkness":
            partes.push("Torre Oscura");
            break;
        case "tower-of-waters":
            partes.push("Torre de las Aguas");
            break;
        default:
            if (disparador) {
                partes.push(prettificar(disparador));
            }
    }

    if (disparador !== "level-up" && disparador !== "in-battle-level-up"
        && detalle.min_level !== null && detalle.min_level !== undefined) {
        partes.push(`Nivel ${detalle.min_level}`);
    }

    if (detalle.item && disparador !== "use-item") {
        partes.push(`Usar ${traducirItem(detalle.item.name)}`);
    }

    if (detalle.held_item && disparador !== "trade") {
        partes.push(`Con ${traducirItem(detalle.held_item.name)} equipado`);
    }

    if (detalle.min_happiness !== null && detalle.min_happiness !== undefined) {
        partes.push(`Amistad ≥${detalle.min_happiness}`);
    }

    if (detalle.min_affection !== null && detalle.min_affection !== undefined) {
        partes.push(`Afecto ≥${detalle.min_affection}`);
    }

    if (detalle.min_beauty !== null && detalle.min_beauty !== undefined) {
        partes.push(`Belleza ≥${detalle.min_beauty}`);
    }

    if (detalle.min_steps) {
        partes.push(`Caminar ${detalle.min_steps} pasos en modo Let's Go`);
    }

    if (detalle.known_move) {
        partes.push(`Sabiendo ${traducirMovimiento(detalle.known_move.name)}`);
    }

    if (detalle.known_move_type) {
        partes.push(`Mov. tipo ${traducirTipo(detalle.known_move_type.name)}`);
    }

    if (detalle.location) {
        partes.push(`En ${traducirLugar(detalle.location.name)}`);
    }

    if (detalle.near_special_rock) {
        partes.push("Cerca de una roca especial");
    }

    if (detalle.time_of_day) {
        const momentos = {
            day: "De día",
            night: "De noche",
            dusk: "Al atardecer",
            "full-moon": "Con luna llena"
        };
        partes.push(momentos[detalle.time_of_day] || prettificar(detalle.time_of_day));
    }

    if (detalle.gender !== null && detalle.gender !== undefined) {
        partes.push(detalle.gender === 1 ? "Hembra" : "Macho");
    }

    if (detalle.turn_upside_down) {
        partes.push("Con la consola boca abajo");
    }

    if (detalle.needs_overworld_rain) {
        partes.push("Mientras llueve");
    }

    if (detalle.needs_multiplayer) {
        partes.push("En modo multijugador");
    }

    if (detalle.party_species) {
        partes.push(`Con ${nombreEspecie(detalle.party_species.name)} en el equipo`);
    }

    if (detalle.party_type) {
        partes.push(`Con un Pokémon de tipo ${traducirTipo(detalle.party_type.name)} en el equipo`);
    }

    if (detalle.relative_physical_stats !== null && detalle.relative_physical_stats !== undefined) {
        partes.push({ 1: "Ataque > Defensa", "-1": "Ataque < Defensa", 0: "Ataque = Defensa" }[detalle.relative_physical_stats]);
    }

    const formaEvolucionada = detalle.evolved_pokemon_form?.name
        ? etiquetaForma(detalle.evolved_pokemon_form.name, especieEvolucion || detalle.evolved_pokemon_form.name.split("-")[0])
        : "";

    if (Array.isArray(detalle.allowed_natures) && detalle.allowed_natures.length > 0) {
        partes.push(
            detalle.allowed_natures.length <= 4 || !formaEvolucionada
                ? `Naturaleza: ${detalle.allowed_natures.map(natura => traducirNaturaleza(natura.name)).join(", ")}`
                : `Naturaleza propia de la forma ${formaEvolucionada}`
        );
    }

    const probabilidad = detalle.condition_expression?.percentage_chance;
    let texto = partes.filter(Boolean).join(" + ");

    if (probabilidad !== null && probabilidad !== undefined) {
        texto += ` (${probabilidad}%${formaEvolucionada ? ` · ${formaEvolucionada}` : ""})`;
    }

    if (detalle.region && texto) {
        const region = nombreRegion(detalle.region.name);
        const formaDeRegion = nombreFormaRegional(detalle.evolved_pokemon_form?.name);
        texto += formaDeRegion ? ` (en ${region}: forma de ${formaDeRegion})` : ` (en ${region})`;
    }

    const formaRegional = nombreFormaRegional(detalle.required_pokemon_form?.name);

    return formaRegional && texto ? `Forma de ${formaRegional}: ${texto}` : texto;
}

/* Devuelve cada alternativa de evolución como un texto independiente */
function listarCondiciones(detalles, especieEvolucion = "") {
    const vigentes = detallesVigentes(detalles);

    if (vigentes.length === 0) {
        return ["Evolución"];
    }

    /* Alcremie tiene decenas de combinaciones de dulce, sabor y giro */
    if (vigentes.every(detalle => detalle.trigger?.name === "spin")) {
        return ["Girar con un dulce"];
    }

    const textos = [...new Set(vigentes.map(detalle => describirDetalle(detalle, especieEvolucion)).filter(Boolean))];
    const sinPrefijo = texto => texto.replace(/^Forma de [^:]+: /, "");
    const esRegional = texto => /^Forma de [^:]+: /.test(texto);

    /* Si la misma condición aparece con y sin forma regional, basta con una */
    const alternativas = textos.filter(texto => !esRegional(texto)
        || !textos.some(otro => otro !== texto && !esRegional(otro) && otro === sinPrefijo(texto)));

    if (alternativas.length === 0) {
        return ["Evolución"];
    }

    if (alternativas.length > 4) {
        return [...alternativas.slice(0, 4), `…y ${alternativas.length - 4} más`];
    }

    return alternativas;
}

/* Versión en una sola línea (para los huecos pequeños de la rejilla de Eevee) */
function formatearCondiciones(detalles, especieEvolucion = "") {
    return listarCondiciones(detalles, especieEvolucion).join(" o ");
}

/* ---------- Debilidades y resistencias ---------- */

function calcularEfectividad(relaciones) {
    const multiplicadores = Object.fromEntries(ordenTipos.map(tipo => [tipo, 1]));

    relaciones.forEach(relacion => {
        relacion.dobleDe.forEach(tipo => {
            if (tipo in multiplicadores) multiplicadores[tipo] *= 2;
        });

        relacion.mitadDe.forEach(tipo => {
            if (tipo in multiplicadores) multiplicadores[tipo] *= 0.5;
        });

        relacion.nadaDe.forEach(tipo => {
            if (tipo in multiplicadores) multiplicadores[tipo] *= 0;
        });
    });

    return multiplicadores;
}

function ordenarPorTipo(lista) {
    return lista.sort((a, b) => ordenTipos.indexOf(a[0]) - ordenTipos.indexOf(b[0]));
}

function renderizarEfectividad(relaciones) {
    if (!relaciones) {
        ["debilidades", "resistencias", "inmunidades", "ofensivas"].forEach(id => {
            elementos[id].innerHTML = '<span class="grupo-vacio">No disponible</span>';
        });
        return;
    }

    const multiplicadores = calcularEfectividad(relaciones);
    const entradas = ordenarPorTipo(Object.entries(multiplicadores));

    const debilidades = entradas
        .filter(([, valor]) => valor > 1)
        .sort((a, b) => b[1] - a[1]);
    const resistencias = entradas
        .filter(([, valor]) => valor > 0 && valor < 1)
        .sort((a, b) => a[1] - b[1]);
    const inmunidades = entradas.filter(([, valor]) => valor === 0);

    renderizarGrupoTipos(elementos.debilidades, debilidades, "No hay debilidades especiales");
    renderizarGrupoTipos(elementos.resistencias, resistencias, "No tiene resistencias registradas");
    renderizarGrupoTipos(elementos.inmunidades, inmunidades, "Ninguna");

    const ofensivas = new Set();
    relaciones.forEach(relacion => relacion.dobleA.forEach(tipo => ofensivas.add(tipo)));

    const listaOfensiva = ordenarPorTipo([...ofensivas].map(tipo => [tipo, 2]));
    renderizarGrupoTipos(elementos.ofensivas, listaOfensiva, "Ninguna");
}

function renderizarGrupoTipos(contenedor, datosGrupo, textoVacio) {
    contenedor.innerHTML = "";

    if (datosGrupo.length === 0) {
        const vacio = document.createElement("span");
        vacio.className = "grupo-vacio";
        vacio.textContent = textoVacio;
        contenedor.appendChild(vacio);
        return;
    }

    datosGrupo.forEach(([tipo, multiplicador]) => {
        contenedor.appendChild(crearChipTipo(tipo, multiplicador));
    });
}

function formatearMultiplicador(valor) {
    const conocidos = { 0: "×0", 0.25: "×¼", 0.5: "×½", 2: "×2", 4: "×4" };
    return conocidos[valor] || `×${valor}`;
}

/* ---------- Estado de la interfaz ---------- */

function mostrarEstado(texto) {
    elementos.estado.textContent = texto;
    elementos.estado.classList.add("visible");
}

function ocultarEstado() {
    elementos.estado.classList.remove("visible");
}

/* ---------- Eventos ---------- */

function prepararEventos() {
    elementos.buscador.addEventListener("input", () => {
        const valor = elementos.buscador.value;
        elementos.limpiarBusqueda.classList.toggle("visible", valor.length > 0);
        mostrarSugerencias(valor);
    });

    elementos.buscador.addEventListener("focus", () => {
        if (!elementos.buscador.value.trim()) {
            actualizarSugerenciasIniciales();
        } else {
            mostrarSugerencias(elementos.buscador.value);
        }
    });

    elementos.shinyBoton.addEventListener("click", () => {
        if (!pokemonActual) {
            return;
        }

        const spriteShiny = obtenerSpriteShiny(pokemonActual);

        if (!spriteShiny) {
            return;
        }

        mostrandoShiny = !mostrandoShiny;

        elementos.pokemonSprite.src = mostrandoShiny
            ? spriteShiny
            : obtenerSpritePrincipal(pokemonActual);

        elementos.shinyBoton.classList.toggle("activo", mostrandoShiny);
        elementos.shinyBoton.setAttribute("aria-pressed", String(mostrandoShiny));
        elementos.shinyBoton.setAttribute(
            "aria-label",
            mostrandoShiny ? "Mostrar versión normal" : "Mostrar versión shiny"
        );
    });

    elementos.busquedaForm.addEventListener("submit", event => {
        event.preventDefault();
        elementos.buscador.blur();
        buscarEntrada(elementos.buscador.value);
    });

    /* Tocar en cualquier punto de la barra (también en la lupa) enfoca el campo */
    elementos.busquedaForm.addEventListener("click", event => {
        if (event.target === elementos.busquedaForm) {
            elementos.buscador.focus();
        }
    });

    elementos.atrasBoton.addEventListener("click", volverAtras);

    elementos.limpiarBusqueda.addEventListener("click", () => {
        elementos.buscador.value = "";
        elementos.limpiarBusqueda.classList.remove("visible");
        elementos.buscador.focus();
        mostrarSugerencias("");
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".buscador-wrap")) {
            ocultarSugerencias();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "/" && document.activeElement !== elementos.buscador) {
            event.preventDefault();
            elementos.buscador.focus();
        }

        if (event.key === "Escape") {
            ocultarSugerencias();
            elementos.buscador.blur();
        }
    });
}

/* ---------- Deslizar para cambiar de Pokémon ---------- */

function dentroDeScrollHorizontal(elemento) {
    for (let actual = elemento; actual && actual !== document.body; actual = actual.parentElement) {
        const overflowX = getComputedStyle(actual).overflowX;

        if ((overflowX === "auto" || overflowX === "scroll") && actual.scrollWidth > actual.clientWidth + 1) {
            return true;
        }
    }

    return false;
}

function prepararSwipePokemon() {
    let inicio = null;

    document.addEventListener("touchstart", event => {
        inicio = null;

        if (event.touches.length !== 1) {
            return;
        }

        const objetivo = event.target;

        if (!(objetivo instanceof Element)
            || objetivo.closest("input, button, a, textarea, select")
            || dentroDeScrollHorizontal(objetivo)) {
            return;
        }

        inicio = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });

    document.addEventListener("touchcancel", () => {
        inicio = null;
    }, { passive: true });

    document.addEventListener("touchend", event => {
        const origen = inicio;
        inicio = null;

        const toque = event.changedTouches?.[0];

        if (!origen || !toque || !elementos.ficha.classList.contains("visible") || especieActualId <= 0) {
            return;
        }

        const desplazamientoX = toque.clientX - origen.x;
        const desplazamientoY = toque.clientY - origen.y;

        /* Gesto claramente horizontal y suficientemente largo */
        if (Math.abs(desplazamientoX) < 60 || Math.abs(desplazamientoX) < Math.abs(desplazamientoY) * 1.6) {
            return;
        }

        const siguienteId = desplazamientoX > 0 ? especieActualId - 1 : especieActualId + 1;

        if (siguienteId < 1 || siguienteId > indice.maximoEspecie) {
            return;
        }

        /* La API acepta el número de la Pokédex como identificador */
        irAPokemon(indice.especiePorId.get(siguienteId)?.defecto ?? String(siguienteId));
    }, { passive: true });
}

/* ---------- Arranque ---------- */

function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js").catch(error => {
            console.error("Error registrando Service Worker:", error);
        });
    }
}

/* ---------- Aviso para instalar la app (solo en Safari de iPhone/iPad, fuera de la app instalada) ---------- */

function prepararAvisoInstalacion() {
    const aviso = document.getElementById("instalarAviso");
    const cerrar = document.getElementById("instalarCerrar");

    if (!aviso || !cerrar) {
        return;
    }

    const esIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const instalada = navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;

    if (!esIos || instalada || leerAlmacen("ultraball-aviso-instalar") === "cerrado") {
        return;
    }

    aviso.hidden = false;
    cerrar.addEventListener("click", () => {
        aviso.hidden = true;
        escribirAlmacen("ultraball-aviso-instalar", "cerrado");
    });
}

window.addEventListener("resize", () => {
    if (elementos.ficha?.classList.contains("visible")) {
        ajustarNombrePokemon();
    }
});

async function iniciarApp() {
    iniciarElementos();
    prepararAvisoInstalacion();
    prepararEventos();

    if (SWIPE_ACTIVO) {
        prepararSwipePokemon();
    }

    datosListos = cargarDatos();

    elementos.buscador.value = "";
    elementos.limpiarBusqueda.classList.remove("visible");

    let resultado = await buscarPokemon(cargarUltimoPokemon(), { inicial: true, silencioso404: true });

    if (resultado === "404") {
        resultado = await buscarPokemon("zekrom", { inicial: true });
    }

    ocultarSugerencias();
    registrarServiceWorker();
}

iniciarApp();
