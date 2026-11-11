import type { Kontur } from '../../shared/render/types'

export interface KatalogEintrag {
  hersteller: string
  artikelnr: string
  name: string
  format: { breiteMm: number, hoeheMm: number, kontur: Kontur, eckenradiusMm: number }
  seiteBreiteMm: number
  seiteHoeheMm: number
  spalten: number
  zeilen: number
  randObenMm: number
  randLinksMm: number
  abstandXMm: number
  abstandYMm: number
  /** false = Maße geschätzt, vor Verkauf an echtem Bogen nachmessen */
  geprueft: boolean
}

/**
 * Bekannte Etikettenbögen als Ausgangspunkt für neue Bogenvorlagen im Admin.
 * Maße aus Herstellerangaben (Rastermaß minus Etikettmaß = Abstand); immer per Testdruck prüfen.
 */
export const AVERY_KATALOG: KatalogEintrag[] = [
  {
    hersteller: 'Avery Zweckform', artikelnr: 'L4744REV', name: 'Universal-Etiketten ablösbar 96 × 50,8 mm, 10 je A4',
    format: { breiteMm: 96, hoeheMm: 50.8, kontur: 'rechteck', eckenradiusMm: 2 },
    seiteBreiteMm: 210, seiteHoeheMm: 297, spalten: 2, zeilen: 5,
    randObenMm: 21.5, randLinksMm: 6, abstandXMm: 6, abstandYMm: 0, geprueft: false,
  },
  {
    hersteller: 'Avery Zweckform', artikelnr: 'L7173', name: 'Adressetiketten 99,1 × 57 mm, 10 je A4',
    format: { breiteMm: 99.1, hoeheMm: 57, kontur: 'rechteck', eckenradiusMm: 2 },
    seiteBreiteMm: 210, seiteHoeheMm: 297, spalten: 2, zeilen: 5,
    randObenMm: 6, randLinksMm: 4.65, abstandXMm: 2.5, abstandYMm: 0, geprueft: false,
  },
  {
    hersteller: 'Avery Zweckform', artikelnr: 'L7165', name: 'Adressetiketten 99,1 × 67,7 mm, 8 je A4',
    format: { breiteMm: 99.1, hoeheMm: 67.7, kontur: 'rechteck', eckenradiusMm: 2 },
    seiteBreiteMm: 210, seiteHoeheMm: 297, spalten: 2, zeilen: 4,
    randObenMm: 13.1, randLinksMm: 4.65, abstandXMm: 2.5, abstandYMm: 0, geprueft: false,
  },
  {
    hersteller: 'Avery Zweckform', artikelnr: 'L7163', name: 'Adressetiketten 99,1 × 38,1 mm, 14 je A4',
    format: { breiteMm: 99.1, hoeheMm: 38.1, kontur: 'rechteck', eckenradiusMm: 2 },
    seiteBreiteMm: 210, seiteHoeheMm: 297, spalten: 2, zeilen: 7,
    randObenMm: 15.15, randLinksMm: 4.65, abstandXMm: 2.5, abstandYMm: 0, geprueft: false,
  },
  {
    hersteller: 'Avery Zweckform', artikelnr: 'L7160', name: 'Adressetiketten 63,5 × 38,1 mm, 21 je A4',
    format: { breiteMm: 63.5, hoeheMm: 38.1, kontur: 'rechteck', eckenradiusMm: 2 },
    seiteBreiteMm: 210, seiteHoeheMm: 297, spalten: 3, zeilen: 7,
    randObenMm: 15.15, randLinksMm: 7.25, abstandXMm: 2.54, abstandYMm: 0, geprueft: false,
  },
]
