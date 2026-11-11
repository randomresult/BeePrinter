<script setup lang="ts">
const { loggedIn, clear } = useUserSession()
const route = useRoute()
const nav = [
  { to: '/admin', label: 'Designs', exact: true },
  { to: '/admin/boegen', label: 'Etikettenbögen' },
  { to: '/admin/themenwelten', label: 'Themenwelten' },
  { to: '/admin/bestellungen', label: 'Bestellungen' },
  { to: '/admin/hilfe', label: 'Hilfe' },
]
const aktiv = (item: { to: string, exact?: boolean }) => item.exact ? (route.path === item.to || route.path.startsWith('/admin/designs')) : route.path.startsWith(item.to)
async function abmelden() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-dvh">
    <header v-if="loggedIn" class="bg-[var(--color-tinte)] text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <NuxtLink to="/admin" class="flex items-center gap-2 font-bold text-lg" style="font-family: var(--font-display)"><UiBeeLogo class="h-7 w-9 bg-[var(--color-honig)] rounded-full p-0.5" />BeePrinter Verwaltung</NuxtLink>
        <nav class="flex flex-wrap gap-1 text-[0.95rem]">
          <NuxtLink
            v-for="item in nav" :key="item.to" :to="item.to"
            class="px-3 py-1.5 rounded-full"
            :class="aktiv(item) ? 'bg-[var(--color-honig)] text-[var(--color-tinte)] font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="ml-auto flex items-center gap-4 text-sm">
          <NuxtLink to="/" class="text-white/70 hover:text-white">Zum Shop</NuxtLink>
          <button class="text-white/70 hover:text-white hover:underline" @click="abmelden">Abmelden</button>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <slot />
    </main>
    <UiToast />
  </div>
</template>
