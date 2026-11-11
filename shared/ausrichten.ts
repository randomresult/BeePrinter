/**
 * Ausrichten & Verteilen von Slots im Editor (Vorbild: Hallenplan-Editor der flohmarkt-app).
 * Slot-Rechtecke sind schon die sichtbare Box – Drehung passiert innerhalb der Box, kein Tausch nötig.
 */
export interface Box { xMm: number, yMm: number, bMm: number, hMm: number }

export type AusrichtModus = 'links' | 'hmitte' | 'rechts' | 'oben' | 'vmitte' | 'unten'

/** Auf 0,5 mm runden – gleiches Raster wie Ziehen und Pfeiltasten */
export const runden = (v: number) => Math.round(v * 2) / 2

/**
 * Neue Positionen beim Ausrichten. Bezug ist der Rahmen um die ganze Auswahl (wie Figma/PowerPoint);
 * bei nur einem Slot ist der Bezug das Etikett selbst – so lässt sich ein Slot aufs Etikett zentrieren.
 */
export function ausrichten(boxen: Box[], modus: AusrichtModus, etikett: { bMm: number, hMm: number }): { xMm: number, yMm: number }[] {
  const rahmen = boxen.length === 1
    ? { x0: 0, y0: 0, x1: etikett.bMm, y1: etikett.hMm }
    : {
        x0: Math.min(...boxen.map(b => b.xMm)),
        y0: Math.min(...boxen.map(b => b.yMm)),
        x1: Math.max(...boxen.map(b => b.xMm + b.bMm)),
        y1: Math.max(...boxen.map(b => b.yMm + b.hMm)),
      }
  return boxen.map((b) => {
    let { xMm, yMm } = b
    if (modus === 'links') xMm = rahmen.x0
    if (modus === 'rechts') xMm = rahmen.x1 - b.bMm
    if (modus === 'hmitte') xMm = runden((rahmen.x0 + rahmen.x1 - b.bMm) / 2)
    if (modus === 'oben') yMm = rahmen.y0
    if (modus === 'unten') yMm = rahmen.y1 - b.hMm
    if (modus === 'vmitte') yMm = runden((rahmen.y0 + rahmen.y1 - b.hMm) / 2)
    return { xMm, yMm }
  })
}

/**
 * Gleiche Abstände entlang einer Achse. Slots, die sich auf der Achse überschneiden
 * (z. B. zwei Slots nebeneinander in einer Zeile beim senkrechten Verteilen), bilden eine Gruppe
 * und wandern gemeinsam. Äußere Gruppen bleiben stehen. Liefert die Verschiebung je Box.
 */
export function verteilen(boxen: Box[], achse: 'x' | 'y'): number[] {
  const pos = achse === 'x' ? 'xMm' : 'yMm'
  const groesse = achse === 'x' ? 'bMm' : 'hMm'
  const sortiert = boxen.map((b, i) => ({ b, i })).sort((a, c) => a.b[pos] - c.b[pos])

  const gruppen: { start: number, ende: number, mitglieder: number[] }[] = []
  for (const { b, i } of sortiert) {
    const g = gruppen.at(-1)
    if (g && b[pos] < g.ende) {
      g.ende = Math.max(g.ende, b[pos] + b[groesse])
      g.mitglieder.push(i)
    }
    else {
      gruppen.push({ start: b[pos], ende: b[pos] + b[groesse], mitglieder: [i] })
    }
  }

  const deltas = boxen.map(() => 0)
  if (gruppen.length < 3) return deltas
  const erste = gruppen[0]!
  const letzte = gruppen.at(-1)!
  const belegt = gruppen.reduce((s, g) => s + (g.ende - g.start), 0)
  const luecke = (letzte.ende - erste.start - belegt) / (gruppen.length - 1)
  let cursor = erste.ende + luecke
  for (const g of gruppen.slice(1, -1)) {
    const d = runden(cursor - g.start)
    for (const m of g.mitglieder) deltas[m] = d
    cursor += g.ende - g.start + luecke
  }
  return deltas
}

/** Schneiden sich zwei Rechtecke? (für die Rahmenauswahl) */
export const schneidet = (a: Box, b: Box) =>
  a.xMm < b.xMm + b.bMm && a.xMm + a.bMm > b.xMm && a.yMm < b.yMm + b.hMm && a.yMm + a.hMm > b.yMm
