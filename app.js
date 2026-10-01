const API = "https://pokeapi.co/api/v2";
const NIVEL_STATS = 50;

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

const nombresStats = {
    hp: "PS",
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "At. Esp.",
    "special-defense": "Def. Esp.",
    speed: "Velocidad"
};

const iconosStats = {
    hp: "♥",
    attack: "⚔",
    defense: "◈",
    "special-attack": "✦",
    "special-defense": "◇",
    speed: "➜"
};

const nombresItems = {
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
    "reaper-cloth": "Tela Terrible",
    "whipped-dream": "Dulce Aroma",
    "sachet": "Saquito Aromático",
    "sweet-apple": "Manzana Dulce",
    "tart-apple": "Manzana Ácida",
    "cracked-pot": "Tetera Rota",
    "chipped-pot": "Tetera Picada",
    "black-augurite": "Augurita Negra",
    "peat-block": "Bloque de Turba",
    "linking-cord": "Cordón Unión"
};

const sugerenciasIniciales = [];

let listaPokemon = [];
let listaHabilidades = [];
let cachePokemon = new Map();
let cacheSpecies = new Map();
let cacheAbility = new Map();
let cacheType = new Map();
let solicitudActual = 0;

const elementos = {};

function iniciarElementos() {
    const ids = [
        "busquedaForm",
        "buscador",
        "limpiarBusqueda",
        "sugerencias",
        "estado",
        "error",
        "habilidadDetalle",
        "ficha",
        "fondoPokemon",
        "pokemonSprite",
        "numeroPokedex",
        "nombrePokemon",
        "categoriaPokemon",
        "tiposPokemon",
        "habilidades",
        "stats",
        "totalStats",
        "evoluciones",
        "debilidades",
        "resistencias",
        "inmunidades",
        "ofensivas"
    ];

    ids.forEach(id => {
        elementos[id] = document.getElementById(id);
    });
}

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function capitalizar(texto) {
    return texto
        .split("-")
        .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join("-");
}

function obtenerNombreLocalizado(nombres, fallback) {
    const espanol = nombres?.find(item => item.language?.name === "es");
    const ingles = nombres?.find(item => item.language?.name === "en");
    return espanol?.name || ingles?.name || fallback;
}

async function obtenerJSON(url, cache) {
    if (cache?.has(url)) {
        return cache.get(url);
    }

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (cache) {
        cache.set(url, datos);
    }

    return datos;
}

async function cargarListadoPokemon() {
    try {
        const resumen = await obtenerJSON(`${API}/pokemon?limit=1&offset=0`);
        const total = resumen.count;
        const datos = await obtenerJSON(`${API}/pokemon?limit=${total}&offset=0`);

        listaPokemon = datos.results.map(pokemon => ({
            name: pokemon.name,
            id: extraerId(pokemon.url),
            url: pokemon.url
        }));

        if (!elementos.buscador.value.trim()) {
            actualizarSugerenciasAleatorias();
        }
    } catch (error) {
        console.error(error);
        elementos.error.textContent = "No se ha podido cargar la lista de Pokémon. Puedes probar buscando por nombre igualmente.";
    }
}

async function cargarListadoHabilidades() {
    try {
        const resumen = await obtenerJSON(`${API}/ability?limit=1&offset=0`);
        const datos = await obtenerJSON(`${API}/ability?limit=${resumen.count}&offset=0`);

        listaHabilidades = datos.results.map(habilidad => ({
            name: habilidad.name,
            id: extraerId(habilidad.url),
            url: habilidad.url
        }));

        if (elementos.buscador.value.trim()) {
            mostrarSugerencias(elementos.buscador.value);
        }
    } catch (error) {
        console.error("No se pudo cargar el listado de habilidades:", error);
    }
}

function extraerId(url) {
    const partes = url.split("/").filter(Boolean);
    return Number(partes.at(-1));
}

function buscarCoincidencias(texto) {
    const consulta = normalizar(texto);

    if (!consulta) {
        return obtenerSugerenciasAleatorias();
    }

    const resultados = [];
    const pokemonEmpiezan = [];
    const pokemonContienen = [];
    const habilidadesEmpiezan = [];
    const habilidadesContienen = [];

    for (const pokemon of listaPokemon) {
        const nombre = normalizar(pokemon.name);

        if (nombre.startsWith(consulta)) {
            pokemonEmpiezan.push({ kind: "pokemon", ...pokemon });
        } else if (nombre.includes(consulta)) {
            pokemonContienen.push({ kind: "pokemon", ...pokemon });
        }
    }

    for (const habilidad of listaHabilidades) {
        const nombre = normalizar(habilidad.name);

        if (nombre.startsWith(consulta)) {
            habilidadesEmpiezan.push({ kind: "habilidad", ...habilidad });
        } else if (nombre.includes(consulta)) {
            habilidadesContienen.push({ kind: "habilidad", ...habilidad });
        }
    }

    resultados.push(...pokemonEmpiezan, ...habilidadesEmpiezan, ...pokemonContienen, ...habilidadesContienen);
    return resultados.slice(0, 10);
}

