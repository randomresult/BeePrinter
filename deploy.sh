#!/usr/bin/env bash
# deploy.sh – BeePrinter (wabengut) per SSH auf Raspberry Pi deployen.
#
# Nutzung:
#   ./deploy.sh                 # auto: Docker falls auf dem Pi vorhanden, sonst pm2
#   ./deploy.sh --seed          # zusätzlich Beispieldaten anlegen (idempotent)
#   ./deploy.sh --mode pm2      # Modus erzwingen (docker|pm2)
#   ./deploy.sh --env-file .env.pi
#
# Überschreibbar per Umgebung: PI_HOST PI_USER APP_NAME APP_PORT REMOTE_DIR MODE ENV_FILE
# Voraussetzung auf dem Pi: SSH-Key-Login, sudo ohne Passwort (Standard bei Raspberry Pi OS).
set -Eeuo pipefail

PI_HOST="${PI_HOST:-192.168.1.100}"
PI_USER="${PI_USER:-pi}"
APP_NAME="${APP_NAME:-wabengut}"
APP_PORT="${APP_PORT:-3000}"
REMOTE_DIR="${REMOTE_DIR:-/home/${PI_USER}/${APP_NAME}}"
DATA_DIR="${DATA_DIR:-/home/${PI_USER}/${APP_NAME}-data}"   # nur pm2-Modus
MODE="${MODE:-auto}"
ENV_FILE="${ENV_FILE:-.env}"
SEED=0

TARGET="${PI_USER}@${PI_HOST}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSH_OPTS=(-o ConnectTimeout=10 -o ControlMaster=auto -o ControlPersist=120
          -o "ControlPath=${HOME}/.ssh/cm-%r@%h:%p")

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }
trap 'die "Abbruch in Zeile $LINENO"' ERR

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)     SEED=1; shift ;;
    --mode)     MODE="${2:?--mode braucht docker|pm2}"; shift 2 ;;
    --env-file) ENV_FILE="${2:?--env-file braucht Pfad}"; shift 2 ;;
    -h|--help)  usage ;;
    *)          die "Unbekannte Option: $1" ;;
  esac
done

rsh() { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }

# Variablen sicher gequotet an Remote-Shell übergeben
remote_vars() {
  local out="" v
  for v in "$@"; do out+="${v}=$(printf '%q' "${!v}") "; done
  printf '%s' "$out"
}

# --- 1. Lokale Checks --------------------------------------------------------
cd "$SCRIPT_DIR"
for bin in ssh rsync curl awk; do
  command -v "$bin" >/dev/null || die "$bin fehlt lokal"
done
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE nicht gefunden (Vorlage: .env.example)"
[[ -f package.json && -f nuxt.config.ts ]] || die "Script muss im Projekt-Root liegen"

log "Verbindung zu $TARGET prüfen"
rsh true || die "SSH zu $TARGET fehlgeschlagen (ssh-copy-id $TARGET?)"

# --- 2. Pi vorbereiten + Modus bestimmen -------------------------------------
log "Pi vorbereiten"
rsh "$(remote_vars REMOTE_DIR) bash -s" <<'REMOTE'
set -euo pipefail
command -v rsync >/dev/null || { sudo apt-get update -qq && sudo apt-get install -y -qq rsync; }
mkdir -p "$REMOTE_DIR"
REMOTE

if [[ "$MODE" == auto ]]; then
  if rsh 'command -v docker >/dev/null'; then MODE=docker; else MODE=pm2; fi
fi
[[ "$MODE" == docker || "$MODE" == pm2 ]] || die "MODE muss docker oder pm2 sein"
log "Modus: $MODE"

# --- 3. Projektdateien übertragen --------------------------------------------
# Ausgeschlossene Pfade sind vor --delete geschützt (Build-Artefakte, Daten, Env bleiben).
log "Dateien synchronisieren"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude '.git/' --exclude 'node_modules/' --exclude '.nuxt/' --exclude '.output/' \
  --exclude '.data/' --exclude '.env' --exclude '.env.*' \
  --exclude '.playwright-mcp/' --exclude 'shots/' --exclude 'Fotos/' \
  --exclude '.DS_Store' --exclude '*.log' \
  ./ "${TARGET}:${REMOTE_DIR}/"
# .env.example trotzdem mitnehmen (wird von --exclude '.env.*' sonst erfasst)
rsync -az -e "ssh ${SSH_OPTS[*]}" .env.example "${TARGET}:${REMOTE_DIR}/.env.example"

# --- 4. Umgebungsvariablen bereinigen + übertragen ---------------------------
log "Umgebungsvariablen aus $ENV_FILE aufbereiten"
TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

