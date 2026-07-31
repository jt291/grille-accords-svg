# Grille Accords SVG

Éditeur web local qui transforme le langage historique de Grille Accords en une partition simplifiée au format SVG.

## Démarrer

```sh
pnpm install
pnpm dev
```

Puis ouvrir l’adresse affichée par Vite. Les commandes de contrôle sont `pnpm test` et `pnpm build`.

## Fonctionnalités

- édition et aperçu SVG instantanés ;
- chargement de toutes les chansons du dossier `Chansons` ;
- export du dessin en `.svg` ;
- prise en charge des blocs introduits par `:` (chansons existantes) ou `=` (documentation) ;
- signatures simples et composées, tempos, durées, répétitions `%`, `NC` et basses renversées ;
- diagnostics avec numéros de ligne pour mesures incomplètes ou dépassées.

Le parseur musical est isolé dans `src/parser.ts`, le dessin dans `src/ChordChart.tsx` et l’interface dans `src/App.tsx`.
