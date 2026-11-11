import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'

export type Ordner = 'hintergruende' | 'logos' | 'pdf'

/** Dateiablage auf der Platte (persistentes Volume). Dateinamen werden nur intern erzeugt. */
export interface Ablage {
  speichern(ordner: Ordner, bytes: Uint8Array, endung: string): Promise<string>
  lesen(ordner: Ordner, name: string): Promise<Uint8Array>
}

const SICHER = /^[\w-]+\.(pdf|png)$/

export function dateiAblage(basis: string): Ablage {
  const root = resolve(basis)
  return {
    async speichern(ordner, bytes, endung) {
      const name = `${randomUUID()}.${endung}`
      await mkdir(join(root, ordner), { recursive: true })
      await writeFile(join(root, ordner, name), bytes)
      return name
    },
    async lesen(ordner, name) {
      if (!SICHER.test(name)) throw new Error(`Ungültiger Dateiname: ${name}`)
      return new Uint8Array(await readFile(join(root, ordner, name)))
    },
  }
}
