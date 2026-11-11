<script setup lang="ts">
import { PLATZHALTER, PFLICHT_PLATZHALTER, platzhalterIn } from '#shared/etikettendaten'
import { SCHRIFTEN } from '#shared/render/schriften'
import type { Slot, TextSlot } from '#shared/render/types'
import { apiFehler } from '~/utils/format'
import { ausrichten, runden, schneidet, verteilen, type AusrichtModus, type Box } from '#shared/ausrichten'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const id = Number(useRoute().params.id)
const { data: design, refresh } = await useFetch(`/api/admin/designs/${id}`)
const { data: themenwelten } = await useFetch('/api/admin/themenwelten', { default: () => [] })
if (!design.value) throw createError({ statusCode: 404, statusMessage: 'Design nicht gefunden', fatal: true })
useHead({ title: () => `${design.value?.name} bearbeiten – BeePrinter Verwaltung` })

const { show } = useToast()
const { busy, run } = useAction()

const meta = reactive({
  name: design.value.name, slug: design.value.slug, beschreibung: design.value.beschreibung,
  themenweltId: design.value.themenweltId, formatId: design.value.formatId,
  preisEuro: design.value.preisCent / 100, veroeffentlicht: design.value.veroeffentlicht, sortierung: design.value.sortierung,
})
const slots = ref<Slot[]>(structuredClone(toRaw(design.value.slots)))
const format = computed(() => design.value!.format)
// ---- Auswahl (mehrere Slots möglich) ----
const auswahl = ref<string[]>([])
const gewaehlteSlots = computed(() => slots.value.filter(s => auswahl.value.includes(s.id)))
/** Genau ein Slot gewählt → Eigenschaften-Panel */
const slot = computed(() => gewaehlteSlots.value.length === 1 ? gewaehlteSlots.value[0]! : null)
const istGewaehlt = (s: Slot) => auswahl.value.includes(s.id)
function waehlen(s: Slot, e?: MouseEvent | PointerEvent) {
  if (e && (e.shiftKey || e.metaKey || e.ctrlKey)) {
    auswahl.value = istGewaehlt(s) ? auswahl.value.filter(x => x !== s.id) : [...auswahl.value, s.id]
  }
  else if (!istGewaehlt(s)) {
    auswahl.value = [s.id]
  }
}
const geaendert = ref(false)
watch([slots, meta], () => { geaendert.value = true }, { deep: true })

// ---- Rückgängig ----
const verlauf: string[] = []
const verlaufLaenge = ref(0)
function merken() {
  verlauf.push(JSON.stringify(slots.value))
  if (verlauf.length > 60) verlauf.shift()
  verlaufLaenge.value = verlauf.length
}
function rueckgaengig() {
  const alt = verlauf.pop()
  verlaufLaenge.value = verlauf.length
  if (!alt) return
  slots.value = JSON.parse(alt)
  auswahl.value = auswahl.value.filter(id => slots.value.some(s => s.id === id))
}

// ---- Vorschau ----
const pdf = ref<Uint8Array | null>(null)
const ueberlauf = ref<string[]>([])
let timer: ReturnType<typeof setTimeout> | undefined
async function vorschau() {
  try {
    const r = await $fetch('/api/admin/vorschau', { method: 'POST', body: { designId: id, slots: slots.value } })
    pdf.value = base64ZuBytes(r.pdf)
    ueberlauf.value = r.ueberlauf
  }
  catch (err) {
    show(apiFehler(err), 'error')
  }
}
onMounted(vorschau)
watch(slots, () => { clearTimeout(timer); timer = setTimeout(vorschau, 350) }, { deep: true })

// ---- Ziehen, Größe ändern, Rahmenauswahl ----
const flaeche = ref<HTMLDivElement>()
type Zug =
  | { art: 'move', x0: number, y0: number, mmProPx: number, start: Map<string, { xMm: number, yMm: number }>, bewegt: boolean }
  | { art: 'size', x0: number, y0: number, mmProPx: number, id: string, b0: number, h0: number }
  | { art: 'rahmen', start: { xMm: number, yMm: number }, dazu: boolean, vorher: string[] }
