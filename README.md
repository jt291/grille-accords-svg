# Grille Accords SVG

Transformez une description textuelle d’accords en une grille musicale claire, compacte, jouable et prête à être partagée.

L’application fonctionne directement dans le navigateur : écrivez ou importez une chanson, contrôlez immédiatement sa validité, visualisez la grille, écoutez-la et exportez-la dans le format adapté à votre usage.

## Fonctionnalités

- édition de la description avec numéros de ligne, position du curseur et surlignage de la ligne active ;
- aperçu SVG mis à jour automatiquement lorsque la description est valide ;
- diagnostics détaillés indiquant la ligne, la position et le symbole concernés ;
- exemples de chansons fournis dans le dossier `Chansons` ;
- import et export de la description au format texte ;
- export graphique en SVG, PNG et WebP ;
- export musical en MIDI et MusicXML ;
- lecture des accords avec l’API Web Audio ;
- commandes de lecture, pause et arrêt, avec métronome optionnel ;
- transposition en demi-tons avec choix des dièses ou des bémols ;
- affichage compact des mesures, signatures rythmiques et repères de temps ;
- impression et affichage du panneau SVG en plein écran ;
- panneaux Description et SVG redimensionnables ;
- aide intégrée dans un panneau latéral redimensionnable ;
- modes clair et sombre ;
- interface disponible en anglais, arabe, breton, chinois, français, hindi et kurde.

## Installation

L’installation nécessite [Node.js](https://nodejs.org/) et [pnpm](https://pnpm.io/installation).

### 1. Télécharger le projet

```sh
git clone https://github.com/jt291/grille-accords-svg.git
```

### 2. Entrer dans le dossier du projet

```sh
cd grille-accords-svg
```

### 3. Installer les dépendances

```sh
pnpm install
```

### 4. Démarrer l’application

```sh
pnpm dev
```

L’application s’ouvre automatiquement dans le navigateur à l’adresse `http://localhost:4317/`.

## Commandes utiles

```sh
pnpm test       # exécuter les tests
pnpm check      # vérifier le code avec Biome
pnpm build      # produire la version de production
pnpm preview    # construire et prévisualiser la version de production
```

La prévisualisation de production s’ouvre sur `http://localhost:4318/`.

## Organisation du code

- `src/parser.ts` analyse les descriptions textuelles ;
- `src/ChordChart.tsx` produit la grille SVG ;
- `src/audio.ts` gère la lecture et l’export MIDI ;
- `src/musicxml.ts` produit les fichiers MusicXML ;
- `src/App.tsx` contient l’interface de l’application.
