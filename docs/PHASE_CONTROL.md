# TrustMesh v2 Phase Control System

Production-ready phase management for the GenZ → Professional → Cannabis rollout pipeline.

## 🚀 Quick Start

```bash
# Check current phase status
pnpm phase:status

# Enable phases in order (first cut-over starts with GenZ)
pnpm phase:enable:genz
pnpm phase:enable:pro
pnpm phase:enable:cannabis

# View generated environment flags
cat .env.phases

# Test CI compliance
./scripts/ci-guard.sh staging
```

## 📋 Deployment Phases

### Phase 1: GenZ Community (`phase1-genz`)
- **Lenses**: `genz`
- **Dependencies**: None
- **Target**: First cut-over, community launch
- **Compliance Level**: `BASIC`

### Phase 2: Professional Organizations (`phase2-professional`) 
- **Lenses**: `professional`
- **Dependencies**: GenZ phase enabled
- **Target**: Corporate expansion
- **Compliance Level**: `CORPORATE_AUDIT`

### Phase 3: Cannabis Pilot (`phase3-cannabis`)
- **Lenses**: `cannabis` 
- **Dependencies**: GenZ + Professional phases
- **Target**: Full regulatory compliance
- **Compliance Level**: `CANNABIS_REGULATORY`

## 🎯 Available Commands

### Phase Management
```bash
pnpm phase:status              # Show deployment status
pnpm phase:list                # List all phases
pnpm phase:enable:genz         # Enable GenZ phase
pnpm phase:enable:pro          # Enable Professional phase  
pnpm phase:enable:cannabis     # Enable Cannabis phase
pnpm phase:disable:*           # Disable phases (with dependency checks)
pnpm phase info <phase>        # Detailed phase information
pnpm phase status --json       # JSON output for CI/automation
```

### CI/CD Integration
```bash
./scripts/ci-guard.sh [staging|production|dev]  # Environment compliance guard
```

## 🏗️ System Architecture

### Runtime Integration

The phase system automatically loads at application startup:

```typescript
// lib/bootstrap/phaseFlags.ts - auto-loaded on boot
export const ENABLED_LENSES = ["genz", "professional"];  // Active lenses
export const COMPLIANCE = "CORPORATE_AUDIT";              // Current compliance level
export const USE_V2 = true;                              // v2 features enabled
export const SHOW_GENZ = true;                           // Show GenZ UI
export const SHOW_PRO = true;                            // Show Professional UI
export const SHOW_CAN = false;                           // Cannabis not enabled yet
```

Use these flags in your application:

```typescript
import { SHOW_GENZ, COMPLIANCE, getComplianceRequirements } from '@/lib/bootstrap/phaseFlags';

// Route guards
if (SHOW_GENZ) {
  // Show GenZ features
}

// Compliance-aware business logic
const limits = getComplianceRequirements();
if (limits.kycRequired) {
  // Enforce KYC verification
}
```

### Health Monitoring

Health endpoint available at `/api/health/phase`:

```json
{
  "current": "phase2-professional",
  "lenses": ["genz", "professional"],
  "compliance": "CORPORATE_AUDIT",
  "timestamp": "2025-10-16T17:00:00.000Z",
  "health": "ok"
}
```

### Environment Variables

Generated automatically in `.env.phases`:

```bash
# TrustMesh v2 Phase Configuration
TRUSTMESH_ENABLED_LENSES="genz,professional"
TRUSTMESH_CURRENT_PHASE="phase2-professional" 
FEATURE_FLAG_GENZ_LENS=true
FEATURE_FLAG_PROFESSIONAL_LENS=true
FEATURE_FLAG_CANNABIS_LENS=false
COMPLIANCE_LEVEL=CORPORATE_AUDIT
```

## 🔒 Safety & Compliance

### Readiness Validation

Each phase includes comprehensive checks:

**GenZ Phase:**
- ✅ UI components tested (`RecognitionCard` + test coverage)
- ✅ Context rules validated (genz-specific business logic)
- ✅ User onboarding ready (E2E test coverage)
- ✅ Settlement adapter stable (MatterFi connectivity)

