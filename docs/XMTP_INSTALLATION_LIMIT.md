# XMTP Installation Limit Fix

## Problem
XMTP V3 limits each inbox to **10 concurrent installations** (one per device/browser/session). Each `Client.create()` call registers a new installation. Without cleanup, repeated logins eventually hit the limit and block new sessions with error:

```
Cannot register a new installation because the InboxID has already registered 10/10 installations.
Please revoke existing installations first.
```

## Solution
Automatic installation pruning that runs **before** client initialization. The system:

1. Uses XMTP `Utils` to check for existing inbox (without creating client)
2. Queries inbox state to list all installations (via static methods)
3. If ≥10 installations exist, revokes oldest ones to keep 5 most recent
4. Creates XMTP client with room for new installation
5. Logs all pruning activity for debugging

## Implementation

### Location
`lib/xmtp/client.ts`

### Key Functions

#### `pruneOldInstallationsPreCreate(utils, signer, identifier)`
- Called automatically **before** `Client.create()`
- Uses `utils.getInboxIdForIdentifier()` to find existing inbox (no client needed)
- Fetches inbox state via `utils.inboxStateFromInboxIds()` (static method)
- Sorts installations by timestamp (oldest to newest)
- Keeps 5 most recent installations for multi-device support
- Revokes oldest installations using `utils.revokeInstallations()` (no client needed)
- Skips cleanup gracefully for new users (no inbox found)

#### `listInstallations(client: Client | null)`
- Debug utility to view all installations for current user
- Returns array with `id`, `timestamp`, and `isCurrent` flag
- Example usage:
  ```ts
  const client = await getXMTPClient(identity)
  const installations = await listInstallations(client)
  console.log('Installations:', installations)
  ```

### Behavior Matrix

| Scenario | Action |
|----------|--------|
| No inbox found | Skip cleanup (new user) |
| < 10 installations | No action (under limit) |
| = 10 installations | Revoke 5 oldest, keep 5 newest |
| > 10 installations | Revoke all but 5 newest |
| Revocation fails | Warning logged, client creation may fail |

### Console Logs

**New user (no inbox):**
```
[XMTP] Initializing client with pre-cleanup...
[XMTP] No inbox found — new user, skip cleanup
[XMTP] Client ready: { inboxId, installationId }
```

**Normal flow (under limit):**
```
[XMTP] Initializing client with pre-cleanup...
[XMTP] Found existing inbox: 92aa13212da0...
[XMTP] Found 3 installations
[XMTP] Under limit (3/10), no cleanup needed
[XMTP] Client ready: { inboxId, installationId }
```

**Pruning flow (at limit):**
```
[XMTP] Initializing client with pre-cleanup...
[XMTP] Found existing inbox: 92aa13212da0...
[XMTP] Found 10 installations
[XMTP] Revoking 5 old installations (keeping 5 most recent)...
[XMTP] Old installations revoked successfully
[XMTP] Client ready: { inboxId, installationId }
```

**Failure (network/auth error):**
```
[XMTP] Pre-creation cleanup failed (might be new user): [error details]
[XMTP] Client ready: { inboxId, installationId }
```

## Technical Details

### XMTP V3 SDK API
- `Utils.getInboxIdForIdentifier(identifier, env)` → Finds inbox without client
- `Utils.inboxStateFromInboxIds(inboxIds, env)` → Fetches installation state without client
- `Utils.revokeInstallations(signer, inboxId, installationIds, env)` → Revokes installations without client
- `Client.create(signer, options)` → Creates client with new installation

### Installation Metadata
```ts
type SafeInstallation = {
  id: string                    // Unique installation identifier
  bytes: Uint8Array            // Raw installation ID bytes (used for revocation)
  clientTimestampNs?: bigint   // Creation timestamp in nanoseconds
}
```

