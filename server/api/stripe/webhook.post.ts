import { eq } from 'drizzle-orm'
import { bestellungen } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const stripe = useStripe()
  const secret = useRuntimeConfig().stripeWebhookSecret
  if (!stripe || !secret) throw createError({ statusCode: 503, statusMessage: 'Stripe nicht konfiguriert' })
  const roh = await readRawBody(event, false)
  const signatur = getRequestHeader(event, 'stripe-signature')
  if (!roh || !signatur) throw createError({ statusCode: 400, statusMessage: 'Signatur fehlt' })

  let ereignis
  try {
    ereignis = stripe.webhooks.constructEvent(roh, signatur, secret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Signatur' })
  }

  if (ereignis.type === 'checkout.session.completed' || ereignis.type === 'checkout.session.async_payment_succeeded') {
    const session = ereignis.data.object
    if (session.payment_status === 'paid') {
      const id = Number(session.metadata?.bestellungId)
      const b = useDb().select().from(bestellungen).where(eq(bestellungen.id, id)).get()
      if (b && b.stripeSessionId === session.id) await zahlungAbschliessen(b.id)
    }
  }
  return { ok: true }
})
