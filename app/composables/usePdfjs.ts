import type { PDFDocumentProxy } from 'pdfjs-dist'

let laden: Promise<typeof import('pdfjs-dist')> | undefined

/** pdf.js nur im Browser und nur bei Bedarf laden */
export function ladePdfjs() {
  laden ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  })
  return laden
}

/** Erste PDF-Seite in ein Canvas zeichnen, passend zur Breite des Canvas-Elternteils */
export async function zeichnePdf(canvas: HTMLCanvasElement, quelle: Uint8Array | string, breitePx: number) {
  const pdfjs = await ladePdfjs()
  const aufgabe = pdfjs.getDocument(typeof quelle === 'string' ? { url: quelle } : { data: quelle })
  const doc: PDFDocumentProxy = await aufgabe.promise
  try {
    const seite = await doc.getPage(1)
    const basis = seite.getViewport({ scale: 1 })
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const viewport = seite.getViewport({ scale: (breitePx / basis.width) * dpr })
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    canvas.style.width = `${breitePx}px`
    canvas.style.height = `${Math.round(viewport.height / dpr)}px`
    await seite.render({ canvas, viewport }).promise
  }
  finally {
    await aufgabe.destroy()
  }
}

export const base64ZuBytes = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0))
