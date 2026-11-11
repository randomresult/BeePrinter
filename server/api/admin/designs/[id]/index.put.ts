import { eq } from 'drizzle-orm'
import { designs } from '../../../../db/schema'
import { designSchema, fehlendePflichtangaben } from '../../../../services/adminSchemas'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const b = await readValidatedBody(event, validate(designSchema))
  const db = useDb()
  const alt = db.select().from(designs).where(eq(designs.id, id)).get()
  if (!alt) throw createError({ statusCode: 404, statusMessage: 'Design nicht gefunden' })
  if (new Set(b.slots.map(s => s.id)).size !== b.slots.length) throw createError({ statusCode: 422, statusMessage: 'Slot-IDs doppelt' })
  if (b.veroeffentlicht) {
    const fehlt = fehlendePflichtangaben(b.slots)
    if (fehlt.length) throw createError({ statusCode: 422, statusMessage: `Veröffentlichen nicht möglich – es fehlen Slots für: ${fehlt.join(', ')}` })
    if (!alt.hintergrund) throw createError({ statusCode: 422, statusMessage: 'Veröffentlichen nicht möglich – Hintergrund fehlt' })
  }
  try {
    return db.update(designs).set(b).where(eq(designs.id, id)).returning().get()
  }
  catch {
    throw createError({ statusCode: 409, statusMessage: 'Kürzel ist schon vergeben' })
  }
})
