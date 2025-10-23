# File Naming Refactor Analysis
## Do We Need File Naming Changes for Branch Consolidation?

**Generated:** 2025-10-23  
**Question:** Should files be renamed per branch to avoid conflicts?

---

## TL;DR Answer

**NO, we don't need a major file naming refactor.**

**Why:**
1. Most file conflicts are **expected and will be resolved via persona system**
2. Files with same names will become **persona-aware wrappers**
3. Professional-unique files will go into **new directories** (no conflicts)
4. The merge strategy already handles this via **variants pattern**

---

## Conflict Analysis

### Files That Exist in Both Branches

Found **3 key files** that exist in both Professional and Civic:

| File | Professional | Civic | Resolution Strategy |
|------|--------------|-------|---------------------|
| `app/page.tsx` | ✅ | ✅ | → Create `app/(tabs)/variants/` with 3 variants |
| `app/layout.tsx` | ✅ | ✅ | → Persona-aware wrapper (minimal changes) |
| `package.json` | ✅ | ✅ | → Merge dependencies (no rename needed) |

**These are GOOD conflicts** - they're the files we expect to make persona-aware.

---

## What The Merge Strategy Already Handles

### Pattern 1: Persona-Aware Wrappers

**For files in both branches:**

```
Before (Civic):
  app/page.tsx  (Civic dashboard)

After (Consolidated):
  app/(tabs)/page.tsx  (Persona router)
  app/(tabs)/variants/ProfessionalDashboard.tsx  (from Professional)
  app/(tabs)/variants/GenZDashboard.tsx  (from Civic)
  app/(tabs)/variants/CivicDashboard.tsx  (from Civic)
```

**No file rename needed** - we create new structure alongside existing.

### Pattern 2: New Directories for Professional Features

**For Professional-unique files:**

```
Professional Branch:
  lib/services/ProfessionalRecognitionService.ts

Consolidated:
  lib/services/recognition/ProfessionalRecognitionService.ts
  lib/services/recognition/HashinalRecognitionService.ts  (existing)
  lib/services/recognition/CivicRecognitionService.ts  (existing)
  lib/services/recognition/index.ts  (new factory)
```

**No rename needed** - we move to new organized directory.

### Pattern 3: Theme/Config Files (New)

**For new persona-specific files:**

```
New in Consolidation:
  lib/themes/metallic.ts  (Professional theme)
  lib/themes/mobile-first.ts  (GenZ theme)
  lib/themes/glass-morphism.ts  (Civic theme)
  lib/config/persona.types.ts  (new)
  lib/config/persona.ts  (new)
```

**No conflicts** - these are brand new files.

---

## Files That DON'T Conflict

### Professional-Unique Files (169 files)

Examples:
- `app/demo/page.tsx` - Professional has demo page
- `docs/HCS-21-Social-Trust-Graph-Standard.md` - Professional docs
- `DEMO_RUNBOOK.md` - Professional demo guide

**Strategy:** 
- Keep as-is if still relevant
- Port content to persona variants if needed
- Archive if obsolete

**No rename needed.**

### Civic-Unique Files (278 files)

Examples:
- `app/home/page.tsx` - Civic campaign home
- `app/events/page.tsx` - Civic events
- `app/volunteer/page.tsx` - Civic volunteer management
- `app/api/support/save/route.ts` - Civic API

