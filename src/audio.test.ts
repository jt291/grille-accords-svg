import { describe, expect, it } from 'vitest'
import { chordToMidi, createMidiFile, createPlaybackEvents } from './audio'
import { parseSong } from './parser'

describe('moteur audio', () => {
  it('convertit les accords majeurs, mineurs et renversés en notes MIDI', () => {
    expect(chordToMidi('C')).toEqual([60, 64, 67])
    expect(chordToMidi('Am')).toEqual([69, 72, 76])
    expect(chordToMidi('D7/F#')[0]).toBe(42)
    expect(chordToMidi('N.C.')).toEqual([])
  })

  it('développe une grille en événements temporisés', () => {
    const song = parseSong(
      `Audio\nStructure:\n4/4 n=120\nA : texte\nA:\n2: C G .`,
    )
    const events = createPlaybackEvents(song)
    expect(events).toHaveLength(4)
    expect(events[0].durationSeconds).toBe(1)
    expect(events[0]).toMatchObject({ beatOffset: 0, durationBeats: 2 })
    expect(events[1]).toMatchObject({ beatOffset: 2, durationBeats: 2 })
    expect(events[2].notes).toEqual(events[0].notes)
  })

  it('produit un fichier MIDI standard', () => {
    const song = parseSong(`MIDI\nStructure:\n4/4 n=120\nA : texte\nA:\n4: C G`)
    const midi = createMidiFile(song)
    expect(new TextDecoder().decode(midi.slice(0, 4))).toBe('MThd')
    expect(new TextDecoder().decode(midi.slice(14, 18))).toBe('MTrk')
    expect(midi.at(-3)).toBe(0xff)
    expect(midi.at(-2)).toBe(0x2f)
    expect([...midi]).toContain(0x58)
    expect(new TextDecoder().decode(midi)).toContain('C')
  })

  it('inscrit les changements de signature dans le MIDI', () => {
    const song = parseSong(
      `Mesures\nStructure:\n4/4 n=120\nA : texte\nA:\n4: C 3/4 3: G`,
    )
    const midi = [...createMidiFile(song)]
    const signatures = midi.filter(
      (byte, index) => byte === 0x58 && midi[index - 1] === 0xff,
    )
    expect(signatures).toHaveLength(2)
  })
})
