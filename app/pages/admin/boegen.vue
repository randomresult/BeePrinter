<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Etikettenbögen – BeePrinter Verwaltung' })

const { data: boegen, refresh } = await useFetch('/api/admin/bogen', { default: () => [] })
const { data: formate, refresh: formateNeu } = await useFetch('/api/admin/formate', { default: () => [] })
const { data: katalog } = await useFetch('/api/admin/katalog', { default: () => [] })
const { busy, run } = useAction()

const leer = () => ({
  id: 0, formatId: formate.value[0]?.id ?? 0, hersteller: 'Avery Zweckform', artikelnr: '', name: '',
  seiteBreiteMm: 210, seiteHoeheMm: 297, spalten: 2, zeilen: 5, randObenMm: 10, randLinksMm: 5, abstandXMm: 0, abstandYMm: 0, aktiv: true,
})
const form = ref(leer())
const katalogWahl = ref('')
const hinweis = ref('')

function bearbeiten(b: typeof boegen.value[number]) {
  const { format: _f, ...rest } = b
  form.value = { ...rest }
  hinweis.value = ''
}

/** Katalogeintrag übernehmen; passendes Etikettenformat suchen oder anlegen */
async function ausKatalog() {
  const k = katalog.value.find(e => e.artikelnr === katalogWahl.value)
  if (!k) return
  let f = formate.value.find(x => x.breiteMm === k.format.breiteMm && x.hoeheMm === k.format.hoeheMm && x.kontur === k.format.kontur)
  if (!f) {
    const name = `${String(k.format.breiteMm).replace('.', ',')} × ${String(k.format.hoeheMm).replace('.', ',')} mm`
    const url: string = '/api/admin/formate'
    f = await run(() => $fetch<typeof formate.value[number]>(url, { method: 'POST', body: { name, ...k.format } }), `Format ${name} angelegt`)
    if (!f) return
    await formateNeu()
  }
  const { format: _f, geprueft, ...werte } = k
  form.value = { ...form.value, ...werte, id: 0, formatId: f.id, aktiv: true }
  hinweis.value = geprueft ? '' : 'Maße aus dem Katalog sind nicht nachgemessen. Vor dem Verkauf einen Testbogen drucken und prüfen.'
}

async function speichern() {
  const { id, ...body } = form.value
  const url: string = id ? `/api/admin/bogen/${id}` : '/api/admin/bogen'
  const ok = await run(() => $fetch<unknown>(url, { method: id ? 'PUT' : 'POST', body }), 'Bogen gespeichert')
  if (ok) {
    await refresh()
    form.value = leer()
    katalogWahl.value = ''
    hinweis.value = ''
  }
}
const formatName = (id: number) => formate.value.find(f => f.id === id)?.name ?? '?'
</script>

<template>
  <div class="grid gap-8">
    <h1 class="text-3xl">Etikettenbögen</h1>
    <div class="flaeche overflow-x-auto">
      <table class="tabelle">
        <thead><tr><th>Bogen</th><th>Format</th><th>Raster</th><th>Ränder oben/links</th><th>Abstände x/y</th><th>Status</th><th /></tr></thead>
        <tbody>
          <tr v-for="b in boegen" :key="b.id">
            <td><strong>{{ b.hersteller }} {{ b.artikelnr }}</strong><br><span class="text-sm text-[var(--color-tinte-weich)]">{{ b.name }}</span></td>
            <td>{{ b.format.name }}</td>
            <td class="tabular">{{ b.spalten }} × {{ b.zeilen }}</td>
            <td class="tabular">{{ b.randObenMm }} / {{ b.randLinksMm }} mm</td>
            <td class="tabular">{{ b.abstandXMm }} / {{ b.abstandYMm }} mm</td>
            <td>{{ b.aktiv ? 'Aktiv' : 'Inaktiv' }}</td>
            <td class="whitespace-nowrap">
              <a :href="`/api/bogen/${b.id}/testbogen`" target="_blank" class="underline mr-3">Testbogen</a>
              <button class="underline" @click="bearbeiten(b)">Bearbeiten</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <form class="flaeche p-5 grid gap-4" @submit.prevent="speichern">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="text-xl">{{ form.id ? `${form.artikelnr} bearbeiten` : 'Neuer Bogen' }}</h2>
        <div v-if="!form.id" class="flex flex-wrap items-end gap-2">
          <label class="feld">
            <span>Aus Liste übernehmen</span>
            <select v-model="katalogWahl" class="eingabe min-w-72">
              <option value="">Bekannte Bögen …</option>
              <option v-for="k in katalog" :key="k.artikelnr" :value="k.artikelnr">{{ k.hersteller }} {{ k.artikelnr }} – {{ k.name }}</option>
            </select>
          </label>
          <button type="button" class="btn btn-rand" :disabled="!katalogWahl" @click="ausKatalog">Übernehmen</button>
        </div>
      </div>
      <p v-if="hinweis" class="rounded-md bg-[var(--color-honig)]/25 px-3 py-2">{{ hinweis }}</p>
      <div class="grid sm:grid-cols-4 gap-4">
        <label class="feld"><span>Hersteller</span><input v-model="form.hersteller" class="eingabe" required></label>
        <label class="feld"><span>Artikelnummer</span><input v-model="form.artikelnr" class="eingabe" required></label>
        <label class="feld sm:col-span-2"><span>Bezeichnung</span><input v-model="form.name" class="eingabe" required></label>
        <label class="feld">
          <span>Etikettenformat</span>
          <select v-model.number="form.formatId" class="eingabe"><option v-for="f in formate" :key="f.id" :value="f.id">{{ f.name }}</option></select>
        </label>
        <label class="feld"><span>Seite Breite (mm)</span><input v-model.number="form.seiteBreiteMm" type="number" step="0.01" class="eingabe"></label>
        <label class="feld"><span>Seite Höhe (mm)</span><input v-model.number="form.seiteHoeheMm" type="number" step="0.01" class="eingabe"></label>
        <label class="flex gap-2 items-center self-end pb-3"><input v-model="form.aktiv" type="checkbox" class="size-4"> Aktiv</label>
        <label class="feld"><span>Spalten</span><input v-model.number="form.spalten" type="number" min="1" class="eingabe"></label>
        <label class="feld"><span>Zeilen</span><input v-model.number="form.zeilen" type="number" min="1" class="eingabe"></label>
        <label class="feld"><span>Rand oben (mm)</span><input v-model.number="form.randObenMm" type="number" step="0.01" class="eingabe"></label>
        <label class="feld"><span>Rand links (mm)</span><input v-model.number="form.randLinksMm" type="number" step="0.01" class="eingabe"></label>
        <label class="feld"><span>Abstand waagerecht (mm)</span><input v-model.number="form.abstandXMm" type="number" step="0.01" class="eingabe"></label>
        <label class="feld"><span>Abstand senkrecht (mm)</span><input v-model.number="form.abstandYMm" type="number" step="0.01" class="eingabe"></label>
      </div>
      <p class="text-sm text-[var(--color-tinte-weich)]">Abstand = Lücke zwischen zwei Etiketten. Etikettgröße kommt vom Format ({{ formatName(form.formatId) }}).</p>
      <div class="flex gap-3">
        <button class="btn btn-tinte" :disabled="busy">Speichern</button>
        <button v-if="form.id" type="button" class="btn btn-rand" @click="form = leer()">Abbrechen</button>
      </div>
    </form>
  </div>
</template>
