# 0001 – Nuxt 4 mit SQLite statt Next.js/Laravel/PostgreSQL

Die Anforderungsmail empfahl Next.js + Laravel/Node + PostgreSQL. Wir bauen auf dem bewährten Setup aus `flohmarkt-app` (Nuxt 4, Nitro-Server-Routen, Drizzle + better-sqlite3, nuxt-auth-utils), weil es nur Gastbestellungen und einen Admin gibt, die Last klein ist und dasselbe Team das Setup bereits betreibt. Ein späterer Wechsel auf PostgreSQL bleibt über Drizzle machbar, ist aber nicht geplant.
