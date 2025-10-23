# Warp Sprint: Persona Consolidation

## Ready-to-Execute Workflow Tickets

**Status:** ✅ Production Ready  
**Last Updated:** 2025-10-23  
**Improvements Applied:**
- P1: Fixed .env.example append (preserves Hedera config)
- P3: Added fixture JSON files for tests
- P8: Added real Vercel + GitHub CLI commands

## Execution Order

1. **P0_init_branch_and_tags.yaml** - Setup safety tags + working branch (30 min)
2. **P1_persona_config_system.yaml** - Persona types + config loader (2-3 hours) ✅ Fixed
3. **P2_persona_aware_router.yaml** - Dashboard variants + nav (3 hours)
4. **P3_envelope_and_migration.yaml** - Recognition envelope V1 (3 hours) ✅ Fixed
5. **P4_pro_theme_and_service.yaml** - Professional import (4 hours)
6. **P5_recognition_factory.yaml** - Service factory pattern (1 hour)
7. **P6_catalog_consolidation.yaml** - Data catalogs by persona (2 hours)
8. **P6_5_merge_dependencies.yaml** - Package.json merge (1 hour)
9. **P7_persona_test_matrix.yaml** - Test matrix + smoke tests (2 hours)
10. **P8_preview_envs_and_pr.yaml** - Vercel deploy + PR (1 hour) ✅ Fixed
11. **P9_cleanup.yaml** - Post-merge cleanup (30 min)
12. **P9_5_hcs21_review.yaml** - Optional HCS-21 review (2 hours)

## Quick Start

```bash
# 1. Pre-flight check
cat ../EXECUTION_GUIDE.md  # Read full guide

# 2. Execute first ticket
cat P0_init_branch_and_tags.yaml
# Copy-paste steps or feed to Warp

# 3. Validate after each ticket
git log --oneline -1
pnpm dev
```

## Resources

- **EXECUTION_GUIDE.md** - Full execution playbook with validation steps
- **../MERGE_STRATEGY_4_BRANCHES.md** - Strategic overview
- **../CONSOLIDATION_GAP_ANALYSIS.md** - Feature gaps covered
- **../BRANCH_COMPARISON_MATRIX_UPDATED.md** - Branch analysis

## Estimated Timeline

- **Minimum:** 5 days (if all tickets executed in one sitting per day)
- **Recommended:** 8-10 days (with proper testing between tickets)
- **Maximum:** 15 days (with extended validation and HCS-21 review)

## Success Criteria

- [ ] All 12 tickets executed
- [ ] All 3 personas (professional/genz/civic) boot cleanly
- [ ] PR opened and CI passes
- [ ] No TypeScript errors
- [ ] All manual tests in EXECUTION_GUIDE pass
