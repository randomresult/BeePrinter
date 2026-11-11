// DB beim Start öffnen und migrieren, damit Fehler sofort sichtbar sind
export default defineNitroPlugin(() => {
  useDb()
})
