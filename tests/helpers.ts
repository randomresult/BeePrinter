import { readFileSync } from 'node:fs'
import { SCHRIFTEN } from '../shared/render/schriften'
import { openDb, migrateDb, type Db } from '../server/db/client'

export const schriften = Object.fromEntries(
  Object.entries(SCHRIFTEN).map(([k, v]) => [k, new Uint8Array(readFileSync(`server/assets/fonts/${v.datei}`))]),
)

export function setupDb(): Db {
  const db = openDb(':memory:')
  migrateDb(db)
  return db
}
