import { asc, eq } from 'drizzle-orm'
import { bogenvorlagen, etikettenformate } from '../../../db/schema'

export default defineEventHandler(() => useDb().select().from(bogenvorlagen)
  .innerJoin(etikettenformate, eq(bogenvorlagen.formatId, etikettenformate.id))
  .orderBy(asc(bogenvorlagen.id)).all()
  .map(r => ({ ...r.bogenvorlagen, format: r.etikettenformate })))
