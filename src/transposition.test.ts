/**
 * Verifies chord-symbol and source-text transposition behavior.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from 'vitest'
import { transposeChord, transposeSource } from './transposition'

describe('transposition', () => {
  it('transpose les accords, suffixes et basses', () => {
    expect(transposeChord('Am7/E', 2, 'sharp')).toBe('Bm7/F#')
    expect(transposeChord('Bb', 1, 'flat')).toBe('B')
    expect(transposeChord('N.C.', 5, 'sharp')).toBe('N.C.')
  })

  it('ne modifie que les blocs de grilles dans la description', () => {
    const source = 'Titre\nStructure:\nCouplet : texte\n\nCouplet:\n4: C Am F G'
    expect(transposeSource(source, 2, 'sharp')).toContain('Couplet : texte')
    expect(transposeSource(source, 2, 'sharp')).toContain('4: D Bm G A')
  })
})
