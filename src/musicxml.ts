import type { Measure, Song } from './types'

const xml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

function harmony(chord: string) {
  if (chord === 'N.C.') return '<harmony><kind>none</kind></harmony>'
  const match = chord.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/)
  if (!match) return ''
  const [, root, accidental, suffix, bass, bassAccidental] = match
  const alter = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const bassAlter = bassAccidental === '#' ? 1 : bassAccidental === 'b' ? -1 : 0
  const kinds: Record<string, string> = {
    '': 'major',
    m: 'minor',
    '7': 'dominant',
    m7: 'minor-seventh',
    M7: 'major-seventh',
    dim: 'diminished',
    dim7: 'diminished-seventh',
    m7b5: 'half-diminished',
    sus2: 'suspended-second',
    sus4: 'suspended-fourth',
    '6': 'major-sixth',
    m6: 'minor-sixth',
    '9': 'dominant-ninth',
    m9: 'minor-ninth',
  }
  return `<harmony><root><root-step>${root}</root-step>${alter ? `<root-alter>${alter}</root-alter>` : ''}</root><kind text="${xml(suffix)}">${kinds[suffix] ?? 'other'}</kind>${bass ? `<bass><bass-step>${bass}</bass-step>${bassAlter ? `<bass-alter>${bassAlter}</bass-alter>` : ''}</bass>` : ''}</harmony>`
}

function beatDuration(measure: Measure) {
  const numerator = Number(measure.meter.label.split('/')[0])
  return measure.meter.bottom === 8 && numerator % 3 === 0
    ? 3
    : 8 / measure.meter.bottom
}

function tempoBpm(tempo: string | undefined) {
  const match = tempo?.match(/^(n|b|np)=(\d+)$/i)
  if (!match) return undefined
  const value = Number(match[2])
  return match[1].toLowerCase() === 'b'
    ? value * 2
    : match[1].toLowerCase() === 'np'
      ? value * 1.5
      : value
}

export function createMusicXml(song: Song) {
  const measures: string[] = []
  let number = 1
  let previousMeter = ''
  let currentTempo = song.tempo
  let previousTempo = ''
  let previousMeasure: Measure | undefined
  const sections = song.sections.length
    ? song.sections
    : [...song.parts.keys()].map((part) => ({
        part,
        label: '',
        collapsed: false,
      }))

  for (const section of sections) {
    const part = song.parts.get(section.part)
    if (!part || section.collapsed) continue
    let firstInSection = true
    for (const line of part.lines) {
      if (line.tempo) currentTempo = line.tempo
      for (const sourceMeasure of line.measures) {
        const measure =
          sourceMeasure.repeat && previousMeasure
            ? previousMeasure
            : sourceMeasure
        const [beats, beatType] = measure.meter.label.split('/')
        const attributes =
          measure.meter.label !== previousMeter
            ? `<attributes><divisions>2</divisions><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
            : ''
        const bpm = tempoBpm(currentTempo)
        const tempo =
          currentTempo !== previousTempo && bpm
            ? `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`
            : ''
        const sectionName = firstInSection
          ? `<direction placement="above"><direction-type><rehearsal>${xml(section.part)}</rehearsal>${section.label ? `<words>${xml(section.label)}</words>` : ''}</direction-type></direction>`
          : ''
        const unit = beatDuration(measure)
        const notes = measure.beats
          .map(
            (beat) =>
              `${harmony(beat.chord)}<note><rest/><duration>${beat.duration * unit}</duration><voice>1</voice></note>`,
          )
          .join('')
        measures.push(
          `<measure number="${number}">${attributes}${tempo}${sectionName}${notes}</measure>`,
        )
        number += 1
        firstInSection = false
        previousMeter = measure.meter.label
        previousTempo = currentTempo ?? ''
        if (!sourceMeasure.repeat) previousMeasure = sourceMeasure
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${xml(song.title)}</work-title></work><part-list><score-part id="P1"><part-name>Chord chart</part-name></score-part></part-list><part id="P1">${measures.join('')}</part></score-partwise>`
}
