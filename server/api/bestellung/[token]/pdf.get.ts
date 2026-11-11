import { druckPdf } from '../../../services/bestellung'

export default defineEventHandler(event => fachlich(async () => {
  rateLimit(event, 'download', 30, 60_000)
  const { bestellung, pdf } = await druckPdf(useDb(), useAblage(), getRouterParam(event, 'token')!)
  const name = `Honigetiketten-${bestellung.daten.honigsorte}-${bestellung.daten.los}`.replace(/[^\w\-äöüÄÖÜß]+/g, '-')
  return pdfAntwort(event, pdf, `${name}.pdf`, getQuery(event).download === '1')
}))
