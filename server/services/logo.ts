import sharp, { type Sharp } from 'sharp'
import { FachFehler } from './fehler'

const MAX_BYTES = 8 * 1024 * 1024
const MAX_KANTE = 1200

/**
 * Macht aus einem Logo (PNG/JPG/SVG/WebP) ein reines Schwarz/Transparent-PNG,
 * passend zum Schwarzdruck auf farbigem Etikettenpapier.
 */
export async function logoSchwarzWeiss(eingabe: Uint8Array, schwelle = 150): Promise<Uint8Array> {
  if (eingabe.byteLength > MAX_BYTES) throw new FachFehler('ungueltig', 'Logo ist größer als 8 MB')
  let bild: Sharp
  try {
    bild = sharp(eingabe, { density: 300, limitInputPixels: 40_000_000 })
    const meta = await bild.metadata()
    if (!meta.format || !['png', 'jpeg', 'svg', 'webp'].includes(meta.format)) throw new Error('format')
  }
  catch {
    throw new FachFehler('ungueltig', 'Logo bitte als PNG, JPG oder SVG hochladen')
  }
  const ergebnis = await bild
    .flatten({ background: '#ffffff' })
    .resize(MAX_KANTE, MAX_KANTE, { fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .threshold(schwelle)
    .trim({ background: '#ffffff', threshold: 10 })
    .raw()
    .toBuffer({ resolveWithObject: true })
    .catch(() => { throw new FachFehler('ungueltig', 'Im Logo ist nach der Umwandlung nichts Schwarzes übrig – bitte kontrastreicheres Bild wählen') })
  const { data, info } = ergebnis

  // Grauwert 0 = Schwarz → deckend, 255 = Weiß → transparent
  const rgba = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i++) {
    rgba[i * 4 + 3] = 255 - data[i * info.channels]!
  }
  return new Uint8Array(await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer())
}