let zug: Zug | null = null
const rahmen = ref<Box | null>(null)
const mmProPx = () => format.value.breiteMm / flaeche.value!.getBoundingClientRect().width
function inMm(e: PointerEvent) {
  const r = flaeche.value!.getBoundingClientRect()
  return { xMm: (e.clientX - r.left) * mmProPx(), yMm: (e.clientY - r.top) * mmProPx() }
}
function fangen(e: PointerEvent) {
  try { flaeche.value!.setPointerCapture(e.pointerId) }
  catch { /* z. B. synthetische Events */ }
}
function start(e: PointerEvent, s: Slot, art: 'move' | 'size') {
  if (e.button !== 0) return
  if (art === 'size') {
    zug = { art, x0: e.clientX, y0: e.clientY, mmProPx: mmProPx(), id: s.id, b0: s.bMm, h0: s.hMm }
    merken()
  }
  else {
    waehlen(s, e)
    if (!istGewaehlt(s)) return // gerade per Umschalt abgewählt
    zug = { art, x0: e.clientX, y0: e.clientY, mmProPx: mmProPx(), start: new Map(gewaehlteSlots.value.map(x => [x.id, { xMm: x.xMm, yMm: x.yMm }])), bewegt: false }
  }
  fangen(e)
}
function hintergrundStart(e: PointerEvent) {
  if (e.button !== 0) return
  const dazu = e.shiftKey || e.metaKey || e.ctrlKey
  zug = { art: 'rahmen', start: inMm(e), dazu, vorher: dazu ? [...auswahl.value] : [] }
  if (!dazu) auswahl.value = []
  fangen(e)
}
function bewegen(e: PointerEvent) {
  if (!zug) return
  const B = format.value.breiteMm
  const H = format.value.hoeheMm
  if (zug.art === 'rahmen') {
    const p = inMm(e)
    const r = { xMm: Math.min(zug.start.xMm, p.xMm), yMm: Math.min(zug.start.yMm, p.yMm), bMm: Math.abs(p.xMm - zug.start.xMm), hMm: Math.abs(p.yMm - zug.start.yMm) }
    rahmen.value = r
    const getroffen = slots.value.filter(s => schneidet(s, r)).map(s => s.id)
    auswahl.value = [...new Set([...zug.vorher, ...getroffen])]
    return
  }
  let dx = (e.clientX - zug.x0) * zug.mmProPx
  let dy = (e.clientY - zug.y0) * zug.mmProPx
  if (zug.art === 'size') {
    const s = slots.value.find(x => x.id === (zug as { id: string }).id)!
    s.bMm = Math.min(Math.max(1, runden(zug.b0 + dx)), B - s.xMm)
    s.hMm = Math.min(Math.max(1, runden(zug.h0 + dy)), H - s.yMm)
    return
  }
  if (!zug.bewegt) {
    if (Math.hypot(e.clientX - zug.x0, e.clientY - zug.y0) < 3) return
    zug.bewegt = true
    merken()
  }
  // Gruppe als Ganzes begrenzen, damit kein Slot übers Etikett hinausrutscht
  const gruppe = gewaehlteSlots.value
  for (const s of gruppe) {
    const o = zug.start.get(s.id)!
    dx = Math.min(Math.max(dx, -o.xMm), B - s.bMm - o.xMm)
    dy = Math.min(Math.max(dy, -o.yMm), H - s.hMm - o.yMm)
  }
  for (const s of gruppe) {
    const o = zug.start.get(s.id)!
    s.xMm = runden(o.xMm + dx)
    s.yMm = runden(o.yMm + dy)
  }
}
function ende() {
  zug = null
  rahmen.value = null
}

function taste(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest('input,select,textarea')) return
  const mod = e.metaKey || e.ctrlKey
  const k = e.key.toLowerCase()
  if (mod && k === 'z') { e.preventDefault(); rueckgaengig(); return }
  if (mod && k === 'a') { e.preventDefault(); auswahl.value = slots.value.map(s => s.id); return }
  if (mod && k === 'd') { e.preventDefault(); duplizieren(); return }
  if (mod && k === 's') { e.preventDefault(); speichern(); return }
  if (e.key === 'Escape') { auswahl.value = []; return }
  if (!gewaehlteSlots.value.length) return
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); entfernen(); return }
  const schritt = e.shiftKey ? 2 : 0.5
  const d = { ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0], ArrowUp: [0, -schritt], ArrowDown: [0, schritt] }[e.key]
  if (d) {
    e.preventDefault()
    merken()
    for (const s of gewaehlteSlots.value) {
      s.xMm = runden(Math.min(Math.max(0, s.xMm + d[0]!), format.value.breiteMm - s.bMm))
      s.yMm = runden(Math.min(Math.max(0, s.yMm + d[1]!), format.value.hoeheMm - s.hMm))
    }
  }
}
onMounted(() => window.addEventListener('keydown', taste))
onBeforeUnmount(() => window.removeEventListener('keydown', taste))

