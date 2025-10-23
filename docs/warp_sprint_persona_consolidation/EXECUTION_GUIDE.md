# TrustMesh Persona Consolidation - Execution Guide

**Sprint Duration:** 8-10 days  
**Execution Partner:** Warp (Jr Dev)  
**Base Branch:** `feat/civic-lens`  
**Target Branch:** `feat/persona-integration`

---

## 🎯 Quick Start

### Prerequisites Check
```bash
# Verify you're in the right repo
pwd  # Should be /home/tonycamero/code/TrustMesh_hackathon

# Verify all source branches exist
git branch -a | grep -E "(civic-lens|genz-lens|universal-recognition|professional)"

# Verify tools installed
which pnpm gh  # Should return paths
```

### Execution Order

Execute tickets sequentially in this order:
1. **P0** - Setup (30 min)
2. **P1** - Persona Config (2-3 hours)
3. **P2** - Router & Nav (3 hours)
4. **P3** - Recognition Envelope (3 hours)
5. **P4** - Professional Import (4 hours)
6. **P5** - Service Factory (1 hour)
7. **P6** - Data Catalogs (2 hours)
8. **P6.5** - Dependencies (1 hour)
9. **P7** - Test Matrix (2 hours)
10. **P8** - Deploy & PR (1 hour)
11. **P9** - Cleanup (30 min)
12. **P9.5** - HCS-21 Review (optional, 2 hours)

---

## 📋 Pre-Flight Checklist

- [ ] Current branch: `feat/civic-lens` or `main`
- [ ] Working tree clean: `git status`
- [ ] All branches fetched: `git fetch --all --tags`
- [ ] Node version correct: `node -v` (v20+)
- [ ] pnpm installed: `pnpm -v`
- [ ] GitHub CLI configured: `gh auth status`

---

## 🚀 Execution Pattern (Per Ticket)

### Before Each Ticket
```bash
# Verify you're on correct branch
git branch --show-current  # Should be feat/persona-integration (after P0)

# Verify working tree is clean
git status

# Optional: Check what files the ticket will create
cat docs/warp_sprint_persona_consolidation/workflows/PX_ticket_name.yaml | grep "files_out:"
```

### Execute Ticket
```bash
# Feed the YAML to Warp or execute steps manually
# Example for manual execution:
cd ~/code/TrustMesh_hackathon

# Read the ticket
cat docs/warp_sprint_persona_consolidation/workflows/P1_persona_config_system.yaml

# Execute each step in sequence
# (Copy-paste from YAML or let Warp handle it)
```

### After Each Ticket
```bash
# 1. Verify commit exists
git log --oneline -1

# 2. Verify files created
ls -la lib/config/  # (example for P1)

# 3. Test the app boots
pnpm dev

# 4. Quick smoke test
# - For P1: Check console for "[Persona] Loaded: TrustMesh Civic"
# - For P2: Visit http://localhost:3000 and verify dashboard renders
# - For P3: Run `pnpm test` (may fail until later tickets)
# - For P4: Switch to professional persona and verify metallic theme

# 5. Stop dev server
# Ctrl+C

# 6. Verify types (optional but recommended)
pnpm type-check || echo "Type errors - will fix in later tickets"

# 7. Mark ticket complete in your tracker
```

---

## 🔍 Validation Checkpoints

### After P1 (Persona Config)
```bash
# Test persona loading
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional pnpm dev &
sleep 5
curl http://localhost:3000 2>&1 | grep -q "Professional" && echo "✓ Professional loads"
pkill -f "next dev"

NEXT_PUBLIC_TRUSTMESH_PERSONA=genz pnpm dev &
sleep 5
curl http://localhost:3000 2>&1 | grep -q "Campus" && echo "✓ GenZ loads"
pkill -f "next dev"

NEXT_PUBLIC_TRUSTMESH_PERSONA=civic pnpm dev &
sleep 5
curl http://localhost:3000 2>&1 | grep -q "Civic" && echo "✓ Civic loads"
pkill -f "next dev"
```

### After P2 (Router)
```bash
# Test routing per persona
for persona in professional genz civic; do
  echo "Testing $persona..."
  NEXT_PUBLIC_TRUSTMESH_PERSONA=$persona pnpm dev &
  sleep 5
  curl -s http://localhost:3000 | grep -q "Dashboard" && echo "✓ $persona dashboard renders"
  pkill -f "next dev"
  sleep 2
done
```

### After P3 (Envelope)
```bash
# Test migration
pnpm test lib/schema/__tests__/Recognition.Migrate.spec.ts

# Verify fixtures exist
ls tests/fixtures/recognition/*.json | wc -l  # Should be 3
```

### After P4 (Professional Import)
```bash
# Verify Professional theme
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional pnpm dev &
sleep 5
curl -s http://localhost:3000 | grep -q "metallic" && echo "✓ Metallic theme present"
pkill -f "next dev"

# Verify professional tokens
cat lib/data/recognition-tokens/professional.json | jq '.tokens | length'  # Should be 4+
```

### After P6.5 (Dependencies)
```bash
# Full validation
pnpm install
pnpm lint
pnpm type-check
pnpm build

# All should pass (or show minimal errors to fix)
```

### After P7 (Test Matrix)
```bash
# Run smoke test
bash scripts/ci/test-personas.sh

# Should output:
# OK build: professional
# OK build: genz
# OK build: civic
```

