# Registry Audit & Remediation Plan

## Problem
Topic IDs are hardcoded throughout the codebase instead of using the centralized registry (`lib/hcs2/registry.ts`). This causes:
- Topic ID mismatches between dev/prod
- Difficult maintenance when topics change
- No single source of truth

## Solution
Use **registry as single source of truth**:
- Client components: `useTopicRegistry()` hook
- Server API routes: `getRegistryTopics()` from `lib/hcs2/registry.ts`
- Service classes: Initialize from registry

## Files Requiring Fixes

### Client Components (use useTopicRegistry hook)
- [ ] components/ContactProfileSheet.tsx (lines 936, 943)
- [ ] app/(tabs)/circle/page.tsx (line 234)
- [ ] app/(tabs)/signals/page.tsx
- [ ] components/ActivityFeed.tsx
- [ ] components/SignalDetailModal.tsx
- [ ] components/CommunityClusterModal.tsx

### API Routes (use getRegistryTopics())
- [ ] app/api/hcs/profile/route.ts (line 15)
- [ ] app/api/hcs/publish-recognition-definition/route.ts
- [ ] app/api/hcs/system-message/route.ts
- [ ] app/api/signal/boost/route.ts
- [ ] app/api/signal/suggest/route.ts

### Service Classes (accept topics in constructor/initialize)
- [ ] lib/services/HCSFeedService.ts (already uses registry ✓)
- [ ] lib/services/HCSRecognitionService.ts
- [ ] lib/services/DirectHCSRecognitionService.ts
- [ ] lib/services/GenzSignalService.ts
- [ ] lib/services/ProfessionalRecognitionService.ts

### Utilities
- [ ] lib/utils/hrl.ts
- [ ] lib/v2/engine/policyEngine.ts

### Debug/Dev Tools (lower priority)
- app/api/debug/manual-load/route.ts
- app/debug/backfill/route.ts
- app/debug/mirror/route.ts

## Registry Structure

```typescript
// lib/hcs2/registry.ts (server-side)
export async function getRegistryTopics(): Promise<RegistryTopics> {
  return {
    contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
    trust: process.env.NEXT_PUBLIC_TOPIC_TRUST,
    profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
    recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
    //...
  }
}

// lib/hooks/useTopicRegistry.ts (client-side)
export function useTopicRegistry(): TopicRegistry {
  return {
    contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
    // ...
  }
}
```

## Execution Order
1. ✅ Created useTopicRegistry hook
2. Fix client components (high priority - user-facing)
3. Fix API routes (high priority - backend)
4. Fix service classes (medium priority - infrastructure)
5. Fix utilities (lower priority)
6. Verify end-to-end


## Critical Fix Applied

### Architecture Decision: Registry as Single Source of Truth

**Before:**
- Topic IDs scattered across codebase
- Mix of env vars, hardcoded IDs, and registry calls
- Silent fallbacks to wrong topic IDs

**After:**
- ALL code MUST call `getRegistryTopics()` (server) or `useTopicRegistry()` (client)
- Registry internally reads from `process.env.NEXT_PUBLIC_TOPIC_*`
- No hardcoded topic IDs anywhere
- Fail-fast if env vars missing

### Fixed Files
- ✅ lib/services/HCSFeedService.ts - Now calls getRegistryTopics()
- ✅ lib/hooks/useTopicRegistry.ts - Created for client-side access

### Data Flow
```
Code → Registry → Env Vars
     ↓
No direct env access
No hardcoded IDs
Single point of control
```

### Verification
Restart dev server and check console:
```
[HCSFeedService] Loading topics from registry...
[HCSFeedService] Loaded topics from registry: { 
  contacts: "0.0.6896005",
  trust: "0.0.6896005",
  profile: "0.0.6896008",
  recognition: "0.0.7148065"
}
```

