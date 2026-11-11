import { bogenvorlagen } from '../../../db/schema'
import { bogenSchema } from '../../../services/adminSchemas'

export default defineEventHandler(async (event) => {
  const b = await readValidatedBody(event, validate(bogenSchema))
  pruefeRaster(b)
  return useDb().insert(bogenvorlagen).values(b).returning().get()
})
