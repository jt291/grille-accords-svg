/**
 * Provides Web Audio playback and Standard MIDI File export for parsed songs.
 *
 * @packageDocumentation
 */

import type { Measure, Song } from './types'

/** Describes one scheduled chord event in playback time. */
export type PlaybackEvent = {
  beatOffset: number
  beatSeconds: number
  durationBeats: number
  durationSeconds: number
  measureId: string
  notes: number[]
  quarterNotes: number
  tempoBpm: number
  chord: string
  meterLabel: string
  meterBottom: number
}

/** Controls the lifecycle of an active Web Audio playback session. */
export type PlaybackController = {
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => void
}
/** Configures optional playback features. */
export type PlaybackOptions = { metronome?: boolean }

const pitchClasses: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

/** Maps a supported chord quality to semitone intervals above its root. */
function chordIntervals(quality: string): number[] {
  if (/^(?:m7b5)/.test(quality)) return [0, 3, 6, 10]
  if (/^(?:dim7)/.test(quality)) return [0, 3, 6, 9]
  if (/^(?:dim)/.test(quality)) return [0, 3, 6]
  if (/^(?:m7M)/.test(quality)) return [0, 3, 7, 11]
  if (/^(?:m9)/.test(quality)) return [0, 3, 7, 10, 14]
  if (/^(?:m7)/.test(quality)) return [0, 3, 7, 10]
  if (/^(?:m6)/.test(quality)) return [0, 3, 7, 9]
  if (/^m/.test(quality)) return [0, 3, 7]
  if (/^(?:7sus2)/.test(quality)) return [0, 2, 7, 10]
  if (/^(?:7sus4)/.test(quality)) return [0, 5, 7, 10]
  if (/^(?:sus2|2)/.test(quality)) return [0, 2, 7]
  if (/^(?:sus4|4)/.test(quality)) return [0, 5, 7]
  if (/^(?:M7)/.test(quality)) return [0, 4, 7, 11]
  if (/^(?:9)/.test(quality)) return [0, 4, 7, 10, 14]
  if (/^(?:7)/.test(quality)) return [0, 4, 7, 10]
  if (/^(?:6)/.test(quality)) return [0, 4, 7, 9]
  if (/^(?:add2)/.test(quality)) return [0, 2, 4, 7]
  if (/^(?:\+5)/.test(quality)) return [0, 4, 8]
  return [0, 4, 7]
}

/** Converts a chord symbol into a set of MIDI note numbers. */
export function chordToMidi(chord: string): number[] {
  if (chord === 'N.C.') return []
  const match = chord.match(/^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/)
  if (!match) return []
  const root = 60 + pitchClasses[match[1]]
  const notes = chordIntervals(match[2]).map((interval) => root + interval)
  const bassPitch = match[3] ? pitchClasses[match[3]] : undefined
  if (bassPitch !== undefined) notes.unshift(36 + bassPitch)
  return [...new Set(notes)]
}

/** Converts a language tempo token to quarter notes per minute. */
function quarterBpm(tempo: string | undefined): number {
  const match = tempo?.match(/^(n|b|np)=(\d+)$/i)
  if (!match) return 120
  const bpm = Number(match[2])
  if (match[1].toLowerCase() === 'b') return bpm * 2
  if (match[1].toLowerCase() === 'np') return bpm * 1.5
  return bpm
}

/** Computes the duration of one logical beat for a measure and tempo. */
function secondsPerBeat(measure: Measure, tempo: string | undefined): number {
  const signatureTop = Number(measure.meter.label.split('/')[0])
  const quarterNotes =
    measure.meter.bottom === 8 && signatureTop % 3 === 0
      ? 1.5
      : 4 / measure.meter.bottom
  return (60 / quarterBpm(tempo)) * quarterNotes
}

