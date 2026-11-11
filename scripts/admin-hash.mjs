// Erzeugt den Passwort-Hash für NUXT_ADMIN_PASSWORD_HASH (gleiches Verfahren wie nuxt-auth-utils)
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

const password = process.argv[2]
if (!password || password.length < 10) {
  console.error('Aufruf: npm run admin:hash -- \'mindestens-10-Zeichen\'')
  process.exit(1)
}
const hash = await new Hash(new Scrypt({})).make(password)
console.log(`NUXT_ADMIN_PASSWORD_HASH='${hash}'`)