**Strategy:**
- Keep all (they're the base)
- Add feature flags where needed
- No changes required

**No rename needed.**

---

## When You WOULD Need File Renaming

**Scenario 1: Merging via Git (Not Recommended)**
If you tried to `git merge` Professional into Civic:
- Git would flag conflicts on `app/page.tsx`, `app/layout.tsx`, etc.
- You'd need to manually resolve or rename files
- This is why we're **importing** instead of **merging**

**Scenario 2: No Persona System**
If you tried to maintain all features in one file:
- Files would become massive with conditional logic everywhere
- You'd need naming like `app/page.professional.tsx`, `app/page.civic.tsx`
- Not scalable

**Scenario 3: Build-Time Branching**
If you tried to maintain separate builds:
- You'd need `src-professional/`, `src-genz/`, `src-civic/`
- Way more complex than runtime persona switching
- Not what we're doing

---

## Our Approach: Runtime Persona System

**Instead of renaming files, we:**

### 1. Create Organized Directories

```
Before (mixed):
  lib/services/ProfessionalRecognitionService.ts  ❌
  lib/services/HashinalRecognitionService.ts  ❌
  lib/services/CivicRecognitionService.ts  ❌

After (organized):
  lib/services/recognition/
    ├── ProfessionalRecognitionService.ts  ✅
    ├── HashinalRecognitionService.ts  ✅
    ├── CivicRecognitionService.ts  ✅
    └── index.ts  (factory)  ✅
```

### 2. Use Variants Pattern

```
Before (single file):
  app/page.tsx  (only one version)

After (variants):
  app/(tabs)/page.tsx  (router)
  app/(tabs)/variants/
    ├── ProfessionalDashboard.tsx
    ├── GenZDashboard.tsx
    └── CivicDashboard.tsx
```

### 3. Runtime Switching

```typescript
// app/(tabs)/page.tsx
import { getPersona } from '@/lib/config/persona';

export default function HomePage() {
  const persona = getPersona();
  
  // No file renaming needed - just dynamic imports
  switch (persona.type) {
    case 'professional': return <ProfessionalDashboard />;
    case 'genz': return <GenZDashboard />;
    case 'civic': return <CivicDashboard />;
  }
}
```

---

## Recommended File Organization Changes

### Changes We SHOULD Make (Not Renames, Just Reorganization)

#### 1. Services → Organized by Type

```bash
# Move existing services to organized structure
mkdir -p lib/services/recognition
mv lib/services/HashinalRecognitionService.ts lib/services/recognition/
mv lib/services/RecognitionEnrichmentService.ts lib/services/recognition/

# Add Professional service
# (imported from Professional branch)
```

#### 2. Data → Organized by Persona

```bash
# Create persona-specific data directories
mkdir -p lib/data/recognition-tokens
mkdir -p lib/data/signal-types

# Move existing data
mv recognition-tokens-clean.json lib/data/recognition-tokens/genz-nft.json
mv data/signal-types.genz.json lib/data/signal-types/genz.json
```

#### 3. Components → Variants Structure

```bash
# Create persona-aware component structure
mkdir -p components/persona-aware/variants

# Existing components stay in place
# New variants go into variants/
```

### Changes We DON'T Need

❌ **Don't rename** `app/page.tsx` to `app/page.civic.tsx`  
❌ **Don't rename** `components/RecognitionCard.tsx` to `components/RecognitionCard.civic.tsx`  
❌ **Don't rename** `lib/hedera.ts` to `lib/hedera.civic.ts`  
❌ **Don't create** `src-professional/`, `src-genz/`, `src-civic/` directories

---

## Naming Conventions for New Files

### When Adding Persona-Specific Files

**Good:**
```
lib/themes/metallic.ts  ✅ (clear what it is)
lib/data/recognition-tokens/professional.json  ✅ (organized)
components/persona-aware/variants/ProfessionalCard.tsx  ✅ (in variants dir)
```

**Bad:**
```
lib/themes/theme-professional.ts  ❌ (redundant prefix)
lib/data/professional-tokens.json  ❌ (not organized)
components/ProfessionalRecognitionCard.tsx  ❌ (not in variants)
```

### File Naming Rules

1. **Base files** (shared): No persona prefix
   - `lib/hedera.ts` ✅
   - `lib/stores/signalsStore.ts` ✅

2. **Persona-specific**: In organized directory
   - `lib/themes/metallic.ts` ✅
   - `lib/data/recognition-tokens/professional.json` ✅

3. **Variants**: In `variants/` subdirectory
   - `app/(tabs)/variants/ProfessionalDashboard.tsx` ✅
   - `components/persona-aware/variants/ProfessionalCard.tsx` ✅

4. **Config/types**: Clear naming
   - `lib/config/persona.types.ts` ✅
   - `lib/config/persona.ts` ✅

---

## Migration Path (No Renames)

### Phase 1: Setup Directories (Day 1)
```bash
mkdir -p lib/config
mkdir -p lib/themes
mkdir -p lib/data/recognition-tokens
mkdir -p lib/data/signal-types
mkdir -p lib/services/recognition
mkdir -p components/persona-aware/variants
mkdir -p app/(tabs)/variants
```

### Phase 2: Import Professional (Days 2-6)
```bash
# Extract from Professional branch
git show ux-variant-1-professional:app/globals.css > /tmp/pro-globals.css

# Create in NEW location (no conflict)
cat > lib/themes/metallic.ts << 'EOF'
export const metallicTheme = { ... }
EOF

# Extract Professional service
git show ux-variant-1-professional:lib/services/ProfessionalRecognitionService.ts \
  > lib/services/recognition/ProfessionalRecognitionService.ts
```

**Result:** All Professional features imported with NO file conflicts.

### Phase 3: Create Persona Routing (Days 7-10)
```bash
# Keep existing Civic page
mv app/page.tsx app/(tabs)/variants/CivicDashboard.tsx

# Add Professional dashboard
cat > app/(tabs)/variants/ProfessionalDashboard.tsx

# Add persona router
cat > app/(tabs)/page.tsx
```

**Result:** Persona routing works with NO renames of original files.

---

## Conflict Resolution Strategy

### If You Encounter Actual Conflicts

**Scenario:** Both branches have `app/page.tsx` with different content

**Solution:**
1. Keep Civic version as `app/(tabs)/variants/CivicDashboard.tsx`
2. Import Professional version as `app/(tabs)/variants/ProfessionalDashboard.tsx`
3. Create router as `app/(tabs)/page.tsx`
4. Delete or rename original `app/page.tsx`

**No global rename needed** - just move existing files to variants.

---

## Testing Strategy (No Renames Needed)

### Test Each Persona

```bash
# Professional
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional pnpm dev
# All Professional files work via persona routing

# GenZ
NEXT_PUBLIC_TRUSTMESH_PERSONA=genz pnpm dev
# All GenZ features work (already in Civic)

# Civic
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic pnpm dev
# All Civic features work (base branch)
```

**No file renames needed** - persona system routes to correct code at runtime.

---

## Final Answer: File Naming Refactor

### What We Need

✅ **Organize** files into logical directories (`lib/themes/`, `lib/config/`, etc.)  
✅ **Create** new variant directories (`app/(tabs)/variants/`, `components/persona-aware/variants/`)  
✅ **Import** Professional files into new organized locations  
✅ **Move** some existing files to variants pattern  

### What We DON'T Need

❌ **Rename** files with persona prefixes (`file.professional.tsx`)  
❌ **Duplicate** files per branch (`src-professional/`, `src-civic/`)  
❌ **Create** build-time branches  
❌ **Manually resolve** git merge conflicts (we're importing, not merging)  

---

## Recommendation

**Proceed with the merge strategy as-is.**

The existing plan in `MERGE_STRATEGY_4_BRANCHES.md` already handles file organization correctly:

1. Uses **variants pattern** for pages
2. Creates **organized directories** for services
3. Imports **Professional files to new locations** (no conflicts)
4. Uses **persona routing** at runtime (no renames)

**No additional file naming refactor needed.**

---

## If You Still Want to Refactor

**Optional cleanup (after consolidation works):**

### Day 16+ (Post-Consolidation Cleanup)

```bash
# Rename unclear files
mv lib/data/some-unclear-name.json lib/data/recognition-tokens/genz-base.json

# Consolidate duplicate utilities
# (only if you find actual duplicates after consolidation)

# Remove obsolete files
rm -rf app/demo/  # if Professional demo is obsolete
```

**But this is optional** - the consolidation will work fine without it.

---

## Summary Table

| File Type | Need Rename? | Strategy |
|-----------|--------------|----------|
| **Shared base files** | ❌ No | Keep as-is |
| **Persona pages** | ❌ No | Move to variants/ |
| **Professional services** | ❌ No | Import to lib/services/recognition/ |
| **Civic unique files** | ❌ No | Keep as base |
| **Theme files** | ❌ No | Create new in lib/themes/ |
| **Config files** | ❌ No | Create new in lib/config/ |
| **Package.json** | ❌ No | Merge dependencies |

**Total files needing rename:** 0

**Files needing reorganization:** ~20 (move to variants/, not rename)

---

*Analysis generated: 2025-10-23*  
*Conclusion: No file naming refactor needed - proceed with merge strategy as designed*
