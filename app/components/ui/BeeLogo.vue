<script setup lang="ts">
/** BeePrinter-Logo: flotte Biene im Flug, mit Tempolinien. Rein dekorativ. */
</script>

<template>
  <svg viewBox="0 0 52 40" aria-hidden="true" fill="none" stroke="var(--color-tinte)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- Tempolinien -->
    <path d="M2 21 H10 M4 27 H12 M7 15 H12" stroke-width="2.2" />
    <g transform="rotate(-18 30 24)">
      <!-- Flügel -->
      <ellipse cx="25" cy="11" rx="6" ry="9" transform="rotate(-25 25 11)" fill="#fffcf6" />
      <ellipse cx="33" cy="12" rx="5" ry="8" transform="rotate(18 33 12)" fill="#fffcf6" />
      <!-- Stachel -->
      <path d="M17 24 L12.5 25.5 L17 27" fill="var(--color-tinte)" />
      <!-- Körper mit Streifen -->
      <clipPath id="beeprinter-koerper"><ellipse cx="28" cy="25" rx="11.5" ry="8.5" /></clipPath>
      <ellipse cx="28" cy="25" rx="11.5" ry="8.5" fill="var(--color-honig)" stroke="none" />
      <g clip-path="url(#beeprinter-koerper)" fill="var(--color-tinte)" stroke="none">
        <rect x="21" y="14" width="3.6" height="22" />
        <rect x="28" y="14" width="3.6" height="22" />
      </g>
      <ellipse cx="28" cy="25" rx="11.5" ry="8.5" />
      <!-- Kopf -->
      <circle cx="41.5" cy="23" r="5.5" fill="var(--color-tinte)" stroke="none" />
      <circle cx="43.4" cy="21.6" r="1.4" fill="#fffcf6" stroke="none" />
      <!-- Fühler -->
      <path d="M41 17.8 Q41 12 37.5 10 M44 18.5 Q46.5 13 45 9.5" stroke-width="1.6" />
      <circle cx="37.5" cy="10" r="1.3" fill="var(--color-tinte)" stroke="none" />
      <circle cx="45" cy="9.5" r="1.3" fill="var(--color-tinte)" stroke="none" />
    </g>
  </svg>
</template>
