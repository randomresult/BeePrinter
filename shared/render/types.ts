export type Kontur = 'rechteck' | 'rund' | 'schluesselloch'

export interface Etikettenformat {
  breiteMm: number
  hoeheMm: number
  kontur: Kontur
  eckenradiusMm: number
}

export interface Bogenvorlage {
  seiteBreiteMm: number
  seiteHoeheMm: number
  spalten: number
  zeilen: number
  randObenMm: number
  randLinksMm: number
  /** Lücke zwischen zwei Etiketten (nicht Rastermaß) */
  abstandXMm: number
  abstandYMm: number
}

export type Ausrichtung = 'links' | 'mitte' | 'rechts'
export type Rotation = 0 | 90 | 270

interface SlotBasis {
  id: string
  /** Rechteck in mm auf dem Etikett, Ursprung oben links. Bei Rotation 90/270 läuft der Text entlang hMm. */
  xMm: number
  yMm: number
  bMm: number
  hMm: number
  rotation: Rotation
}

export interface TextSlot extends SlotBasis {
  typ: 'text'
  /**
   * Text mit Platzhaltern, z. B. "Mindestens haltbar bis: {mhd}".
   * Ohne Platzhalter = fester Text. Enthält er nur leere optionale Felder, entfällt der Slot.
   */
  text: string
  schrift: string
  maxPt: number
  minPt: number
  ausrichtung: Ausrichtung
  versalien?: boolean
}

export interface LogoSlot extends SlotBasis {
  typ: 'logo'
}

export type Slot = TextSlot | LogoSlot
