import { describe, expect, it } from 'vitest'
import { etikettPositionen, rasterFehler } from '../shared/render/raster'
import { AVERY_KATALOG } from '../server/data/avery-katalog'

const l4744 = AVERY_KATALOG.find(k => k.artikelnr === 'L4744REV')!

describe('etikettPositionen', () => {
  it('liefert 10 Positionen für L4744REV, zeilenweise', () => {
    const p = etikettPositionen(l4744, l4744.format)
    expect(p).toHaveLength(10)
    expect(p[0]).toEqual({ xMm: 6, yMm: 21.5 })
    expect(p[1]).toEqual({ xMm: 108, yMm: 21.5 })
    expect(p[9]!.yMm).toBeCloseTo(21.5 + 4 * 50.8)
  })

  it('alle Katalogbögen passen auf ihre Seite', () => {
    for (const k of AVERY_KATALOG) expect(rasterFehler(k, k.format), k.artikelnr).toBeNull()
  })

  it('meldet zu breites Raster', () => {
    expect(rasterFehler({ ...l4744, randLinksMm: 20 }, l4744.format)).toMatch(/zu breit/)
  })
})
