import { desc, eq } from 'drizzle-orm'
import { bestellungen, designs } from '../../db/schema'

export default defineEventHandler(() => useDb().select({
  id: bestellungen.id, token: bestellungen.token, email: bestellungen.email, status: bestellungen.status,
  betragCent: bestellungen.betragCent, erstelltAm: bestellungen.erstelltAm, bezahltAm: bestellungen.bezahltAm,
  daten: bestellungen.daten, design: designs.name,
}).from(bestellungen).innerJoin(designs, eq(bestellungen.designId, designs.id)).orderBy(desc(bestellungen.id)).limit(500).all())
