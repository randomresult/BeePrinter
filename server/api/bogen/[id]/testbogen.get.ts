import { eq } from 'drizzle-orm'
import { bogenvorlagen, etikettenformate } from '../../../db/schema'
import { BEISPIELDATEN } from '../../../../shared/etikettendaten'
import { rendere } from '../../../services/etikett'

/** Kostenloser Testbogen: nur Etikettkonturen – auf Normalpapier drucken und gegen den Etikettenbogen halten. */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const row = useDb().select().from(bogenvorlagen)
    .innerJoin(etikettenformate, eq(bogenvorlagen.formatId, etikettenformate.id))
    .where(eq(bogenvorlagen.id, id)).get()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Bogen nicht gefunden' })
  const { pdf } = await rendere({
    format: row.etikettenformate, slots: [], hintergrund: null, daten: BEISPIELDATEN, bogen: row.bogenvorlagen, wasserzeichen: false, kontur: true,
  }, useAblage(), ladeSchrift)
  return pdfAntwort(event, pdf, `Testbogen-${row.bogenvorlagen.artikelnr}.pdf`)
})
