export const euro = (cent: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cent / 100)

export const datum = (d: Date | string | number) =>
  new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))

export const datumZeit = (d: Date | string | number) =>
  new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d))

/** Fehlermeldung aus $fetch-Fehlern */
export const apiFehler = (err: unknown) => {
  const e = err as { data?: { statusMessage?: string, message?: string }, statusMessage?: string }
  return e?.data?.statusMessage || e?.statusMessage || e?.data?.message || 'Unbekannter Fehler'
}

export const feldFehler = (err: unknown): Record<string, string[]> =>
  (err as { data?: { data?: { issues?: Record<string, string[]> } } })?.data?.data?.issues ?? {}

export const PAPIERE = [
  { key: 'orange', name: 'Orange' },
  { key: 'gelb', name: 'Gelb' },
  { key: 'blau', name: 'Blau' },
  { key: 'gruen', name: 'Grün' },
  { key: 'kraft', name: 'Kraftpapier' },
  { key: 'weiss', name: 'Weiß' },
] as const
export type Papier = typeof PAPIERE[number]['key']
