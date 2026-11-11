import { PDFDocument, degrees, rgb, type PDFEmbeddedPage, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { fuelleText, type Etikettendaten } from '../etikettendaten'
import { etikettPositionen } from './raster'
import { WASSERZEICHEN_SCHRIFT } from './schriften'
import type { Bogenvorlage, Etikettenformat, LogoSlot, Slot, TextSlot } from './types'

export const MM = 72 / 25.4

export interface RenderEingabe {
  format: Etikettenformat
  slots: Slot[]
  /** Hintergrund-PDF (1 Seite in Etikettgröße) oder null */
  hintergrund: Uint8Array | null
  /** Schriftdateien je Schlüssel – nur die von den Slots benutzten + Wasserzeichen-Schrift nötig */
  schriften: Record<string, Uint8Array>
  daten: Etikettendaten
  /** Logo als PNG (bereits schwarz/transparent) */
  logo?: Uint8Array | null
}

export interface RenderOptionen {
  /** null = einzelnes Etikett (Vorschau), sonst ganzer Bogen */
  bogen: Bogenvorlage | null
  wasserzeichen: boolean
  /** Etikettkontur als Haarlinie zeichnen (Vorschau/Kalibrierung) */
  kontur?: boolean
}

export interface Ueberlauf {
  slotId: string
  /** Platzhalter im Slot – zeigt dem Imker, welches Feld zu lang ist */
  felder: string[]
  text: string
}

export interface RenderErgebnis {
  pdf: Uint8Array
  ueberlauf: Ueberlauf[]
}

interface Platzierung {
  text: string
  pt: number
  font: PDFFont
  slot: TextSlot
}

/**
 * Größte Schriftgröße zwischen minPt und maxPt, bei der der Text in den Slot passt (0,25-pt-Schritte).
 * null = passt selbst bei minPt nicht.
 */
export function passendeGroesse(font: PDFFont, text: string, slot: TextSlot): number | null {
  const quer = slot.rotation !== 0
  const laenge = (quer ? slot.hMm : slot.bMm) * MM
  const dicke = (quer ? slot.bMm : slot.hMm) * MM
  for (let pt = slot.maxPt; pt >= slot.minPt - 1e-9; pt -= 0.25) {
    if (font.widthOfTextAtSize(text, pt) <= laenge && font.heightAtSize(pt) <= dicke * 1.15) return pt
  }
  return null
}

export async function renderEtiketten(e: RenderEingabe, o: RenderOptionen): Promise<RenderErgebnis> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setProducer('BeePrinter')
  doc.setCreator('BeePrinter')

  const fontCache = new Map<string, PDFFont>()
  async function font(key: string) {
    let f = fontCache.get(key)
    if (!f) {
      const bytes = e.schriften[key]
      if (!bytes) throw new Error(`Schrift fehlt: ${key}`)
      f = await doc.embedFont(bytes, { subset: true })
      fontCache.set(key, f)
    }
    return f
  }

  // 1. Texte einmal setzen (alle Etiketten identisch)
  const platzierungen: Platzierung[] = []
  const ueberlauf: Ueberlauf[] = []
  for (const slot of e.slots) {
    if (slot.typ !== 'text') continue
    let text = fuelleText(slot.text, e.daten)
    if (!text) continue
    if (slot.versalien) text = text.toLocaleUpperCase('de-DE')
    const f = await font(slot.schrift)
    const pt = passendeGroesse(f, text, slot)
    if (pt === null) {
      ueberlauf.push({ slotId: slot.id, felder: [...slot.text.matchAll(/\{(\w+)\}/g)].map(m => m[1]!), text })
      platzierungen.push({ text, pt: slot.minPt, font: f, slot }) // trotzdem zeigen, damit man es sieht
    }
    else {
      platzierungen.push({ text, pt, font: f, slot })
    }
  }

  const hintergrund: PDFEmbeddedPage | null = e.hintergrund
    ? (await doc.embedPdf(e.hintergrund, [0]))[0]!
    : null
  const logoSlot = e.slots.find((s): s is LogoSlot => s.typ === 'logo')
  const logo: PDFImage | null = logoSlot && e.logo ? await doc.embedPng(e.logo) : null
  const wzFont = o.wasserzeichen ? await font(WASSERZEICHEN_SCHRIFT) : null

  const B = e.format.breiteMm * MM
  const H = e.format.hoeheMm * MM
  const seite = o.bogen
    ? doc.addPage([o.bogen.seiteBreiteMm * MM, o.bogen.seiteHoeheMm * MM])
    : doc.addPage([B, H])
  const positionen = o.bogen ? etikettPositionen(o.bogen, e.format) : [{ xMm: 0, yMm: 0 }]

  for (const pos of positionen) {
    const lx = pos.xMm * MM
    const ly = seite.getHeight() - pos.yMm * MM - H
    if (hintergrund) seite.drawPage(hintergrund, { x: lx, y: ly, width: B, height: H })
    for (const p of platzierungen) zeichneText(seite, p, lx, ly, H)
    if (logo && logoSlot) zeichneLogo(seite, logo, logoSlot, lx, ly, H)
    if (o.kontur) zeichneKontur(seite, e.format, lx, ly)
    if (wzFont) zeichneWasserzeichen(seite, wzFont, lx, ly, B, H)
  }

  return { pdf: await doc.save(), ueberlauf }
}

