import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['pdfjs-dist'] },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      title: 'BeePrinter – Honigetiketten selbst drucken',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..800&family=Instrument+Sans:wght@400;500;600;700&display=swap' },
      ],
    },
  },
  runtimeConfig: {
    databasePath: '.data/db.sqlite',
    migrationsDir: 'server/db/migrations',
    dateienDir: '.data/dateien',
    adminEmail: '',
    adminPasswordHash: '',
    trustProxy: false,
    mailFrom: 'BeePrinter <etiketten@example.org>',
    smtp: { host: 'localhost', port: 1025, secure: false, user: '', pass: '' },
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    public: { siteUrl: 'http://localhost:3000' },
  },
  nitro: {
    preset: 'node-server',
  },
})
