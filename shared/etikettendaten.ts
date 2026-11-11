import { z } from 'zod'

/** Verkehrsbezeichnungen nach Honigverordnung (Auswahl) – „Sonstige“ erlaubt Freitext. */
export const HONIGSORTEN = [
  'Blütenhonig',
  'Waldhonig',
  'Honigtauhonig',
  'Rapshonig',
  'Akazienhonig',
  'Lindenhonig',
  'Kastanienhonig',
  'Heidehonig',
  'Tannenhonig',
  'Sonnenblumenhonig',
  'Kleehonig',
  'Buchweizenhonig',
  'Obstblütenhonig',
  'Cremiger Blütenhonig',
] as const

export const FUELLMENGEN = [30, 50, 125, 250, 500] as const

const pflicht = (name: string, max: number) =>
  z.string().trim().min(1, `${name} fehlt`).max(max, `${name}: höchstens ${max} Zeichen`)
const optional = (max: number) => z.string().trim().max(max, `Höchstens ${max} Zeichen`).default('')

/**
 * Plausibilität des Mindesthaltbarkeitsdatums.
 * Liefert eine Fehlermeldung oder null. `heute` als YYYY-MM-DD, damit testbar.
 */
export function pruefeMhd(mhd: string, heute: string): string | null {
  if (mhd <= heute) return 'MHD muss in der Zukunft liegen'
  const [j, m, t] = heute.split('-').map(Number)
  const grenze = `${j! + 3}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`
  if (mhd > grenze) return 'MHD liegt mehr als 3 Jahre in der Zukunft – Tippfehler?'
  return null
}

export const heuteIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })

export const etikettendatenSchema = z.object({
  honigsorte: pflicht('Honigsorte', 40),
  ursprung: pflicht('Ursprungsland', 40).default('Deutschland'),
  fuellmengeG: z.coerce.number().refine(v => (FUELLMENGEN as readonly number[]).includes(v), 'Füllmenge wählen'),
  mhd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'MHD fehlt'),
  los: pflicht('Losnummer', 20),
  imkerei: pflicht('Name der Imkerei', 60),
  strasse: pflicht('Straße', 60),
  plz: z.string().trim().regex(/^\d{4,5}$/, 'PLZ: 4 oder 5 Ziffern'),
  ort: pflicht('Ort', 40),
  kontakt: optional(60),
  lagerhinweis: optional(60),
  region: optional(40),
  anlass: optional(80),
}).superRefine((d, ctx) => {
  const fehler = pruefeMhd(d.mhd, heuteIso())
  if (fehler) ctx.addIssue({ code: 'custom', path: ['mhd'], message: fehler })
})

export type Etikettendaten = z.infer<typeof etikettendatenSchema>
export type EtikettendatenFeld = keyof Etikettendaten

/** Platzhalter, die in Slot-Texten erlaubt sind, mit ihrer Ausgabe. */
export const PLATZHALTER: Record<string, { label: string, wert: (d: Etikettendaten) => string, optional: boolean }> = {
  honigsorte: { label: 'Honigsorte', wert: d => d.honigsorte, optional: false },
  ursprung: { label: 'Ursprungsland', wert: d => d.ursprung, optional: false },
  fuellmenge: { label: 'Füllmenge', wert: d => (d.fuellmengeG ? `${d.fuellmengeG} g` : ""), optional: false },
  mhd: { label: 'MHD', wert: d => d.mhd.split('-').reverse().join('.'), optional: false },
  los: { label: 'Losnummer', wert: d => d.los, optional: false },
  imkerei: { label: 'Imkerei', wert: d => d.imkerei, optional: false },
  strasse: { label: 'Straße', wert: d => d.strasse, optional: false },
  plz: { label: 'PLZ', wert: d => d.plz, optional: false },
  ort: { label: 'Ort', wert: d => d.ort, optional: false },
  kontakt: { label: 'Website/Telefon', wert: d => d.kontakt, optional: true },
  lagerhinweis: { label: 'Lagerhinweis', wert: d => d.lagerhinweis, optional: true },
  region: { label: 'Regionalangabe', wert: d => d.region, optional: true },
  anlass: { label: 'Anlass-Text', wert: d => d.anlass, optional: true },
}

/** Pflichtangaben, die jedes veröffentlichte Design über Slots abdecken muss. */
export const PFLICHT_PLATZHALTER = Object.entries(PLATZHALTER).filter(([, p]) => !p.optional).map(([k]) => k)

const PLATZHALTER_RE = /\{(\w+)\}/g

export function platzhalterIn(text: string): string[] {
  return [...text.matchAll(PLATZHALTER_RE)].map(m => m[1]!)
}

/**
 * Setzt Etikettendaten in einen Slot-Text ein.
 * null = Slot entfällt (alle enthaltenen Platzhalter optional und leer).
 */
export function fuelleText(text: string, daten: Etikettendaten): string | null {
  const keys = platzhalterIn(text)
  if (keys.length && keys.every(k => PLATZHALTER[k]?.optional && !PLATZHALTER[k].wert(daten))) return null
  return text.replace(PLATZHALTER_RE, (_, k: string) => PLATZHALTER[k]?.wert(daten) ?? '').trim()
}

/** Beispieldaten für Admin-Vorschau und Galerie */
export const BEISPIELDATEN: Etikettendaten = {
  honigsorte: 'Blütenhonig',
  ursprung: 'Deutschland',
  fuellmengeG: 250,
  mhd: '2028-12-31',
  los: 'L-2406',
  imkerei: 'Imkerei Muster',
  strasse: 'Lindenweg 7',
  plz: '69245',
  ort: 'Bammental',
  kontakt: 'www.imkerei-muster.de',
  lagerhinweis: 'trocken, kühl und dunkel lagern',
  region: 'aus dem Elsenztal',
  anlass: 'Christine & Ralph · 12.06.2027',
}
