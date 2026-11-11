<script setup lang="ts">
import { euro, PAPIERE, type Papier } from '~/utils/format'

useHead({ title: 'BeePrinter – Honigetiketten selbst drucken' })
useSeoMeta({ description: 'Fertig gestaltete Honigetiketten mit allen Pflichtangaben. Design wählen, Angaben eintragen, druckfertiges PDF für Avery-Etikettenbögen herunterladen.' })

const { data: designs } = await useFetch('/api/designs', { default: () => [] })

const gruppen = computed(() => {
  const map = new Map<string, { name: string, designs: Array<typeof designs.value[number]> }>()
  for (const d of designs.value) {
    if (!map.has(d.themenwelt.slug)) map.set(d.themenwelt.slug, { name: d.themenwelt.name, designs: [] })
    map.get(d.themenwelt.slug)!.designs.push(d)
  }
  return [...map.values()]
})

const papierFuer = (i: number): Papier => PAPIERE[i % (PAPIERE.length - 1)]!.key

/** Drei gestapelte Etiketten im Hero, bevorzugt im Standardformat */
const heroLagen = [
  { papier: 'orange', stil: 'left: 4%; top: 9%; transform: rotate(-7deg)' },
  { papier: 'blau', stil: 'left: 24%; top: 30%; transform: rotate(4deg)' },
  { papier: 'gelb', stil: 'left: 11%; top: 52%; transform: rotate(-2deg)' },
] as const
const hero = computed(() => {
  const standard = designs.value.filter(d => d.format.startsWith('96'))
  return (standard.length >= 3 ? standard : designs.value).slice(0, 3)
})

/** Etikett für die Pflichtangaben-Erklärung: klassisches Dreispalten-Layout */
const pflichtDesign = computed(() => designs.value.find(d => d.slug === 'waldhonig') ?? hero.value[0])
const pflichtangaben = [
  // Positionen am Rand des jeweiligen Textes, damit die Nummern nichts verdecken
  { n: 1, x: '50%', y: '6%', titel: 'Verkehrsbezeichnung', text: 'Die Sorte, z. B. „Blütenhonig“ oder „Waldhonig“.' },
  { n: 2, x: '36%', y: '34%', titel: 'Herkunftsland', text: 'Zum Beispiel „aus Deutschland“.' },
  { n: 3, x: '42%', y: '44%', titel: 'Füllmenge', text: 'Nennfüllmenge in Gramm.' },
  { n: 4, x: '99%', y: '25%', titel: 'Mindesthaltbarkeit', text: '„Mindestens haltbar bis …“ mit Datum.' },
  { n: 5, x: '99%', y: '44%', titel: 'Losnummer', text: 'Damit sich jede Abfüllung zurückverfolgen lässt.' },
  { n: 6, x: '1%', y: '24%', titel: 'Name und Anschrift', text: 'Deine Imkerei als Abfüller.' },
]

