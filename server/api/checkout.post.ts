import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { etikettendatenSchema } from '../../shared/etikettendaten'
import { bestellungen } from '../db/schema'
import { erstelleBestellung } from '../services/bestellung'
import { designMitFormat } from '../services/etikett'

const body = z.object({
  slug: z.string(),
  bogenId: z.coerce.number().int(),
  daten: etikettendatenSchema,
  logoId: z.uuid().nullish(),
  email: z.email('Bitte gültige E-Mail-Adresse angeben').trim().toLowerCase(),
  angabenGeprueft: z.literal(true, 'Bitte bestätige, dass du die Angaben geprüft hast'),
  widerrufVerzicht: z.literal(true, 'Bitte stimme der sofortigen Bereitstellung zu'),
})

export default defineEventHandler(async (event) => {
  rateLimit(event, 'checkout', 10, 10 * 60_000)
  const b = await readValidatedBody(event, validate(body))
  const config = useRuntimeConfig()
  const stripe = useStripe()
  if (!stripe && !import.meta.dev) throw createError({ statusCode: 503, statusMessage: 'Zahlung ist nicht konfiguriert' })
  return fachlich(async () => {
    const db = useDb()
    const bestellung = await erstelleBestellung(db, useAblage(), ladeSchrift, {
      designSlug: b.slug, bogenId: b.bogenId, daten: b.daten, logoId: b.logoId ?? null, email: b.email,
    })
    const zurueck = `${config.public.siteUrl}/bestellung/${bestellung.token}`

    if (!stripe) {
      console.warn('[checkout] Kein NUXT_STRIPE_SECRET_KEY – Zahlung wird simuliert (nur Entwicklung)')
      await zahlungAbschliessen(bestellung.id)
      return { url: zurueck }
    }

    const { design } = designMitFormat(db, { id: bestellung.designId }, false)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: b.email,
      locale: 'de',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: bestellung.betragCent,
          product_data: { name: `Etiketten-PDF „${design.name}“`, description: `${b.daten.honigsorte}, ${b.daten.fuellmengeG} g, Los ${b.daten.los}` },
        },
      }],
      invoice_creation: { enabled: true },
      metadata: { bestellungId: String(bestellung.id), token: bestellung.token },
      success_url: `${zurueck}?bezahlt=1`,
      cancel_url: `${config.public.siteUrl}/design/${design.slug}?von=${bestellung.token}`,
    })
    db.update(bestellungen).set({ stripeSessionId: session.id }).where(eq(bestellungen.id, bestellung.id)).run()
    return { url: session.url! }
  })
})
