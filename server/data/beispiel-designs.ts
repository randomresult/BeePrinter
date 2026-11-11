/**
 * Beispiel-Designs für Entwicklung und Demo. Hintergründe werden als Vektor-PDF erzeugt
 * (einfache, selbst gezeichnete Ornamente). Echte Grafiken liefert später Wabengut über den Admin.
 */
import { PDFDocument, rgb, type PDFPage } from 'pdf-lib'
import type { Slot, TextSlot } from '../../shared/render/types'

const MM = 72 / 25.4
const B = 96
const H = 50.8

type Zeichner = (z: Zeichenstift) => void

export interface BeispielDesign {
  slug: string
  name: string
  themenwelt: 'standard' | 'saison' | 'geschenk'
  beschreibung: string
  preisCent: number
  slots: Slot[]
  zeichne: Zeichner
}

// ---------- Zeichenhilfen (Koordinaten in mm, Ursprung oben links) ----------

class Zeichenstift {
  constructor(private seite: PDFPage) {}
  pfad(d: string, o: { fuellen?: boolean, linie?: number, grau?: number } = {}) {
    const farbe = rgb(o.grau ?? 0, o.grau ?? 0, o.grau ?? 0)
    this.seite.drawSvgPath(d, {
      x: 0, y: H * MM, scale: MM,
      color: o.fuellen ? farbe : undefined,
      borderColor: o.linie ? farbe : undefined,
      borderWidth: o.linie ? o.linie : undefined,
    })
  }
  linie(x1: number, y1: number, x2: number, y2: number, staerke = 0.25, strich?: number[]) {
    this.seite.drawLine({
      start: { x: x1 * MM, y: (H - y1) * MM }, end: { x: x2 * MM, y: (H - y2) * MM },
      thickness: staerke * MM, color: rgb(0, 0, 0), dashArray: strich?.map(s => s * MM),
    })
  }
  rahmen(abstand: number, radius: number, staerke = 0.3, strich?: number[]) {
    const x = abstand, y = abstand, w = B - 2 * abstand, h = H - 2 * abstand, r = radius
    if (strich) {
      this.linie(x + r, y, x + w - r, y, staerke, strich)
      this.linie(x + r, y + h, x + w - r, y + h, staerke, strich)
      this.linie(x, y + r, x, y + h - r, staerke, strich)
      this.linie(x + w, y + r, x + w, y + h - r, staerke, strich)
      return
    }
    this.pfad(`M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`, { linie: staerke })
  }
  kreis(cx: number, cy: number, r: number, o: { fuellen?: boolean, linie?: number } = { fuellen: true }) {
    this.pfad(`M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`, o)
  }
  wabe(cx: number, cy: number, r: number, o: { fuellen?: boolean, linie?: number } = { linie: 0.25 }) {
    const pkt = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6
      return `${(cx + r * Math.cos(a)).toFixed(3)} ${(cy + r * Math.sin(a)).toFixed(3)}`
    })
    this.pfad(`M ${pkt.join(' L ')} Z`, o)
  }
  waben(x0: number, y0: number, spalten: number, zeilen: number, r: number) {
    const dx = r * Math.sqrt(3)
    for (let z = 0; z < zeilen; z++) {
      for (let s = 0; s < spalten; s++) this.wabe(x0 + s * dx + (z % 2 ? dx / 2 : 0), y0 + z * r * 1.5, r)
    }
  }
  biene(cx: number, cy: number, s: number) {
    this.kreis(cx - 0.55 * s, cy - 0.55 * s, 0.5 * s, { linie: 0.18 })
    this.kreis(cx + 0.15 * s, cy - 0.65 * s, 0.45 * s, { linie: 0.18 })
    this.pfad(`M ${cx - s} ${cy} A ${s} ${0.6 * s} 0 1 0 ${cx + s} ${cy} A ${s} ${0.6 * s} 0 1 0 ${cx - s} ${cy} Z`, { fuellen: true })
    this.linie(cx - 0.3 * s, cy - 0.55 * s, cx - 0.3 * s, cy + 0.55 * s, 0.22 * s)
    this.kreis(cx + 1.15 * s, cy, 0.35 * s)
  }
  krone(cx: number, cy: number, s: number) {
    const w = 2 * s, h = 1.3 * s, x = cx - s, y = cy - h / 2
    this.pfad(`M ${x} ${y + h} L ${x} ${y + 0.3 * h} L ${x + 0.25 * w} ${y + 0.65 * h} L ${x + 0.5 * w} ${y} L ${x + 0.75 * w} ${y + 0.65 * h} L ${x + w} ${y + 0.3 * h} L ${x + w} ${y + h} Z`, { fuellen: true })
    for (const px of [0, 0.5, 1]) this.kreis(x + px * w, (px === 0.5 ? y : y + 0.3 * h) - 0.25 * s, 0.22 * s)
  }
  baum(x: number, unten: number, w: number, h: number) {
    this.pfad(`M ${x + w / 2} ${unten - h} L ${x + w} ${unten - h * 0.35} L ${x + w * 0.65} ${unten - h * 0.35} L ${x + w * 0.9} ${unten - h * 0.1} L ${x + w * 0.55} ${unten - h * 0.1} L ${x + w * 0.55} ${unten} L ${x + w * 0.45} ${unten} L ${x + w * 0.45} ${unten - h * 0.1} L ${x + w * 0.1} ${unten - h * 0.1} L ${x + w * 0.35} ${unten - h * 0.35} L ${x} ${unten - h * 0.35} Z`, { fuellen: true })
  }
  blume(cx: number, cy: number, r: number) {
    for (let i = 0; i < 5; i++) {
      const a = (2 * Math.PI * i) / 5 - Math.PI / 2
      this.kreis(cx + r * 0.62 * Math.cos(a), cy + r * 0.62 * Math.sin(a), r * 0.42, { linie: 0.2 })
    }
    this.kreis(cx, cy, r * 0.3)
  }
  herz(cx: number, cy: number, s: number, fuellen = true) {
    this.pfad(`M ${cx} ${cy + 0.8 * s} C ${cx - 1.4 * s} ${cy - 0.1 * s} ${cx - 0.7 * s} ${cy - 1.1 * s} ${cx} ${cy - 0.4 * s} C ${cx + 0.7 * s} ${cy - 1.1 * s} ${cx + 1.4 * s} ${cy - 0.1 * s} ${cx} ${cy + 0.8 * s} Z`, fuellen ? { fuellen: true } : { linie: 0.25 })
  }
  stern(cx: number, cy: number, r: number) {
    const pkt = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2
      const rr = i % 2 ? r * 0.42 : r
      return `${(cx + rr * Math.cos(a)).toFixed(3)} ${(cy + rr * Math.sin(a)).toFixed(3)}`
    })
    this.pfad(`M ${pkt.join(' L ')} Z`, { fuellen: true })
  }
  sonne(cx: number, cy: number, r: number) {
    this.kreis(cx, cy, r, { linie: 0.3 })
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI / 6) * i
      this.linie(cx + r * 1.25 * Math.cos(a), cy + r * 1.25 * Math.sin(a), cx + r * 1.7 * Math.cos(a), cy + r * 1.7 * Math.sin(a), 0.3)
    }
  }
  gras(x0: number, x1: number, unten: number, hoehe: number) {
    let d = ''
    for (let x = x0; x < x1; x += 1.3) {
      const h = hoehe * (0.5 + 0.5 * Math.abs(Math.sin(x * 1.7)))
      const neig = Math.sin(x * 2.3) * 2.2
      d += `M ${x.toFixed(2)} ${unten} Q ${x.toFixed(2)} ${(unten - h * 0.7).toFixed(2)} ${(x + neig).toFixed(2)} ${(unten - h).toFixed(2)} `
    }
    this.pfad(d, { linie: 0.18 })
  }
  ranke(x0: number, x1: number, y: number) {
    const m = (x0 + x1) / 2
    this.pfad(`M ${x0} ${y} C ${x0 + 4} ${y - 2.5} ${m - 4} ${y + 2.5} ${m} ${y} C ${m + 4} ${y - 2.5} ${x1 - 4} ${y + 2.5} ${x1} ${y}`, { linie: 0.25 })
    for (const x of [x0 + (m - x0) / 2, m + (x1 - m) / 2]) this.kreis(x, y, 0.5)
  }
  ecke(x: number, y: number, sx: 1 | -1, sy: 1 | -1, s: number) {
    this.pfad(`M ${x} ${y + sy * s} Q ${x} ${y} ${x + sx * s} ${y} M ${x + sx * s * 0.3} ${y + sy * s * 0.3} m 0 0`, { linie: 0.35 })
    this.kreis(x + sx * s * 0.35, y + sy * s * 0.35, s * 0.12)
  }
}

