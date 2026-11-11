<script setup lang="ts">
import { FUELLMENGEN, HONIGSORTEN } from '#shared/etikettendaten'
import { apiFehler, euro, feldFehler, type Papier } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug as string
const { data: design, error } = await useFetch(`/api/designs/${slug}`)
if (error.value || !design.value) throw createError({ statusCode: 404, statusMessage: 'Design nicht gefunden', fatal: true })
useHead({ title: `${design.value.name} – BeePrinter` })

const SONSTIGE = '__sonstige'
const daten = reactive({
  honigsorte: 'Blütenhonig', ursprung: 'Deutschland', fuellmengeG: 250 as number, mhd: '', los: '',
  imkerei: '', strasse: '', plz: '', ort: '', kontakt: '', lagerhinweis: '', region: '', anlass: '',
})
const sorteWahl = ref<string>('Blütenhonig')
const sorteFrei = ref('')
watch([sorteWahl, sorteFrei], ([w, f]) => { daten.honigsorte = w === SONSTIGE ? f : w })

const logoId = ref<string | null>(null)
const logoBild = ref<string | null>(null)
const bogenId = ref<number>(design.value.boegen[0]?.id ?? 0)
const email = ref('')
const angabenGeprueft = ref(false)
const widerrufVerzicht = ref(false)
const papier = ref<Papier>('orange')
const vorlage = ref<string | null>(null) // Token der Bestellung, aus der vorausgefüllt wurde

const nutzt = (feld: string) => design.value!.felder.includes(feld)

// ---- Vorausfüllen: aus alter Bestellung (?von=) oder gemerkter Anschrift ----
const MERKER = 'wabengut-anschrift'
const ANSCHRIFT = ['imkerei', 'strasse', 'plz', 'ort', 'kontakt', 'ursprung', 'region', 'lagerhinweis'] as const
function sorteSetzen(s: string) {
  if ((HONIGSORTEN as readonly string[]).includes(s)) sorteWahl.value = s
  else { sorteWahl.value = SONSTIGE; sorteFrei.value = s }
}
onMounted(async () => {
  const von = route.query.von
  if (typeof von === 'string') {
    try {
      const alt = await $fetch(`/api/bestellung/${von}`)
      Object.assign(daten, alt.daten)
      sorteSetzen(alt.daten.honigsorte)
      daten.los = ''
      daten.mhd = ''
      logoId.value = alt.logoId
      if (design.value!.boegen.some(b => b.id === alt.bogenId)) bogenId.value = alt.bogenId
      vorlage.value = von
      return
    }
    catch { /* Link ungültig – normal weiter */ }
  }
  try {
    const gemerkt = JSON.parse(localStorage.getItem(MERKER) ?? 'null')
    if (gemerkt) for (const k of ANSCHRIFT) if (typeof gemerkt[k] === 'string') daten[k] = gemerkt[k]
  }
  catch { /* Speicher nicht verfügbar */ }
})
watch(() => ANSCHRIFT.map(k => daten[k]), () => {
  try { localStorage.setItem(MERKER, JSON.stringify(Object.fromEntries(ANSCHRIFT.map(k => [k, daten[k]])))) }
  catch { /* egal */ }
})

// ---- Live-Vorschau (serverseitig gerendert, mit Wasserzeichen) ----
const pdf = ref<Uint8Array | null>(null)
const fehler = ref<Record<string, string[]>>({})
const ueberlauf = ref<string[]>([])
const beruehrt = reactive(new Set<string>())
const kaufVersucht = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let anfrage = 0

async function vorschauLaden() {
  const meine = ++anfrage
  try {
    const r = await $fetch('/api/vorschau', { method: 'POST', body: { slug, daten: { ...daten }, logoId: logoId.value } })
    if (meine !== anfrage) return
    pdf.value = base64ZuBytes(r.pdf)
    fehler.value = r.fehler as Record<string, string[]>
    ueberlauf.value = r.ueberlauf
  }
  catch (err) {
    console.error(err)
  }
}
onMounted(vorschauLaden)
watch([() => ({ ...daten }), logoId], () => {
  clearTimeout(timer)
  timer = setTimeout(vorschauLaden, 300)
}, { deep: true })

const fehlerFuer = (feld: string) => {
  if (ueberlauf.value.includes(feld) || (feld === 'ort' && ueberlauf.value.includes('plz'))) return 'Zu lang für das Etikett – bitte kürzen'
  if (!kaufVersucht.value && !beruehrt.has(feld)) return null
  const key = feld === 'fuellmenge' ? 'fuellmengeG' : feld
  return fehler.value[key]?.[0] ?? null
}
const offenePunkte = computed(() => Object.keys(fehler.value).length + ueberlauf.value.length)

