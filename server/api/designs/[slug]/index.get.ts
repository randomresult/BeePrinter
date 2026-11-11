import { platzhalterIn } from '../../../../shared/etikettendaten'
import { bogenFuerFormat, designMitFormat } from '../../../services/etikett'

export default defineEventHandler(event => fachlich(() => {
  const db = useDb()
  const { design, format, themenwelt } = designMitFormat(db, { slug: getRouterParam(event, 'slug')! }, true)
  const felder = [...new Set(design.slots.flatMap(s => (s.typ === 'text' ? platzhalterIn(s.text) : [])))]
  return {
    slug: design.slug,
    name: design.name,
    beschreibung: design.beschreibung,
    preisCent: design.preisCent,
    themenwelt: themenwelt.name,
    format: { name: format.name, breiteMm: format.breiteMm, hoeheMm: format.hoeheMm },
    felder,
    hatLogo: design.slots.some(s => s.typ === 'logo'),
    boegen: bogenFuerFormat(db, format.id).map(b => ({ id: b.id, name: `${b.hersteller} ${b.artikelnr}`, beschreibung: b.name, anzahl: b.spalten * b.zeilen })),
  }
}))
