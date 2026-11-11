# --- Build ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Laufzeit ---
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production TZ=Europe/Berlin PORT=3000 \
    NUXT_DATABASE_PATH=/data/db.sqlite NUXT_MIGRATIONS_DIR=/app/migrations NUXT_DATEIEN_DIR=/data/dateien
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/db/migrations ./migrations
VOLUME /data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
