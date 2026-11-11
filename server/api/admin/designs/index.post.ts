import { z } from 'zod'
import { designs } from '../../../db/schema'

const body = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/, 'Nur a–z, 0–9 und Bindestrich'),
  themenweltId: z.coerce.number().int(),
  formatId: z.coerce.number().int(),
})

export default defineEventHandler(async (event) => {
  const b = await readValidatedBody(event, validate(body))
  try {
    return useDb().insert(designs).values({ ...b, veroeffentlicht: false }).returning().get()
  }
  catch {
    throw createError({ statusCode: 409, statusMessage: 'Kürzel ist schon vergeben' })
  }
})