function obtenerSugerenciasAleatorias() {
    if (listaPokemon.length === 0) {
        return [];
    }

    const disponibles = [...listaPokemon];
    const sugerencias = [];

    while (sugerencias.length < 5 && disponibles.length > 0) {
        const indice = Math.floor(Math.random() * disponibles.length);
        const pokemon = disponibles.splice(indice, 1)[0];

        sugerencias.push({
            kind: "pokemon",
            ...pokemon
        });
    }

    return sugerencias;
}

function actualizarSugerenciasAleatorias() {
    const sugerencias = obtenerSugerenciasAleatorias();
    renderizarSugerencias(sugerencias, sugerencias.length > 0);
}

function mostrarSugerencias(texto) {
    const coincidencias = buscarCoincidencias(texto);
    renderizarSugerencias(coincidencias, true);
}

function renderizarSugerencias(coincidencias, mostrar) {
    elementos.sugerencias.innerHTML = "";

    if (!mostrar || coincidencias.length === 0) {
        elementos.sugerencias.classList.remove("visible");
        return;
    }

    coincidencias.forEach(resultado => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = `sugerencia ${resultado.kind === "habilidad" ? "sugerencia-habilidad" : ""}`;
        boton.dataset.nombre = resultado.name;

        const icono = document.createElement("span");
        icono.className = "sugerencia-icono";
        icono.textContent = resultado.kind === "habilidad" ? "✦" : "◈";

        const contenido = document.createElement("span");
        contenido.className = "sugerencia-contenido";

        const nombre = document.createElement("span");
        nombre.className = "sugerencia-nombre";
        nombre.textContent = capitalizar(resultado.name);

        const tipo = document.createElement("small");
        tipo.className = "sugerencia-tipo";
        tipo.textContent = resultado.kind === "habilidad" ? "Habilidad" : `Pokémon ${resultado.id ? `· #${String(resultado.id).padStart(4, "0")}` : ""}`;

        contenido.append(nombre, tipo);

        const flecha = document.createElement("span");
        flecha.className = "sugerencia-flecha";
        flecha.textContent = "→";

        boton.append(icono, contenido, flecha);

        boton.addEventListener("click", () => {
            elementos.buscador.value = resultado.name;
            elementos.limpiarBusqueda.classList.add("visible");
            elementos.sugerencias.classList.remove("visible");

            if (resultado.kind === "habilidad") {
                buscarHabilidad(resultado.name);
            } else {
                buscarPokemon(resultado.name);
            }
        });

        elementos.sugerencias.appendChild(boton);
    });

    elementos.sugerencias.classList.add("visible");
}

async function buscarPokemon(entrada, opciones = {}) {
    const nombre = normalizar(entrada);
    const cargaInicial = opciones.inicial === true;

    if (!nombre) {
        return;
    }

    elementos.sugerencias.classList.remove("visible");
    elementos.error.textContent = "";
    const idSolicitud = ++solicitudActual;

    mostrarEstado(cargaInicial ? "Preparando la Pokédex..." : `Buscando ${capitalizar(nombre)}...`);

    try {
        const pokemon = await obtenerJSON(
            `${API}/pokemon/${encodeURIComponent(nombre)}`,
            cachePokemon
        );

        const species = await obtenerJSON(
            pokemon.species.url,
            cacheSpecies
        );

        if (idSolicitud !== solicitudActual) {
            return;
        }

        const resultados = await Promise.allSettled([
            obtenerJSON(species.evolution_chain.url),
            Promise.all(pokemon.abilities.map(item => obtenerJSON(item.ability.url, cacheAbility))),
            Promise.all(pokemon.types.map(item => obtenerJSON(item.type.url, cacheType)))
        ]);

        if (idSolicitud !== solicitudActual) {
            return;
        }

        const cadenaEvolucion = resultados[0].status === "fulfilled"
            ? resultados[0].value
            : null;
        const habilidades = resultados[1].status === "fulfilled"
            ? resultados[1].value
            : [];
        const tipos = resultados[2].status === "fulfilled"
            ? resultados[2].value
            : [];

        mostrarPokemon(pokemon, species, habilidades, tipos);

        if (cadenaEvolucion) {
            try {
                await mostrarEvoluciones(cadenaEvolucion, pokemon.species.name);
            } catch (error) {
                console.error("Error cargando evolución:", error);
                elementos.evoluciones.innerHTML = '<p class="evolucion-vacia">No se ha podido cargar la línea evolutiva.</p>';
            }
        } else {
            elementos.evoluciones.innerHTML = '<p class="evolucion-vacia">No se ha podido cargar la línea evolutiva.</p>';
        }

        if (idSolicitud !== solicitudActual) {
            return;
        }

        if (tipos.length > 0) {
            renderizarDebilidadesYFortalezas(tipos);
        } else {
            elementos.debilidades.innerHTML = '<span class="grupo-vacio">No disponible</span>';
            elementos.resistencias.innerHTML = '<span class="grupo-vacio">No disponible</span>';
            elementos.inmunidades.innerHTML = '<span class="grupo-vacio">No disponible</span>';
            elementos.ofensivas.innerHTML = '<span class="grupo-vacio">No disponible</span>';
        }

        ocultarEstado();
        guardarUltimoPokemon(nombre);
        return true;
    } catch (error) {
        console.error("Error cargando Pokémon:", error);

        if (idSolicitud !== solicitudActual) {
            return;
        }

        ocultarEstado();

        if (cargaInicial) {
            elementos.ficha.classList.remove("visible");
            elementos.error.textContent = "No se ha podido conectar con PokéAPI. Comprueba tu conexión y vuelve a intentarlo.";
        } else {
            elementos.error.textContent = "No he encontrado ese Pokémon. Prueba con su nombre en inglés, por ejemplo: pikachu, bulbasaur o charizard.";
        }

        return false;
    }
}

