import { asc, eq, sql } from 'drizzle-orm'
import { bestellungen, designs, etikettenformate, themenwelten } from '../../../db/schema'

export default defineEventHandler(() => useDb().select({
  id: designs.id, slug: designs.slug, name: designs.name, preisCent: designs.preisCent, veroeffentlicht: designs.veroeffentlicht,
  hatHintergrund: sql<boolean>`${designs.hintergrund} is not null`, themenwelt: themenwelten.name, format: etikettenformate.name,
  verkauft: sql<number>`(select count(*) from ${bestellungen} where ${bestellungen.designId} = ${designs.id} and ${bestellungen.status} = 'bezahlt')`,
}).from(designs)
  .innerJoin(themenwelten, eq(designs.themenweltId, themenwelten.id))
  .innerJoin(etikettenformate, eq(designs.formatId, etikettenformate.id))
  .orderBy(asc(themenwelten.sortierung), asc(designs.sortierung)).all())