const schritte = [
  { titel: 'Design wählen', text: 'Such dir eine Gestaltung aus, die zu deiner Imkerei und deiner Sorte passt.' },
  { titel: 'Angaben eintragen', text: 'Sorte, Füllmenge, MHD, Los und Anschrift – alles landet automatisch an der richtigen Stelle.' },
  { titel: 'PDF drucken', text: 'Druckfertig für deinen Avery-Etikettenbogen. Bogen einlegen, drucken, aufkleben.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="px-4 sm:px-10 max-w-[1240px] mx-auto pt-8 sm:pt-12 pb-20 sm:pb-24 flex flex-wrap items-center gap-16">
      <div class="flex-[1_1_480px] min-w-0 flex flex-col gap-7">
        <span class="self-start rounded-full bg-[var(--color-sand)] px-3.5 py-1.5 text-sm font-semibold text-[#5a4a33]">Für Imkereien jeder Größe</span>
        <h1 class="m-0 text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.02] tracking-[-0.025em]">
          Honigetiketten, die du <em class="italic font-medium text-[var(--color-bernstein)]">heute noch</em> aufs Glas klebst.
        </h1>
        <p class="m-0 max-w-[540px] text-[19px] leading-relaxed text-[var(--color-tinte-weich)]">
          Design aussuchen, Sorte, Füllmenge, MHD, Los und Anschrift eintragen – fertig ist ein druckfertiges PDF für deinen Avery-Etikettenbogen. Ohne Grafikprogramm, mit allen Pflichtangaben an der richtigen Stelle.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="#designs" class="btn btn-tinte !min-h-14 !px-7 text-[17px]">
            Designs ansehen
            <svg aria-hidden="true" viewBox="0 0 20 20" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10 H16 M11 5 L16 10 L11 15" /></svg>
          </a>
          <a href="#so-gehts" class="btn btn-rand !min-h-14 !px-7 text-[17px] !border-[var(--color-tinte)]">So funktioniert’s</a>
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-7 gap-y-3 text-[15px] font-medium text-[#3e362c]">
          <li v-for="v in ['Druckfertiges PDF', 'Für Avery-Etikettenbögen', 'Ohne Grafikprogramm']" :key="v" class="flex items-center gap-2">
            <svg aria-hidden="true" viewBox="0 0 20 20" class="size-[18px]" fill="none" stroke="var(--color-bernstein)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 L8 14.5 L16 6" /></svg>
            {{ v }}
          </li>
        </ul>
      </div>

      <div class="wabe flex-[1_1_460px] min-w-0 relative aspect-[1/0.86] rounded-[36px] bg-[var(--color-honig)] overflow-hidden" aria-hidden="true">
        <ClientOnly>
          <div v-for="(d, i) in hero" :key="d.slug" class="absolute w-[72%] drop-shadow-[0_18px_28px_rgba(60,35,0,0.28)]" :style="heroLagen[i]!.stil">
            <EtikettAufPapier :quelle="`/api/designs/${d.slug}/muster`" :papier="heroLagen[i]!.papier" alt="" />
          </div>
        </ClientOnly>
      </div>
    </section>

    <!-- So geht's -->
    <section id="so-gehts" class="scroll-mt-6 bg-[var(--color-blatt)] border-y border-[var(--color-linie)]">
      <div class="px-4 sm:px-10 max-w-[1240px] mx-auto py-20 sm:py-22 flex flex-col gap-12">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <h2 class="m-0 text-[2.25rem] sm:text-[44px] leading-[1.1] tracking-[-0.02em]">In drei Schritten<br>zum fertigen Etikett</h2>
          <p class="m-0 max-w-[380px] text-[var(--color-tinte-weich)]">Kein Layouten, kein Ausmessen. Du trägst nur ein, was auf dein Glas gehört.</p>
        </div>
        <ol class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          <li v-for="(s, i) in schritte" :key="s.titel" class="flex flex-col gap-3.5 p-8 rounded-3xl bg-[var(--color-kalk)]">
            <span class="text-[56px] leading-none italic font-normal text-[var(--color-bernstein)]" style="font-family: var(--font-display)">{{ i + 1 }}</span>
            <h3 class="m-0 text-[22px] font-semibold" style="font-family: var(--font-sans)">{{ s.titel }}</h3>
            <p class="m-0 text-base text-[var(--color-tinte-weich)]">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Designs -->
    <section id="designs" class="scroll-mt-6 px-4 sm:px-10 max-w-[1240px] mx-auto py-20 sm:py-24 flex flex-col gap-10">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex flex-col gap-3">
          <span class="text-sm font-semibold tracking-[0.12em] uppercase text-[var(--color-bernstein-dunkel)]">Kollektion</span>
          <h2 class="m-0 text-[2.25rem] sm:text-[44px] leading-[1.1] tracking-[-0.02em]">Designs für dein Glas</h2>
        </div>
        <p class="m-0 max-w-[400px] text-[var(--color-tinte-weich)]">Alle Vorschauen mit Beispieldaten. Deine eigenen Angaben trägst du im nächsten Schritt ein.</p>
      </div>

      <div v-for="g in gruppen" :key="g.name" class="flex flex-col gap-6">
        <h3 v-if="gruppen.length > 1" class="m-0 text-[28px] tracking-[-0.01em]">{{ g.name }}</h3>
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-x-9 gap-y-14">
          <li v-for="(d, i) in g.designs" :key="d.slug">
            <NuxtLink :to="`/design/${d.slug}`" class="group flex flex-col gap-3.5">
              <div class="relative flex items-center justify-center aspect-[4/3] px-[34px] py-10 rounded-3xl bg-[var(--color-sand-dunkel)]">
                <ClientOnly>
                  <div class="w-full -rotate-[1.2deg] transition-transform duration-200 group-hover:rotate-0 group-hover:scale-[1.02] drop-shadow-[0_12px_20px_rgba(60,35,0,0.20)]">
                    <EtikettAufPapier :quelle="`/api/designs/${d.slug}/muster`" :papier="papierFuer(i + g.name.length)" :alt="`Musteretikett ${d.name}`" />
                  </div>
                </ClientOnly>
                <span class="absolute top-3.5 left-3.5 rounded-full bg-[var(--color-kalk)] px-3 py-1 text-[13px] font-semibold text-[#3e362c]">{{ d.format }}</span>
              </div>
              <div class="mt-1.5 flex items-baseline justify-between gap-3">
                <h4 class="m-0 text-[26px] font-bold tracking-[-0.01em] leading-tight" style="font-family: var(--font-display)">{{ d.name }}</h4>
                <span class="text-lg font-semibold tabular whitespace-nowrap">{{ euro(d.preisCent) }}</span>
              </div>
              <p v-if="d.beschreibung" class="m-0 text-base text-[var(--color-tinte-weich)]">{{ d.beschreibung }}</p>
              <span class="inline-flex items-center gap-2 min-h-11 font-semibold underline-offset-4 group-hover:underline">
                Mit diesem Design starten
                <svg aria-hidden="true" viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10 H16 M11 5 L16 10 L11 15" /></svg>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
      <p v-if="!designs.length" class="text-[var(--color-tinte-weich)]">Noch keine Designs veröffentlicht.</p>
    </section>

    <!-- Pflichtangaben -->
    <section id="pflichtangaben" class="scroll-mt-6 bg-[var(--color-nacht)] text-[#f4eee2]">
      <div class="px-4 sm:px-10 max-w-[1240px] mx-auto py-20 sm:py-24 flex flex-wrap items-center gap-16 lg:gap-[72px]">
        <div v-if="pflichtDesign" class="flex-[1_1_520px] min-w-0 p-3 sm:p-6">
          <div class="relative">
            <ClientOnly>
              <EtikettAufPapier :quelle="`/api/designs/${pflichtDesign.slug}/muster`" papier="kraft" :alt="`Musteretikett ${pflichtDesign.name} mit markierten Pflichtangaben`" />
            </ClientOnly>
            <span
              v-for="m in pflichtangaben" :key="m.n" aria-hidden="true"
              class="absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center size-5 sm:size-[30px] rounded-full bg-[var(--color-honig)] text-[var(--color-tinte)] text-[11px] sm:text-sm font-bold shadow-[0_0_0_2px_var(--color-nacht)] sm:shadow-[0_0_0_3px_var(--color-nacht)]"
              :style="{ left: m.x, top: m.y }"
            >{{ m.n }}</span>
          </div>
        </div>
        <div class="flex-[1_1_420px] min-w-0 flex flex-col gap-7">
          <span class="text-sm font-semibold tracking-[0.12em] uppercase text-[var(--color-honig)]">Pflichtangaben</span>
          <h2 class="m-0 text-[2.25rem] sm:text-[44px] leading-[1.1] tracking-[-0.02em]">Alles drauf, was aufs Glas muss.</h2>
          <ol class="grid sm:grid-cols-2 gap-x-7 gap-y-5">
            <li v-for="m in pflichtangaben" :key="m.n" class="flex gap-3.5 items-start">
              <span class="flex-none grid place-items-center size-7 rounded-full bg-[var(--color-honig)] text-[var(--color-tinte)] text-[13px] font-bold">{{ m.n }}</span>
              <div class="flex flex-col gap-1">
                <strong class="text-[17px] font-semibold">{{ m.titel }}</strong>
                <span class="text-[15px] leading-snug text-[var(--color-nacht-text)]">{{ m.text }}</span>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Abschluss -->
    <section class="px-4 sm:px-10 max-w-[1240px] mx-auto py-20 sm:py-24">
      <div class="wabe relative overflow-hidden flex flex-wrap items-center justify-between gap-8 p-8 sm:p-16 rounded-[36px] bg-[var(--color-honig)]">
        <h2 class="relative m-0 max-w-[640px] text-[2.25rem] sm:text-5xl leading-[1.05] tracking-[-0.02em]">Dein Honig verdient ein Etikett, das nach dir aussieht.</h2>
        <a href="#designs" class="btn btn-tinte relative !min-h-15 !px-8 text-lg">
          Jetzt Design wählen
          <svg aria-hidden="true" viewBox="0 0 20 20" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10 H16 M11 5 L16 10 L11 15" /></svg>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Wabenmuster als Hintergrund der Honigflächen */
.wabe {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34.64' height='60'%3E%3Cpath d='M17.32 0 V10 L0 20 V40 L17.32 50 V60 M17.32 50 L34.64 40 V20 L17.32 10' fill='none' stroke='rgba(31,26,20,0.10)' stroke-width='1.5'/%3E%3C/svg%3E");
}
</style>