async function buscarHabilidad(entrada) {
    const nombre = normalizar(entrada);

    if (!nombre) {
        return;
    }

    elementos.sugerencias.classList.remove("visible");
    elementos.error.textContent = "";
    elementos.ficha.classList.remove("visible");
    elementos.habilidadDetalle.classList.remove("visible");
    const idSolicitud = ++solicitudActual;

    mostrarEstado(`Buscando habilidad ${capitalizar(nombre)}...`);

    try {
        const habilidad = await obtenerJSON(`${API}/ability/${encodeURIComponent(nombre)}`, cacheAbility);

        if (idSolicitud !== solicitudActual) {
            return;
        }

        renderizarDetalleHabilidad(habilidad);
        ocultarEstado();
    } catch (error) {
        console.error("Error cargando habilidad:", error);
        if (idSolicitud !== solicitudActual) {
            return;
        }

        ocultarEstado();
        elementos.error.textContent = `No he encontrado la habilidad “${capitalizar(nombre)}”. Prueba con su nombre en inglés, por ejemplo: intimidate, levitate o static.`;
    }
}

function renderizarDetalleHabilidad(habilidad) {
    const nombre = obtenerNombreLocalizado(habilidad.names, capitalizar(habilidad.name));
    const efecto = obtenerTextoLocalizado(habilidad.effect_entries, "effect") || "No hay una descripción disponible para esta habilidad.";
    const resumen = obtenerTextoLocalizado(habilidad.effect_entries, "short_effect") || "";
    const pokemon = [...habilidad.pokemon].sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name));

    elementos.habilidadDetalle.innerHTML = "";
    elementos.habilidadDetalle.classList.add("visible");

    const cabecera = document.createElement("div");
    cabecera.className = "habilidad-detalle-cabecera";

    const etiqueta = document.createElement("span");
    etiqueta.className = "detalle-etiqueta";
    etiqueta.textContent = "HABILIDAD";

    const titulo = document.createElement("h2");
    titulo.textContent = nombre;

    const nombreApi = document.createElement("p");
    nombreApi.className = "detalle-subtitulo";
    nombreApi.textContent = capitalizar(habilidad.name);

    cabecera.append(etiqueta, titulo, nombreApi);

    const descripcion = document.createElement("div");
    descripcion.className = "habilidad-descripcion";

    const descripcionTitulo = document.createElement("span");
    descripcionTitulo.textContent = "¿QUÉ HACE?";

    const descripcionTexto = document.createElement("p");
    descripcionTexto.textContent = efecto;

    descripcion.append(descripcionTitulo, descripcionTexto);

    if (resumen && resumen !== efecto) {
        const resumenTexto = document.createElement("small");
        resumenTexto.textContent = resumen;
        descripcion.appendChild(resumenTexto);
    }

    const poseedores = document.createElement("div");
    poseedores.className = "habilidad-poseedores";

    const poseedoresCabecera = document.createElement("div");
    poseedoresCabecera.className = "poseedores-cabecera";

    const poseedoresTitulo = document.createElement("div");
    poseedoresTitulo.innerHTML = `<span>POKÉMON QUE LA POSEEN</span><small>${pokemon.length} Pokémon registrados</small>`;
    poseedoresCabecera.appendChild(poseedoresTitulo);

    const grid = document.createElement("div");
    grid.className = "poseedores-grid";

    pokemon.forEach(item => {
        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "poseedor-pokemon";

        const id = extraerId(item.pokemon.url);
        const sprite = document.createElement("img");
        sprite.loading = "lazy";
        sprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${id}.png`;
        sprite.alt = `Sprite de ${capitalizar(item.pokemon.name)}`;

        const texto = document.createElement("span");
        texto.textContent = capitalizar(item.pokemon.name);

        const tipo = document.createElement("small");
        tipo.textContent = item.is_hidden ? "Oculta" : "Disponible";

        tarjeta.append(sprite, texto, tipo);
        tarjeta.addEventListener("click", () => {
            elementos.buscador.value = item.pokemon.name;
            elementos.limpiarBusqueda.classList.add("visible");
            buscarPokemon(item.pokemon.name);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        grid.appendChild(tarjeta);
    });

    poseedores.append(poseedoresCabecera, grid);
    elementos.habilidadDetalle.append(cabecera, descripcion, poseedores);

    document.title = `${nombre} · Habilidad · Pokédex`;
}

function obtenerTextoLocalizado(lista, campo) {
    if (!Array.isArray(lista)) {
        return "";
    }

    const espanol = lista.find(item => item.language?.name === "es");
    const ingles = lista.find(item => item.language?.name === "en");
    return espanol?.[campo] || ingles?.[campo] || "";
}

function mostrarPokemon(pokemon, species, habilidades, tipos) {
    elementos.habilidadDetalle.classList.remove("visible");
    elementos.ficha.classList.add("visible");

    const nombre = obtenerNombreLocalizado(species.names, capitalizar(pokemon.name));
    const genero = species.genera ? obtenerNombreLocalizado(species.genera, "Pokémon") : "Pokémon";
    const imagen = obtenerSpritePrincipal(pokemon);
    const imagenFondo =
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        imagen;

    const tipoPrincipal = pokemon.types[0]?.type?.name || "normal";
    const fondoTipo = `./assets/backgrounds/${tipoPrincipal}.gif`;

    elementos.ficha.classList.add("visible");
    elementos.nombrePokemon.textContent = nombre;
    elementos.numeroPokedex.textContent = `#${String(pokemon.id).padStart(4, "0")}`;
    elementos.categoriaPokemon.textContent = genero;
    elementos.pokemonSprite.src = imagen || "";
    elementos.pokemonSprite.alt = `Sprite de ${nombre}`;

    elementos.fondoPokemon.style.backgroundImage = `url("${fondoTipo}"), url("${imagenFondo || ""}")`;

    document.documentElement.style.setProperty("--accent", coloresTipos[tipoPrincipal] || "#ffffff");

    document.title = `${nombre} · Pokédex`;
    document.querySelector('meta[name="theme-color"]').setAttribute("content", coloresTipos[tipoPrincipal] || "#233044");

    renderizarTiposPokemon(pokemon.types);
    renderizarHabilidades(pokemon, habilidades);
    renderizarStats(pokemon.stats);
}

function renderizarTiposPokemon(tiposPokemon) {
    elementos.tiposPokemon.innerHTML = "";

    tiposPokemon.forEach(item => {
        const nombreTipo = item.type.name;
        const chip = crearChipTipo(nombreTipo);
        elementos.tiposPokemon.appendChild(chip);
    });
}

function crearChipTipo(nombreTipo, multiplicador = null) {
    const chip = document.createElement("span");
    chip.className = "tipo-chip";
    chip.dataset.tipo = nombreTipo;

    const texto = document.createElement("span");
    texto.textContent = nombresTipos[nombreTipo] || capitalizar(nombreTipo);
    chip.appendChild(texto);

    if (multiplicador !== null) {
        const multi = document.createElement("strong");
        multi.className = "tipo-multiplicador";
        multi.textContent = formatearMultiplicador(multiplicador);
        chip.appendChild(multi);
    }

    return chip;
}

function renderizarHabilidades(pokemon, habilidades) {
    elementos.habilidades.innerHTML = "";

    const ordenadas = [...pokemon.abilities].sort((a, b) => {
        if (a.is_hidden !== b.is_hidden) {
            return a.is_hidden ? 1 : -1;
        }
        return a.slot - b.slot;
    });

    ordenadas.forEach(referencia => {
        const detalle = habilidades.find(item => item.name === referencia.ability.name);
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
        nombre.textContent = obtenerNombreLocalizado(
            detalle?.names,
            capitalizar(referencia.ability.name)
        );

        tarjeta.append(etiqueta, nombre);
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
        rango.textContent = `${valores.min}–${valores.max}`;

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

function clasificarStat(base, media, umbral, rango) {
    if (rango < 25) {
        return "stat-mediocre";
    }

    if (base >= media + umbral) {
        return "stat-fuerte";
    }

    if (base <= media - umbral) {
        return "stat-mala";
    }

    return "stat-mediocre";
}

function calcularNivel50(base, nombreStat) {
    const ivMinimo = 0;
    const ivMaximo = 31;
    const evMinimo = 0;
    const evMaximo = 252;
    const nivel = NIVEL_STATS;

    if (nombreStat === "hp") {
        const min = Math.floor(((2 * base + ivMinimo + Math.floor(evMinimo / 4)) * nivel) / 100) + nivel + 10;
        const max = Math.floor(((2 * base + ivMaximo + Math.floor(evMaximo / 4)) * nivel) / 100) + nivel + 10;
        return { min, max };
    }

    const baseMin = Math.floor(((2 * base + ivMinimo + Math.floor(evMinimo / 4)) * nivel) / 100) + 5;
    const baseMax = Math.floor(((2 * base + ivMaximo + Math.floor(evMaximo / 4)) * nivel) / 100) + 5;

    const min = Math.floor(baseMin * 0.9);
    const max = Math.floor(baseMax * 1.1);

    return { min, max };
}

async function mostrarEvoluciones(cadenaEvolucion, especieSeleccionada) {
    const raiz = cadenaEvolucion.chain;
    elementos.evoluciones.innerHTML = "";

    const nodos = obtenerNodosCadena(raiz);
    const resultados = await Promise.allSettled(
        nodos.map(nodo => obtenerJSON(`${API}/pokemon/${encodeURIComponent(nodo.species.name)}`, cachePokemon))
    );

    const mapaPokemons = new Map();

    resultados.forEach((resultado, indice) => {
        if (resultado.status === "fulfilled") {
            mapaPokemons.set(resultado.value.name, resultado.value);
        } else {
            console.warn(
                `No se pudo cargar ${nodos[indice].species.name} para la línea evolutiva.`,
                resultado.reason
            );
        }
    });

    if (nodos.length === 1) {
        const vacio = document.createElement("p");
        vacio.className = "evolucion-vacia";
        vacio.textContent = "Este Pokémon no tiene evoluciones ni preevoluciones registradas.";
        elementos.evoluciones.appendChild(vacio);
        return;
    }

    if (raiz.species.name === "eevee" && raiz.evolves_to.length > 0) {
        renderizarEvolucionEevee(raiz, mapaPokemons, especieSeleccionada);
        return;
    }

    if (cadenaTieneRamificaciones(raiz)) {
        renderizarArbolEvolutivo(raiz, mapaPokemons, especieSeleccionada);
        return;
    }

    renderizarLineaEvolutiva(raiz, mapaPokemons, especieSeleccionada);
}

function obtenerNodosCadena(raiz) {
    const nodos = [];

    function recorrer(nodo) {
        nodos.push(nodo);
        nodo.evolves_to.forEach(hijo => recorrer(hijo));
    }

    recorrer(raiz);
    return nodos;
}

function cadenaTieneRamificaciones(nodo) {
    if (nodo.evolves_to.length > 1) {
        return true;
    }

    return nodo.evolves_to.some(hijo => cadenaTieneRamificaciones(hijo));
}

function obtenerSpritePrincipal(pokemon) {
    return pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ||
        pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.front_default ||
        pokemon.sprites.other?.home?.front_default ||
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.front_default;
}

function obtenerSpriteEvolucion(pokemon) {
    return pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.front_default ||
        pokemon.sprites.other?.home?.front_default ||
        pokemon.sprites.front_default;
}

function crearTarjetaEvolucion(nodo, mapaPokemons, especieSeleccionada, claseExtra = "") {
    const pokemon = mapaPokemons.get(nodo.species.name);
    const nombre = pokemon
        ? capitalizar(pokemon.name)
        : capitalizar(nodo.species.name);
    const imagen = pokemon ? obtenerSpriteEvolucion(pokemon) : "";

    const tarjeta = document.createElement("article");
    tarjeta.className = `evolucion-pokemon ${claseExtra}`;

    if (nodo.species.name === especieSeleccionada) {
        tarjeta.classList.add("seleccionado");
    }

    const sprite = document.createElement("img");
    sprite.loading = "lazy";
    sprite.src = imagen || "";
    sprite.alt = `Sprite de ${nombre}`;

    const texto = document.createElement("strong");
    texto.textContent = nombre;

    tarjeta.append(sprite, texto);
    return tarjeta;
}

function crearCondicionEvolutiva(nodo) {
    const condicion = document.createElement("span");
    condicion.className = "evolucion-condicion";
    condicion.textContent = formatearCondiciones(nodo.evolution_details);
    return condicion;
}

function renderizarLineaEvolutiva(raiz, mapaPokemons, especieSeleccionada) {
    const contenedor = document.createElement("div");
    contenedor.className = "evolucion-linea";

    function recorrer(nodo) {
        contenedor.appendChild(
            crearTarjetaEvolucion(nodo, mapaPokemons, especieSeleccionada)
        );

        const siguiente = nodo.evolves_to[0];

        if (!siguiente) {
            return;
        }

        const flecha = document.createElement("div");
        flecha.className = "evolucion-flecha";

        const linea = document.createElement("span");
        linea.className = "flecha-linea";
        linea.textContent = "→";

        flecha.append(linea, crearCondicionEvolutiva(siguiente));
        contenedor.appendChild(flecha);
        recorrer(siguiente);
    }

    recorrer(raiz);
    elementos.evoluciones.appendChild(contenedor);
}

function renderizarArbolEvolutivo(raiz, mapaPokemons, especieSeleccionada) {
    const contenedor = document.createElement("div");
    contenedor.className = "evolucion-arbol";

    const raizWrap = document.createElement("div");
    raizWrap.className = "arbol-raiz";
    raizWrap.appendChild(crearTarjetaEvolucion(raiz, mapaPokemons, especieSeleccionada));
    contenedor.appendChild(raizWrap);

    const hijos = crearRamasArbol(raiz, mapaPokemons, especieSeleccionada);

    if (hijos) {
        contenedor.appendChild(hijos);
    }

    elementos.evoluciones.appendChild(contenedor);
}

function crearRamasArbol(nodo, mapaPokemons, especieSeleccionada) {
    if (!nodo.evolves_to || nodo.evolves_to.length === 0) {
        return null;
    }

    const contenedor = document.createElement("div");
    contenedor.className = "arbol-hijos";

    nodo.evolves_to.forEach((hijo, indice) => {
        const rama = document.createElement("div");
        rama.className = "arbol-rama";

        const conexion = document.createElement("div");
        conexion.className = "arbol-conexion";

        const flecha = document.createElement("span");
        flecha.className = "arbol-flecha";
        flecha.textContent = obtenerFlechaRama(nodo.evolves_to.length, indice);
        rama.classList.add(obtenerClaseRama(nodo.evolves_to.length, indice));

        conexion.append(flecha, crearCondicionEvolutiva(hijo));
        rama.appendChild(conexion);

        const cuerpo = document.createElement("div");
        cuerpo.className = "arbol-cuerpo";
        cuerpo.appendChild(crearTarjetaEvolucion(hijo, mapaPokemons, especieSeleccionada));

        const siguientes = crearRamasArbol(hijo, mapaPokemons, especieSeleccionada);
        if (siguientes) {
            cuerpo.appendChild(siguientes);
        }

        rama.appendChild(cuerpo);
        contenedor.appendChild(rama);
    });

    return contenedor;
}

function obtenerFlechaRama(total, indice) {
    if (total === 1) {
        return "→";
    }

    if (total === 2) {
        return indice === 0 ? "↗" : "↘";
    }

    if (indice === 0) {
        return "↗";
    }

    if (indice === total - 1) {
        return "↘";
    }

    return "→";
}

function obtenerClaseRama(total, indice) {
    const flecha = obtenerFlechaRama(total, indice);

    if (flecha === "↗") {
        return "rama-arriba";
    }

    if (flecha === "↘") {
        return "rama-abajo";
    }

    return "rama-recta";
}

function renderizarEvolucionEevee(raiz, mapaPokemons, especieSeleccionada) {
    const contenedor = document.createElement("div");
    contenedor.className = "evolucion-eevee";

    const conexiones = document.createElement("div");
    conexiones.className = "eevee-conexiones";

    const centro = document.createElement("div");
    centro.className = "eevee-centro";
    centro.appendChild(crearTarjetaEvolucion(raiz, mapaPokemons, especieSeleccionada, "eevee-principal"));

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

    raiz.evolves_to.forEach((hijo, indice) => {
        const posicion = posiciones[indice] || posiciones[posiciones.length - 1];
        const rama = document.createElement("div");
        rama.className = `eevee-rama eevee-${posicion[0]}`;

        const contenido = document.createElement("div");
        contenido.className = "eevee-contenido";
        contenido.appendChild(crearTarjetaEvolucion(hijo, mapaPokemons, especieSeleccionada));
        contenido.appendChild(crearCondicionEvolutiva(hijo));

        const flecha = document.createElement("span");
        flecha.className = "eevee-flecha";
        flecha.textContent = posicion[1];

        rama.append(contenido, flecha);
        contenedor.appendChild(rama);
    });

    contenedor.append(conexiones, centro);
    elementos.evoluciones.appendChild(contenedor);
}

function formatearCondiciones(detalles) {
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return "Evolución";
    }

    const condiciones = new Set();

    detalles.forEach(detalle => {
        if (detalle.min_level !== null) {
            condiciones.add(`Nivel ${detalle.min_level}`);
        }

        if (detalle.min_happiness !== null) {
            condiciones.add(`Amistad ${detalle.min_happiness}`);
        }

        if (detalle.min_affection !== null) {
            condiciones.add(`Afecto ${detalle.min_affection}`);
        }

        if (detalle.min_beauty !== null) {
            condiciones.add(`Belleza ${detalle.min_beauty}`);
        }

        if (detalle.item) {
            condiciones.add(traducirItem(detalle.item.name));
        }

        if (detalle.held_item) {
            condiciones.add(`Con ${traducirItem(detalle.held_item.name)}`);
        }

        if (detalle.known_move) {
            condiciones.add(`Movimiento: ${capitalizar(detalle.known_move.name)}`);
        }

        if (detalle.known_move_type) {
            condiciones.add(`Movimiento de tipo ${nombresTipos[detalle.known_move_type.name] || capitalizar(detalle.known_move_type.name)}`);
        }

        if (detalle.location) {
            condiciones.add(`Lugar: ${capitalizar(detalle.location.name.replaceAll("-", " "))}`);
        }

        if (detalle.time_of_day) {
            condiciones.add(detalle.time_of_day === "day" ? "De día" : "De noche");
        }

        if (detalle.gender !== null) {
            condiciones.add(detalle.gender === 1 ? "Hembra" : "Macho");
        }

        if (detalle.turn_upside_down) {
            condiciones.add("Con la consola invertida");
        }

        if (detalle.needs_overworld_rain) {
            condiciones.add("Mientras llueve");
        }

        if (detalle.party_species) {
            condiciones.add(`Con ${capitalizar(detalle.party_species.name)} en el equipo`);
        }

        if (detalle.party_type) {
            condiciones.add(`Con un Pokémon de tipo ${nombresTipos[detalle.party_type.name] || capitalizar(detalle.party_type.name)} en el equipo`);
        }

        if (detalle.trade_species) {
            condiciones.add(`Intercambio por ${capitalizar(detalle.trade_species.name)}`);
        }

        if (detalle.relative_physical_stats !== null) {
            if (detalle.relative_physical_stats === 1) {
                condiciones.add("Ataque > Defensa");
            } else if (detalle.relative_physical_stats === -1) {
                condiciones.add("Ataque < Defensa");
            } else if (detalle.relative_physical_stats === 0) {
                condiciones.add("Ataque = Defensa");
            }
        }

        if (detalle.trigger?.name === "trade" && condiciones.size === 0) {
            condiciones.add("Intercambio");
        }

        if (detalle.trigger?.name === "shed" && condiciones.size === 0) {
            condiciones.add("Al subir de nivel con espacio y Poké Ball");
        }

        if (detalle.trigger?.name === "level-up" && condiciones.size === 0) {
            condiciones.add("Subir de nivel");
        }

        if (detalle.trigger?.name === "use-item" && condiciones.size === 0) {
            condiciones.add("Usar objeto");
        }

        if (detalle.trigger?.name === "three-critical-hits" && condiciones.size === 0) {
            condiciones.add("Tres golpes críticos");
        }

        if (detalle.trigger?.name === "take-damage" && condiciones.size === 0) {
            condiciones.add("Recibir daño");
        }
    });

    return [...condiciones].join(" + ") || "Evolución";
}

function traducirItem(nombre) {
    return nombresItems[nombre] || capitalizar(nombre.replaceAll("-", " "));
}

function calcularEfectividad(defensasTipo) {
    const multiplicadores = Object.fromEntries(Object.keys(nombresTipos).map(tipo => [tipo, 1]));

    defensasTipo.forEach(tipo => {
        const relaciones = tipo.damage_relations;

        relaciones.double_damage_from.forEach(ref => {
            multiplicadores[ref.name] *= 2;
        });

        relaciones.half_damage_from.forEach(ref => {
            multiplicadores[ref.name] *= 0.5;
        });

        relaciones.no_damage_from.forEach(ref => {
            multiplicadores[ref.name] *= 0;
        });
    });

    return multiplicadores;
}

function renderizarDebilidadesYFortalezas(tipos) {
    const multiplicadores = calcularEfectividad(tipos);
    const debilidades = Object.entries(multiplicadores)
        .filter(([, valor]) => valor > 1)
        .sort((a, b) => b[1] - a[1]);
    const resistencias = Object.entries(multiplicadores)
        .filter(([, valor]) => valor > 0 && valor < 1)
        .sort((a, b) => a[1] - b[1]);
    const inmunidades = Object.entries(multiplicadores)
        .filter(([, valor]) => valor === 0);

    renderizarGrupoTipos(elementos.debilidades, debilidades, "No hay debilidades especiales");
    renderizarGrupoTipos(elementos.resistencias, resistencias, "No tiene resistencias registradas");
    renderizarGrupoTipos(elementos.inmunidades, inmunidades.map(([tipo, valor]) => [tipo, valor]), "Ninguna");

    const ofensivas = new Set();
    tipos.forEach(tipo => {
        tipo.damage_relations.double_damage_to.forEach(ref => ofensivas.add(ref.name));
    });

    const listaOfensiva = [...ofensivas].sort();
    renderizarGrupoTipos(elementos.ofensivas, listaOfensiva.map(tipo => [tipo, 2]), "Ninguna");
}

function renderizarGrupoTipos(contenedor, datos, textoVacio) {
    contenedor.innerHTML = "";

    if (datos.length === 0) {
        const vacio = document.createElement("span");
        vacio.className = "grupo-vacio";
        vacio.textContent = textoVacio;
        contenedor.appendChild(vacio);
        return;
    }

    datos.forEach(([tipo, multiplicador]) => {
        contenedor.appendChild(crearChipTipo(tipo, multiplicador));
    });
}

function formatearMultiplicador(valor) {
    if (valor === 0) {
        return "×0";
    }

    if (valor === 0.25) {
        return "×¼";
    }

    if (valor === 0.5) {
        return "×½";
    }

    if (valor === 4) {
        return "×4";
    }

    if (valor === 2) {
        return "×2";
    }

    return `×${valor}`;
}

function mostrarEstado(texto) {
    elementos.estado.textContent = texto;
    elementos.estado.classList.add("visible");
}

function ocultarEstado() {
    elementos.estado.classList.remove("visible");
}

function guardarUltimoPokemon(nombre) {
    localStorage.setItem("ultimoPokemon", nombre);
}

function cargarUltimoPokemon() {
    const guardado = localStorage.getItem("ultimoPokemon");

    if (guardado) {
        return guardado;
    }

    return "zekrom";
}

async function buscarEntrada(entrada) {
    const nombre = normalizar(entrada);
    if (!nombre) {
        return;
    }

    const habilidadExacta = listaHabilidades.find(habilidad => normalizar(habilidad.name) === nombre);

    if (habilidadExacta) {
        await buscarHabilidad(habilidadExacta.name);
        return;
    }

    const encontrado = await buscarPokemon(nombre);

    if (!encontrado) {
        await buscarHabilidad(nombre);
    }
}

function prepararEventos() {
    elementos.buscador.addEventListener("input", () => {
        const valor = elementos.buscador.value;
        elementos.limpiarBusqueda.classList.toggle("visible", valor.length > 0);
        mostrarSugerencias(valor);
    });

    elementos.buscador.addEventListener("focus", () => {
        if (!elementos.buscador.value.trim()) {
            actualizarSugerenciasAleatorias();
        } else {
            mostrarSugerencias(elementos.buscador.value);
        }
    });

    elementos.busquedaForm.addEventListener("submit", event => {
        event.preventDefault();
        buscarEntrada(elementos.buscador.value);
    });

    elementos.limpiarBusqueda.addEventListener("click", () => {
        elementos.buscador.value = "";
        elementos.limpiarBusqueda.classList.remove("visible");
        elementos.buscador.focus();
        mostrarSugerencias("");
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".buscador-wrap")) {
            elementos.sugerencias.classList.remove("visible");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "/" && document.activeElement !== elementos.buscador) {
            event.preventDefault();
            elementos.buscador.focus();
        }

        if (event.key === "Escape") {
            elementos.sugerencias.classList.remove("visible");
            elementos.buscador.blur();
        }
    });
}

async function iniciarApp() {
    iniciarElementos();
    prepararEventos();

    const inicial = cargarUltimoPokemon();

    elementos.buscador.value = "";
    elementos.limpiarBusqueda.classList.remove("visible");

    await buscarPokemon(inicial, { inicial: true });
    cargarListadoPokemon();
    cargarListadoHabilidades();

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js").catch(error => {
            console.error("Error registrando Service Worker:", error);
        });
    }
}

document.addEventListener("DOMContentLoaded", iniciarApp);