**Professional Phase:**
- ✅ RBAC tested (role-based access controls)
- ✅ Treasury limits configured (corporate transaction limits)
- ✅ Corporate onboarding ready (business account flows)
- ✅ Audit logging verified (compliance trail infrastructure)

**Cannabis Phase:**
- 🔧 Compliance engine hardened (regulatory-grade validation)
- 🔧 KYC/KYB integration complete (identity verification)
- 🔧 Facility license verification (regulatory compliance)
- 🔧 Treasury limits configured (cannabis-specific controls)
- 🔧 Jurisdiction deny list loaded (geographic restrictions)
- 🔧 Business hours validation (time-based controls)
- 🔧 Audit trail regulatory ready (full compliance reporting)

### Dependency Protection

```bash
# This will fail - Professional depends on GenZ
$ pnpm phase:disable:genz
❌ Cannot disable: phase2-professional depend on this phase
```

### CI/CD Guardrails

Environment-specific enforcement:

```bash
# Production requires all phases
./scripts/ci-guard.sh production
🏭 Production - requiring all phases
✅ Phase guard OK for production

# Staging is flexible
./scripts/ci-guard.sh staging  
🎭 Staging - requiring progressive phases
✅ Phase guard OK for staging
```

## 🚀 CI/CD Integration

### GitHub Actions

Automated phase management via workflow dispatch:

```yaml
# .github/workflows/phase-flip.yml
name: Phase Flip
on:
  workflow_dispatch:
    inputs:
      phase: { type: choice, options: [genz, professional, cannabis] }
      environment: { type: choice, options: [staging, production] }
```

Usage:
1. Go to GitHub Actions → "Phase Flip" workflow
2. Select phase and environment  
3. Workflow runs readiness checks and commits phase change
4. Automated deployment picks up new phase configuration

### Deployment Pipeline Integration

Add to your deploy workflow:

```yaml
- name: Phase Guard
  run: ./scripts/ci-guard.sh ${{ env.DEPLOYMENT_ENV }}

- name: Load Phase Config  
  run: cp .env.phases apps/web/.env.local

- name: Deploy
  run: pnpm build && pnpm deploy
```

### Access Control

Protected via `CODEOWNERS`:
```
config/phases.json     @trust-ops
.env.phases           @trust-ops  
scripts/phase.ts      @platform-team
```

## 👥 Team Usage

### Developers
```bash
# Start with GenZ for local development
pnpm phase:enable:genz

# Add Professional when testing corporate features  
pnpm phase:enable:pro

# Check what's currently enabled
pnpm phase:status
```

### DevOps/SRE
```bash
# CI pipeline validation
./scripts/ci-guard.sh $ENVIRONMENT

# Health monitoring
curl https://app.trustmesh.com/api/health/phase

# Automated phase status
pnpm phase status --json | jq '.current'
```

### QA/Testing
```bash
# Test phase-specific functionality
pnpm phase:enable:genz
pnpm test:e2e -- --grep "PHASE_1_GENZ"

# Test progression
pnpm phase:enable:pro
pnpm test:e2e -- --grep "PHASE_2_PROFESSIONAL"
```

## 📁 File Structure

```
scripts/
├── phase.ts              # Main phase control (hardened)
├── ci-guard.sh          # Simplified CI guardrail
├── checks.ts            # Real readiness validation
lib/bootstrap/
├── phaseFlags.ts        # Runtime flag loading
app/api/health/phase/
├── route.ts             # Health endpoint
config/
├── phases.json          # Phase state (auto-generated)
.env.phases              # Environment flags (auto-generated)
.github/
├── workflows/phase-flip.yml  # Automated phase management
├── CODEOWNERS               # Access control
```

## 🛠️ Advanced Usage