/** Slot-Rechteck in PDF-Koordinaten (unten links) */
function slotBox(slot: Slot, lx: number, ly: number, H: number) {
  return {
    x: lx + slot.xMm * MM,
    y: ly + H - (slot.yMm + slot.hMm) * MM,
    w: slot.bMm * MM,
    h: slot.hMm * MM,
  }
}

function zeichneText(seite: PDFPage, p: Platzierung, lx: number, ly: number, H: number) {
  const { slot, font, pt, text } = p
  const box = slotBox(slot, lx, ly, H)
  const breite = font.widthOfTextAtSize(text, pt)
  const voll = font.heightAtSize(pt)
  const unterlaenge = voll - font.heightAtSize(pt, { descender: false })
  const quer = slot.rotation !== 0
  const laenge = quer ? box.h : box.w
  const dicke = quer ? box.w : box.h
  const versatz = slot.ausrichtung === 'links' ? 0 : slot.ausrichtung === 'rechts' ? laenge - breite : (laenge - breite) / 2
  const grund = (dicke - voll) / 2 + unterlaenge // Grundlinie quer zur Laufrichtung

  let x: number, y: number
  if (slot.rotation === 0) {
    x = box.x + versatz
    y = box.y + grund
  }
  else if (slot.rotation === 90) {
    // liest von unten nach oben
    x = box.x + box.w - grund
    y = box.y + versatz
  }
  else {
    // 270: liest von oben nach unten
    x = box.x + grund
    y = box.y + box.h - versatz
  }
  seite.drawText(text, { x, y, size: pt, font, color: rgb(0, 0, 0), rotate: degrees(slot.rotation) })
}

function zeichneLogo(seite: PDFPage, logo: PDFImage, slot: LogoSlot, lx: number, ly: number, H: number) {
  const box = slotBox(slot, lx, ly, H)
  const s = Math.min(box.w / logo.width, box.h / logo.height)
  const w = logo.width * s
  const h = logo.height * s
  seite.drawImage(logo, { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, width: w, height: h })
}

function zeichneKontur(seite: PDFPage, f: Etikettenformat, lx: number, ly: number) {
  const B = f.breiteMm * MM
  const H = f.hoeheMm * MM
  const linie = { borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.4, borderDashArray: [2, 2] }
  if (f.kontur === 'rund') {
    seite.drawEllipse({ x: lx + B / 2, y: ly + H / 2, xScale: B / 2, yScale: H / 2, ...linie })
  }
  else if (f.kontur === 'rechteck' && f.eckenradiusMm > 0) {
    const r = f.eckenradiusMm * MM
    const pfad = `M ${r} 0 H ${B - r} A ${r} ${r} 0 0 1 ${B} ${r} V ${H - r} A ${r} ${r} 0 0 1 ${B - r} ${H} H ${r} A ${r} ${r} 0 0 1 0 ${H - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`
    seite.drawSvgPath(pfad, { x: lx, y: ly + H, ...linie })
  }
  else {
    // Schlüsselloch: Kontur kommt später mit eigenem Format; bis dahin Rechteck als Hilfslinie
    seite.drawRectangle({ x: lx, y: ly, width: B, height: H, ...linie })
  }
}

function zeichneWasserzeichen(seite: PDFPage, font: PDFFont, lx: number, ly: number, B: number, H: number) {
  const text = 'VORSCHAU'
  const winkel = Math.atan2(H, B)
  const diagonale = Math.hypot(B, H)
  const pt = Math.min(H * 0.45, (diagonale * 0.8) / (font.widthOfTextAtSize(text, 1)))
  const w = font.widthOfTextAtSize(text, pt)
  const hoehe = font.heightAtSize(pt, { descender: false })
  // Text um Etikettmitte drehen
  const cx = lx + B / 2
  const cy = ly + H / 2
  const dx = -w / 2
  const dy = -hoehe / 2
  const x = cx + dx * Math.cos(winkel) - dy * Math.sin(winkel)
  const y = cy + dx * Math.sin(winkel) + dy * Math.cos(winkel)
  seite.drawText(text, { x, y, size: pt, font, color: rgb(0.85, 0.1, 0.1), opacity: 0.22, rotate: degrees((winkel * 180) / Math.PI) })
}
