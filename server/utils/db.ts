import { resolve } from 'node:path'
import { openDb, migrateDb, type Db } from '../db/client'

let db: Db | undefined

export function useDb(): Db {
  if (!db) {
    const config = useRuntimeConfig()
    db = openDb(resolve(process.cwd(), config.databasePath))
    migrateDb(db, resolve(process.cwd(), config.migrationsDir))
  }
  return db
}
