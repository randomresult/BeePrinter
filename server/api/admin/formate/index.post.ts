import { etikettenformate } from '../../../db/schema'
import { formatSchema } from '../../../services/adminSchemas'

export default defineEventHandler(async (event) => {
  const b = await readValidatedBody(event, validate(formatSchema))
  return useDb().insert(etikettenformate).values(b).returning().get()
})
