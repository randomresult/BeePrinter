import type { Bogenvorlage, Etikettenformat } from './types'

export interface EtikettPosition {
  /** oben links in mm, Ursprung oben links auf der Seite */
  xMm: number
  yMm: number
}

/** Alle Etikettpositionen eines Bogens, zeilenweise von oben links. */
export function etikettPositionen(bogen: Bogenvorlage, format: Pick<Etikettenformat, 'breiteMm' | 'hoeheMm'>): EtikettPosition[] {
  const out: EtikettPosition[] = []
  for (let z = 0; z < bogen.zeilen; z++) {
    for (let s = 0; s < bogen.spalten; s++) {
      out.push({
        xMm: bogen.randLinksMm + s * (format.breiteMm + bogen.abstandXMm),
        yMm: bogen.randObenMm + z * (format.hoeheMm + bogen.abstandYMm),
      })
    }
  }
  return out
}

/** Prüft, ob das Raster auf die Seite passt. Liefert Fehlermeldung oder null. */
export function rasterFehler(bogen: Bogenvorlage, format: Pick<Etikettenformat, 'breiteMm' | 'hoeheMm'>): string | null {
  const rechts = bogen.randLinksMm + bogen.spalten * format.breiteMm + (bogen.spalten - 1) * bogen.abstandXMm
  const unten = bogen.randObenMm + bogen.zeilen * format.hoeheMm + (bogen.zeilen - 1) * bogen.abstandYMm
  const toleranz = 0.01
  if (rechts > bogen.seiteBreiteMm + toleranz) return `Raster ist ${(rechts - bogen.seiteBreiteMm).toFixed(1)} mm zu breit für die Seite`
  if (unten > bogen.seiteHoeheMm + toleranz) return `Raster ist ${(unten - bogen.seiteHoeheMm).toFixed(1)} mm zu hoch für die Seite`
  return null
}
