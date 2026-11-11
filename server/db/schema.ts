import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Slot, Kontur } from '../../shared/render/types'
import type { Etikettendaten } from '../../shared/etikettendaten'

const zeitstempel = (name: string) => integer(name, { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)

export const themenwelten = sqliteTable('themenwelten', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  sortierung: integer('sortierung').notNull().default(0),
})

export const etikettenformate = sqliteTable('etikettenformate', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  breiteMm: real('breite_mm').notNull(),
  hoeheMm: real('hoehe_mm').notNull(),
  kontur: text('kontur').$type<Kontur>().notNull().default('rechteck'),
  eckenradiusMm: real('eckenradius_mm').notNull().default(0),
})

export const bogenvorlagen = sqliteTable('bogenvorlagen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  formatId: integer('format_id').notNull().references(() => etikettenformate.id),
  hersteller: text('hersteller').notNull(),
  artikelnr: text('artikelnr').notNull(),
  name: text('name').notNull(),
  seiteBreiteMm: real('seite_breite_mm').notNull().default(210),
  seiteHoeheMm: real('seite_hoehe_mm').notNull().default(297),
  spalten: integer('spalten').notNull(),
  zeilen: integer('zeilen').notNull(),
  randObenMm: real('rand_oben_mm').notNull(),
  randLinksMm: real('rand_links_mm').notNull(),
  abstandXMm: real('abstand_x_mm').notNull().default(0),
  abstandYMm: real('abstand_y_mm').notNull().default(0),
  aktiv: integer('aktiv', { mode: 'boolean' }).notNull().default(true),
})

export const designs = sqliteTable('designs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  beschreibung: text('beschreibung').notNull().default(''),
  themenweltId: integer('themenwelt_id').notNull().references(() => themenwelten.id),
  formatId: integer('format_id').notNull().references(() => etikettenformate.id),
  /** Dateiname der Hintergrund-PDF im Dateien-Ordner (Unterordner hintergruende/) */
  hintergrund: text('hintergrund'),
  slots: text('slots', { mode: 'json' }).$type<Slot[]>().notNull().default(sql`'[]'`),
  preisCent: integer('preis_cent').notNull().default(490),
  veroeffentlicht: integer('veroeffentlicht', { mode: 'boolean' }).notNull().default(false),
  sortierung: integer('sortierung').notNull().default(0),
  erstelltAm: zeitstempel('erstellt_am'),
})

export type BestellStatus = 'offen' | 'bezahlt'

export const bestellungen = sqliteTable('bestellungen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  designId: integer('design_id').notNull().references(() => designs.id),
  bogenId: integer('bogen_id').notNull().references(() => bogenvorlagen.id),
  daten: text('daten', { mode: 'json' }).$type<Etikettendaten>().notNull(),
  logoId: text('logo_id'),
  status: text('status').$type<BestellStatus>().notNull().default('offen'),
  betragCent: integer('betrag_cent').notNull(),
  /** Druck-PDF wird beim Checkout erzeugt und eingefroren (ADR 0003) */
  pdfDatei: text('pdf_datei').notNull(),
  stripeSessionId: text('stripe_session_id'),
  erstelltAm: zeitstempel('erstellt_am'),
  bezahltAm: integer('bezahlt_am', { mode: 'timestamp' }),
})
