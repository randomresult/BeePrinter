import { z } from 'zod'
import { PFLICHT_PLATZHALTER, PLATZHALTER, platzhalterIn } from '../../shared/etikettendaten'
import { SCHRIFT_KEYS } from '../../shared/render/schriften'
import type { Slot } from '../../shared/render/types'

const mm = z.coerce.number().min(0).max(400)
const basis = {
  id: z.string().min(1).max(20),
  xMm: mm, yMm: mm, bMm: mm.min(1), hMm: mm.min(1),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(270)]),
}

export const slotSchema = z.discriminatedUnion('typ', [
  z.object({
    ...basis,
    typ: z.literal('text'),
    text: z.string().trim().min(1).max(120).refine(t => platzhalterIn(t).every(k => k in PLATZHALTER), 'Unbekannter Platzhalter'),
    schrift: z.enum(SCHRIFT_KEYS as [string, ...string[]]),
    maxPt: z.coerce.number().min(2).max(72),
    minPt: z.coerce.number().min(2).max(72),
    ausrichtung: z.enum(['links', 'mitte', 'rechts']),
    versalien: z.boolean().optional(),
  }).refine(s => s.minPt <= s.maxPt, 'Mindestgröße größer als Höchstgröße'),
  z.object({ ...basis, typ: z.literal('logo') }),
])

export const designSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/, 'Nur a–z, 0–9 und Bindestrich'),
  beschreibung: z.string().trim().max(300).default(''),
  themenweltId: z.coerce.number().int(),
  formatId: z.coerce.number().int(),
  preisCent: z.coerce.number().int().min(50).max(100_00),
  veroeffentlicht: z.boolean(),
  sortierung: z.coerce.number().int().default(0),
  slots: z.array(slotSchema).max(40),
})

/** Pflichtangaben, die kein Slot abdeckt – ein Design ohne sie darf nicht veröffentlicht werden. */
export function fehlendePflichtangaben(slots: Slot[]): string[] {
  const vorhanden = new Set(slots.flatMap(s => (s.typ === 'text' ? platzhalterIn(s.text) : [])))
  return PFLICHT_PLATZHALTER.filter(k => !vorhanden.has(k)).map(k => PLATZHALTER[k]!.label)
}

export const bogenSchema = z.object({
  formatId: z.coerce.number().int(),
  hersteller: z.string().trim().min(1).max(60),
  artikelnr: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  seiteBreiteMm: mm, seiteHoeheMm: mm,
  spalten: z.coerce.number().int().min(1).max(20),
  zeilen: z.coerce.number().int().min(1).max(40),
  randObenMm: mm, randLinksMm: mm, abstandXMm: mm, abstandYMm: mm,
  aktiv: z.boolean().default(true),
})

export const formatSchema = z.object({
  name: z.string().trim().min(1).max(60),
  breiteMm: mm.min(5), hoeheMm: mm.min(5),
  kontur: z.enum(['rechteck', 'rund', 'schluesselloch']),
  eckenradiusMm: mm.default(0),
})

export const themenweltSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/),
  sortierung: z.coerce.number().int().default(0),
})
