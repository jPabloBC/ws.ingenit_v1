#!/usr/bin/env bash
set -euo pipefail
# Config
NAME="ws.ingenit-v1"
TS="$(date +"%Y%m%d-%H%M%S")"
SCOPE="jpablobcs-projects"  # si no usas team/context, deja vacío: SCOPE=""
mkdir -p backups
# Git snapshot + tag
git add -A
git commit -m "deploy $NAME $TS" || true
git tag -f "backup-$TS"
git push --follow-tags
# ZIP del estado actual
git archive -o "backups/${NAME}-${TS}.zip" --format=zip HEAD
# Deploy a Vercel (forzando prod) y captura URL limpia
if [ -n "$SCOPE" ]; then
  DEPLOY_OUTPUT="$(vercel --prod --confirm --scope "$SCOPE" 2>&1 || true)"
else
  DEPLOY_OUTPUT="$(vercel --prod --confirm 2>&1 || true)"
fi
URL="$(printf "%s" "$DEPLOY_OUTPUT" \
  | tr '\n' ' ' \
  | grep -oE 'https://[^ ]+vercel\.app' \
  | tail -n1)"
if [ -z "${URL:-}" ]; then
  echo "ERROR: No se pudo obtener la URL del deploy."
  echo "Salida de vercel:"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi
# Inspect del deployment (texto legible) + guardar URL
if [ -n "$SCOPE" ]; then
  vercel inspect "$URL" --scope "$SCOPE" > "backups/${NAME}-${TS}.txt"
else
  vercel inspect "$URL" > "backups/${NAME}-${TS}.txt"
fi
echo "$URL" > "backups/${NAME}-${TS}.url"
echo "OK -> $URL"