// ---- Logo ----
const logoLaedt = ref(false)
const logoFehler = ref('')
async function logoHochladen(e: Event) {
  const datei = (e.target as HTMLInputElement).files?.[0]
  if (!datei) return
  logoLaedt.value = true
  logoFehler.value = ''
  try {
    const form = new FormData()
    form.append('logo', datei)
    const r = await $fetch('/api/logo', { method: 'POST', body: form })
    logoId.value = r.logoId
    logoBild.value = r.vorschau
  }
  catch (err) {
    logoFehler.value = apiFehler(err)
  }
  finally {
    logoLaedt.value = false
  }
}
function logoEntfernen() {
  logoId.value = null
  logoBild.value = null
}

// ---- Kaufen ----
const kaufFehler = ref('')
const kaufFeldFehler = ref<Record<string, string[]>>({})
const kauftGerade = ref(false)
async function kaufen() {
  kaufVersucht.value = true
  kaufFehler.value = ''
  kaufFeldFehler.value = {}
  await vorschauLaden()
  if (offenePunkte.value) {
    kaufFehler.value = 'Bitte die markierten Angaben ergänzen oder kürzen.'
    return
  }
  kauftGerade.value = true
  try {
    const r = await $fetch('/api/checkout', {
      method: 'POST',
      body: { slug, bogenId: bogenId.value, daten: { ...daten }, logoId: logoId.value, email: email.value, angabenGeprueft: angabenGeprueft.value, widerrufVerzicht: widerrufVerzicht.value },
    })
    window.location.href = r.url
  }
  catch (err) {
    kaufFehler.value = apiFehler(err)
    kaufFeldFehler.value = feldFehler(err)
    kauftGerade.value = false
  }
}
</script>

