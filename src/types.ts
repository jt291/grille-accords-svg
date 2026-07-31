export type Diagnostic = {
  line: number
  message: string
  severity: 'error' | 'warning'
}
export type Meter = { top: number; bottom: number; label: string }
export type Beat = { chord: string; duration: number }
export type Measure = { meter: Meter; beats: Beat[]; repeat?: boolean }
export type MusicLine = {
  sourceLine: number
  measures: Measure[]
  tempo?: string
}
export type Part = { name: string; lines: MusicLine[] }
export type Section = { part: string; label: string; collapsed: boolean }
export type Song = {
  title: string
  meter: Meter
  tempo?: string
  sections: Section[]
  parts: Map<string, Part>
  diagnostics: Diagnostic[]
}
