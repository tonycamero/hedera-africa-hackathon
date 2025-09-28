# Demo Mode Component Mapping Analysis

**Purpose**: Comprehensive mapping of all demo/seed-related components in TrustMesh for safe cleanup and production hardening.

**Status**: 🔍 **ANALYSIS ONLY** - No code changes

**Goal**: Eliminate demo drift, ensure predictable production behavior, reduce surface area

---

## Mapping Methodology

1. **Artifact Discovery**: Search for demo/seed-related code patterns
2. **Dependency Tracing**: Map reads/writes/side-effects for each component  
3. **Kill Switch Identification**: Document how to disable each component
4. **Usage Analysis**: Trace which components depend on which others
5. **Classification**: Determine keep/harden/deprecate/remove for each

---

## Search Results & Analysis

### A. Flags & Toggles (Entry Points)
**Search Command**: Demo/seed pattern search

**Key Findings:**
- `lib/runtimeFlags.ts` - Core RuntimeFlags interface with seedOn, scope, ephemeralStrict
- `lib/demo/seed.ts` - Main seed data creation with SEED_TAG="seeded"
- `lib/data/demoProfiles.ts` - Rich demo user profiles (tm-alex-chen, tm-maya-patel, etc.)
- Environment variables: NEXT_PUBLIC_DEMO_SEED, NEXT_PUBLIC_DEMO_SCOPE, NEXT_PUBLIC_DEMO_MODE

### B. Session/Demo Identity Wiring  
**Search Command**: Session ID and demo user patterns

**Key Findings:**
- `lib/session.ts` - getSessionId() function with demo fallbacks
- Demo user IDs: tm-alex-chen, tm-maya-patel, tm-jordan-kim, tm-sam-rivera, etc.
- sessionStorage integration for persistence
- Bootstrap system uses getSessionId() for derived calculations

### C. Demo Data Sources
**Search Command**: Profile and recognition demo data

**Key Findings:**
- `lib/data/demoProfiles.ts` - 8 detailed personas with trust networks
- `lib/demo/seed.ts` - 15+ demo events (contacts, trust, recognition)
- Demo recognition distribution mapping
- Hardcoded demo users in services

### D. Services with Demo Fallbacks
**Search Command**: Service-level demo integration

**Key Findings:**
- `lib/services/HCSFeedService.ts` - enableSeedMode(), demo user arrays
- Various services use getRuntimeFlags() for demo behavior
- Demo fallbacks in recognition and profile services
- MirrorReader integration points

### E. Registry + API Exposure
**Search Command**: API endpoints with demo functionality

**Key Findings:**
- `/api/seed-demo` - Manual demo seeding endpoint
- `/api/seed-recognition` - Recognition-specific seeding
- `/api/debug-mint-recognition` - Demo minting
- Registry config returns demo flags
- HCS profile route has demo fallbacks

### F. Store Layer Hooks
**Search Command**: Store integration with demo data

**Key Findings:**
- `signalsStore` has scope filtering ('global' | 'my')
- Demo data uses meta.tag = "seeded" for identification
- Memory management separates seeded vs real signals
- Session persistence integration

### G. Build Guards
**Search Command**: Production guards and environment checks

**Key Findings:**
- Environment checks in lib/env.ts, lib/runtimeFlags.ts
- NODE_ENV production checks in API routes
- DEMO_MODE and DEMO_SEED constants
- Some build guards but not comprehensive

---

## Artifact Inventory

