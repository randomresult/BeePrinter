import { asc } from 'drizzle-orm'
import { etikettenformate } from '../../../db/schema'

export default defineEventHandler(() => useDb().select().from(etikettenformate).orderBy(asc(etikettenformate.id)).all())
