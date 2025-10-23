#!/usr/bin/env bash
set -euo pipefail
for p in professional genz civic; do
  echo '--- Persona:' $p
  NEXT_PUBLIC_TRUSTMESH_PERSONA=$p pnpm build >/dev/null
  echo 'OK build:' $p
done
echo "Manual assertions: start dev, verify tokens/themes/flags/routes as per docs."
