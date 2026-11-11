import { dateiAblage, type Ablage } from '../services/ablage'
import { SCHRIFTEN, type SchriftKey } from '../../shared/render/schriften'

let ablage: Ablage | undefined
export function useAblage(): Ablage {
  ablage ??= dateiAblage(useRuntimeConfig().dateienDir)
  return ablage
}

const cache = new Map<string, Uint8Array>()

/** Schriften liegen als Nitro-Server-Assets in server/assets/fonts (auch im Build enthalten). */
export async function ladeSchrift(key: string): Promise<Uint8Array> {
  const hit = cache.get(key)
  if (hit) return hit
  const def = SCHRIFTEN[key as SchriftKey]
  if (!def) throw createError({ statusCode: 500, statusMessage: `Unbekannte Schrift: ${key}` })
  const raw = await useStorage('assets:server').getItemRaw<Uint8Array | Buffer>(`fonts/${def.datei}`)
  if (!raw) throw createError({ statusCode: 500, statusMessage: `Schriftdatei fehlt: ${def.datei}` })
  const bytes = new Uint8Array(raw)
  cache.set(key, bytes)
  return bytes
}

export function pdfAntwort(event: Parameters<typeof setResponseHeaders>[0], pdf: Uint8Array, dateiname: string, download = false) {
  setResponseHeaders(event, {
    'content-type': 'application/pdf',
    'content-disposition': `${download ? 'attachment' : 'inline'}; filename="${dateiname.normalize('NFKD').replace(/[^\x20-\x7e]/g, '')}"; filename*=UTF-8''${encodeURIComponent(dateiname)}`,
    'cache-control': 'private, no-store',
  })
  return Buffer.from(pdf)
}
