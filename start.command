#!/bin/sh
# Double-click (macOS) or run ./start.command (Linux). The first run sets everything up.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Node.js is needed. Installing it..."; brew install node || exit 1
  else
    echo "Please install Node.js from https://nodejs.org, then start again."
    (open https://nodejs.org || xdg-open https://nodejs.org) >/dev/null 2>&1
    exit 1
  fi
fi
export OSH_FROM_START=1
if [ ! -f outputs/runtime-config.json ] || [ ! -d node_modules/@comfyorg/sdk ]; then
  node shared/runtime/install.ts || { printf 'Press Enter to close.'; read -r _; exit 1; }
fi
echo "Starting... your browser will open. Close this window to stop."
exec npm start
