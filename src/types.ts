/**
 * Core domain types shared by the parser, renderer, playback engine, and exporters.
 *
 * @packageDocumentation
 */

/** Describes a parser issue associated with a source line. */
export type Diagnostic = {
  line: number
  message: string
  severity: 'error' | 'warning'
}
/** Describes a musical meter as interpreted by the chord-chart language. */
export type Meter = { top: number; bottom: number; label: string }
/** Represents one chord onset and its duration in logical beats. */
export type Beat = { chord: string; duration: number }
/** Represents a complete measure, including repeat placeholders. */
export type Measure = { meter: Meter; beats: Beat[]; repeat?: boolean }
/** Represents one parsed source line containing one or more measures. */
export type MusicLine = {
  sourceLine: number
  measures: Measure[]
  tempo?: string
}
/** Defines a named reusable song part. */
export type Part = { name: string; lines: MusicLine[] }
/** References a part from the song structure and supplies its display label. */
export type Section = { part: string; label: string; collapsed: boolean }
/** Represents a fully parsed chord-chart document. */
export type Song = {
  title: string
  meter: Meter
  tempo?: string
  sections: Section[]
  parts: Map<string, Part>
  diagnostics: Diagnostic[]
}