### Why Pre-Creation Pruning?
- **Critical**: `Client.create()` fails if 10/10 installations already exist
- Post-creation cleanup cannot run because client creation never succeeds
- XMTP provides `Utils` class with static methods for inbox operations without a client
- Pre-creation approach: check installations → clean up → create client with available slot
- Handles both new users (no inbox) and existing users (cleanup first) gracefully

## Testing

### Manual Test Steps
1. Clear browser cache/storage (force new installation)
2. Login to TrustMesh multiple times (10+ sessions)
3. Check console logs for pruning activity
4. Verify messaging functionality works after pruning

### Debug Helper
Add to any component:
```tsx
'use client'
import { getXMTPClient, listInstallations } from '@/lib/xmtp/client'

export function XMTPDebugPanel() {
  const handleCheck = async () => {
    const identity = await getCurrentIdentity() // your auth logic
    const client = await getXMTPClient(identity)
    const installations = await listInstallations(client)
    console.table(installations)
  }
  
  return <button onClick={handleCheck}>Check Installations</button>
}
```

## Edge Cases

### Multiple Browser Tabs
- Each tab creates its own XMTP client (separate installations)
- Pruning happens independently in each tab
- Race condition: Multiple tabs may prune simultaneously
- Result: Safe (idempotent revocation, latest survives)

### Offline/Network Errors
- `inboxState()` call may fail
- Pruning logs warning but doesn't throw
- Client remains usable (already initialized)

### Development Environment
- XMTP `dev` network may not support revocation in all scenarios
- Errors are logged as warnings, not fatal
- Production `production` environment fully supports revocation

## Configuration

### Constants
```ts
const MAX_INSTALLATIONS = 5  // Keep 5 most recent installations
```

Currently pruning keeps **5 most recent installations** to support multi-device usage while preventing limit errors. To adjust:

```ts
// Modify MAX_INSTALLATIONS at top of file
const MAX_INSTALLATIONS = 3  // More aggressive cleanup
const MAX_INSTALLATIONS = 8  // More lenient (closer to limit)

// The function automatically uses this constant:
const keepCount = Math.min(MAX_INSTALLATIONS, installations.length - 1)
```

## Monitoring

### Metrics to Track
- Frequency of pruning events (how often we hit 10 installations)
- Average installation count per user
- Revocation success/failure rate
- Time to complete pruning operation

### Log Queries (if using log aggregation)
```
"[XMTP] Revoking" level:info
→ Count pruning events

"[XMTP] Installation prune failed" level:warn
→ Track failures
```

## Related Files
- `lib/xmtp/client.ts` - Implementation
- `lib/config/xmtp.ts` - XMTP environment config
- `components/xmtp/ConversationList.tsx` - UI that triggers client init

## References
- [XMTP V3 SDK Docs](https://github.com/xmtp/xmtp-js)
- [@xmtp/browser-sdk v5.x](https://www.npmjs.com/package/@xmtp/browser-sdk)
- Installation limit: 10 per inbox (XMTP protocol spec)

## Rollback Plan
If pruning causes issues:

1. Remove pre-creation cleanup from `initClient()`:
   ```diff
   - // PRE-CREATION CLEANUP
   - try {
   -   await pruneOldInstallationsPreCreate(utils, signer, identifier)
   - } catch (cleanupError) {
   -   console.warn('[XMTP] Pre-creation cleanup failed:', cleanupError)
   - }
   ```

2. Manual cleanup script for affected users:
   ```ts
   // Run once in dev console after successful login
   const client = await getXMTPClient(identity)
   const state = await client.inboxState(true)
   console.log('Installations:', state.installations.length)
   
   // Manual revocation if needed
   if (state.installations.length > 5) {
     const sorted = state.installations.sort((a, b) => 
       Number((a.clientTimestampNs || 0n) - (b.clientTimestampNs || 0n))
     )
     const revokeTargets = sorted.slice(0, -5).map(i => i.bytes)
     await client.revokeInstallations(revokeTargets)
   }
   ```

3. Monitor error logs for recurring installation limit errors
