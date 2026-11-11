import { and, asc, eq } from 'drizzle-orm'
import type { Db } from '../db/client'
import { bogenvorlagen, designs, etikettenformate, themenwelten } from '../db/schema'
import { renderEtiketten, type RenderErgebnis } from '../../shared/render/render'
import { WASSERZEICHEN_SCHRIFT } from '../../shared/render/schriften'
import type { Bogenvorlage, Slot } from '../../shared/render/types'
import type { Etikettendaten } from '../../shared/etikettendaten'
import type { Ablage } from './ablage'
import { FachFehler } from './fehler'

export type SchriftLader = (key: string) => Promise<Uint8Array>

export type DesignZeile = typeof designs.$inferSelect
export type FormatZeile = typeof etikettenformate.$inferSelect
export type BogenZeile = typeof bogenvorlagen.$inferSelect

export function designMitFormat(db: Db, where: { slug: string } | { id: number }, nurVeroeffentlicht: boolean) {
  const bedingung = 'slug' in where ? eq(designs.slug, where.slug) : eq(designs.id, where.id)
  const row = db.select().from(designs)
    .innerJoin(etikettenformate, eq(designs.formatId, etikettenformate.id))
    .innerJoin(themenwelten, eq(designs.themenweltId, themenwelten.id))
    .where(nurVeroeffentlicht ? and(bedingung, eq(designs.veroeffentlicht, true)) : bedingung)
    .get()
  if (!row) throw new FachFehler('nicht_gefunden', 'Design nicht gefunden')
  return { design: row.designs, format: row.etikettenformate, themenwelt: row.themenwelten }
}

export function bogenFuerFormat(db: Db, formatId: number) {
  return db.select().from(bogenvorlagen)
    .where(and(eq(bogenvorlagen.formatId, formatId), eq(bogenvorlagen.aktiv, true)))
    .orderBy(asc(bogenvorlagen.id)).all()
}

export interface RenderAuftrag {
  format: FormatZeile
  slots: Slot[]
  hintergrund: string | null
  daten: Etikettendaten
  logoId?: string | null
  bogen: Bogenvorlage | null
  wasserzeichen: boolean
  kontur?: boolean
}

/** Lädt Hintergrund, Schriften und Logo und rendert. */
export async function rendere(a: RenderAuftrag, ablage: Ablage, ladeSchrift: SchriftLader): Promise<RenderErgebnis> {
  const keys = new Set<string>(a.slots.flatMap(s => (s.typ === 'text' ? [s.schrift] : [])))
  if (a.wasserzeichen) keys.add(WASSERZEICHEN_SCHRIFT)
  const schriften: Record<string, Uint8Array> = {}
  for (const k of keys) schriften[k] = await ladeSchrift(k)
  const hatLogoSlot = a.slots.some(s => s.typ === 'logo')
  return renderEtiketten({
    format: a.format,
    slots: a.slots,
    hintergrund: a.hintergrund ? await ablage.lesen('hintergruende', a.hintergrund) : null,
    schriften,
    daten: a.daten,
    logo: hatLogoSlot && a.logoId ? await ablage.lesen('logos', `${a.logoId}.png`) : null,
  }, { bogen: a.bogen, wasserzeichen: a.wasserzeichen, kontur: a.kontur })
}
