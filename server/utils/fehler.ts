import { z } from 'zod'
import { FachFehler, type FehlerCode } from '../services/fehler'

const STATUS: Record<FehlerCode, number> = {
  nicht_gefunden: 404,
  ungueltig: 422,
  ueberlauf: 422,
  nicht_bezahlt: 402,
  konflikt: 409,
}

export function alsHttpFehler(err: unknown) {
  if (err instanceof FachFehler) {
    return createError({ statusCode: STATUS[err.code], statusMessage: err.message, data: { code: err.code, ...err.data } })
  }
  return err
}

/** Führt fn aus und wandelt FachFehler in HTTP-Fehler */
export async function fachlich<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return await fn()
  }
  catch (err) {
    throw alsHttpFehler(err)
  }
}

export function validate<T extends z.ZodType>(schema: T) {
  return (body: unknown): z.infer<T> => {
    const res = schema.safeParse(body)
    if (!res.success) {
      throw createError({ statusCode: 422, statusMessage: 'Eingaben prüfen', data: { issues: z.flattenError(res.error).fieldErrors } })
    }
    return res.data
  }
}
