import { openDb, migrateDb } from '../server/db/client'
import { dateiAblage } from '../server/services/ablage'
import { beispieleAnlegen } from '../server/services/beispiele'

const db = openDb(process.env.NUXT_DATABASE_PATH || '.data/db.sqlite')
migrateDb(db)
const r = await beispieleAnlegen(db, dateiAblage(process.env.NUXT_DATEIEN_DIR || '.data/dateien'))
console.log(r.angelegt ? 'Beispieldaten angelegt' : 'DB enthält schon Designs – nichts geändert')
