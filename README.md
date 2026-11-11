# BeePrinter – Honig-Etikettengenerator

Imker wählen ein fertiges Honigetikett-Design, tragen ihre Pflichtangaben ein und kaufen ein druckfertiges A4-PDF für Avery-Etikettenbögen. Fachbegriffe: [CONTEXT.md](CONTEXT.md), Entscheidungen: [docs/adr](docs/adr).

## Start

```bash
nvm use            # Node 22
npm install
cp .env.example .env   # Admin-Hash: npm run admin:hash -- 'passwort'; NUXT_APP_SECRET: openssl rand -base64 32
npm run db:seed        # Format 96 × 50,8, Bogen L4744REV, 8 Beispiel-Designs
npm run dev
```

- Shop: http://localhost:3000, Verwaltung: /admin
- Ohne `NUXT_STRIPE_SECRET_KEY` wird die Zahlung **nur im Dev-Modus** simuliert.
- Stripe lokal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, Secret in `NUXT_STRIPE_WEBHOOK_SECRET`.
- Mails lokal: `docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit`

## Aufbau

- `shared/render/` – Renderer (pdf-lib): Hintergrund-PDF + Slots → Etikett oder ganzer Bogen. Auto-Fit, Wasserzeichen, Rotation.
- `shared/etikettendaten.ts` – Pflichtangaben, Validierung (zod), Platzhalter wie `{mhd}`.
- `server/services/` – Bestellung (friert Druck-PDF beim Checkout ein), Logo → Schwarz/Transparent (sharp), Mail.
- `server/data/` – Avery-Katalog (Ausgangswerte für neue Bögen) und Beispiel-Designs (selbst gezeichnete Platzhalter-Grafiken).
- Schriften: `server/assets/fonts/` – nur SIL-OFL-Schriften, Lizenzen liegen daneben.

## Vor dem Livegang

- Ränder von L4744REV an einem echten Bogen nachmessen (Testbogen in der Verwaltung).
- Echte Grafiken als Hintergrund-PDF hochladen (1 Seite, Etikettgröße, nur Schwarz, ohne variable Texte).
- Impressum, Datenschutz, AGB, Widerrufsbelehrung ergänzen.
