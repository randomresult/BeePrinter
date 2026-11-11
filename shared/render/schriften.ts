/** Freie Schriften (SIL OFL), Dateien in server/assets/fonts. Ein Schlüssel = ein Schnitt. */
export const SCHRIFTEN = {
  'alegreya-sc': { name: 'Alegreya SC', datei: 'AlegreyaSC-Regular.ttf' },
  'alegreya-sc-bold': { name: 'Alegreya SC Bold', datei: 'AlegreyaSC-Bold.ttf' },
  'alegreya-sans': { name: 'Alegreya Sans', datei: 'AlegreyaSans-Regular.ttf' },
  'alegreya-sans-bold': { name: 'Alegreya Sans Bold', datei: 'AlegreyaSans-Bold.ttf' },
  'abril': { name: 'Abril Fatface', datei: 'AbrilFatface-Regular.ttf' },
  'rye': { name: 'Rye', datei: 'Rye-Regular.ttf' },
  'courier': { name: 'Courier Prime', datei: 'CourierPrime-Regular.ttf' },
  'courier-bold': { name: 'Courier Prime Bold', datei: 'CourierPrime-Bold.ttf' },
  'great-vibes': { name: 'Great Vibes', datei: 'GreatVibes-Regular.ttf' },
} as const satisfies Record<string, { name: string, datei: string }>

export type SchriftKey = keyof typeof SCHRIFTEN
export const SCHRIFT_KEYS = Object.keys(SCHRIFTEN) as SchriftKey[]
export const WASSERZEICHEN_SCHRIFT: SchriftKey = 'alegreya-sans-bold'
