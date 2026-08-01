# Grille Accords SVG

[English](README.EN.md) · [Español](README.ES.md) · [Português](README.PT.md) · [العربية](README.AR.md) · [Brezhoneg](README.BR.md) · [中文](README.ZH.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Kurdî](README.KU.md)

Turn a compact text description into a clear, playable chord chart—ready to rehearse, print, hear, and export.

Grille Accords SVG runs in the browser. Write or import a song, get immediate validation, preview its chart, transpose it, play it, and export it for the web or music-notation software.

## Features

- Text editor with line numbers, cursor position, and active-line highlighting
- Blocking diagnostics that identify the line, token position, and faulty symbol
- Live SVG preview for valid descriptions
- Built-in song examples from the `Chansons` directory
- Text import and export
- SVG, PNG, and WebP graphic exports
- MIDI and MusicXML music exports
- Web Audio playback with play, pause, stop, and optional metronome
- Semitone transposition with sharp or flat spelling
- Compact measures, prominent time signatures, and visual beat markers
- Printing, full-screen chart view, and resizable editor/preview panels
- Integrated, resizable help drawer
- Light and dark themes
- English, Spanish, Portuguese, Arabic, Breton, Chinese, French, Hindi, and Kurdish interfaces

## Installation

Install [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/installation), then follow these steps.

### 1. Clone the repository

```sh
git clone https://github.com/jt291/grille-accords-svg.git
```

### 2. Enter the project directory

```sh
cd grille-accords-svg
```

### 3. Install dependencies

```sh
pnpm install
```

### 4. Start the application

```sh
pnpm dev
```

The application opens automatically at `http://localhost:4317/`.

## Useful commands

```sh
pnpm test       # Run the tests
pnpm check      # Check the code with Biome
pnpm docs       # Generate the TypeDoc API in docs/api
pnpm build      # Create a production build
pnpm preview    # Build and preview the production version
```

The production preview opens at `http://localhost:4318/`.

## Project structure

- `src/parser.ts` parses textual descriptions
- `src/ChordChart.tsx` renders the SVG chart
- `src/audio.ts` handles playback and MIDI export
- `src/musicxml.ts` creates MusicXML files
- `src/App.tsx` contains the application interface

## Live application

[Open Grille Accords SVG](https://grille-accords-svg.jtisseau.chatgpt.site/)
