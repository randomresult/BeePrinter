import { asc } from 'drizzle-orm'
import { themenwelten } from '../../../db/schema'

export default defineEventHandler(() => useDb().select().from(themenwelten).orderBy(asc(themenwelten.sortierung)).all())