const pct = (s: Box) => ({
  left: `${(s.xMm / format.value.breiteMm) * 100}%`,
  top: `${(s.yMm / format.value.hoeheMm) * 100}%`,
  width: `${(s.bMm / format.value.breiteMm) * 100}%`,
  height: `${(s.hMm / format.value.hoeheMm) * 100}%`,
})

// ---- Ausrichten & Verteilen ----
function ausrichtenNach(modus: AusrichtModus) {
  const liste = gewaehlteSlots.value
  if (!liste.length) return
  merken()
  ausrichten(liste, modus, { bMm: format.value.breiteMm, hMm: format.value.hoeheMm }).forEach((p, i) => Object.assign(liste[i]!, p))
}
function verteilenNach(achse: 'x' | 'y') {
  const liste = gewaehlteSlots.value
  merken()
  const feld = achse === 'x' ? 'xMm' : 'yMm'
  verteilen(liste, achse).forEach((d, i) => { liste[i]![feld] += d })
}
const ausrichtKnoepfe: { modus: AusrichtModus, label: string, icon: string }[] = [
  { modus: 'links', label: 'Linksbündig', icon: 'M2 1h1.5v18H2zM5 4h10v4H5zM5 11h7v4H5z' },
  { modus: 'hmitte', label: 'Waagerecht zentrieren', icon: 'M9.25 1h1.5v18h-1.5zM4 4h12v4H4zM6 11h8v4H6z' },
  { modus: 'rechts', label: 'Rechtsbündig', icon: 'M16.5 1H18v18h-1.5zM5 4h10v4H5zM8 11h7v4H8z' },
  { modus: 'oben', label: 'Oben ausrichten', icon: 'M1 2h18v1.5H1zM4 5h4v10H4zM11 5h4v7h-4z' },
  { modus: 'vmitte', label: 'Senkrecht zentrieren', icon: 'M1 9.25h18v1.5H1zM4 4h4v12H4zM11 6h4v8h-4z' },
  { modus: 'unten', label: 'Unten ausrichten', icon: 'M1 16.5h18V18H1zM4 5h4v10H4zM11 8h4v7h-4z' },
]
const bezug = computed(() => gewaehlteSlots.value.length === 1 ? 'am Etikett' : 'an der Auswahl')

// ---- Slots verwalten ----
const neueId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
function textSlot() {
  merken()
  const s: TextSlot = { id: neueId(), typ: 'text', text: '{honigsorte}', xMm: 10, yMm: 10, bMm: 40, hMm: 6, schrift: 'alegreya-sans', maxPt: 12, minPt: 6, ausrichtung: 'mitte', rotation: 0 }
  slots.value.push(s)
  auswahl.value = [s.id]
}
function logoSlot() {
  if (slots.value.some(s => s.typ === 'logo')) return show('Es gibt schon einen Logo-Slot', 'error')
  merken()
  const s: Slot = { id: neueId(), typ: 'logo', xMm: 5, yMm: 28, bMm: 18, hMm: 14, rotation: 0 }
  slots.value.push(s)
  auswahl.value = [s.id]
}
/** Dupliziert alle gewählten Text-Slots (Logo nur einmal erlaubt), versetzt um 2 mm */
function duplizieren() {
  const quelle = gewaehlteSlots.value.filter(s => s.typ === 'text')
  if (!quelle.length) return
  merken()
  const H = format.value.hoeheMm
  const kopien = quelle.map(s => ({ ...structuredClone(toRaw(s)), id: neueId(), xMm: s.xMm, yMm: Math.min(s.yMm + 2, H - s.hMm) }))
  slots.value.push(...kopien)
  auswahl.value = kopien.map(s => s.id)
}
function entfernen() {
  if (!auswahl.value.length) return
  merken()
  slots.value = slots.value.filter(s => !istGewaehlt(s))
  auswahl.value = []
}
function platzhalterEinfuegen(k: string) {
  if (slot.value?.typ === 'text') slot.value.text = `${slot.value.text} {${k}}`.trim()
}
const fehlendePflicht = computed(() => {
  const da = new Set(slots.value.flatMap(s => (s.typ === 'text' ? platzhalterIn(s.text) : [])))
  return PFLICHT_PLATZHALTER.filter(k => !da.has(k)).map(k => PLATZHALTER[k]!.label)
})
const slotName = (s: Slot) => s.typ === 'logo' ? 'Logo' : s.text