| Artifact Name | Type | Location(s) | Reads | Writes/Side-effects | Kill Switch | Used By | Classification | Notes |
|---------------|------|-------------|-------|---------------------|-------------|---------|----------------|-------|
| HeaderModeChips | UI | `components/HeaderModeChips.tsx` | NEXT_PUBLIC_DEMO_MODE, RuntimeFlags | HCSFeedService.enableSeedMode(), signalsStore.clear() | NEXT_PUBLIC_DEMO_MODE=false | All pages via layout | **Keep Dev Only** | Primary demo control interface |
| RuntimeFlags | Service | `lib/runtimeFlags.ts` | NEXT_PUBLIC_DEMO_SEED, NEXT_PUBLIC_DEMO_SCOPE | URL params, localStorage | Set env vars to false | HeaderModeChips, Services | **Keep but Harden** | Core flag system |
| DemoProfiles | Data | `lib/data/demoProfiles.ts` | None | None | Remove import | ContactProfile, Recognition | **Remove** | Static demo user data |
| SeedData | Data | `lib/demo/seed.ts` | RuntimeFlags | signalsStore.addSignal() | seedOn=false | HCSFeedService | **Remove** | Demo event generation |
| HCSFeedService.enableSeedMode | Service | `lib/services/HCSFeedService.ts` | RuntimeFlags | HCS topics, demo arrays | seedOn=false | HeaderModeChips | **Remove** | Orchestrates demo seeding |
| SignalsStore Demo Logic | Service | `lib/stores/signalsStore.ts` | meta.tag="seeded" | Memory separation, filtering | Remove tag checks | All UI components | **Keep but Harden** | Tag-based demo separation |
| Session Demo Default | Service | `lib/session.ts` | NEXT_PUBLIC_DEMO_SEED | sessionStorage tm_session_id | DEMO_SEED=off | Bootstrap, Services | **Remove** | tm-alex-chen fallback |
| /api/seed-demo | API | `app/api/seed-demo/route.ts` | HCSFeedService | HCS topics, comprehensive seeding | Remove endpoint | Manual triggers | **Remove** | Development seeding API |
| /api/seed-recognition | API | `app/api/seed-recognition/route.ts` | HederaClient | Recognition definitions/instances | Remove endpoint | Development testing | **Remove** | Recognition-specific seeding |
| /api/debug-mint-recognition | API | `app/api/debug-mint-recognition/route.ts` | Recognition service | Demo recognition minting | Remove endpoint | Debug testing | **Remove** | Demo minting utility |
| RecognitionGrid Demo Users | UI | `components/RecognitionGrid.tsx` | DirectHCS/Legacy service | Recognition display for demo users | Service switching only | Recognition page | **Keep** | Uses services, no direct demo |
| ContactProfileSheet Demo | UI | `components/ContactProfileSheet.tsx` | Profile services | Demo profile fallbacks | Remove fallback paths | Contacts page | **Keep but Harden** | Has demo profile fallbacks |
| Bootstrap Demo Integration | Service | `lib/boot/bootstrapFlex.ts` | getSessionId(), RuntimeFlags | Derived calculations with demo session | Remove demo session support | App initialization | **Keep but Harden** | Session-aware bootstrap |
| Demo Environment Config | Config | `.env.local` | None | Environment variables | Set to false/off | All components | **Keep but Harden** | Configuration source |
| Demo User Arrays | Data | Various services | None | None | Remove arrays | HCSFeedService, others | **Remove** | Hardcoded user lists |

---

## Demo Data Flow Graph

**Root**: HeaderModeChips "Seed" / "My/Global" Toggle

```
HeaderModeChips.toggleSeed()
    ↓
RuntimeFlags.updateRuntimeFlags({ seedOn: true })
    ↓
HCSFeedService.enableSeedMode()
    ↓
- createSeedData() from lib/demo/seed.ts
- Demo user arrays (tm-alice47, etc.)
- HCS topic publishing
    ↓
SignalsStore.addSignal() [with meta.tag = "seeded"]
    ↓
UI Components filter by:
- RuntimeFlags.scope ('global' | 'my') 
- SignalsStore tag-based separation
- getSessionId() for ownership
    ↓
Displayed in:
- SignalsPage, CirclePage, ContactsPage, RecognitionPage
- FeedItem, ActivityFeed, ContactProfileSheet
- RecognitionGrid, Trust displays
```

**Scope Toggle Flow**:
```
HeaderModeChips.toggleScope()
    ↓
RuntimeFlags.updateRuntimeFlags({ scope: 'global'|'my' })
    ↓
SignalsStore.getSignals({ scope, sessionId })
    ↓
Filter events by ownership/direction
    ↓
UI re-renders with filtered data
```

---

## Kill Switches Summary

### Environment-Level Kill Switches
```bash
# Complete demo mode disable
NEXT_PUBLIC_DEMO_MODE=false          # Hides HeaderModeChips entirely
NEXT_PUBLIC_DEMO_SEED=off            # Disables seed data creation
NEXT_PUBLIC_DEMO_SCOPE=my            # Default to personal view
NEXT_PUBLIC_DEMO_EPHEMERAL_STRICT=false # Disable reset features

# Production hardening
NODE_ENV=production                   # Some guards check this
NEXT_PUBLIC_ALLOW_DEMO=off           # Additional production guard (not yet implemented)
```

