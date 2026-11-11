import { eq } from 'drizzle-orm'
import { etikettenformate } from '../db/schema'
import { rasterFehler } from '../../shared/render/raster'
import type { Bogenvorlage } from '../../shared/render/types'

export function pruefeRaster(b: Bogenvorlage & { formatId: number }) {
  const format = useDb().select().from(etikettenformate).where(eq(etikettenformate.id, b.formatId)).get()
  if (!format) throw createError({ statusCode: 422, statusMessage: 'Etikettenformat unbekannt' })
  const fehler = rasterFehler(b, format)
  if (fehler) throw createError({ statusCode: 422, statusMessage: fehler })
}
