import { openDb, migrateDb } from '../server/db/client'

const path = process.env.NUXT_DATABASE_PATH || '.data/db.sqlite'
migrateDb(openDb(path))
console.log(`Migriert: ${path}`)
