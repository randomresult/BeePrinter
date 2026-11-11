import { logoSchwarzWeiss } from '../services/logo'

export default defineEventHandler(async (event) => {
  rateLimit(event, 'logo', 20, 10 * 60_000)
  const teile = await readMultipartFormData(event)
  const datei = teile?.find(t => t.name === 'logo' && t.data?.length)
  if (!datei) throw createError({ statusCode: 422, statusMessage: 'Keine Datei empfangen' })
  return fachlich(async () => {
    const png = await logoSchwarzWeiss(new Uint8Array(datei.data))
    const name = await useAblage().speichern('logos', png, 'png')
    return { logoId: name.replace(/\.png$/, ''), vorschau: `data:image/png;base64,${Buffer.from(png).toString('base64')}` }
  })
})
