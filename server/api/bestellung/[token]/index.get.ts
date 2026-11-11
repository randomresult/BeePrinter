import { eq } from 'drizzle-orm'
import { bogenvorlagen, designs } from '../../../db/schema'
import { bestellungPerToken } from '../../../services/bestellung'

export default defineEventHandler(event => fachlich(async () => {
  rateLimit(event, 'bestellung', 60, 60_000)
  const db = useDb()
  let b = bestellungPerToken(db, getRouterParam(event, 'token')!)
  if (b.status === 'offen') {
    await stripeStatusPruefen(b).catch(err => console.error('[stripe] Statusprüfung', err))
    b = bestellungPerToken(db, b.token)
  }
  const design = db.select().from(designs).where(eq(designs.id, b.designId)).get()!
  const bogen = db.select().from(bogenvorlagen).where(eq(bogenvorlagen.id, b.bogenId)).get()!
  return {
    status: b.status,
    betragCent: b.betragCent,
    erstelltAm: b.erstelltAm,
    bezahltAm: b.bezahltAm,
    daten: b.daten,
    logoId: b.logoId,
    bogenId: b.bogenId,
    design: { slug: design.slug, name: design.name },
    bogen: `${bogen.hersteller} ${bogen.artikelnr}`,
  }
}))
