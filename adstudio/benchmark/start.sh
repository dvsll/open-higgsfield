#!/usr/bin/env bash
set -euo pipefail
[[ "${1:-}" == "--approved" ]] || { echo 'DRY RUN: start isolated Comfy/proxy with watchdog after approval only.'; exit 0; }
package="$(cd "$(dirname "$0")" && pwd)"
: "${BENCHMARK_LEASE:?Private lease JSON required}"
: "${RUNPOD_API_KEY:?Ephemeral termination credential required}"
python3.12 "$package/lifecycle.py" watch --lease "$BENCHMARK_LEASE" --approved > /workspace/watchdog.log 2>&1 &
watchdog=$!
sleep 2
kill -0 "$watchdog" || { echo 'Watchdog failed; do not start.'; exit 1; }
source /workspace/adstudio-benchmark/venv/bin/activate
finish(){ python "$package/lifecycle.py" terminate --lease "$BENCHMARK_LEASE" --approved; }
trap finish EXIT INT TERM
cd /workspace/adstudio-benchmark/ComfyUI
# No public HTTP ports; SSH tunnel only. Do not start Manager/updaters/API nodes.
python main.py --listen 127.0.0.1 --port 28188 --disable-api-nodes --disable-auto-launch > /workspace/comfy-benchmark.log 2>&1 &
comfy_pid=$!
for i in $(seq 1 120); do
  if curl --fail --silent http://127.0.0.1:28188/system_stats > /dev/null; then break; fi
  kill -0 "$comfy_pid" || exit 1
  sleep 1
done
comfy-api-proxy run --comfyui http://127.0.0.1:28188 --host 127.0.0.1 --port 28189 > /workspace/proxy-benchmark.log 2>&1 &
proxy_pid=$!
wait -n "$comfy_pid" "$proxy_pid" "$watchdog"
