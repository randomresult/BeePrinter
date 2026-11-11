<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Themenwelten – BeePrinter Verwaltung' })

const { data: liste, refresh } = await useFetch('/api/admin/themenwelten', { default: () => [] })
const { busy, run } = useAction()
const neu = reactive({ name: '', slug: '', sortierung: 10 })

async function speichern(t: { id: number, name: string, slug: string, sortierung: number }) {
  const url: string = `/api/admin/themenwelten/${t.id}`
  await run(() => $fetch<unknown>(url, { method: 'PUT', body: t }), 'Gespeichert')
}
async function anlegen() {
  const url: string = '/api/admin/themenwelten'
  const ok = await run(() => $fetch<unknown>(url, { method: 'POST', body: neu }), 'Themenwelt angelegt')
  if (ok) { Object.assign(neu, { name: '', slug: '', sortierung: 10 }); await refresh() }
}
</script>

<template>
  <div class="grid gap-8 max-w-3xl">
    <h1 class="text-3xl">Themenwelten</h1>
    <div class="flaeche p-4 grid gap-3">
      <form v-for="t in liste" :key="t.id" class="grid grid-cols-[2fr_1.5fr_6rem_auto] gap-3 items-end" @submit.prevent="speichern(t)">
        <label class="feld"><span>Name</span><input v-model="t.name" class="eingabe"></label>
        <label class="feld"><span>Kürzel</span><input v-model="t.slug" class="eingabe"></label>
        <label class="feld"><span>Reihenfolge</span><input v-model.number="t.sortierung" type="number" class="eingabe"></label>
        <button class="btn btn-rand" :disabled="busy">Speichern</button>
      </form>
    </div>
    <form class="flaeche p-4 grid grid-cols-[2fr_1.5fr_6rem_auto] gap-3 items-end" @submit.prevent="anlegen">
      <label class="feld"><span>Neue Themenwelt</span><input v-model="neu.name" class="eingabe" placeholder="z. B. Firmenpräsente" required></label>
      <label class="feld"><span>Kürzel</span><input v-model="neu.slug" class="eingabe" placeholder="firmen" required></label>
      <label class="feld"><span>Reihenfolge</span><input v-model.number="neu.sortierung" type="number" class="eingabe"></label>
      <button class="btn btn-tinte" :disabled="busy">Anlegen</button>
    </form>
  </div>
</template>
