#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${TENEBIRIS_APP_DIR:-/opt/data/Tenebiris Office/Tenebiris-Office-v1}"
EXPECTED_SHA="${1:?expected commit SHA is required}"
PID_FILE="$APP_DIR/.tenebiris.pid"
LOG_FILE="${TENEBIRIS_LOG_FILE:-/opt/data/logs/tenebiris-office.log}"
LOCK_DIR="${TENEBIRIS_DEPLOY_LOCK:-/opt/data/cache/tenebiris-deploy.lock}"

cleanup_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  printf 'Another Tenebiris deployment is running.\n' >&2
  exit 1
fi
trap cleanup_lock EXIT

cd "$APP_DIR"
git fetch origin main
git merge --ff-only origin/main

ACTUAL_SHA="$(git rev-parse HEAD)"
if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
  printf 'Commit mismatch: expected %s, got %s\n' "$EXPECTED_SHA" "$ACTUAL_SHA" >&2
  exit 1
fi

npm ci
npm test
npm run lint
npm run build

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID"
    for _ in {1..30}; do
      kill -0 "$OLD_PID" 2>/dev/null || break
      sleep 1
    done
  fi
fi

pkill -f 'vite --port=3000 --host=0.0.0.0' 2>/dev/null || true
mkdir -p "$(dirname "$LOG_FILE")"
nohup npm start >>"$LOG_FILE" 2>&1 &
NEW_PID=$!
printf '%s\n' "$NEW_PID" >"$PID_FILE"

for _ in {1..30}; do
  if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/ >/dev/null; then
    break
  fi
  sleep 1
done
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/ >/dev/null
curl --fail --silent --show-error --max-time 150 http://127.0.0.1:3000/api/live/health \
  | node -e "let b='';process.stdin.on('data',d=>b+=d).on('end',()=>{const x=JSON.parse(b);if(x.connected!==true)process.exit(1);console.log(JSON.stringify({status:x.status,connected:x.connected,latencyMs:x.latencyMs}))})"

printf 'DEPLOYED_SHA=%s\n' "$ACTUAL_SHA"
