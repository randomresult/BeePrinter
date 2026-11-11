import { randomBytes } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { Db } from '../db/client'
import { bestellungen, bogenvorlagen } from '../db/schema'
import type { Etikettendaten } from '../../shared/etikettendaten'
import type { Ablage } from './ablage'
import { designMitFormat, rendere, type SchriftLader } from './etikett'
import { FachFehler } from './fehler'

export interface NeueBestellung {
  designSlug: string
  bogenId: number
  daten: Etikettendaten
  logoId: string | null
  email: string
}

export const neuesToken = () => randomBytes(24).toString('base64url')

/**
 * Legt eine offene Bestellung an und friert das Druck-PDF sofort ein (ADR 0003):
 * Spätere Änderungen am Design betreffen gekaufte PDFs nicht.
 */
export async function erstelleBestellung(db: Db, ablage: Ablage, ladeSchrift: SchriftLader, b: NeueBestellung) {
  const { design, format } = designMitFormat(db, { slug: b.designSlug }, true)
  const bogen = db.select().from(bogenvorlagen)
    .where(and(eq(bogenvorlagen.id, b.bogenId), eq(bogenvorlagen.formatId, format.id), eq(bogenvorlagen.aktiv, true)))
    .get()
  if (!bogen) throw new FachFehler('ungueltig', 'Etikettenbogen passt nicht zum Design')

  const { pdf, ueberlauf } = await rendere({
    format, slots: design.slots, hintergrund: design.hintergrund, daten: b.daten, logoId: b.logoId, bogen, wasserzeichen: false,
  }, ablage, ladeSchrift)
  if (ueberlauf.length) {
    throw new FachFehler('ueberlauf', 'Einige Angaben sind zu lang für das Etikett', { felder: [...new Set(ueberlauf.flatMap(u => u.felder))] })
  }
  const pdfDatei = await ablage.speichern('pdf', pdf, 'pdf')
  return db.insert(bestellungen).values({
    token: neuesToken(),
    email: b.email,
    designId: design.id,
    bogenId: bogen.id,
    daten: b.daten,
    logoId: b.logoId,
    betragCent: design.preisCent,
    pdfDatei,
  }).returning().get()
}

export function bestellungPerToken(db: Db, token: string) {
  const b = db.select().from(bestellungen).where(eq(bestellungen.token, token)).get()
  if (!b) throw new FachFehler('nicht_gefunden', 'Bestellung nicht gefunden')
  return b
}

/** Idempotent: true nur beim ersten Übergang offen → bezahlt (dann Mail senden). */
export function markiereBezahlt(db: Db, bestellungId: number, jetzt = new Date()): boolean {
  const r = db.update(bestellungen)
    .set({ status: 'bezahlt', bezahltAm: jetzt })
    .where(and(eq(bestellungen.id, bestellungId), eq(bestellungen.status, 'offen')))
    .run()
  return r.changes === 1
}

export async function druckPdf(db: Db, ablage: Ablage, token: string) {
  const b = bestellungPerToken(db, token)
  if (b.status !== 'bezahlt') throw new FachFehler('nicht_bezahlt', 'Die Bestellung ist noch nicht bezahlt')
  return { bestellung: b, pdf: await ablage.lesen('pdf', b.pdfDatei) }
}
