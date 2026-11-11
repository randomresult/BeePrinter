import { asc, eq } from 'drizzle-orm'
import { designs, etikettenformate, themenwelten } from '../../db/schema'

export default defineEventHandler(() => {
  const rows = useDb().select({
    slug: designs.slug, name: designs.name, beschreibung: designs.beschreibung, preisCent: designs.preisCent,
    themenwelt: { slug: themenwelten.slug, name: themenwelten.name, sortierung: themenwelten.sortierung },
    format: etikettenformate.name,
  }).from(designs)
    .innerJoin(themenwelten, eq(designs.themenweltId, themenwelten.id))
    .innerJoin(etikettenformate, eq(designs.formatId, etikettenformate.id))
    .where(eq(designs.veroeffentlicht, true))
    .orderBy(asc(themenwelten.sortierung), asc(designs.sortierung))
    .all()
  return rows
})
