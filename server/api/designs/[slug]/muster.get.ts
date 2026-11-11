import { BEISPIELDATEN } from '../../../../shared/etikettendaten'
import { designMitFormat, rendere } from '../../../services/etikett'

/** Musteretikett mit Beispieldaten für die Galerie (mit Wasserzeichen) */
export default defineEventHandler(event => fachlich(async () => {
  const { design, format } = designMitFormat(useDb(), { slug: getRouterParam(event, 'slug')! }, true)
  const { pdf } = await rendere({ format, slots: design.slots, hintergrund: design.hintergrund, daten: BEISPIELDATEN, bogen: null, wasserzeichen: true }, useAblage(), ladeSchrift)
  return pdfAntwort(event, pdf, `${design.slug}-muster.pdf`)
}))