/** Expands a song structure into sequential playback events. */
export function createPlaybackEvents(song: Song): PlaybackEvent[] {
  const events: PlaybackEvent[] = []
  let tempo = song.tempo
  const sections = song.sections.length
    ? song.sections
    : [...song.parts.keys()].map((part) => ({
        part,
        label: '',
        collapsed: false,
      }))

  sections.forEach((section, sectionIndex) => {
    const part = song.parts.get(section.part)
    if (!part || section.collapsed) return
    let previousMeasure: Measure | undefined
    part.lines.forEach((line, lineIndex) => {
      if (line.tempo) tempo = line.tempo
      line.measures.forEach((sourceMeasure, measureIndex) => {
        const measure =
          sourceMeasure.repeat && previousMeasure
            ? previousMeasure
            : sourceMeasure
        const measureId = `${sectionIndex}:${lineIndex}:${measureIndex}`
        const beatSeconds = secondsPerBeat(measure, tempo)
        const tempoBpm = quarterBpm(tempo)
        const signatureTop = Number(measure.meter.label.split('/')[0])
        const quartersPerBeat =
          measure.meter.bottom === 8 && signatureTop % 3 === 0
            ? 1.5
            : 4 / measure.meter.bottom
        let beatOffset = 0
        for (const beat of measure.beats) {
          events.push({
            beatOffset,
            beatSeconds,
            durationBeats: beat.duration,
            notes: chordToMidi(beat.chord),
            quarterNotes: beat.duration * quartersPerBeat,
            tempoBpm,
            durationSeconds: beat.duration * beatSeconds,
            measureId,
            chord: beat.chord,
            meterLabel: measure.meter.label,
            meterBottom: measure.meter.bottom,
          })
          beatOffset += beat.duration
        }
        if (!sourceMeasure.repeat) previousMeasure = sourceMeasure
      })
    })
  })
  return events
}

/** Encodes an integer using MIDI's variable-length quantity format. */
function variableLength(value: number): number[] {
  const bytes = [value & 0x7f]
  let remaining = value >> 7
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80)
    remaining >>= 7
  }
  return bytes
}

/** Builds a named MIDI chunk with a big-endian length prefix. */
function chunk(name: string, data: number[]): number[] {
  const length = data.length
  return [
    ...new TextEncoder().encode(name),
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
    ...data,
  ]
}

/** Creates a type-0 Standard MIDI File containing notes and musical metadata. */
export function createMidiFile(song: Song): Uint8Array {
  const ticksPerQuarter = 480
  const timedEvents: { bytes: number[]; order: number; tick: number }[] = []
  const title = [...new TextEncoder().encode(song.title)].slice(0, 127)
  timedEvents.push({
    bytes: [0xff, 0x03, title.length, ...title],
    order: 0,
    tick: 0,
  })
  timedEvents.push({ bytes: [0xc0, 0], order: 1, tick: 0 })
  let tick = 0
  let previousTempo = -1
  let previousMeter = ''

  for (const event of createPlaybackEvents(song)) {
    if (event.beatOffset === 0 && event.meterLabel !== previousMeter) {
      const numerator = Number(event.meterLabel.split('/')[0])
      const denominatorPower = Math.round(Math.log2(event.meterBottom))
      const clocks = event.meterBottom === 8 && numerator % 3 === 0 ? 36 : 24
      timedEvents.push({
        bytes: [0xff, 0x58, 0x04, numerator, denominatorPower, clocks, 8],
        order: 0,
        tick,
      })
      previousMeter = event.meterLabel
    }
    if (event.tempoBpm !== previousTempo) {
      const microseconds = Math.round(60_000_000 / event.tempoBpm)
      timedEvents.push({
        bytes: [
          0xff,
          0x51,
          0x03,
          (microseconds >>> 16) & 0xff,
          (microseconds >>> 8) & 0xff,
          microseconds & 0xff,
        ],
        order: 0,
        tick,
      })
      previousTempo = event.tempoBpm
    }
    const endTick = tick + Math.round(event.quarterNotes * ticksPerQuarter)
    if (event.chord !== 'N.C.') {
      const chord = [...new TextEncoder().encode(event.chord)].slice(0, 127)
      timedEvents.push({
        bytes: [0xff, 0x06, chord.length, ...chord],
        order: 1,
        tick,
      })
    }
    for (const note of event.notes) {
      timedEvents.push({ bytes: [0x90, note, 88], order: 2, tick })
      timedEvents.push({ bytes: [0x80, note, 0], order: 1, tick: endTick })
    }
    tick = endTick
  }
  timedEvents.push({ bytes: [0xff, 0x2f, 0], order: 3, tick })
  timedEvents.sort((a, b) => a.tick - b.tick || a.order - b.order)

  const track: number[] = []
  let previousTick = 0
  for (const event of timedEvents) {
    track.push(...variableLength(event.tick - previousTick), ...event.bytes)
    previousTick = event.tick
  }
  const header = chunk('MThd', [0, 0, 0, 1, 1, 0xe0])
  return new Uint8Array([...header, ...chunk('MTrk', track)])
}

