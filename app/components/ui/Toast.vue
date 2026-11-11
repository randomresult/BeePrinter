<script setup lang="ts">
const { toast } = useToast()
</script>

<template>
  <div aria-live="polite" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md pointer-events-none">
    <Transition enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0" enter-active-class="transition" leave-active-class="transition">
      <div v-if="toast" class="rounded-xl px-4 py-3 font-bold shadow-lg pointer-events-auto" :class="toast.kind === 'ok' ? 'bg-[var(--color-tinte)] text-white' : 'bg-[var(--color-fehler)] text-white'">
        {{ toast.text }}
      </div>
    </Transition>
  </div>
</template>
