import type { Transporter } from 'nodemailer'

export interface MailKontext {
  transport: Transporter
  from: string
  baseUrl: string
}

const euro = (cent: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cent / 100)
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export interface BestellMailDaten {
  email: string
  token: string
  designName: string
  designSlug: string
  honigsorte: string
  los: string
  betragCent: number
  bogenName: string
}

export async function sendeDownloadMail(ctx: MailKontext, b: BestellMailDaten) {
  const download = `${ctx.baseUrl}/bestellung/${b.token}`
  const nochmal = `${ctx.baseUrl}/design/${b.designSlug}?von=${b.token}`
  const text = [
    'Hallo,',
    '',
    `vielen Dank für deine Bestellung „${b.designName}“ (${b.honigsorte}, Los ${b.los}) über ${euro(b.betragCent)}.`,
    '',
    'Dein druckfertiges PDF kannst du hier jederzeit wieder herunterladen:',
    download,
    '',
    `Drucke es auf ${b.bogenName}. Wichtig: im Druckdialog „Tatsächliche Größe“ bzw. 100 % wählen, nicht „An Seite anpassen“.`,
    '',
    'Neue Charge, neue Losnummer? Hier ist das Formular schon mit deinen Angaben ausgefüllt:',
    nochmal,
    '',
    'Viel Freude mit deinen Etiketten!',
  ].join('\n')
  const html = `<p>Hallo,</p>
<p>vielen Dank für deine Bestellung <strong>„${esc(b.designName)}“</strong> (${esc(b.honigsorte)}, Los ${esc(b.los)}) über ${euro(b.betragCent)}.</p>
<p><a href="${download}" style="display:inline-block;padding:10px 18px;background:#1f1a0e;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold">PDF herunterladen</a></p>
<p>Drucke es auf <strong>${esc(b.bogenName)}</strong>. Wichtig: im Druckdialog „Tatsächliche Größe“ bzw. 100&nbsp;% wählen, nicht „An Seite anpassen“.</p>
<p>Neue Charge, neue Losnummer? <a href="${nochmal}">Formular mit deinen Angaben öffnen</a></p>
<p>Viel Freude mit deinen Etiketten!</p>`
  await ctx.transport.sendMail({ from: ctx.from, to: b.email, subject: `Deine Honigetiketten „${b.designName}“`, text, html })
}
