<script setup lang="ts">
import { euro } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Designs – BeePrinter Verwaltung' })

const { data: designs } = await useFetch('/api/admin/designs', { default: () => [] })
const { data: themenwelten } = await useFetch('/api/admin/themenwelten', { default: () => [] })
const { data: formate } = await useFetch('/api/admin/formate', { default: () => [] })
const { busy, run } = useAction()

const neu = reactive({ name: '', slug: '', themenweltId: 0, formatId: 0 })
watchEffect(() => {
  if (!neu.themenweltId && themenwelten.value[0]) neu.themenweltId = themenwelten.value[0].id
  if (!neu.formatId && formate.value[0]) neu.formatId = formate.value[0].id
})
watch(() => neu.name, (n) => {
  neu.slug = n.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
})
async function anlegen() {
  const url: string = '/api/admin/designs'
  const d = await run(() => $fetch<{ id: number }>(url, { method: 'POST', body: neu }), 'Design angelegt')
  if (d) await navigateTo(`/admin/designs/${d.id}`)
}
</script>

<template>
  <div class="grid gap-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="text-3xl">Designs</h1>
    </div>

    <div class="flaeche overflow-x-auto">
      <table class="tabelle">
        <thead><tr><th>Name</th><th>Themenwelt</th><th>Format</th><th>Preis</th><th>Status</th><th>Verkauft</th></tr></thead>
        <tbody>
          <tr v-for="d in designs" :key="d.id">
            <td><NuxtLink :to="`/admin/designs/${d.id}`" class="font-bold underline underline-offset-2">{{ d.name }}</NuxtLink></td>
            <td>{{ d.themenwelt }}</td>
            <td>{{ d.format }}</td>
            <td class="tabular">{{ euro(d.preisCent) }}</td>
            <td>
              <span v-if="d.veroeffentlicht" class="font-bold">Veröffentlicht</span>
              <span v-else class="text-[var(--color-tinte-weich)]">Entwurf{{ d.hatHintergrund ? '' : ', ohne Hintergrund' }}</span>
            </td>
            <td class="tabular">{{ d.verkauft }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <form class="flaeche p-5 grid sm:grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 items-end" @submit.prevent="anlegen">
      <label class="feld"><span>Neues Design</span><input v-model="neu.name" class="eingabe" placeholder="z. B. Osterhonig" required></label>
      <label class="feld"><span>Kürzel (URL)</span><input v-model="neu.slug" class="eingabe" required></label>
      <label class="feld">
        <span>Themenwelt</span>
        <select v-model.number="neu.themenweltId" class="eingabe"><option v-for="t in themenwelten" :key="t.id" :value="t.id">{{ t.name }}</option></select>
      </label>
      <label class="feld">
        <span>Etikettenformat</span>
        <select v-model.number="neu.formatId" class="eingabe"><option v-for="f in formate" :key="f.id" :value="f.id">{{ f.name }}</option></select>
      </label>
      <button class="btn btn-tinte" :disabled="busy || !neu.name">Anlegen</button>
    </form>
  </div>
</template>
