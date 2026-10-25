# Ultraball · Pokédex personal

Web app (HTML + JavaScript puro) pensada para iPhone: se abre desde Safari y se añade a la pantalla de inicio como si fuera una app.
Busca un Pokémon (por nombre en español o inglés, o por número) y ve sus stats, habilidades, evoluciones y debilidades.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `app.js` | La app |
| `datos.json` | Nombres en español, lista de Pokémon/habilidades, tabla de tipos. Se carga una vez y queda en caché |
| `service-worker.js` | Caché y modo sin conexión |
| `manifest.json`, `icon-*.png` | Icono y datos de la app instalada |
| `assets/backgrounds/<tipo>.gif` | Fondos animados por tipo (opcional; ver abajo) |
| `herramientas/generar-datos.py` | Regenera `datos.json` cuando salgan Pokémon nuevos |

## Detalles a tener en cuenta

- **Fondos GIF:** la app busca `assets/backgrounds/normal.gif`, `fire.gif`, `water.gif`… (los 18 tipos). Si no existen, simplemente no se muestran. No hace falta tocar nada más.
- **Deslizar para cambiar de Pokémon:** se activa con `SWIPE_ACTIVO = true` al principio de `app.js`. Ponlo a `false` para desactivarlo.
- **Botón de volver (arriba a la izquierda):** vuelve al Pokémon o habilidad anterior de esta sesión (hasta 50 pasos). El historial no se guarda al cerrar la app.
- **Sin conexión:** funcionan los Pokémon que ya hayas consultado. Los nuevos necesitan internet.
- **Actualizar la app instalada:** los archivos se piden primero a la red, así que al desplegar cambios se ven en la siguiente apertura con conexión.

## Regenerar `datos.json`

```
git clone --depth 1 https://github.com/PokeAPI/api-data.git
python3 herramientas/generar-datos.py ./api-data/data/api/v2 datos.json
```
