import { describe, expect, it } from 'vitest'
import { BEISPIELDATEN, etikettendatenSchema, fuelleText, pruefeMhd } from '../shared/etikettendaten'

describe('etikettendatenSchema', () => {
  it('akzeptiert Beispieldaten', () => {
    expect(etikettendatenSchema.safeParse(BEISPIELDATEN).success).toBe(true)
  })

  it('verlangt alle Pflichtangaben', () => {
    const r = etikettendatenSchema.safeParse({ ...BEISPIELDATEN, los: ' ', imkerei: '', fuellmengeG: 333 })
    expect(r.success).toBe(false)
    const felder = r.error!.issues.map(i => i.path[0])
    expect(felder).toEqual(expect.arrayContaining(['los', 'imkerei', 'fuellmengeG']))
  })
})

describe('pruefeMhd', () => {
  it('lehnt Vergangenheit und heute ab', () => {
    expect(pruefeMhd('2026-11-09', '2026-11-09')).toMatch(/Zukunft/)
    expect(pruefeMhd('2025-01-01', '2026-11-09')).toMatch(/Zukunft/)
  })
  it('akzeptiert üblichen Zeitraum', () => {
    expect(pruefeMhd('2028-12-31', '2026-11-09')).toBeNull()
  })
  it('warnt bei mehr als 3 Jahren', () => {
    expect(pruefeMhd('2030-01-01', '2026-11-09')).toMatch(/Tippfehler/)
  })
})

describe('fuelleText', () => {
  it('setzt Platzhalter ein und formatiert MHD/Füllmenge', () => {
    expect(fuelleText('{fuellmenge} · MHD {mhd}', BEISPIELDATEN)).toBe('250 g · MHD 31.12.2028')
  })
  it('lässt Slot mit nur leeren optionalen Feldern entfallen', () => {
    expect(fuelleText('{kontakt}', { ...BEISPIELDATEN, kontakt: '' })).toBeNull()
  })
  it('fester Text bleibt', () => {
    expect(fuelleText('Mindestens', BEISPIELDATEN)).toBe('Mindestens')
  })
})
