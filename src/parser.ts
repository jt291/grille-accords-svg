import type {
  Beat,
  Diagnostic,
  Measure,
  Meter,
  MusicLine,
  Part,
  Section,
  Song,
} from './types'

const meterRe = /^(\d+)\/(\d+)$/
const tempoRe = /^(?:n|b|np)=\d+$/i
const durationRe = /^(\d+):$/
const chordRe =
  /^(?:NC|[A-G](?:#|b)?(?:m7M|7sus[24]|m7b5|dim7|sus[24]|add2|M7|m9|dim|m7|m6|m|\+5|[mM]?[2679]|[24])?)(?:\/[A-G](?:#|b)?)?$/i

const meter = (token: string): Meter | undefined => {
  const match = token.match(meterRe)
  if (!match) return undefined
  const top = Number(match[1])
  const beats = match[2] === '8' && top % 3 === 0 ? top / 3 : top
  return { top: beats, bottom: Number(match[2]), label: token }
}

function parseMusicLine(
  text: string,
  lineNumber: number,
  initialMeter: Meter,
  diagnostics: Diagnostic[],
): MusicLine {
  const measures: Measure[] = []
  let currentMeter = initialMeter
  let duration = currentMeter.top
  let beats: Beat[] = []
  let used = 0
  let tempo: string | undefined

  const finish = () => {
    if (!beats.length) return
    measures.push({ meter: currentMeter, beats })
    beats = []
    used = 0
  }

  for (const token of text.trim().split(/\s+/).filter(Boolean)) {
    const nextMeter = meter(token)
    if (nextMeter) {
      if (used)
        diagnostics.push({
          line: lineNumber,
          severity: 'error',
          message: `La signature ${token} doit commencer entre deux mesures.`,
        })
      else {
        currentMeter = nextMeter
        duration = currentMeter.top
      }
      continue
    }
    if (tempoRe.test(token)) {
      tempo = token
      continue
    }
    const durationMatch = token.match(durationRe)
    if (durationMatch) {
      duration = Number(durationMatch[1])
      continue
    }
    if (token === '.') {
      if (used)
        diagnostics.push({
          line: lineNumber,
          severity: 'error',
          message: 'La répétition doit commencer entre deux mesures.',
        })
      else if (!measures.length)
        measures.push({ meter: currentMeter, beats: [], repeat: true })
      else measures.push({ meter: currentMeter, beats: [], repeat: true })
      continue
    }
    if (!chordRe.test(token))
      diagnostics.push({
        line: lineNumber,
        severity: 'warning',
        message: `Accord inhabituel : « ${token} ».`,
      })
    if (used + duration > currentMeter.top) {
      diagnostics.push({
        line: lineNumber,
        severity: 'error',
        message: `« ${token} » dépasse la mesure de ${currentMeter.top} temps.`,
      })
      finish()
    }
    beats.push({
      chord: token.toUpperCase() === 'NC' ? 'N.C.' : token,
      duration,
    })
    used += duration
    if (used === currentMeter.top) finish()
  }
  if (used) {
    diagnostics.push({
      line: lineNumber,
      severity: 'error',
      message: `Mesure incomplète : ${used} temps sur ${currentMeter.top}.`,
    })
    finish()
  }
  return { sourceLine: lineNumber, measures, tempo }
}

export function parseSong(source: string): Song {
  const rows = source.replace(/\r/g, '').split('\n')
  const diagnostics: Diagnostic[] = []
  const title = rows.find((row) => row.trim())?.trim() || 'Sans titre'
  const structureIndex = rows.findIndex((row) =>
    /^\s*Structure\s*[:=]\s*$/i.test(row),
  )
  let initialMeter: Meter = { top: 4, bottom: 4, label: '4/4' }
  let tempo: string | undefined
  const sections: Section[] = []
  const parts = new Map<string, Part>()
  if (structureIndex < 0)
    diagnostics.push({
      line: 1,
      severity: 'error',
      message: 'Bloc « Structure: » introuvable.',
    })

  let i = structureIndex < 0 ? 1 : structureIndex + 1
  for (; i < rows.length; i++) {
    const text = rows[i].trim()
    if (!text) continue
    const header = text.match(/^(.+?)\s*[:=]\s*$/)
    if (header) break
    const tokens = text.split(/\s+/)
    const lineMeter = meter(tokens[0])
    if (lineMeter) {
      initialMeter = lineMeter
      if (tokens[1] && tempoRe.test(tokens[1])) tempo = tokens[1]
      continue
    }
    const ref = text.match(/^([^:=]+?)\s*:\s*(.+)$/)
    if (!ref)
      diagnostics.push({
        line: i + 1,
        severity: 'warning',
        message: 'Référence de partie non reconnue.',
      })
    else {
      const rawLabel = ref[2].trim()
      const collapsed = /(?:\/|\bTrue)\s*$/i.test(rawLabel)
      sections.push({
        part: ref[1].trim(),
        label: rawLabel.replace(/(?:\/|\bTrue)\s*$/i, '').trim(),
        collapsed,
      })
    }
  }

  while (i < rows.length) {
    const text = rows[i].trim()
    const header = text.match(/^(.+?)\s*[:=]\s*$/)
    if (!header) {
      i++
      continue
    }
    const part: Part = { name: header[1].trim(), lines: [] }
    i++
    let activeMeter = initialMeter
    while (i < rows.length && !/^\s*(.+?)\s*[:=]\s*$/.test(rows[i])) {
      const music = rows[i].trim()
      if (music) {
        const parsed = parseMusicLine(music, i + 1, activeMeter, diagnostics)
        const last = [...parsed.measures].reverse().find(Boolean)
        if (last) activeMeter = last.meter
        part.lines.push(parsed)
      }
      i++
    }
    parts.set(part.name, part)
  }
  for (const section of sections)
    if (!parts.has(section.part) && !section.collapsed)
      diagnostics.push({
        line: structureIndex + 1,
        severity: 'warning',
        message: `La partie « ${section.part} » n’est pas définie.`,
      })
  return { title, meter: initialMeter, tempo, sections, parts, diagnostics }
}