<template>
  <div v-if="design" class="px-4 sm:px-8 max-w-6xl mx-auto pb-16">
    <NuxtLink to="/#designs" class="text-sm text-[var(--color-tinte-weich)] hover:underline">Alle Designs</NuxtLink>
    <h1 class="text-4xl sm:text-5xl mt-2">{{ design.name }}</h1>
    <p class="mt-2 text-[var(--color-tinte-weich)] max-w-[40rem]">{{ design.beschreibung }}</p>

    <div v-if="vorlage" class="mt-6 rounded-lg bg-[var(--color-honig)]/25 border-2 border-[var(--color-honig)] px-4 py-3 max-w-[40rem]">
      Deine Angaben aus der letzten Bestellung sind eingetragen. Trag die <strong>neue Losnummer</strong> und das <strong>MHD</strong> dieser Charge ein.
    </div>

    <div class="mt-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 items-start">
      <!-- Formular -->
      <form class="grid gap-10 order-2 lg:order-1" novalidate @submit.prevent="kaufen">
        <fieldset class="grid gap-4">
          <legend class="text-2xl font-bold mb-3" style="font-family: var(--font-display)">Der Honig</legend>
          <div class="grid sm:grid-cols-2 gap-4">
            <label class="feld">
              <span>Honigsorte</span>
              <select v-model="sorteWahl" class="eingabe" @blur="beruehrt.add('honigsorte')">
                <option v-for="s in HONIGSORTEN" :key="s" :value="s">{{ s }}</option>
                <option :value="SONSTIGE">Andere Sorte …</option>
              </select>
            </label>
            <label v-if="sorteWahl === SONSTIGE" class="feld">
              <span>Sorte (frei)</span>
              <input v-model="sorteFrei" class="eingabe" maxlength="40" :aria-invalid="!!fehlerFuer('honigsorte')" @blur="beruehrt.add('honigsorte')">
            </label>
            <label class="feld">
              <span>Füllmenge</span>
              <select v-model.number="daten.fuellmengeG" class="eingabe">
                <option v-for="g in FUELLMENGEN" :key="g" :value="g">{{ g }} g</option>
              </select>
            </label>
            <label class="feld">
              <span>Ursprungsland</span>
              <input v-model="daten.ursprung" class="eingabe" maxlength="40" :aria-invalid="!!fehlerFuer('ursprung')" @blur="beruehrt.add('ursprung')">
              <small v-if="fehlerFuer('ursprung')" class="fehlertext">{{ fehlerFuer('ursprung') }}</small>
              <small v-else>Steht als „aus {{ daten.ursprung || '…' }}“ auf dem Etikett.</small>
            </label>
            <label v-if="nutzt('region')" class="feld">
              <span>Regionalangabe <small class="font-normal">(optional)</small></span>
              <input v-model="daten.region" class="eingabe" maxlength="40" placeholder="z. B. aus dem Odenwald" :aria-invalid="!!fehlerFuer('region')">
              <small v-if="fehlerFuer('region')" class="fehlertext">{{ fehlerFuer('region') }}</small>
            </label>
          </div>
          <p v-if="fehlerFuer('honigsorte')" class="fehlertext">{{ fehlerFuer('honigsorte') }}</p>
        </fieldset>

        <fieldset class="grid gap-4">
          <legend class="text-2xl font-bold mb-3" style="font-family: var(--font-display)">Diese Charge</legend>
          <div class="grid sm:grid-cols-2 gap-4">
            <label class="feld">
              <span>Mindestens haltbar bis</span>
              <input v-model="daten.mhd" type="date" class="eingabe" :aria-invalid="!!fehlerFuer('mhd')" @blur="beruehrt.add('mhd')">
              <small v-if="fehlerFuer('mhd')" class="fehlertext">{{ fehlerFuer('mhd') }}</small>
              <small v-else>Üblich sind bis zu 2 Jahre nach dem Abfüllen.</small>
            </label>
            <label class="feld">
              <span>Losnummer</span>
              <input v-model="daten.los" class="eingabe" maxlength="20" placeholder="z. B. L-2406" :aria-invalid="!!fehlerFuer('los')" @blur="beruehrt.add('los')">
              <small v-if="fehlerFuer('los')" class="fehlertext">{{ fehlerFuer('los') }}</small>
              <small v-else>Kennzeichnet die Abfüllung, etwa Jahr und Woche.</small>
            </label>
          </div>
        </fieldset>

        <fieldset class="grid gap-4">
          <legend class="text-2xl font-bold mb-3" style="font-family: var(--font-display)">Deine Imkerei</legend>
          <label class="feld">
            <span>Name</span>
            <input v-model="daten.imkerei" class="eingabe" maxlength="60" autocomplete="organization" placeholder="Imkerei Muster" :aria-invalid="!!fehlerFuer('imkerei')" @blur="beruehrt.add('imkerei')">
            <small v-if="fehlerFuer('imkerei')" class="fehlertext">{{ fehlerFuer('imkerei') }}</small>
          </label>
          <label class="feld">
            <span>Straße und Hausnummer</span>
            <input v-model="daten.strasse" class="eingabe" maxlength="60" autocomplete="street-address" :aria-invalid="!!fehlerFuer('strasse')" @blur="beruehrt.add('strasse')">
            <small v-if="fehlerFuer('strasse')" class="fehlertext">{{ fehlerFuer('strasse') }}</small>
          </label>
          <div class="grid grid-cols-[7rem_1fr] gap-4">
            <label class="feld">
              <span>PLZ</span>
              <input v-model="daten.plz" class="eingabe" inputmode="numeric" maxlength="5" autocomplete="postal-code" :aria-invalid="!!fehlerFuer('plz')" @blur="beruehrt.add('plz')">
            </label>
            <label class="feld">
              <span>Ort</span>
              <input v-model="daten.ort" class="eingabe" maxlength="40" autocomplete="address-level2" :aria-invalid="!!fehlerFuer('ort')" @blur="beruehrt.add('ort')">
            </label>
          </div>
          <p v-if="fehlerFuer('plz') || fehlerFuer('ort')" class="fehlertext">{{ fehlerFuer('plz') || fehlerFuer('ort') }}</p>
          <label v-if="nutzt('kontakt')" class="feld">
            <span>Website oder Telefon <small class="font-normal">(optional)</small></span>
            <input v-model="daten.kontakt" class="eingabe" maxlength="60" :aria-invalid="!!fehlerFuer('kontakt')">
            <small v-if="fehlerFuer('kontakt')" class="fehlertext">{{ fehlerFuer('kontakt') }}</small>
          </label>
          <label v-if="nutzt('lagerhinweis')" class="feld">
            <span>Lagerhinweis <small class="font-normal">(optional)</small></span>
            <input v-model="daten.lagerhinweis" class="eingabe" maxlength="60" placeholder="trocken, kühl und dunkel lagern" :aria-invalid="!!fehlerFuer('lagerhinweis')">
            <small v-if="fehlerFuer('lagerhinweis')" class="fehlertext">{{ fehlerFuer('lagerhinweis') }}</small>
          </label>
          <label v-if="nutzt('anlass')" class="feld">
            <span>Persönlicher Text <small class="font-normal">(optional)</small></span>
            <input v-model="daten.anlass" class="eingabe" maxlength="80" placeholder="z. B. Christine & Ralph · 12.06.2027" :aria-invalid="!!fehlerFuer('anlass')">
            <small v-if="fehlerFuer('anlass')" class="fehlertext">{{ fehlerFuer('anlass') }}</small>
          </label>

          <div v-if="design.hatLogo" class="feld">
            <span>Logo <small class="font-normal">(optional)</small></span>
            <div class="flex flex-wrap items-center gap-4">
              <label class="btn btn-rand btn-klein cursor-pointer">
                {{ logoId ? 'Anderes Logo wählen' : 'Logo hochladen' }}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="sr-only" @change="logoHochladen">
              </label>
              <img v-if="logoBild" :src="logoBild" alt="Dein Logo in Schwarz" class="h-12 bg-white rounded border border-[var(--color-linie)] p-1">
              <button v-if="logoId" type="button" class="text-sm underline" @click="logoEntfernen">Logo entfernen</button>
              <span v-if="logoLaedt" class="text-sm">Wird umgewandelt …</span>
            </div>
            <small v-if="logoFehler" class="fehlertext">{{ logoFehler }}</small>
            <small v-else>PNG, JPG oder SVG. Wir wandeln es in reines Schwarz um, damit es auf farbigem Papier sauber druckt.</small>
          </div>
        </fieldset>

        <fieldset class="grid gap-4 flaeche p-5 sm:p-6">
          <legend class="sr-only">Kaufen</legend>
          <h2 class="text-2xl">Druck-PDF kaufen</h2>
          <label v-if="design.boegen.length > 1" class="feld">
            <span>Etikettenbogen</span>
            <select v-model.number="bogenId" class="eingabe">
              <option v-for="b in design.boegen" :key="b.id" :value="b.id">{{ b.name }} – {{ b.anzahl }} Etiketten</option>
            </select>
          </label>
          <p v-else-if="design.boegen[0]" class="text-[var(--color-tinte-weich)]">
            Für <strong class="text-[var(--color-tinte)]">{{ design.boegen[0].name }}</strong> ({{ design.boegen[0].beschreibung }}).
            <a :href="`/api/bogen/${design.boegen[0].id}/testbogen`" target="_blank" class="underline">Testbogen</a> vorher auf Normalpapier drucken und gegen den Etikettenbogen halten.
          </p>
          <label class="feld">
            <span>E-Mail für den Download-Link</span>
            <input v-model="email" type="email" class="eingabe" autocomplete="email" :aria-invalid="!!kaufFeldFehler.email">
            <small v-if="kaufFeldFehler.email" class="fehlertext">{{ kaufFeldFehler.email[0] }}</small>
          </label>
          <label class="flex gap-3 items-start">
            <input v-model="angabenGeprueft" type="checkbox" class="mt-1.5 size-5 accent-[var(--color-tinte)]">
            <span>Ich habe die Vorschau geprüft. Das PDF wird mit genau diesen Angaben erstellt und lässt sich danach nicht mehr ändern.</span>
          </label>
          <label class="flex gap-3 items-start">
            <input v-model="widerrufVerzicht" type="checkbox" class="mt-1.5 size-5 accent-[var(--color-tinte)]">
            <span class="text-sm">Ich möchte das PDF sofort erhalten und weiß, dass mein Widerrufsrecht damit erlischt.</span>
          </label>
          <p v-if="kaufFehler" role="alert" class="fehlertext">{{ kaufFehler }}</p>
          <button class="btn btn-kaufen text-lg min-h-[3.25rem]" :disabled="kauftGerade || !angabenGeprueft || !widerrufVerzicht">
            {{ kauftGerade ? 'Weiter zur Zahlung …' : `Für ${euro(design.preisCent)} kaufen` }}
          </button>
          <p class="text-sm text-[var(--color-tinte-weich)]">Bezahlen mit PayPal, Karte, Apple Pay oder Google Pay. Das PDF kannst du danach beliebig oft herunterladen und drucken.</p>
        </fieldset>
      </form>

      <!-- Vorschau -->
      <aside class="order-1 lg:order-2 lg:sticky lg:top-6 grid gap-4">
        <ClientOnly>
          <EtikettAufPapier :quelle="pdf" :papier="papier" :alt="`Vorschau deines Etiketts ${design.name}`" schatten />
        </ClientOnly>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <EtikettPapierWahl v-model="papier" />
          <span class="text-sm text-[var(--color-tinte-weich)]">Gedruckt wird nur Schwarz, die Farbe kommt vom Papier.</span>
        </div>
        <p v-if="ueberlauf.length" class="fehlertext" role="status">Mindestens eine Angabe passt nicht aufs Etikett. Sie ist im Formular markiert.</p>
      </aside>
    </div>
  </div>
</template>
