#!/usr/bin/env bash
set -euo pipefail

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti ":${port}" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing processes on port ${port}: ${pids}"
    kill $pids || true
    sleep 1
  fi
}

kill_port 3000 || true
kill_port 3001 || true
sleep 1

export PLAYWRIGHT_STATIC_EXPORT=1
export CI=1
exec npx playwright test "$@"
