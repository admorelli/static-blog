#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3001}"
OUT_DIR="${2:-./out}"

# Stop any leftover listeners on the chosen port or its fallback.
for p in "$PORT" 3000; do
  if lsof -ti ":$p" -sTCP:LISTEN >/dev/null 2>&1; then
    lsof -ti ":$p" -sTCP:LISTEN | xargs -r kill || true
  fi
done
sleep 1

# Start static server on the chosen port.
npx serve "$OUT_DIR" -l "$PORT" &
PID=$!

cleanup() {
  kill "$PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Wait until the server responds.
for i in {1..120}; do
  if curl -fsS "http://localhost:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

exec npx playwright test "${@:3}"
