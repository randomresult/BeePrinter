import { eq } from 'drizzle-orm'
import { PDFDocument } from 'pdf-lib'
import { designs, etikettenformate } from '../../../../db/schema'

/** Hintergrund-PDF hochladen: genau 1 Seite, Seitengröße = Etikettformat (±1 mm) */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()
  const row = db.select().from(designs).innerJoin(etikettenformate, eq(designs.formatId, etikettenformate.id)).where(eq(designs.id, id)).get()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Design nicht gefunden' })
  const datei = (await readMultipartFormData(event))?.find(t => t.name === 'hintergrund' && t.data?.length)
  if (!datei) throw createError({ statusCode: 422, statusMessage: 'Keine Datei empfangen' })

  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(datei.data)
  }
  catch {
    throw createError({ statusCode: 422, statusMessage: 'Datei ist kein lesbares PDF' })
  }
  if (doc.getPageCount() !== 1) throw createError({ statusCode: 422, statusMessage: 'Das PDF muss genau eine Seite haben' })
  if (doc.getForm().getFields().length) throw createError({ statusCode: 422, statusMessage: 'Das PDF enthält Formularfelder – bitte flach exportieren' })
  const { width, height } = doc.getPage(0).getSize()
  const mm = (pt: number) => (pt * 25.4) / 72
  const f = row.etikettenformate
  if (Math.abs(mm(width) - f.breiteMm) > 1 || Math.abs(mm(height) - f.hoeheMm) > 1) {
    throw createError({ statusCode: 422, statusMessage: `Seitengröße ${mm(width).toFixed(1)} × ${mm(height).toFixed(1)} mm passt nicht zum Format ${f.breiteMm} × ${f.hoeheMm} mm` })
  }
  const name = await useAblage().speichern('hintergruende', new Uint8Array(datei.data), 'pdf')
  db.update(designs).set({ hintergrund: name }).where(eq(designs.id, id)).run()
  return { ok: true }
})
