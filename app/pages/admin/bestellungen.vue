<script setup lang="ts">
import { datumZeit, euro } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Bestellungen – BeePrinter Verwaltung' })
const { data: liste } = await useFetch('/api/admin/bestellungen', { default: () => [] })
const umsatz = computed(() => liste.value.filter(b => b.status === 'bezahlt').reduce((s, b) => s + b.betragCent, 0))
</script>

<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-baseline justify-between gap-4">
      <h1 class="text-3xl">Bestellungen</h1>
      <p>Bezahlt gesamt: <strong class="tabular">{{ euro(umsatz) }}</strong></p>
    </div>
    <div class="flaeche overflow-x-auto">
      <table class="tabelle">
        <thead><tr><th>Datum</th><th>Design</th><th>Imkerei</th><th>Honig</th><th>E-Mail</th><th>Betrag</th><th>Status</th><th /></tr></thead>
        <tbody>
          <tr v-for="b in liste" :key="b.id">
            <td class="tabular whitespace-nowrap">{{ datumZeit(b.erstelltAm) }}</td>
            <td>{{ b.design }}</td>
            <td>{{ b.daten.imkerei }}<br><span class="text-sm text-[var(--color-tinte-weich)]">{{ b.daten.plz }} {{ b.daten.ort }}</span></td>
            <td>{{ b.daten.honigsorte }}, {{ b.daten.fuellmengeG }} g<br><span class="text-sm text-[var(--color-tinte-weich)]">Los {{ b.daten.los }}</span></td>
            <td>{{ b.email }}</td>
            <td class="tabular">{{ euro(b.betragCent) }}</td>
            <td :class="b.status === 'bezahlt' ? 'font-bold' : 'text-[var(--color-tinte-weich)]'">{{ b.status === 'bezahlt' ? 'Bezahlt' : 'Offen' }}</td>
            <td><a v-if="b.status === 'bezahlt'" :href="`/bestellung/${b.token}`" target="_blank" class="underline">Ansehen</a></td>
          </tr>
          <tr v-if="!liste.length"><td colspan="8" class="text-[var(--color-tinte-weich)]">Noch keine Bestellungen.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