### Programmatic Access
```typescript
import { enablePhase, loadPhaseState } from './scripts/phase';

// Automation scripts
const state = loadPhaseState();
if (!state.phases['phase1-genz'].enabled) {
  await enablePhase('genz');
}
```

### Custom Readiness Checks
Extend readiness validation in `scripts/checks.ts`:
```typescript
export const healthChecks = {
  async myCustomCheck(): Promise<boolean> {
    // Your validation logic
    return await validateMyService();
  }
};
```

Then add to `scripts/phase.ts`:
```typescript
case "my-custom-check":
  return await healthChecks.myCustomCheck();
```

### Environment Overrides
```bash
# Force enable for testing (bypasses checks)
FORCE_PHASE_ENABLE=true pnpm phase enable cannabis
```

## 🚨 Troubleshooting

### Common Issues

**Readiness Check Failures:**
```bash
❌ Readiness check failed: genz-ui-components-tested
```
**Solution**: Ensure required files exist and tests pass as defined in readiness checks.

**Dependency Violations:**
```bash  
❌ Dependency not met: phase1-genz must be enabled first
```
**Solution**: Enable dependencies in order: GenZ → Professional → Cannabis.

**CI Guardrail Failures:**
```bash
❌ Production requires Cannabis phase to be enabled
```
**Solution**: Enable all required phases for target environment.

### Debug Commands

```bash
# Detailed phase information
pnpm phase info cannabis

# JSON status for parsing
pnpm phase status --json | jq '.phases'

# Generated environment config  
cat .env.phases

# Validate environment compliance
./scripts/ci-guard.sh production
```

## 📊 Monitoring & Observability

### Health Checks
```bash
# Application health with phase info
curl /api/health/phase

# Basic connectivity
pnpm phase:status
```

### Logging
Application startup logs include phase information:
```
[phase] loading .env.phases
[phase] current=phase2-professional lenses=genz,professional compliance=CORPORATE_AUDIT
```

### Alerts
Set up monitoring on:
- Phase flip events (via commit messages)
- Health endpoint status changes
- Readiness check failures

## 🗓️ Rollout Timeline

### Phase 1: GenZ Launch
- **Target**: January 15, 2025
- **Scope**: Community recognition system
- **Readiness**: ✅ Ready for cut-over

### Phase 2: Professional Expansion  
- **Target**: February 1, 2025
- **Scope**: Corporate organizations
- **Readiness**: ✅ Ready for cut-over

### Phase 3: Cannabis Pilot
- **Target**: March 1, 2025
- **Scope**: Full regulatory compliance
- **Readiness**: 🔧 In development

## 🔄 Rollback Procedures

### Standard Rollback
```bash
# Disable last phase
pnpm phase:disable:professional

# Commit and deploy
git commit -am "rollback: disable professional phase"
git push
```

### Emergency Rollback
```bash
# Stop traffic (feature flag or maintenance)
# Run rollback
pnpm phase:disable:cannabis
# Verify state
pnpm phase:status
# Restore service
```

## 🎯 Success Metrics

- ✅ Phase progression works (GenZ → Professional → Cannabis)
- ✅ Dependency protection enforces order  
- ✅ Readiness checks prevent broken deployments
- ✅ CI guardrails enforce environment compliance
- ✅ Health monitoring provides visibility
- ✅ Rollback procedures work under pressure

## 🎬 Operator Cheatsheet

```bash
# Daily operations
pnpm phase:status                # Current status
pnpm phase:list                  # All phases
./scripts/ci-guard.sh staging    # Environment check
curl /api/health/phase           # Health status

# Phase progression  
pnpm phase:enable:genz           # First cut-over
pnpm phase:enable:pro            # Second cut-over  
pnpm phase:enable:cannabis       # Full production

# Troubleshooting
pnpm phase info <phase>          # Deep dive
cat .env.phases                  # Environment config
pnpm phase status --json         # Automation data
```

---

**This phase control system ensures safe, progressive rollout of TrustMesh v2 capabilities while maintaining compliance and operational safety across all deployment environments.**

Ready to press play! 🚀