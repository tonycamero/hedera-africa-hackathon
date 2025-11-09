# HCS/HCS-22 Refresh Strategy

## Core Principle

**Only refresh when identity is created or mutated.** Do not refresh on reads, mints, or other non-identity operations.

## Refresh Triggers

### Automatic Triggers

| Event | Location | Reason | Implementation |
|-------|----------|--------|----------------|
| **Server Start** | `instrumentation.ts` | Initial warmup (last 7 days) | `initHcs22()` |
| **Periodic Background** | `init.ts` | Incremental updates (new messages only) | `setInterval()` every N minutes |
| **Identity Provision** | `resolveOrProvision.ts:117` | New user needs immediate visibility | `reduceHcs22()` local cache update |
| **Profile Update** | `/api/hcs/profile` POST | Other users need fresh profile data | `refreshBindings()` non-blocking |

### Manual Triggers

| User Action | Endpoint | Use Case |
|-------------|----------|----------|
| **Pull-to-Refresh** | `POST /api/hcs22/refresh` | User explicitly syncs |
| **Debug/Admin** | Same endpoint | Manual cache sync |

## When NOT to Refresh

**Do not trigger refresh for:**
- ❌ Recognition mint (HCS-20) - uses existing identities
- ❌ Contact bond (HCS-10) - uses existing identities
- ❌ Reading feeds/lists - serve from cache
- ❌ Lens/persona switch - UI state only
- ❌ Any read-only operation

## Configuration

```bash
# .env.local
HCS22_ENABLED=true
HCS22_REFRESH_INTERVAL_MINUTES=5  # 0 to disable periodic
HCS22_LOG_LEVEL=info              # or 'debug'
```

## Decision Rule

**Ask: "Does this action create or mutate identity?"**

- ✅ **Yes** → Trigger refresh
  - New user signup
  - Profile update (HCS-11)
  - DID ↔ Hedera rebinding
  
- ❌ **No** → Do NOT trigger refresh
  - Recognition mint
  - Contact bond
  - Feed reads
  - UI state changes

## Refresh Behavior

### Initial Warmup (Server Start)
```
[HCS22] Loaded 105 identity bindings from 139 messages
[HCS22] Periodic refresh enabled (every 5 minutes)
```

### Incremental Refresh (After Watermark)
```
[HCS22] Refresh: +3 new bindings
```
Only fetches messages newer than last watermark - no redundant processing.

### Profile Update
```
[HCS Profile POST] Invalidated cache for 0.0.7172242
```
Non-blocking background refresh triggered after profile publish.

## Implementation Details

### Mutation Endpoints That Refresh

1. **`/api/hedera/account/create*`** (provision)
   - Calls `reduceHcs22()` immediately
   - No API call needed - local cache update

2. **`/api/hcs/profile`** (POST)
   - Calls `invalidateProfileCache(accountId)`
   - Then triggers `refreshBindings()` non-blocking

### Read Endpoints That Do NOT Refresh

- `/api/recognition/list`
- `/api/profile/status`
- `/api/hcs/mint-recognition`
- `/api/circle`
- All other GET endpoints

### Manual Refresh API

```typescript
// POST /api/hcs22/refresh
// Triggers incremental fetch (non-blocking)
{
  "ok": true,
  "message": "HCS-22 refresh triggered"
}
```

## Future Considerations

As TrustMesh scales:
- Consider Redis for distributed cache
- Add cache eviction policies (LRU)
- Monitor refresh latency and adjust intervals
- Add metrics for cache hit/miss rates

## Why This Works

1. **Efficient**: Only processes new messages (watermark-based)
2. **Silent**: Minimal log noise (summary only)
3. **Scalable**: No refresh spam on every action
4. **Predictable**: Clear rules for when to refresh
5. **Maintainable**: Future devs won't add refreshes everywhere

---

**Remember:** When in doubt, do NOT add a refresh trigger. Let the periodic background refresh handle it.
