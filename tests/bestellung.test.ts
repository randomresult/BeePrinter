import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { dateiAblage, type Ablage } from '../server/services/ablage'
import { beispieleAnlegen } from '../server/services/beispiele'
import { druckPdf, erstelleBestellung, markiereBezahlt } from '../server/services/bestellung'
import { bogenFuerFormat, designMitFormat } from '../server/services/etikett'
import { FachFehler } from '../server/services/fehler'
import { BEISPIELDATEN } from '../shared/etikettendaten'
import type { Db } from '../server/db/client'
import { schriften, setupDb } from './helpers'

const lade = async (k: string) => schriften[k]!

let db: Db
let ablage: Ablage
let bogenId: number

beforeEach(async () => {
  db = setupDb()
  ablage = dateiAblage(mkdtempSync(join(tmpdir(), 'wabengut-')))
  await beispieleAnlegen(db, ablage)
  const { format } = designMitFormat(db, { slug: 'waldhonig' }, true)
  bogenId = bogenFuerFormat(db, format.id)[0]!.id
})

const neu = (over: Partial<Parameters<typeof erstelleBestellung>[3]> = {}) =>
  erstelleBestellung(db, ablage, lade, { designSlug: 'waldhonig', bogenId, daten: BEISPIELDATEN, logoId: null, email: 'imker@example.org', ...over })

describe('Bestellung', () => {
  it('friert Druck-PDF ein und gibt es erst nach Zahlung heraus', async () => {
    const b = await neu()
    expect(b.status).toBe('offen')
    expect(b.betragCent).toBe(490)
    await expect(druckPdf(db, ablage, b.token)).rejects.toThrow(FachFehler)

    expect(markiereBezahlt(db, b.id)).toBe(true)
    expect(markiereBezahlt(db, b.id)).toBe(false) // Webhook doppelt → keine zweite Mail
    const { pdf } = await druckPdf(db, ablage, b.token)
    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(1)
  })

  it('lehnt zu lange Angaben mit Feldnamen ab', async () => {
    const err = await neu({ daten: { ...BEISPIELDATEN, strasse: 'Hauptstraße 123a, Hinterhaus links, 3. Etage' } }).catch(e => e)
    expect(err).toBeInstanceOf(FachFehler)
    expect(err.code).toBe('ueberlauf')
    expect(err.data.felder).toContain('strasse')
  })

  it('lehnt unbekanntes oder unveröffentlichtes Design ab', async () => {
    await expect(neu({ designSlug: 'gibtsnicht' })).rejects.toThrow('Design nicht gefunden')
  })

  it('lehnt Bogen eines anderen Formats ab', async () => {
    await expect(neu({ bogenId: 999 })).rejects.toThrow(/bogen passt nicht/)
  })
})
