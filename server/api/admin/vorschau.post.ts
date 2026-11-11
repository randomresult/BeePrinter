import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { BEISPIELDATEN, etikettendatenSchema } from '../../../shared/etikettendaten'
import { designs, etikettenformate } from '../../db/schema'
import { slotSchema } from '../../services/adminSchemas'
import { rendere } from '../../services/etikett'

const body = z.object({
  designId: z.coerce.number().int(),
  slots: z.array(slotSchema),
  daten: etikettendatenSchema.optional(),
})

/** Vorschau ungespeicherter Slots im Editor (mit Beispieldaten, ohne Wasserzeichen) */
export default defineEventHandler(async (event) => {
  const b = await readValidatedBody(event, validate(body))
  const row = useDb().select().from(designs).innerJoin(etikettenformate, eq(designs.formatId, etikettenformate.id)).where(eq(designs.id, b.designId)).get()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Design nicht gefunden' })
  const { pdf, ueberlauf } = await rendere({
    format: row.etikettenformate, slots: b.slots, hintergrund: row.designs.hintergrund, daten: b.daten ?? BEISPIELDATEN, bogen: null, wasserzeichen: false, kontur: true,
  }, useAblage(), ladeSchrift)
  return { pdf: Buffer.from(pdf).toString('base64'), ueberlauf: ueberlauf.map(u => u.slotId) }
})
