import { z } from 'zod'
import { etikettendatenSchema, type Etikettendaten } from '../../shared/etikettendaten'
import { designMitFormat, rendere } from '../services/etikett'

const LEER: Etikettendaten = {
  honigsorte: '', ursprung: '', fuellmengeG: 0, mhd: '', los: '', imkerei: '', strasse: '', plz: '', ort: '',
  kontakt: '', lagerhinweis: '', region: '', anlass: '',
}

const body = z.object({
  slug: z.string(),
  daten: z.record(z.string(), z.union([z.string().max(200), z.number()])).default({}),
  logoId: z.uuid().nullish(),
})

/**
 * Vorschau eines Etiketts mit Wasserzeichen. Rendert auch unvollständige Angaben,
 * meldet aber Validierungsfehler und Überlauf zurück – Kaufen geht erst ohne beides.
 */
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vorschau', 120, 60_000)
  const b = await readValidatedBody(event, validate(body))
  return fachlich(async () => {
    const { design, format } = designMitFormat(useDb(), { slug: b.slug }, true)
    const pruefung = etikettendatenSchema.safeParse(b.daten)
    const daten = pruefung.success ? pruefung.data : { ...LEER, ...b.daten } as Etikettendaten
    if (!pruefung.success && (daten.mhd === '' || !/^\d{4}-\d{2}-\d{2}$/.test(daten.mhd))) daten.mhd = ''
    const { pdf, ueberlauf } = await rendere({
      format, slots: design.slots, hintergrund: design.hintergrund, daten, logoId: b.logoId, bogen: null, wasserzeichen: true, kontur: true,
    }, useAblage(), ladeSchrift)
    return {
      pdf: Buffer.from(pdf).toString('base64'),
      ueberlauf: [...new Set(ueberlauf.flatMap(u => u.felder))],
      fehler: pruefung.success ? {} : z.flattenError(pruefung.error).fieldErrors,
    }
  })
})
