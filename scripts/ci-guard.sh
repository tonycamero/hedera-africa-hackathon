#!/usr/bin/env bash
set -euo pipefail

ENV=${1:-staging}
PHASE_JSON=$(pnpm --silent phase status --json)

enabled() { 
  echo "$PHASE_JSON" | jq -r ".phases[\"$1\"].enabled"; 
}

echo "🔍 Phase guard checking $ENV environment..."

if [[ "$ENV" == "production" ]]; then
  echo "🏭 Production - requiring all phases"
  [[ $(enabled "phase1-genz") == "true" ]] || { echo "❌ GenZ must be enabled"; exit 1; }
  [[ $(enabled "phase2-professional") == "true" ]] || { echo "❌ Professional must be enabled"; exit 1; }
  [[ $(enabled "phase3-cannabis") == "true" ]] || { echo "❌ Cannabis must be enabled for prod"; exit 1; }
fi

if [[ "$ENV" == "staging" ]]; then
  echo "🎭 Staging - requiring progressive phases"  
  [[ $(enabled "phase1-genz") == "true" ]] || { echo "❌ Stage needs GenZ"; exit 1; }
  # Professional recommended; Cannabis optional in staging
  if [[ $(enabled "phase3-cannabis") == "true" ]]; then
    echo "⚠️  Cannabis enabled in staging - ensure test data only"
  fi
fi

echo "✅ Phase guard OK for $ENV"