#!/usr/bin/env python3
"""Genera datos.json (nombres en español, lista de Pokémon y habilidades) a partir
de un clon de https://github.com/PokeAPI/api-data

Uso:
    git clone --depth 1 https://github.com/PokeAPI/api-data.git
    python3 herramientas/generar-datos.py ./api-data/data/api/v2 datos.json

Solo hace falta volver a ejecutarlo cuando salgan Pokémon nuevos.
"""
import glob, json, os, sys

base = sys.argv[1]
salida = sys.argv[2] if len(sys.argv) > 2 else "datos.json"


def cargar(patron):
    for ruta in glob.glob(os.path.join(base, patron)):
        with open(ruta, encoding="utf-8") as f:
            yield json.load(f)


def id_de(url):
    return int(url.rstrip("/").split("/")[-1])


def es(nombres):
    for idioma in ("es", "es-419"):
        for n in nombres:
            if n["language"]["name"] == idioma:
                return n["name"]
    return None


pokemon, defecto = [], {}
for d in cargar("pokemon/*/index.json"):
    sid = id_de(d["species"]["url"])
    pokemon.append([d["name"], d["id"], sid])
    if d["is_default"]:
        defecto[sid] = d["name"]
pokemon.sort(key=lambda p: p[1])

especies = {}
for d in cargar("pokemon-species/*/index.json"):
    especies[d["id"]] = [d["name"], es(d["names"]) or d["name"].title(), defecto[d["id"]]]
maximo = max(especies)
lista_especies = [None] + [especies.get(i) for i in range(1, maximo + 1)]

habilidades = sorted(
    ([d["name"], d["id"], es(d["names"]) or d["name"].replace("-", " ").title()] for d in cargar("ability/*/index.json")),
    key=lambda h: h[1],
)


def mapa(carpeta):
    return {d["name"]: n for d in cargar(f"{carpeta}/*/index.json") if (n := es(d["names"]))}


TIPOS = {"normal","fire","water","electric","grass","ice","fighting","poison","ground","flying",
         "psychic","bug","rock","ghost","dragon","dark","steel","fairy"}
tipos = {}
for d in cargar("type/*/index.json"):
    if d["name"] in TIPOS:
        r = d["damage_relations"]
        nombres = lambda clave: [t["name"] for t in r[clave]]
        tipos[d["name"]] = {
            "dobleDe": nombres("double_damage_from"),
            "mitadDe": nombres("half_damage_from"),
            "nadaDe": nombres("no_damage_from"),
            "dobleA": nombres("double_damage_to"),
        }

datos = {
    "v": 1,
    "tipos": tipos,
    "pokemon": pokemon,
    "especies": lista_especies,
    "habilidades": habilidades,
    "objetos": mapa("item"),
    "movimientos": mapa("move"),
    "lugares": mapa("location"),
    "naturalezas": mapa("nature"),
}
with open(salida, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
print(f"{len(pokemon)} pokémon, {maximo} especies, {len(habilidades)} habilidades -> {salida} ({os.path.getsize(salida) // 1024} KB)")
