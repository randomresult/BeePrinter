import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { renderEtiketten } from '../shared/render/render'
import { BEISPIELDATEN } from '../shared/etikettendaten'
import { AVERY_KATALOG } from '../server/data/avery-katalog'
import { BEISPIEL_DESIGNS, erzeugeHintergrund } from '../server/data/beispiel-designs'
import type { TextSlot } from '../shared/render/types'
import { schriften } from './helpers'

const bogen = AVERY_KATALOG.find(k => k.artikelnr === 'L4744REV')!
const design = BEISPIEL_DESIGNS.find(d => d.slug === 'waldhonig')!

describe('renderEtiketten', () => {
  it('erzeugt ein flaches A4-PDF ohne Formularfelder', async () => {
    const hg = await erzeugeHintergrund(design.zeichne)
    const { pdf, ueberlauf } = await renderEtiketten(
      { format: bogen.format, slots: design.slots, hintergrund: hg, schriften, daten: BEISPIELDATEN },
      { bogen, wasserzeichen: false },
    )
    expect(ueberlauf).toEqual([])
    const doc = await PDFDocument.load(pdf)
    expect(doc.getPageCount()).toBe(1)
    const { width, height } = doc.getPage(0).getSize()
    expect(width).toBeCloseTo(595.28, 1)
    expect(height).toBeCloseTo(841.89, 1)
    expect(doc.catalog.has(doc.context.obj('AcroForm') as never)).toBe(false)
    expect(Buffer.from(pdf).toString('latin1')).not.toContain('/AcroForm')
  })

  it('alle Beispiel-Designs passen mit Beispieldaten ohne Überlauf', async () => {
    for (const d of BEISPIEL_DESIGNS) {
      const { ueberlauf } = await renderEtiketten(
        { format: bogen.format, slots: d.slots, hintergrund: null, schriften, daten: BEISPIELDATEN },
        { bogen: null, wasserzeichen: true },
      )
      expect(ueberlauf, d.slug).toEqual([])
    }
  })

  it('meldet Überlauf mit betroffenen Feldern', async () => {
    const slot: TextSlot = { id: 'x', typ: 'text', text: '{imkerei}', xMm: 2, yMm: 2, bMm: 20, hMm: 4, schrift: 'alegreya-sans', maxPt: 7, minPt: 5, ausrichtung: 'links', rotation: 0 }
    const { ueberlauf } = await renderEtiketten(
      { format: bogen.format, slots: [slot], hintergrund: null, schriften, daten: { ...BEISPIELDATEN, imkerei: 'Imkerei Hans-Joachim Müller-Lüdenscheidt' } },
      { bogen: null, wasserzeichen: false },
    )
    expect(ueberlauf).toEqual([expect.objectContaining({ slotId: 'x', felder: ['imkerei'] })])
  })
})