# Kommentare/Leerzeilen raus, "export " und umschließende Quotes entfernen,
# Pfad-/Laufzeit-Keys raus (werden unten pro Modus gesetzt).
awk '
  /^[[:space:]]*(#|$)/ { next }
  {
    sub(/^[[:space:]]*export[[:space:]]+/, "")
    eq = index($0, "="); if (eq == 0) next
    key = substr($0, 1, eq - 1); val = substr($0, eq + 1)
    if (key ~ /^(NUXT_DATABASE_PATH|NUXT_DATEIEN_DIR|NUXT_MIGRATIONS_DIR|PORT|NODE_ENV)$/) next
    if (val ~ /^".*"$/ || val ~ /^\x27.*\x27$/) val = substr(val, 2, length(val) - 2)
    print key "=" val
  }' "$ENV_FILE" > "$TMP_ENV"

env_val() { grep -E "^$1=" "$TMP_ENV" | tail -n1 | cut -d= -f2- || true; }

# nuxt-auth-utils liest NUXT_SESSION_PASSWORD (>= 32 Zeichen), nicht NUXT_APP_SECRET
if [[ -z "$(env_val NUXT_SESSION_PASSWORD)" ]]; then
  secret="$(env_val NUXT_APP_SECRET)"
  [[ -n "$secret" ]] || die "NUXT_SESSION_PASSWORD fehlt in $ENV_FILE (openssl rand -base64 32)"
  warn "NUXT_SESSION_PASSWORD fehlt – übernehme NUXT_APP_SECRET"
  echo "NUXT_SESSION_PASSWORD=$secret" >> "$TMP_ENV"
fi
sp="$(env_val NUXT_SESSION_PASSWORD)"
(( ${#sp} >= 32 )) || die "NUXT_SESSION_PASSWORD muss mindestens 32 Zeichen haben"
[[ -n "$(env_val NUXT_ADMIN_PASSWORD_HASH)" ]] || warn "NUXT_ADMIN_PASSWORD_HASH leer – kein Admin-Login möglich"
[[ "$(env_val NUXT_PUBLIC_SITE_URL)" == *localhost* ]] \
  && warn "NUXT_PUBLIC_SITE_URL zeigt auf localhost – Links in Mails/Stripe-Redirects falsch"

{
  echo "NODE_ENV=production"
  if [[ "$MODE" == pm2 ]]; then
    echo "PORT=${APP_PORT}"
    echo "NUXT_DATABASE_PATH=${DATA_DIR}/db.sqlite"
    echo "NUXT_DATEIEN_DIR=${DATA_DIR}/dateien"
    echo "NUXT_MIGRATIONS_DIR=${REMOTE_DIR}/server/db/migrations"
  else
    echo "PORT=3000"
  fi
} >> "$TMP_ENV"

rsync -a --chmod=F600 -e "ssh ${SSH_OPTS[*]}" "$TMP_ENV" "${TARGET}:${REMOTE_DIR}/.env.production"

# --- 5a. Docker ---------------------------------------------------------------
deploy_docker() {
  log "Docker-Image bauen und Container ersetzen (erster Build auf dem Pi dauert)"
  rsh "$(remote_vars APP_NAME APP_PORT REMOTE_DIR SEED) bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
D="docker"; docker info >/dev/null 2>&1 || D="sudo docker"

$D build -t "${APP_NAME}:latest" .
$D volume create "${APP_NAME}-data" >/dev/null

if [ "$SEED" = 1 ]; then
  # Build-Stage enthält tsx + Quellcode; Layer sind gecacht
  $D build --target build -t "${APP_NAME}:build" .
  $D run --rm -v "${APP_NAME}-data:/data" \
    -e TZ=Europe/Berlin -e NUXT_DATABASE_PATH=/data/db.sqlite -e NUXT_DATEIEN_DIR=/data/dateien \
    "${APP_NAME}:build" npx tsx scripts/seed.ts
fi

$D rm -f "$APP_NAME" >/dev/null 2>&1 || true
$D run -d --name "$APP_NAME" --restart unless-stopped \
  --env-file "$REMOTE_DIR/.env.production" \
  -v "${APP_NAME}-data:/data" \
  -p "${APP_PORT}:3000" \
  "${APP_NAME}:latest" >/dev/null
$D image prune -f >/dev/null
REMOTE
}

# --- 5b. pm2 ------------------------------------------------------------------
deploy_pm2() {
  log "Node 22 + pm2 einrichten, bauen, starten"
  rsh "$(remote_vars APP_NAME REMOTE_DIR DATA_DIR SEED) bash -s" <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

node_major() { node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0; }
if [ "$(node_major)" != 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
# Build-Tools für better-sqlite3/sharp, falls keine Prebuilds passen
sudo apt-get install -y -qq build-essential python3 || true
command -v pm2 >/dev/null || sudo npm install -g pm2

cd "$REMOTE_DIR"
ENVF="$REMOTE_DIR/.env.production"
mkdir -p "$DATA_DIR/dateien"

npm ci --no-audit --no-fund
npm run build

if [ "$SEED" = 1 ]; then
  npx tsx --env-file="$ENVF" scripts/seed.ts
fi

pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
pm2 start .output/server/index.mjs --name "$APP_NAME" --cwd "$REMOTE_DIR" \
  --node-args="--env-file=$ENVF" --time
pm2 save >/dev/null

# Autostart nach Reboot (idempotent)
sudo env PATH="$PATH:$(dirname "$(command -v node)")" \
  "$(command -v pm2)" startup systemd -u "$USER" --hp "$HOME" >/dev/null
REMOTE
}

"deploy_${MODE}"

# --- 6. Healthcheck -------------------------------------------------------------
URL="http://${PI_HOST}:${APP_PORT}/"
log "Healthcheck $URL"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "$URL"; then
    log "Fertig – BeePrinter läuft auf $URL (Modus: $MODE)"
    exit 0
  fi
  sleep 2
done
if [[ "$MODE" == docker ]]; then hint="docker logs $APP_NAME"; else hint="pm2 logs $APP_NAME"; fi
die "Keine Antwort von $URL – Logs: ssh $TARGET '$hint'"
