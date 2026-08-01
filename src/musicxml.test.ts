import { describe, expect, it } from 'vitest'
import { createMusicXml } from './musicxml'
import { parseSong } from './parser'

describe('MusicXML', () => {
  it('exporte signatures, accords et silences', () => {
    const song = parseSong(
      `Test & Co\nStructure:\n4/4 n=120\nA : texte\nA:\n4: C 3/4 3: D7/F#`,
    )
    const output = createMusicXml(song)
    expect(output).toContain('<work-title>Test &amp; Co</work-title>')
    expect(output).toContain('<beats>3</beats><beat-type>4</beat-type>')
    expect(output).toContain('<kind text="7">dominant</kind>')
    expect(output).toContain(
      '<bass-step>F</bass-step><bass-alter>1</bass-alter>',
    )
    expect(output).toContain('<rest/>')
  })
})
