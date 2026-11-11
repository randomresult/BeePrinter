export type FehlerCode = 'nicht_gefunden' | 'ungueltig' | 'ueberlauf' | 'nicht_bezahlt' | 'konflikt'

/** Fachlicher Fehler; wird in server/utils/fehler.ts auf HTTP gemappt. */
export class FachFehler extends Error {
  constructor(public code: FehlerCode, message: string, public data?: Record<string, unknown>) {
    super(message)
  }
}
