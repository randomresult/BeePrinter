import { themenwelten } from '../../../db/schema'
import { themenweltSchema } from '../../../services/adminSchemas'

export default defineEventHandler(async (event) => {
  const b = await readValidatedBody(event, validate(themenweltSchema))
  try {
    return useDb().insert(themenwelten).values(b).returning().get()
  }
  catch {
    throw createError({ statusCode: 409, statusMessage: 'Kürzel ist schon vergeben' })
  }
})
