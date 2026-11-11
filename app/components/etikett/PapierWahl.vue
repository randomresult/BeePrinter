<script setup lang="ts">
import { PAPIERE, type Papier } from '~/utils/format'

const papier = defineModel<Papier>({ required: true })
</script>

<template>
  <fieldset class="flex flex-wrap items-center gap-2">
    <legend class="sr-only">Papierfarbe für die Vorschau</legend>
    <label v-for="p in PAPIERE" :key="p.key" class="relative cursor-pointer" :title="p.name">
      <input v-model="papier" type="radio" name="papier" :value="p.key" class="peer sr-only">
      <span
        class="block size-8 rounded-full border-2 border-[var(--color-linie)] peer-checked:border-[var(--color-tinte)] peer-checked:ring-2 peer-checked:ring-[var(--color-tinte)] peer-checked:ring-offset-2 peer-checked:ring-offset-[var(--color-kalk)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2"
        :style="{ background: `var(--color-papier-${p.key})` }"
      />
      <span class="sr-only">{{ p.name }}</span>
    </label>
  </fieldset>
</template>
