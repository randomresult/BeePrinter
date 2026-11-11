import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { bestellungen } from '../db/schema'
import { markiereBezahlt } from '../services/bestellung'

let stripe: Stripe | undefined | null

/** null = kein Schlüssel konfiguriert (nur in Entwicklung: Zahlung wird simuliert) */
export function useStripe(): Stripe | null {
  if (stripe === undefined) {
    const key = useRuntimeConfig().stripeSecretKey
    stripe = key ? new Stripe(key) : null
  }
  return stripe
}

/** Zahlung bestätigt → bezahlt markieren und nur beim ersten Übergang die Mail senden */
export async function zahlungAbschliessen(bestellungId: number) {
  const db = useDb()
  if (!markiereBezahlt(db, bestellungId)) return false
  const b = db.select().from(bestellungen).where(eq(bestellungen.id, bestellungId)).get()!
  await sendeDownloadMailSicher(b)
  return true
}

/** Fallback, falls der Webhook (noch) nicht ankam: Session direkt bei Stripe prüfen */
export async function stripeStatusPruefen(b: typeof bestellungen.$inferSelect) {
  const s = useStripe()
  if (!s || b.status !== 'offen' || !b.stripeSessionId) return
  const session = await s.checkout.sessions.retrieve(b.stripeSessionId)
  if (session.payment_status === 'paid' && session.metadata?.bestellungId === String(b.id)) {
    await zahlungAbschliessen(b.id)
  }
}
