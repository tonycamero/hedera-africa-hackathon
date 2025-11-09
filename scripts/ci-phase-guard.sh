#!/bin/bash

#
# CI Phase Guardrail for TrustMesh v2
#
# Enforces phase-appropriate compliance levels in protected environments
#
# Usage:
#   ./scripts/ci-phase-guard.sh [production|staging|dev]
#

set -euo pipefail

ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Change to project root
cd "$PROJECT_ROOT"

# Check if phase control is available
if ! command -v pnpm >/dev/null 2>&1; then
    log_error "pnpm not found. Please install pnpm first."
    exit 1
fi

if [ ! -f "scripts/phase.ts" ]; then
    log_error "Phase control script not found at scripts/phase.ts"
    exit 1
fi

log_info "🔍 Checking phase compliance for environment: $ENVIRONMENT"

# Get current phase state
PHASE_JSON=$(pnpm --silent phase status --json 2>/dev/null || echo '{}')
CURRENT_PHASE=$(echo "$PHASE_JSON" | jq -r '.currentPhase // "none"')
GENZ_ENABLED=$(echo "$PHASE_JSON" | jq -r '.phases["phase1-genz"].enabled // false')
PROFESSIONAL_ENABLED=$(echo "$PHASE_JSON" | jq -r '.phases["phase2-professional"].enabled // false')
CANNABIS_ENABLED=$(echo "$PHASE_JSON" | jq -r '.phases["phase3-cannabis"].enabled // false')

log_info "Current phase: $CURRENT_PHASE"
log_info "Phases enabled: GenZ($GENZ_ENABLED), Professional($PROFESSIONAL_ENABLED), Cannabis($CANNABIS_ENABLED)"

# Environment-specific compliance checks
case "$ENVIRONMENT" in
    "production")
        log_info "🏭 Production environment - enforcing strictest compliance"
        
        if [ "$CANNABIS_ENABLED" != "true" ]; then
            log_error "Production requires Cannabis phase to be enabled for full regulatory compliance"
            exit 1
        fi
        
        if [ "$PROFESSIONAL_ENABLED" != "true" ]; then
            log_error "Production requires Professional phase for corporate audit trail"
            exit 1
        fi
        
        if [ "$GENZ_ENABLED" != "true" ]; then
            log_error "Production requires all phases to be progressively enabled"
            exit 1
        fi
        
        log_info "✅ Production compliance checks passed"
        ;;
        
    "staging")
        log_info "🎭 Staging environment - enforcing corporate audit compliance"
        
        if [ "$PROFESSIONAL_ENABLED" != "true" ]; then
            log_warn "Staging should have Professional phase enabled for proper audit testing"
        fi
        
        if [ "$CANNABIS_ENABLED" = "true" ]; then
            log_warn "Cannabis phase enabled in staging - ensure test data only"
        fi
        
        log_info "✅ Staging compliance checks passed"
        ;;
        
    "dev")
        log_info "🧪 Development environment - flexible phase configuration allowed"
        
        if [ "$CANNABIS_ENABLED" = "true" ]; then
            log_warn "Cannabis phase enabled in dev - remember this increases compliance overhead"
        fi
        
        log_info "✅ Development compliance checks passed"
        ;;
        
    *)
        log_error "Unknown environment: $ENVIRONMENT"
        log_error "Supported environments: production, staging, dev"
        exit 1
        ;;
esac

# Check for required environment files
if [ ! -f ".env.phases" ]; then
    log_warn "No .env.phases file found - phase configuration may not be loaded"
fi

# Verify readiness for enabled phases
log_info "🔧 Verifying readiness for enabled phases..."

if [ "$GENZ_ENABLED" = "true" ]; then
    if [ ! -f "src/components/RecognitionCard.tsx" ]; then
        log_error "GenZ phase enabled but RecognitionCard component missing"
        exit 1
    fi
fi

if [ "$PROFESSIONAL_ENABLED" = "true" ]; then
    if [ ! -f "lib/v2/engine/auditTrail.ts" ]; then
        log_error "Professional phase enabled but audit trail engine missing"
        exit 1
    fi
fi

if [ "$CANNABIS_ENABLED" = "true" ]; then
    if [ ! -f "lib/v2/engine/compliance.ts" ]; then
        log_error "Cannabis phase enabled but compliance engine missing"
        exit 1
    fi
fi

log_info "✅ All phase readiness checks passed"

# Export phase info for downstream CI steps
if [ -n "${GITHUB_ENV:-}" ]; then
    echo "TRUSTMESH_CI_PHASE=$CURRENT_PHASE" >> "$GITHUB_ENV"
    echo "TRUSTMESH_CI_COMPLIANCE_LEVEL=$ENVIRONMENT" >> "$GITHUB_ENV"
else
    log_info "Phase info: TRUSTMESH_CI_PHASE=$CURRENT_PHASE, TRUSTMESH_CI_COMPLIANCE_LEVEL=$ENVIRONMENT"
fi

log_info "🚀 Phase compliance verified for $ENVIRONMENT environment"