/** Synthesizes a short chord using triangle-wave oscillators. */
function soundChord(context: AudioContext, notes: number[], duration: number) {
  if (!notes.length) return
  const now = context.currentTime
  const gain = context.createGain()
  const level = Math.min(0.18, 0.5 / notes.length)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(level, now + 0.025)
  gain.gain.setValueAtTime(level, now + Math.max(0.03, duration - 0.12))
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  gain.connect(context.destination)
  for (const note of notes) {
    const oscillator = context.createOscillator()
    oscillator.type = 'triangle'
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12)
    oscillator.connect(gain)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }
}

/** Schedules metronome clicks for every logical beat of a playback event. */
function soundMetronome(context: AudioContext, event: PlaybackEvent) {
  for (let beat = 0; beat < event.durationBeats; beat += 1) {
    const time = context.currentTime + beat * event.beatSeconds
    const accent = event.beatOffset + beat === 0
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(accent ? 1320 : 880, time)
    gain.gain.setValueAtTime(accent ? 0.24 : 0.13, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(time)
    oscillator.stop(time + 0.05)
  }
}

/**
 * Starts Web Audio playback for a parsed song.
 *
 * @returns A controller that can pause, resume, or stop playback.
 */
export async function playSong(
  song: Song,
  onMeasure: (measureId: string | null) => void,
  onEnded: () => void,
  options: PlaybackOptions = {},
): Promise<PlaybackController> {
  const AudioContextClass = window.AudioContext
  const context = new AudioContextClass()
  await context.resume()
  const events = createPlaybackEvents(song)
  let index = 0
  let timer: number | undefined
  let stopped = false
  let paused = false
  let remainingMilliseconds = 0
  let timerStartedAt = 0

  /** Stops playback and releases the audio context. */
  const stop = () => {
    if (stopped) return
    stopped = true
    if (timer !== undefined) window.clearTimeout(timer)
    onMeasure(null)
    void context.close()
  }
  /** Suspends playback while preserving the remaining event time. */
  const pause = async () => {
    if (stopped || paused) return
    paused = true
    if (timer !== undefined) {
      window.clearTimeout(timer)
      remainingMilliseconds = Math.max(
        0,
        remainingMilliseconds - (performance.now() - timerStartedAt),
      )
    }
    await context.suspend()
  }
  /** Resumes a previously suspended playback session. */
  const resume = async () => {
    if (stopped || !paused) return
    paused = false
    await context.resume()
    timerStartedAt = performance.now()
    timer = window.setTimeout(next, remainingMilliseconds)
  }
  /** Schedules the next chord event or completes playback. */
  const next = () => {
    if (stopped || paused) return
    const event = events[index]
    if (!event) {
      stop()
      onEnded()
      return
    }
    onMeasure(event.measureId)
    if (options.metronome) soundMetronome(context, event)
    soundChord(context, event.notes, event.durationSeconds)
    index += 1
    remainingMilliseconds = event.durationSeconds * 1000
    timerStartedAt = performance.now()
    timer = window.setTimeout(next, remainingMilliseconds)
  }
  next()
  return { pause, resume, stop }
}