export async function erzeugeHintergrund(zeichne: Zeichner): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setProducer('BeePrinter (Beispiel)')
  const seite = doc.addPage([B * MM, H * MM])
  zeichne(new Zeichenstift(seite))
  return doc.save()
}

// ---------- Slot-Layouts ----------

let n = 0
const t = (text: string, xMm: number, yMm: number, bMm: number, hMm: number, schrift: string, maxPt: number, minPt: number, extra: Partial<TextSlot> = {}): TextSlot =>
  ({ id: `s${++n}`, typ: 'text', text, xMm, yMm, bMm, hMm, schrift, maxPt, minPt, ausrichtung: 'mitte', rotation: 0, ...extra })

/** Dreispaltiges Grundlayout wie auf den Wabengut-Gläsern: Anschrift links, Sorte Mitte, MHD rechts */
function dreiSpalten(o: { titel: string, text: string, fett: string, versalien?: boolean, titelMax?: number }): Slot[] {
  return [
    t('{honigsorte}', 24, 6, 48, 9, o.titel, o.titelMax ?? 18, 9, { versalien: o.versalien }),
    t('aus {ursprung}', 24, 15, 48, 4.5, o.text, 9, 5.5),
    t('{fuellmenge}', 24, 20, 48, 4.5, o.fett, 10, 6.5),
    t('{imkerei}', 4, 9, 19, 4, o.fett, 7, 4.2),
    t('{strasse}', 4, 13.5, 19, 3.6, o.text, 6.5, 4),
    t('{plz} {ort}', 4, 17.5, 19, 3.6, o.text, 6.5, 4),
    t('{kontakt}', 4, 21.5, 19, 3.6, o.text, 6, 3.8),
    t('Mindestens', 73, 9, 20, 3.4, o.text, 6.5, 4),
    t('haltbar bis:', 73, 12.4, 20, 3.4, o.text, 6.5, 4),
    t('{mhd}', 73, 16, 20, 4, o.fett, 8, 5),
    t('Los: {los}', 73, 20.5, 20, 3.6, o.text, 6.5, 4),
    t('{region}', 24, 25, 48, 4, o.text, 8, 5),
    t('{lagerhinweis}', 14, 44.2, 68, 3.4, o.text, 6.5, 4),
  ]
}

