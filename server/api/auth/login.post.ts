import { z } from 'zod'

const loginSchema = z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1) })

export default defineEventHandler(async (event) => {
  rateLimit(event, 'login', 8, 15 * 60 * 1000)
  rateLimitGlobal('login', 60, 15 * 60 * 1000)
  const { email, password } = await readValidatedBody(event, validate(loginSchema))
  const config = useRuntimeConfig()
  if (!config.adminEmail || !config.adminPasswordHash) {
    throw createError({ statusCode: 500, statusMessage: 'Admin-Zugang ist nicht konfiguriert (NUXT_ADMIN_EMAIL / NUXT_ADMIN_PASSWORD_HASH).' })
  }
  const ok = email === config.adminEmail.toLowerCase() && await verifyPassword(config.adminPasswordHash, password)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'E-Mail oder Passwort falsch' })
  await setUserSession(event, { user: { email: config.adminEmail, role: 'admin' }, loggedInAt: Date.now() })
  return { ok: true }
})
