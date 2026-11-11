<script setup lang="ts">
import { datumZeit, euro } from '~/utils/format'

const route = useRoute()
const token = route.params.token as string
const { data: b, error, refresh } = await useFetch(`/api/bestellung/${token}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Bestellung nicht gefunden', fatal: true })
useHead({ title: 'Deine Etiketten – BeePrinter', meta: [{ name: 'robots', content: 'noindex' }] })

// Nach der Rückkehr von Stripe kann der Webhook ein paar Sekunden brauchen
let versuche = 0
let timer: ReturnType<typeof setTimeout> | undefined
function warten() {
  if (b.value?.status !== 'offen' || versuche++ > 15) return
  timer = setTimeout(async () => { await refresh(); warten() }, 2000)
}
onMounted(warten)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div v-if="b" class="px-4 sm:px-8 max-w-3xl mx-auto pb-16">
    <template v-if="b.status === 'bezahlt'">
      <h1 class="text-4xl sm:text-5xl">Deine Etiketten sind fertig.</h1>
      <p class="mt-3 text-lg text-[var(--color-tinte-weich)]">
        {{ b.design.name }} – {{ b.daten.honigsorte }}, {{ b.daten.fuellmengeG }} g, Los {{ b.daten.los }}.
        Den Link zu dieser Seite haben wir dir auch per E-Mail geschickt.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a :href="`/api/bestellung/${token}/pdf?download=1`" class="btn btn-kaufen text-lg min-h-[3.25rem]">PDF herunterladen</a>
        <a :href="`/api/bestellung/${token}/pdf`" target="_blank" class="btn btn-rand min-h-[3.25rem]">Im Browser öffnen</a>
      </div>

      <section class="mt-12 flaeche p-6">
        <h2 class="text-2xl">So druckst du richtig</h2>
        <ol class="mt-4 grid gap-3 list-decimal pl-5">
          <li>Leg einen Bogen <strong>{{ b.bogen }}</strong> ein – farbig oder weiß, ganz wie du magst.</li>
          <li>Im Druckdialog <strong>„Tatsächliche Größe“</strong> bzw. <strong>100 %</strong> wählen. „An Seite anpassen“ verschiebt die Etiketten.</li>
          <li>Unsicher? Druck zuerst den <a :href="`/api/bogen/${b.bogenId}/testbogen`" target="_blank" class="underline">Testbogen</a> auf Normalpapier und halt ihn gegen das Licht auf den Etikettenbogen.</li>
        </ol>
      </section>

      <section class="mt-10">
        <h2 class="text-2xl">Neue Charge?</h2>
        <p class="mt-2 text-[var(--color-tinte-weich)]">Dieses PDF bleibt so, wie es ist. Für eine neue Losnummer oder ein anderes MHD öffnest du das Formular mit deinen Angaben und kaufst ein neues PDF.</p>
        <NuxtLink :to="`/design/${b.design.slug}?von=${token}`" class="btn btn-tinte mt-4">Mit meinen Angaben neu anlegen</NuxtLink>
      </section>
      <p class="mt-10 text-sm text-[var(--color-tinte-weich)]">Bezahlt am {{ datumZeit(b.bezahltAm!) }}, {{ euro(b.betragCent) }}</p>
    </template>

    <template v-else>
      <h1 class="text-4xl">Zahlung wird bestätigt …</h1>
      <p class="mt-3 text-[var(--color-tinte-weich)]">Das dauert meist nur ein paar Sekunden. Diese Seite aktualisiert sich von selbst.</p>
      <p class="mt-6 text-sm text-[var(--color-tinte-weich)]">Zahlung abgebrochen? <NuxtLink :to="`/design/${b.design.slug}?von=${token}`" class="underline">Zurück zum Formular</NuxtLink></p>
    </template>
  </div>
</template>
