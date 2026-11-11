import type { Db } from '../db/client'
import { bogenvorlagen, designs, etikettenformate, themenwelten } from '../db/schema'
import { AVERY_KATALOG } from '../data/avery-katalog'
import { BEISPIEL_DESIGNS, erzeugeHintergrund } from '../data/beispiel-designs'
import type { Ablage } from './ablage'

/** Legt Themenwelten, Format 96 × 50,8, Bogen L4744REV und die Beispiel-Designs an. Nur auf leerer DB. */
export async function beispieleAnlegen(db: Db, ablage: Ablage) {
  if (db.select().from(designs).limit(1).get()) return { angelegt: false }

  const tw = Object.fromEntries(
    [
      { slug: 'standard', name: 'Standard', sortierung: 1 },
      { slug: 'saison', name: 'Saison', sortierung: 2 },
      { slug: 'geschenk', name: 'Geschenkeditionen', sortierung: 3 },
    ].map(t => [t.slug, db.insert(themenwelten).values(t).returning().get().id]),
  )

  const k = AVERY_KATALOG.find(e => e.artikelnr === 'L4744REV')!
  const format = db.insert(etikettenformate).values({ name: '96 × 50,8 mm', ...k.format }).returning().get()
  const { format: _f, geprueft: _g, ...bogen } = k
  db.insert(bogenvorlagen).values({ ...bogen, formatId: format.id }).run()

  let sortierung = 0
  for (const d of BEISPIEL_DESIGNS) {
    const hintergrund = await ablage.speichern('hintergruende', await erzeugeHintergrund(d.zeichne), 'pdf')
    db.insert(designs).values({
      slug: d.slug, name: d.name, beschreibung: d.beschreibung, themenweltId: tw[d.themenwelt]!, formatId: format.id,
      hintergrund, slots: d.slots, preisCent: d.preisCent, veroeffentlicht: true, sortierung: ++sortierung,
    }).run()
  }
  return { angelegt: true }
}