### Service-Level Kill Switches
- **HCSFeedService**: seedOn flag prevents enableSeedMode() execution
- **SignalsStore**: Remove meta.tag="seeded" checks to ignore demo data
- **Session**: DEMO_SEED=off prevents tm-alex-chen fallback
- **Bootstrap**: Skip demo session support in derived calculations

### Component-Level Kill Switches
- **HeaderModeChips**: DEMO_MODE check hides component in production
- **Profile Services**: Remove demo fallback arrays and hardcoded users
- **API Routes**: Remove /api/seed-* endpoints entirely
- **Recognition**: Switch to DirectHCS service only (already implemented)

---

## Classification Results

### Keep in Dev Only
*Components useful for development but should be hidden in production*
- **HeaderModeChips** - Primary demo control interface (already has DEMO_MODE guard)
- **Runtime flag system** - Useful for development toggles
- **My/Global scope filtering** - Legitimate feature for any environment

### Keep but Harden  
*Components to keep but guard behind explicit ALLOW_DEMO flag*
- **SignalsStore tag separation** - Keep the architecture but remove demo-specific logic
- **Bootstrap system** - Remove demo session support, keep core functionality
- **ContactProfileSheet** - Remove demo profile fallbacks, keep HCS-only paths
- **Environment configuration** - Keep flags but default to false/off in production

### Deprecate
*Components to replace with HCS-only paths*
- **Legacy recognition services** - Already being replaced with DirectHCSRecognitionService
- **Profile service demo fallbacks** - Replace with HCS-only profile resolution
- **Session demo defaults** - Remove tm-alex-chen fallback, use proper session generation

### Remove
*Dead code or duplicates to eliminate*
- **lib/data/demoProfiles.ts** - Static demo user database (8 profiles)
- **lib/demo/seed.ts** - Demo event generation system  
- **HCSFeedService.enableSeedMode()** - Demo seeding orchestration
- **API endpoints**: /api/seed-demo, /api/seed-recognition, /api/debug-mint-recognition
- **Demo user arrays** - Hardcoded user lists in services
- **Demo recognition distribution** - Static token assignments

---

## Risk Assessment

### High Risk (Immediate Attention)
- **Session demo defaults** - Could affect production user identity
- **API seed endpoints** - Should not be accessible in production
- **Profile service fallbacks** - May return demo data when HCS fails

### Medium Risk (Plan for Removal)
- **SignalsStore demo logic** - Adds complexity but relatively contained
- **Bootstrap demo integration** - Affects derived calculations
- **Demo environment variables** - Need production defaults

### Low Risk (Cosmetic/Development)
- **HeaderModeChips** - Already guarded, only shows in dev
- **Static demo profiles** - Only used when explicitly imported

---

## Recommended Cleanup Sequence

### Phase 1: Production Safety (Week 1)
1. Add `NEXT_PUBLIC_ALLOW_DEMO=off` guard to all seed APIs  
2. Remove demo session defaults from `lib/session.ts`
3. Set production environment defaults (DEMO_MODE=false, DEMO_SEED=off)
4. Add build-time checks to prevent demo imports in production bundles

### Phase 2: Service Cleanup (Week 2)
1. Remove `HCSFeedService.enableSeedMode()` and related demo arrays
2. Clean up demo fallbacks in profile and recognition services
3. Simplify `SignalsStore` by removing seeded tag logic
4. Update bootstrap to remove demo session support

### Phase 3: Data Removal (Week 3) 
1. Delete `lib/data/demoProfiles.ts` and `lib/demo/seed.ts`
2. Remove API seed endpoints entirely
3. Clean up demo-related imports across components
4. Update tests to use HCS-only data paths

### Phase 4: Hardening (Week 4)
1. Add comprehensive production guards
2. Implement bundle analysis to verify no demo code in production
3. Add runtime assertions for demo mode state
4. Document HCS-only architecture

---

## Next Steps

1. ✅ Create analysis document
2. ✅ Run systematic searches  
3. ✅ Populate artifact inventory
4. ✅ Map dependencies and flows
5. ✅ Document kill switches
6. ✅ Classify each component
7. ✅ Create removal/hardening plan
8. ⏳ **Execute Phase 1 (Production Safety)**

---

**Status**: 🔍 **ANALYSIS COMPLETE** - Ready for implementation

**Key Insight**: Demo system is more pervasive than expected, touching 15+ components with multiple integration points. Systematic cleanup required to avoid breaking production behavior.

*Last Updated: Analysis complete, implementation plan ready*
