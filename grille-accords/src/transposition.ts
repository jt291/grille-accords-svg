/**
 * Transposes chord symbols, parsed songs, and textual chart descriptions.
 *
 * @packageDocumentation
 */

import type { Song } from './types'

/** Selects the enharmonic spelling used for transposed notes. */
export type Accidental = 'flat' | 'sharp'

const sharpNotes = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]
const flatNotes = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]
const pitch = new Map([
  ['C', 0],
  ['B#', 0],
  ['C#', 1],
  ['DB', 1],
  ['D', 2],
  ['D#', 3],
  ['EB', 3],
  ['E', 4],
  ['FB', 4],
  ['E#', 5],
  ['F', 5],
  ['F#', 6],
  ['GB', 6],
  ['G', 7],
  ['G#', 8],
  ['AB', 8],
  ['A', 9],
  ['A#', 10],
  ['BB', 10],
  ['B', 11],
  ['CB', 11],
])
const chordPattern = /^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/i

/** Transposes a single note name by a signed number of semitones. */
function transposeNote(note: string, steps: number, accidental: Accidental) {
  const value = pitch.get(note.toUpperCase())
  if (value === undefined) return note
  return (accidental === 'flat' ? flatNotes : sharpNotes)[
    (value + steps + 120) % 12
  ]
}

/**
 * Transposes a chord symbol while preserving its quality and optional bass.
 */
export function transposeChord(
  chord: string,
  steps: number,
  accidental: Accidental,
) {
  if (!steps || /^N\.?C\.?$/i.test(chord)) return chord
  const match = chord.match(chordPattern)
  if (!match) return chord
  const [, root, suffix, bass] = match
  return `${transposeNote(root, steps, accidental)}${suffix}${bass ? `/${transposeNote(bass, steps, accidental)}` : ''}`
}

/** Creates a transposed copy of a parsed song without changing the source song. */
export function transposeSong(
  song: Song,
  steps: number,
  accidental: Accidental,
): Song {
  if (!steps) return song
  return {
    ...song,
    parts: new Map(
      [...song.parts].map(([name, part]) => [
        name,
        {
          ...part,
          lines: part.lines.map((line) => ({
            ...line,
            measures: line.measures.map((measure) => ({
              ...measure,
              beats: measure.beats.map((beat) => ({
                ...beat,
                chord: transposeChord(beat.chord, steps, accidental),
              })),
            })),
          })),
        },
      ]),
    ),
  }
}

/** Transposes chord tokens inside part blocks while preserving structural text. */
export function transposeSource(
  source: string,
  steps: number,
  accidental: Accidental,
) {
  const rows = source.replace(/\r/g, '').split('\n')
  let inPart = false
  return rows
    .map((row) => {
      if (/^\s*Structure\s*[:=]\s*$/i.test(row)) {
        inPart = false
        return row
      }
      if (/^\s*.+?\s*[:=]\s*$/.test(row)) {
        inPart = true
        return row
      }
      if (!inPart) return row
      return row.replace(/\S+/g, (token) =>
        transposeChord(token, steps, accidental),
      )
    })
    .join('\n')
}
