<template>
  <div class="min-h-dvh flex flex-col">
    <header class="px-4 sm:px-10 py-6 max-w-[1240px] w-full mx-auto flex flex-wrap items-center justify-between gap-4">
      <NuxtLink to="/" class="group flex items-center gap-2.5" aria-label="BeePrinter – zur Startseite">
        <UiBeeLogo class="h-9 w-[47px] -rotate-3 transition-transform duration-300 group-hover:rotate-3 group-hover:translate-x-0.5" />
        <span class="text-[22px] font-bold tracking-[-0.01em]" style="font-family: var(--font-display)">Bee<span class="font-normal italic">Printer</span></span>
      </NuxtLink>
      <nav aria-label="Hauptnavigation" class="flex flex-wrap items-center gap-x-7 gap-y-2 font-medium">
        <NuxtLink to="/#so-gehts" class="hover:text-[var(--color-bernstein-dunkel)]">So geht’s</NuxtLink>
        <NuxtLink to="/#designs" class="hover:text-[var(--color-bernstein-dunkel)]">Designs</NuxtLink>
        <NuxtLink to="/#pflichtangaben" class="hover:text-[var(--color-bernstein-dunkel)]">Pflichtangaben</NuxtLink>
        <NuxtLink to="/#designs" class="btn btn-tinte">Etikett gestalten</NuxtLink>
      </nav>
    </header>
    <main class="flex-1">
      <slot />
    </main>
    <footer class="border-t border-[var(--color-linie)]">
      <div class="px-4 sm:px-10 py-8 max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-4 text-[15px] text-[var(--color-tinte-weich)]">
        <span>© BeePrinter – Honigetiketten zum Selbstdrucken, eine Idee der Imkerei Stadler</span>
        <nav aria-label="Rechtliches" class="flex gap-6">
          <NuxtLink to="/impressum" class="underline-offset-4 hover:underline">Impressum</NuxtLink>
          <NuxtLink to="/admin" class="underline-offset-4 hover:underline">Verwaltung</NuxtLink>
        </nav>
      </div>
    </footer>
  </div>
</template>