const logo = (xMm: number, yMm: number, bMm: number, hMm: number): Slot => ({ id: `s${++n}`, typ: 'logo', xMm, yMm, bMm, hMm, rotation: 0 })

// ---------- Designs ----------

export const BEISPIEL_DESIGNS: BeispielDesign[] = [
  {
    slug: 'waldhonig', name: 'Waldhonig', themenwelt: 'standard', preisCent: 490,
    beschreibung: 'Kapitälchen, Tannensilhouette und Waben – klassisch und kräftig.',
    slots: dreiSpalten({ titel: 'alegreya-sc-bold', text: 'alegreya-sans', fett: 'alegreya-sans-bold', versalien: true }),
    zeichne: (z) => {
      z.rahmen(1.6, 2.5, 0.5)
      z.rahmen(2.6, 1.8, 0.2)
      z.linie(23.5, 8, 23.5, 38)
      z.linie(72.5, 8, 72.5, 38)
      for (const [x, h] of [[34, 9], [40, 11.5], [46, 8.5], [52, 11], [58, 8]] as const) z.baum(x, 41.5, 6, h)
      z.linie(30, 41.5, 66, 41.5, 0.3)
      z.waben(6, 30, 4, 3, 1.8)
      z.waben(77, 30, 4, 3, 1.8)
    },
  },
  {
    slug: 'fruehling', name: 'Frühling', themenwelt: 'standard', preisCent: 490,
    beschreibung: 'Leichte Blüten in den Ecken, freundliche Groteske.',
    slots: dreiSpalten({ titel: 'alegreya-sans-bold', text: 'alegreya-sans', fett: 'alegreya-sans-bold', titelMax: 19 }),
    zeichne: (z) => {
      z.rahmen(2, 3, 0.25)
      for (const [x, y, r] of [[8, 34, 3.2], [14, 39, 2.2], [5, 41, 1.6], [88, 34, 3.2], [82, 39, 2.2], [91, 41, 1.6], [48, 36, 3.8], [40, 39, 2.2], [56, 39, 2.2]] as const) z.blume(x, y, r)
      z.biene(66, 33, 1.3)
      z.biene(30, 32, 1)
    },
  },
  {
    slug: 'sommertracht', name: 'Sommertracht', themenwelt: 'standard', preisCent: 490,
    beschreibung: 'Wiese, Sonne und Bienen – wie ein Sommertag am Bienenstand.',
    slots: dreiSpalten({ titel: 'alegreya-sc-bold', text: 'alegreya-sans', fett: 'alegreya-sans-bold' }),
    zeichne: (z) => {
      z.gras(4, 26, 47, 7)
      z.gras(70, 92, 47, 7)
      z.linie(4, 47, 26, 47, 0.25)
      z.linie(70, 47, 92, 47, 0.25)
      z.sonne(84, 34, 2.4)
      z.biene(20, 33, 1.2)
      z.biene(62, 31, 1)
      z.krone(48, 33, 2.2)
    },
  },
  {
    slug: 'landhaus', name: 'Landhaus', themenwelt: 'standard', preisCent: 590,
    beschreibung: 'Schreibmaschinenschrift, gestrichelter Rahmen und Platz für dein Logo.',
    slots: [
      ...dreiSpalten({ titel: 'courier-bold', text: 'courier', fett: 'courier-bold', versalien: true, titelMax: 17 }),
      logo(38, 29, 20, 13),
    ],
    zeichne: (z) => {
      z.rahmen(1.4, 0, 0.35, [1.2, 0.8])
      z.rahmen(2.4, 0, 0.15)
      z.linie(23.5, 8, 23.5, 40, 0.15, [0.6, 0.6])
      z.linie(72.5, 8, 72.5, 40, 0.15, [0.6, 0.6])
      z.waben(8, 31, 3, 3, 1.6)
      z.waben(79, 31, 3, 3, 1.6)
    },
  },
  {
    slug: 'premium', name: 'Premium', themenwelt: 'standard', preisCent: 690,
    beschreibung: 'Plakative Serifenschrift, Doppelrahmen mit Eckornamenten und Krone.',
    slots: dreiSpalten({ titel: 'abril', text: 'alegreya-sans', fett: 'alegreya-sans-bold', titelMax: 20 }),
    zeichne: (z) => {
      z.rahmen(1.5, 0, 0.7)
      z.rahmen(2.8, 0, 0.2)
      z.ecke(4.5, 4.5, 1, 1, 4)
      z.ecke(91.5, 4.5, -1, 1, 4)
      z.ecke(4.5, 46.3, 1, -1, 4)
      z.ecke(91.5, 46.3, -1, -1, 4)
      z.krone(48, 34, 3.2)
      z.ranke(28, 42, 36)
      z.ranke(54, 68, 36)
    },
  },
  {
    slug: 'vintage', name: 'Vintage', themenwelt: 'standard', preisCent: 590,
    beschreibung: 'Western-Schrift, Punktrahmen und alte Bienenkorb-Anmutung.',
    slots: dreiSpalten({ titel: 'rye', text: 'courier', fett: 'courier-bold', titelMax: 16 }),
    zeichne: (z) => {
      z.rahmen(2, 4, 0.5)
      for (let x = 6; x <= 90; x += 2.2) { z.kreis(x, 4.2, 0.35); z.kreis(x, 46.6, 0.35) }
      // Bienenkorb aus Bögen
      for (let i = 0; i < 5; i++) {
        const w = 14 - i * 2.2
        z.pfad(`M ${48 - w / 2} ${42 - i * 2.4} Q ${48} ${39 - i * 2.4} ${48 + w / 2} ${42 - i * 2.4}`, { linie: 0.35 })
      }
      z.linie(40, 42, 56, 42, 0.4)
      z.kreis(48, 40.6, 0.9)
      z.biene(58, 31, 1)
      z.biene(37, 33, 0.9)
    },
  },
  {
    slug: 'weihnachten', name: 'Weihnachtshonig', themenwelt: 'saison', preisCent: 590,
    beschreibung: 'Sterne und Tannen, mit eigenem Gruß (z. B. „Frohe Weihnachten“).',
    slots: [
      ...dreiSpalten({ titel: 'alegreya-sc-bold', text: 'alegreya-sans', fett: 'alegreya-sans-bold', versalien: true }).filter(s => !(s.typ === 'text' && s.text === '{region}')),
      t('{anlass}', 24, 25, 48, 5.5, 'great-vibes', 14, 8),
    ],
    zeichne: (z) => {
      z.rahmen(2, 2.5, 0.35)
      for (const [x, y, r] of [[8, 33, 1.6], [13, 38, 1], [86, 33, 1.6], [81, 38, 1], [48, 33, 1.3], [30, 36, 0.8], [66, 36, 0.8]] as const) z.stern(x, y, r)
      z.baum(38, 43, 6, 9)
      z.baum(52, 43, 6, 9)
      z.baum(45, 43, 6, 11)
    },
  },
  {
    slug: 'hochzeit', name: 'Hochzeit', themenwelt: 'geschenk', preisCent: 790,
    beschreibung: 'Gastgeschenk mit Namen und Datum des Paares in Schreibschrift.',
    slots: [
      ...dreiSpalten({ titel: 'alegreya-sc-bold', text: 'alegreya-sans', fett: 'alegreya-sans-bold', versalien: true }).filter(s => !(s.typ === 'text' && s.text === '{region}')),
      t('{anlass}', 22, 33.5, 52, 7, 'great-vibes', 15, 8),
    ],
    zeichne: (z) => {
      z.rahmen(2, 3, 0.3)
      z.ranke(28, 46, 28.5)
      z.ranke(50, 68, 28.5)
      z.herz(48, 28.5, 1.4, false)
      z.herz(44, 42.3, 0.7)
      z.herz(52, 42.3, 0.7)
      z.linie(30, 42.3, 41.5, 42.3, 0.2)
      z.linie(54.5, 42.3, 66, 42.3, 0.2)
    },
  },
]