// ---- Speichern & Hintergrund ----
async function speichern() {
  const url: string = `/api/admin/designs/${id}`
  const ok = await run(() => $fetch<unknown>(url, {
    method: 'PUT',
    body: { ...meta, preisCent: Math.round(meta.preisEuro * 100), slots: slots.value },
  }), 'Gespeichert')
  if (ok) {
    await refresh()
    await nextTick()
    geaendert.value = false
  }
}
async function hintergrundHochladen(e: Event) {
  const datei = (e.target as HTMLInputElement).files?.[0]
  if (!datei) return
  const form = new FormData()
  form.append('hintergrund', datei)
  const url: string = `/api/admin/designs/${id}/hintergrund`
  const ok = await run(() => $fetch<unknown>(url, { method: 'POST', body: form }), 'Hintergrund ersetzt')
  if (ok) { await refresh(); await vorschau() }
}
onBeforeRouteLeave(() => !geaendert.value || window.confirm('Ungespeicherte Änderungen verwerfen?'))
</script>

<template>
  <div v-if="design" class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <NuxtLink to="/admin" class="text-sm text-[var(--color-tinte-weich)] hover:underline">Alle Designs</NuxtLink>
        <h1 class="text-3xl">{{ meta.name }}</h1>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="geaendert" class="text-sm text-[var(--color-tinte-weich)]">Ungespeicherte Änderungen</span>
        <a v-if="design.veroeffentlicht" :href="`/design/${design.slug}`" target="_blank" class="btn btn-rand btn-klein">Im Shop ansehen</a>
        <button class="btn btn-tinte" :disabled="busy" @click="speichern">Speichern</button>
      </div>
    </div>

    <div class="grid xl:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
      <!-- Arbeitsfläche -->
      <div class="grid gap-3">
        <!-- Werkzeugleiste -->
        <div class="flaeche px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-2" role="toolbar" aria-label="Ausrichten">
          <span class="text-sm font-bold min-w-28">
            {{ gewaehlteSlots.length ? `${gewaehlteSlots.length} Slot${gewaehlteSlots.length > 1 ? 's' : ''} gewählt` : 'Nichts gewählt' }}
          </span>
          <div class="flex gap-0.5" role="group" aria-label="Ausrichten">
            <button
              v-for="a in ausrichtKnoepfe" :key="a.modus" class="werkzeug" :disabled="!gewaehlteSlots.length"
              :title="`${a.label} ${bezug}`" :aria-label="`${a.label} ${bezug}`" @click="ausrichtenNach(a.modus)"
            >
              <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true" fill="currentColor"><path :d="a.icon" /></svg>
            </button>
          </div>
          <div class="flex gap-0.5" role="group" aria-label="Verteilen">
            <button class="werkzeug" :disabled="gewaehlteSlots.length < 3" title="Waagerecht gleiche Abstände (ab 3 Slots)" aria-label="Waagerecht verteilen" @click="verteilenNach('x')">
              <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true" fill="currentColor"><path d="M1 2h1.5v16H1zM17.5 2H19v16h-1.5zM7 6h6v8H7z" /></svg>
            </button>
            <button class="werkzeug" :disabled="gewaehlteSlots.length < 3" title="Senkrecht gleiche Abstände (ab 3 Slots)" aria-label="Senkrecht verteilen" @click="verteilenNach('y')">
              <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true" fill="currentColor"><path d="M2 1h16v1.5H2zM2 17.5h16V19H2zM6 7h8v6H6z" /></svg>
            </button>
          </div>
          <div class="flex gap-0.5 ml-auto">
            <button class="werkzeug" :disabled="!verlaufLaenge" title="Rückgängig (⌘Z)" aria-label="Rückgängig" @click="rueckgaengig">
              <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true" fill="currentColor"><path d="M7.5 4 2 9l5.5 5V10.5H12a4 4 0 0 1 0 8h-1V20h1a5.5 5.5 0 0 0 0-11H7.5z" /></svg>
            </button>
            <button class="werkzeug px-2 w-auto text-sm" :disabled="!gewaehlteSlots.some(s => s.typ === 'text')" title="Duplizieren (⌘D)" @click="duplizieren">Duplizieren</button>
            <button class="werkzeug px-2 w-auto text-sm" :disabled="!gewaehlteSlots.length" title="Löschen (Entf)" @click="entfernen">Löschen</button>
          </div>
        </div>

        <div class="flaeche p-4 sm:p-8 bg-[repeating-conic-gradient(#f4f5f1_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
          <div class="relative select-none">
            <ClientOnly><EtikettAufPapier :quelle="pdf" papier="weiss" alt="Vorschau mit Beispieldaten" schatten /></ClientOnly>
            <div ref="flaeche" class="absolute inset-0 touch-none" @pointerdown.self="hintergrundStart" @pointermove="bewegen" @pointerup="ende" @pointercancel="ende">
              <div
                v-for="s in slots" :key="s.id"
                class="absolute cursor-move border"
                :class="[
                  istGewaehlt(s) ? 'border-[var(--color-honig-dunkel)] bg-[var(--color-honig)]/20 border-2 z-10' : 'border-dashed border-sky-500/60 hover:bg-sky-400/10',
                  ueberlauf.includes(s.id) ? '!border-[var(--color-fehler)] !bg-red-500/15' : '',
                ]"
                :style="pct(s)"
                :title="slotName(s)"
                @pointerdown.stop="start($event, s, 'move')"
              >
                <span v-if="slot?.id === s.id" class="absolute -right-1.5 -bottom-1.5 size-3 bg-[var(--color-honig-dunkel)] cursor-se-resize" @pointerdown.stop="start($event, s, 'size')" />
              </div>
              <div v-if="rahmen" class="absolute border border-dashed border-[var(--color-tinte)] bg-sky-400/10 pointer-events-none" :style="pct(rahmen)" />
            </div>
          </div>
        </div>
        <p class="text-sm text-[var(--color-tinte-weich)]">
          Etikett {{ format.name }}. Slot ziehen zum Verschieben, Ecke ziehen für die Größe. Mit Umschalt oder ⌘ klicken, um mehrere Slots zu wählen, oder auf freier Fläche einen Rahmen aufziehen. Pfeiltasten verschieben um 0,5 mm (mit Umschalt 2 mm). Vorschau mit Beispieldaten.
        </p>
        <p v-if="ueberlauf.length" class="fehlertext">{{ ueberlauf.length }} Slot(s) zu klein für die Beispieldaten – rot markiert.</p>
        <p v-if="fehlendePflicht.length" class="fehlertext">Für die Veröffentlichung fehlen Slots für: {{ fehlendePflicht.join(', ') }}</p>

        <div class="flaeche p-4">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 class="text-xl">Slots</h2>
            <div class="flex gap-2">
              <button class="btn btn-rand btn-klein" @click="textSlot">Text-Slot</button>
              <button class="btn btn-rand btn-klein" @click="logoSlot">Logo-Slot</button>
            </div>
          </div>
          <ul class="grid gap-1">
            <li v-for="s in slots" :key="s.id">
              <button
                class="w-full text-left px-3 py-1.5 rounded-md truncate"
                :class="istGewaehlt(s) ? 'bg-[var(--color-honig)] font-bold' : 'hover:bg-[var(--color-kalk)]'"
                @click="waehlen(s, $event); if (!($event.shiftKey || $event.metaKey || $event.ctrlKey)) auswahl = [s.id]"
              >
                {{ slotName(s) }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Eigenschaften -->
      <div class="grid gap-6">
        <section v-if="slot" class="flaeche p-4 grid gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xl">{{ slot.typ === 'logo' ? 'Logo-Slot' : 'Text-Slot' }}</h2>
            <div class="flex gap-2">
              <button v-if="slot.typ === 'text'" class="btn btn-rand btn-klein" @click="duplizieren">Duplizieren</button>
              <button class="btn btn-rand btn-klein" @click="entfernen">Löschen</button>
            </div>
          </div>
          <template v-if="slot.typ === 'text'">
            <label class="feld">
              <span>Text</span>
              <input v-model="slot.text" class="eingabe">
              <small>Platzhalter in geschweiften Klammern. Ohne Platzhalter = fester Text.</small>
            </label>
            <div class="flex flex-wrap gap-1">
              <button v-for="(p, k) in PLATZHALTER" :key="k" type="button" class="text-xs px-2 py-1 rounded-full border border-[var(--color-linie)] hover:border-[var(--color-tinte)]" @click="platzhalterEinfuegen(k as string)">
                {{ p.label }}
              </button>
            </div>
            <label class="feld">
              <span>Schrift</span>
              <select v-model="slot.schrift" class="eingabe">
                <option v-for="(s, k) in SCHRIFTEN" :key="k" :value="k">{{ s.name }}</option>
              </select>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="feld"><span>Größte Schrift (pt)</span><input v-model.number="slot.maxPt" type="number" step="0.5" min="2" class="eingabe"></label>
              <label class="feld"><span>Kleinste Schrift (pt)</span><input v-model.number="slot.minPt" type="number" step="0.5" min="2" class="eingabe"></label>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="feld">
                <span>Ausrichtung</span>
                <select v-model="slot.ausrichtung" class="eingabe"><option value="links">Links</option><option value="mitte">Mitte</option><option value="rechts">Rechts</option></select>
              </label>
              <label class="feld">
                <span>Drehung</span>
                <select v-model.number="slot.rotation" class="eingabe"><option :value="0">Keine</option><option :value="90">90° (nach oben)</option><option :value="270">90° (nach unten)</option></select>
              </label>
            </div>
            <label class="flex gap-2 items-center"><input v-model="slot.versalien" type="checkbox" class="size-4"> In Großbuchstaben setzen</label>
          </template>
          <div class="grid grid-cols-4 gap-2">
            <label class="feld"><span>x</span><input v-model.number="slot.xMm" type="number" step="0.5" class="eingabe px-2"></label>
            <label class="feld"><span>y</span><input v-model.number="slot.yMm" type="number" step="0.5" class="eingabe px-2"></label>
            <label class="feld"><span>Breite</span><input v-model.number="slot.bMm" type="number" step="0.5" class="eingabe px-2"></label>
            <label class="feld"><span>Höhe</span><input v-model.number="slot.hMm" type="number" step="0.5" class="eingabe px-2"></label>
          </div>
          <small class="text-[var(--color-tinte-weich)]">Alle Maße in mm, von oben links.</small>
        </section>

        <section class="flaeche p-4 grid gap-3">
          <h2 class="text-xl">Design</h2>
          <label class="feld"><span>Name</span><input v-model="meta.name" class="eingabe"></label>
          <label class="feld"><span>Kürzel (URL)</span><input v-model="meta.slug" class="eingabe"></label>
          <label class="feld"><span>Beschreibung</span><textarea v-model="meta.beschreibung" rows="2" class="eingabe" /></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="feld">
              <span>Themenwelt</span>
              <select v-model.number="meta.themenweltId" class="eingabe"><option v-for="t in themenwelten" :key="t.id" :value="t.id">{{ t.name }}</option></select>
            </label>
            <label class="feld"><span>Preis (€)</span><input v-model.number="meta.preisEuro" type="number" step="0.1" min="0.5" class="eingabe"></label>
          </div>
          <label class="feld"><span>Reihenfolge</span><input v-model.number="meta.sortierung" type="number" class="eingabe"></label>
          <label class="flex gap-2 items-center font-bold"><input v-model="meta.veroeffentlicht" type="checkbox" class="size-4"> Im Shop veröffentlicht</label>
          <div class="feld">
            <span>Hintergrund</span>
            <label class="btn btn-rand btn-klein cursor-pointer justify-self-start">
              {{ design.hintergrund ? 'Hintergrund-PDF ersetzen' : 'Hintergrund-PDF hochladen' }}
              <input type="file" accept="application/pdf" class="sr-only" @change="hintergrundHochladen">
            </label>
            <small>Ein Vektor-PDF mit einer Seite in {{ format.breiteMm }} × {{ format.hoeheMm }} mm, nur Schwarz, ohne die variablen Texte.</small>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
