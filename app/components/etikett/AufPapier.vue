<script setup lang="ts">
import type { Papier } from '~/utils/format'

/**
 * Zeigt ein Etikett-PDF so, wie es auf farbigem Etikettenpapier aussieht:
 * Schwarzdruck wird per multiply auf die Papierfarbe gelegt, Weiß verschwindet.
 */
const props = defineProps<{ quelle: Uint8Array | string | null, papier: Papier, alt: string, schatten?: boolean }>()

const huelle = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const laedt = ref(true)
const breite = ref(0)
let lauf = 0

async function zeichnen() {
  if (!props.quelle || !canvas.value || !breite.value) return
  const meinLauf = ++lauf
  laedt.value = true
  try {
    // pdf.js übernimmt Uint8Array-Puffer → Kopie übergeben
    const q = typeof props.quelle === 'string' ? props.quelle : props.quelle.slice()
    const ziel = document.createElement('canvas')
    await zeichnePdf(ziel, q, breite.value)
    if (meinLauf !== lauf || !canvas.value) return
    canvas.value.width = ziel.width
    canvas.value.height = ziel.height
    canvas.value.style.width = ziel.style.width
    canvas.value.style.height = ziel.style.height
    canvas.value.getContext('2d')!.drawImage(ziel, 0, 0)
  }
  catch (err) {
    console.error('[vorschau]', err)
  }
  finally {
    if (meinLauf === lauf) laedt.value = false
  }
}

let ro: ResizeObserver | undefined
onMounted(() => {
  ro = new ResizeObserver(([e]) => {
    const w = Math.floor(e!.contentRect.width)
    if (w && w !== breite.value) {
      breite.value = w
      zeichnen()
    }
  })
  ro.observe(huelle.value!)
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => props.quelle, zeichnen)
</script>

<template>
  <div
    ref="huelle"
    class="relative rounded-[3%/6%] overflow-hidden transition-colors duration-300"
    :class="schatten ? 'shadow-[0_1px_0_rgba(0,0,0,.08),0_10px_24px_-12px_rgba(34,38,32,.45)]' : ''"
    :style="{ background: `var(--color-papier-${papier})` }"
  >
    <canvas ref="canvas" role="img" :aria-label="alt" class="block w-full mix-blend-multiply" />
    <div v-if="laedt && !canvas?.width" class="absolute inset-0 grid place-items-center text-sm text-[var(--color-tinte-weich)]">Etikett wird gezeichnet …</div>
  </div>
</template>