---

## 🐛 Troubleshooting

### Issue: P1 overwrites .env.example
**Symptom:** Existing Hedera config missing  
**Fix:** Already applied in workflow (uses `cat >>` instead of `cat >`)

### Issue: P3 tests fail with "Cannot find module"
**Symptom:** Jest can't find fixture files  
**Fix:** Already applied - fixtures created in P3

### Issue: pnpm type-check fails
**Symptom:** TypeScript errors in persona files  
**Fix:** Expected until all tickets complete. Run `pnpm type-check --noEmit` to see errors without blocking

### Issue: Circular dependencies
**Symptom:** Import errors between persona.ts and services  
**Fix:** Ensure `lib/config/persona.ts` doesn't import services directly (should only export types/functions)

### Issue: P8 - gh pr create fails
**Symptom:** "No commits between feat/civic-lens and feat/persona-integration"  
**Fix:** Verify you've committed all previous tickets. Run `git log feat/civic-lens..feat/persona-integration`

---

## 📊 Progress Tracking

### Daily Targets

**Day 1:**
- ✅ P0 - Setup
- ✅ P1 - Persona Config
- ✅ P2 - Router

**Day 2:**
- ✅ P3 - Envelope
- ✅ P4 - Professional Import

**Day 3:**
- ✅ P5 - Factory
- ✅ P6 - Catalogs
- ✅ P6.5 - Dependencies

**Day 4:**
- ✅ P7 - Test Matrix
- ✅ Manual testing per persona

**Day 5:**
- ✅ P8 - Deploy & PR
- ✅ P9 - Cleanup
- ✅ (Optional) P9.5 - HCS-21

---

## ✅ Final Validation (Before P8)

### Pre-PR Checklist
```bash
# 1. All tests pass
pnpm test

# 2. Linting passes
pnpm lint

# 3. Type checking passes
pnpm type-check

# 4. All 3 personas build
for p in professional genz civic; do
  NEXT_PUBLIC_TRUSTMESH_PERSONA=$p pnpm build
done

# 5. Verify git history
git log --oneline feat/civic-lens..feat/persona-integration | wc -l  # Should be ~12 commits

# 6. Verify no uncommitted changes
git status  # Should be clean
```

### Manual UI Testing
```bash
# Professional
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional pnpm dev
# Open http://localhost:3000
# Check:
# - Metallic theme visible
# - No NFT/civic features
# - Professional nav links only

# GenZ
NEXT_PUBLIC_TRUSTMESH_PERSONA=genz pnpm dev
# Check:
# - Mobile-first theme
# - NFT/gamification visible
# - GenZ nav links

# Civic
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic pnpm dev
# Check:
# - Glass morphism theme
# - Civic + GenZ features both present
# - All nav links visible
```

---

## 🎯 Success Criteria

### Technical
- [ ] All 3 personas boot without errors
- [ ] Persona switching via env var works
- [ ] No code duplication (DRY)
- [ ] Bundle size < 500KB per persona
- [ ] Test coverage > 70%
- [ ] No TypeScript errors
- [ ] No console errors

### Business
- [ ] Can demo all 3 personas in < 1 hour
- [ ] All analysis docs accurate (BRANCH_COMPARISON_MATRIX, GAP_ANALYSIS)
- [ ] Merge strategy successfully executed
- [ ] One codebase, three markets ✅

---

## 📞 Getting Help

### If Stuck

1. **Check the analysis docs:**
   - `BRANCH_COMPARISON_MATRIX_UPDATED.md` - Branch relationships
   - `CONSOLIDATION_GAP_ANALYSIS.md` - What to port
   - `MERGE_STRATEGY_4_BRANCHES.md` - Full strategy
   - `FILE_NAMING_REFACTOR_ANALYSIS.md` - File organization

2. **Review ticket prerequisites:**
   ```bash
   cat docs/warp_sprint_persona_consolidation/workflows/PX_ticket.yaml | grep "prerequisites:"
   ```

3. **Check git history:**
   ```bash
   git log --oneline -10  # Last 10 commits
   ```

4. **Verify file structure:**
   ```bash
   tree lib/config lib/themes lib/services/recognition -L 2
   ```

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# Return to Civic base
git checkout feat/civic-lens
git branch -D feat/persona-integration  # Delete failed branch

# Or restore from backup tag
git checkout backup-civic-20251023  # Use actual date

# Or start over from P0
git checkout feat/civic-lens
git checkout -b feat/persona-integration-v2
# Re-execute tickets
```

---

## 📝 Post-Execution

### After P9 (Cleanup)
```bash
# Verify main has your changes
git checkout main
git log --oneline -15 | grep "persona"

# Verify old branch removed
git branch -a | grep persona-integration  # Should be empty

# Tag the release
git tag v2.0.0-persona-system
git push origin v2.0.0-persona-system
```

### Update Documentation
```bash
# Ensure README reflects persona system
grep -A 10 "Persona System" README.md

# Archive merge strategy docs
mkdir -p docs/archive
mv MERGE_STRATEGY_4_BRANCHES.md docs/archive/
git add docs/archive
git commit -m "docs: archive merge strategy (completed)"
```

---

**Ready to execute?** Start with P0! 🚀

```bash
cat docs/warp_sprint_persona_consolidation/workflows/P0_init_branch_and_tags.yaml
```
