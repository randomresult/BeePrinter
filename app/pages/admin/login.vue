<script setup lang="ts">
import { apiFehler } from '~/utils/format'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Anmelden – BeePrinter Verwaltung' })

const { loggedIn, fetch: sessionLaden } = useUserSession()
if (loggedIn.value) await navigateTo('/admin')

const email = ref('')
const passwort = ref('')
const fehler = ref('')
const laeuft = ref(false)
async function anmelden() {
  laeuft.value = true
  fehler.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: passwort.value } })
    await sessionLaden()
    await navigateTo('/admin')
  }
  catch (err) {
    fehler.value = apiFehler(err)
  }
  finally {
    laeuft.value = false
  }
}
</script>

<template>
  <div class="min-h-[70dvh] grid place-items-center">
    <form class="flaeche p-6 sm:p-8 w-full max-w-sm grid gap-4" @submit.prevent="anmelden">
      <h1 class="text-2xl">Verwaltung</h1>
      <label class="feld">
        <span>E-Mail</span>
        <input v-model="email" type="email" class="eingabe" autocomplete="username" required>
      </label>
      <label class="feld">
        <span>Passwort</span>
        <input v-model="passwort" type="password" class="eingabe" autocomplete="current-password" required>
      </label>
      <p v-if="fehler" role="alert" class="fehlertext">{{ fehler }}</p>
      <button class="btn btn-tinte" :disabled="laeuft">{{ laeuft ? 'Anmelden …' : 'Anmelden' }}</button>
    </form>
  </div>
</template>
