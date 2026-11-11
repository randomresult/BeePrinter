import { eq } from 'drizzle-orm'
import { bogenvorlagen } from '../../../db/schema'
import { bogenSchema } from '../../../services/adminSchemas'

export default defineEventHandler(async (event) => {
  const b = await readValidatedBody(event, validate(bogenSchema))
  pruefeRaster(b)
  const r = useDb().update(bogenvorlagen).set(b).where(eq(bogenvorlagen.id, Number(getRouterParam(event, 'id')))).returning().get()
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Bogen nicht gefunden' })
  return r
})
