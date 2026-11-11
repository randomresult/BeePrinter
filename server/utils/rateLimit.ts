import type { H3Event } from 'h3'

const buckets = new Map<string, number[]>()

/**
 * Client-IP für das Rate-Limit. `X-Forwarded-For` ist vom Client frei setzbar und wird nur
 * ausgewertet, wenn NUXT_TRUST_PROXY=true (App läuft hinter genau einem Reverse-Proxy).
 * Dann zählt der letzte Eintrag – den hat der eigene Proxy angehängt, nicht der Client.
 */
function clientIp(event: H3Event): string {
  if (useRuntimeConfig().trustProxy) {
    const forwarded = getRequestHeader(event, 'x-forwarded-for')?.split(',').map(s => s.trim()).filter(Boolean)
    if (forwarded?.length) return forwarded.at(-1)!
  }
  return getRequestIP(event) ?? 'unknown'
}

function hit(id: string, max: number, windowMs: number) {
  const now = Date.now()
  const hits = (buckets.get(id) ?? []).filter(t => now - t < windowMs)
  if (hits.length >= max) {
    throw createError({ statusCode: 429, statusMessage: 'Zu viele Anfragen – bitte kurz warten.' })
  }
  hits.push(now)
  buckets.set(id, hits)
}

/** Simples In-Memory-Sliding-Window pro IP (reicht für eine Einzelinstanz, ADR 0001). */
export function rateLimit(event: H3Event, key: string, max: number, windowMs: number) {
  hit(`${key}:${clientIp(event)}`, max, windowMs)
}

/** Obergrenze über alle IPs hinweg, z. B. gegen verteiltes Passwort-Raten. */
export function rateLimitGlobal(key: string, max: number, windowMs: number) {
  hit(`${key}:*`, max, windowMs)
}
