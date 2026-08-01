/**
 * Verifies parsing, diagnostics, and backward-compatible language syntax.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from 'vitest'
import { parseSong } from './parser'

describe('parseSong', () => {
  it('lit la structure, les parties et les durées', () => {
    const song = parseSong(
      `Test\nStructure:\n4/4 n=120\nCouplet : paroles\nCouplet:\n2: C G 4: Am .`,
    )
    expect(song.title).toBe('Test')
    expect(song.tempo).toBe('n=120')
    expect(song.sections[0]).toMatchObject({
      part: 'Couplet',
      label: 'paroles',
    })
    expect(song.parts.get('Couplet')?.lines[0].measures).toHaveLength(3)
    expect(song.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(
      0,
    )
  })

  it('accepte la syntaxe historique avec signe égal et les mesures composées', () => {
    const song = parseSong(`Test\nStructure =\n6/8\nA : texte /\nA =\n1: C D`)
    expect(song.meter.top).toBe(2)
    expect(song.sections[0].collapsed).toBe(true)
  })

  it('signale une mesure incomplète', () => {
    const song = parseSong(`Test\nStructure:\n4/4\nA : texte\nA:\n2: C 1: G`)
    expect(song.diagnostics.some((d) => d.message.includes('incomplète'))).toBe(
      true,
    )
  })

  it('reconnaît les accords mineurs simples', () => {
    const song = parseSong(
      `Mineurs\nStructure:\n4/4\nA : texte\nA:\n4: Am Cm Dm Em`,
    )
    expect(
      song.diagnostics.filter((d) => d.message.includes('inhabituel')),
    ).toHaveLength(0)
  })
})
