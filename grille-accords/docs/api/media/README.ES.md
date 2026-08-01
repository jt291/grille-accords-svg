# Grille Accords SVG

[English](README.EN.md) · [Español](README.ES.md) · [Português](README.PT.md) · [العربية](README.AR.md) · [Brezhoneg](README.BR.md) · [中文](README.ZH.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Kurdî](README.KU.md)

Transforma una descripción textual compacta en una cuadrícula de acordes clara y reproducible, lista para ensayar, imprimir, escuchar y exportar.

## Funcionalidades

- editor con números de línea, posición del cursor y resaltado de la línea activa;
- diagnósticos bloqueantes que indican la línea, la posición y el símbolo erróneo;
- vista previa SVG, transposición y reproducción Web Audio con metrónomo;
- exportación de texto, SVG, PNG, WebP, MIDI y MusicXML;
- impresión, pantalla completa, paneles redimensionables y modos claro/oscuro;
- interfaz y ayuda disponibles en nueve idiomas.

## Instalación

Instala [Node.js](https://nodejs.org/) y [pnpm](https://pnpm.io/installation), y ejecuta cada paso:

```sh
git clone https://github.com/jt291/grille-accords-svg.git
cd grille-accords-svg
pnpm install
pnpm dev
```

La aplicación se abre automáticamente en `http://localhost:4317/`.

## Comandos útiles

```sh
pnpm test
pnpm check
pnpm run docs
pnpm build
pnpm preview
```

[Abrir la aplicación](https://grille-accords-svg.jtisseau.chatgpt.site/)

[Consultar la documentación de la API TypeScript](https://jt291.github.io/grille-accords-svg/)
