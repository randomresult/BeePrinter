import { describe, expect, it } from 'vitest'
import { ausrichten, verteilen } from '../shared/ausrichten'

const etikett = { bMm: 96, hMm: 50.8 }
const box = (xMm: number, yMm: number, bMm: number, hMm: number) => ({ xMm, yMm, bMm, hMm })

describe('ausrichten', () => {
  const zwei = [box(10, 5, 20, 6), box(30, 20, 40, 8)]

  it('richtet mehrere Slots am gemeinsamen Rahmen aus', () => {
    expect(ausrichten(zwei, 'links', etikett).map(p => p.xMm)).toEqual([10, 10])
    expect(ausrichten(zwei, 'rechts', etikett).map(p => p.xMm)).toEqual([50, 30])
    expect(ausrichten(zwei, 'oben', etikett).map(p => p.yMm)).toEqual([5, 5])
    expect(ausrichten(zwei, 'unten', etikett).map(p => p.yMm)).toEqual([22, 20])
  })

  it('zentriert auf 0,5 mm gerundet', () => {
    // Rahmen 10..70, Mitte 40
    expect(ausrichten(zwei, 'hmitte', etikett).map(p => p.xMm)).toEqual([30, 20])
  })

  it('bezieht einen einzelnen Slot aufs Etikett', () => {
    expect(ausrichten([box(3, 3, 40, 6)], 'hmitte', etikett)[0]).toEqual({ xMm: 28, yMm: 3 })
    expect(ausrichten([box(3, 3, 40, 6)], 'unten', etikett)[0]!.yMm).toBeCloseTo(44.8)
  })
})

describe('verteilen', () => {
  it('macht gleiche Abstände, äußere bleiben stehen', () => {
    const d = verteilen([box(0, 0, 10, 5), box(0, 12, 10, 5), box(0, 40, 10, 5)], 'y')
    // belegt 15, Spanne 45, Lücke 15 → mittlerer auf y 20
    expect(d).toEqual([0, 8, 0])
  })

  it('verschiebt Slots einer Zeile gemeinsam', () => {
    const d = verteilen([box(0, 0, 10, 5), box(0, 10, 10, 5), box(50, 11, 10, 5), box(0, 40, 10, 5)], 'y')
    expect(d[1]).toBe(d[2])
  })

  it('tut unter drei Gruppen nichts', () => {
    expect(verteilen([box(0, 0, 10, 5), box(0, 30, 10, 5)], 'y')).toEqual([0, 0])
  })
})
