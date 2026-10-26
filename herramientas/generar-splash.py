#!/usr/bin/env python3
"""Genera las pantallas de carga de iPhone (splash/*.png): fondo de la app con el logo centrado.

Uso:  python3 herramientas/generar-splash.py
Imprime las etiquetas <link rel="apple-touch-startup-image"> para index.html.
"""
import os
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONDO = (35, 48, 68, 255)  # #233044

# (ancho, alto) en px CSS, factor de píxeles
PANTALLAS = [
    (320, 568, 2), (375, 667, 2), (414, 736, 3), (375, 812, 3), (414, 896, 2), (414, 896, 3),
    (360, 780, 3), (390, 844, 3), (428, 926, 3), (393, 852, 3), (430, 932, 3),
    (402, 874, 3), (420, 912, 3), (440, 956, 3),
]

logo = Image.open(os.path.join(RAIZ, "Logo.png")).convert("RGBA")
logo = logo.crop(logo.getbbox())
os.makedirs(os.path.join(RAIZ, "splash"), exist_ok=True)

for w, h, r in PANTALLAS:
    ancho, alto = w * r, h * r
    lienzo = Image.new("RGBA", (ancho, alto), FONDO)
    ancho_logo = round(ancho * 0.56)
    peq = logo.resize((ancho_logo, round(logo.height * ancho_logo / logo.width)), Image.LANCZOS)
    lienzo.alpha_composite(peq, ((ancho - peq.width) // 2, (alto - peq.height) // 2))
    ruta = f"splash/splash-{ancho}x{alto}.png"
    lienzo.convert("RGB").save(os.path.join(RAIZ, ruta), optimize=True)
    print(f'    <link rel="apple-touch-startup-image" href="{ruta}" media="(device-width: {w}px) and (device-height: {h}px) and (-webkit-device-pixel-ratio: {r}) and (orientation: portrait)">')
