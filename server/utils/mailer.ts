import nodemailer, { type Transporter } from 'nodemailer'
import { eq } from 'drizzle-orm'
import { bogenvorlagen, designs, type bestellungen } from '../db/schema'
import { sendeDownloadMail, type MailKontext } from '../services/mail'

let transport: Transporter | undefined

export function useMailKontext(): MailKontext {
  const config = useRuntimeConfig()
  if (!transport) {
    const { host, port, secure, user, pass } = config.smtp
    transport = nodemailer.createTransport({
      host, port: Number(port), secure: String(secure) === 'true', auth: user ? { user, pass } : undefined,
    })
  }
  return { transport, from: config.mailFrom, baseUrl: config.public.siteUrl }
}

/** Mailfehler dürfen eine bezahlte Bestellung nie scheitern lassen – nur loggen. */
export async function sendeDownloadMailSicher(b: typeof bestellungen.$inferSelect) {
  try {
    const db = useDb()
    const design = db.select().from(designs).where(eq(designs.id, b.designId)).get()!
    const bogen = db.select().from(bogenvorlagen).where(eq(bogenvorlagen.id, b.bogenId)).get()!
    await sendeDownloadMail(useMailKontext(), {
      email: b.email, token: b.token, designName: design.name, designSlug: design.slug,
      honigsorte: b.daten.honigsorte, los: b.daten.los, betragCent: b.betragCent,
      bogenName: `${bogen.hersteller} ${bogen.artikelnr}`,
    })
  }
  catch (err) {
    console.error('[mail] Download-Mail fehlgeschlagen:', err)
  }
}
