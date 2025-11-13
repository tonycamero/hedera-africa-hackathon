# TrustMesh Troubleshooting Guide

## Missing Contacts After Server Restart

### Problem
Contacts that were bonded yesterday (or 3-4 days ago) are not showing up after restarting the dev server.

### Root Cause
The ingestion system (`HcsCircleState`) only looks back at a limited time window when initializing. Your browser may have old cursors saved that prevent it from fetching older events.

### Solution

**Quick Fix: Force a full resync**

1. Open browser console (F12)
2. Run this command:
   ```javascript
   await window.trustmeshIngest.forceResync()
   ```
3. Wait 30 seconds for ingestion to complete
4. Refresh the page

This will:
- Clear all saved cursors (localStorage)
- Clear all cached state (signalsStore + circleState)
- Restart ingestion with a **7-day lookback window**
- Reload all contact bonds from the past week

---

## Debug Commands

TrustMesh exposes several debug commands via `window.trustmeshIngest`:

### Check Current State

```javascript
// View ingestion statistics
window.trustmeshIngest.stats()

// View all signals in store
window.trustmeshIngest.signalsStore()

// View saved cursors (timestamps for each topic)
window.trustmeshIngest.cursors()

// View circle state for a specific user
window.circleState.getCircleFor('0.0.7226146')  // Replace with your account ID
window.circleState.getStats()
```

### Reset & Resync

```javascript
// Clear just the cursors (keeps cached data)
await window.trustmeshIngest.clearCursors()

// Clear all caches (but keep cursors)
window.trustmeshIngest.clearCaches()

// Full resync (clears everything and reloads from HCS)
await window.trustmeshIngest.forceResync()

// Manual restart (keeps existing cursors)
await window.trustmeshIngest.restart()
```

---

## Understanding the Data Flow

### How Contacts Get Loaded

1. **Browser loads** → `startIngestion()` runs
2. **Backfill phase**:
   - Checks for saved cursor in localStorage
   - If no cursor: uses **7-day lookback** (timestamp: now - 7 days)
   - Fetches all events since cursor/lookback
   - Processes events → updates `circleState`
3. **Streaming phase**:
   - Polls Mirror Node every 10 seconds for new events
   - Updates state incrementally
4. **API query** (`/api/circle`):
   - Checks if `circleState.isReady()` (has processed at least 1 event)
   - Returns scoped contacts for authenticated user

### Why Contacts Might Be Missing

| Symptom | Cause | Fix |
|---------|-------|-----|
| **"No contacts found"** (but they exist on HCS) | Old cursor in localStorage prevents loading older events | `forceResync()` |
| **"Circle state initializing" error** | Backfill hasn't completed yet | Wait 30 seconds, refresh |
| **"Missing or invalid Authorization header"** | Frontend not sending Magic token | Already fixed in latest code |
| **Contacts disappear after refresh** | Server restarted, state lost | Normal - run `forceResync()` once |

---

## Checking HCS Directly

Want to verify your bond actually exists on Hedera? Use Mirror Node API directly:

### Find Recent Contact Events

```bash
# Get last 500 messages from contacts topic
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7148063/messages?order=desc&limit=500" | jq '.messages[] | select(.message != null) | {timestamp: .consensus_timestamp, seq: .sequence_number, decoded: (.message | @base64d | fromjson)} | select(.decoded.type == "CONTACT_ACCEPT")'
```

### Search for Specific Accounts

```bash
# Replace 0.0.7226146 and 0.0.7226165 with your account IDs
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7148063/messages?order=asc&limit=500" | jq '[.messages[] | select(.message != null) | {timestamp: .consensus_timestamp, seq: .sequence_number, decoded: (.message | @base64d | fromjson)} | select(.decoded.metadata.from.acct == "0.0.7226146" or .decoded.metadata.to.acct == "0.0.7226165")]'
```

### Calculate Lookback Timestamp

```javascript
// Find timestamp for N days ago
const daysAgo = 7
const timestamp = Math.floor((Date.now() - (daysAgo * 24 * 60 * 60 * 1000)) / 1000)
console.log(`${daysAgo} days ago:`, timestamp + '.0')

// Use in Mirror Node query:
// https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7148063/messages?timestamp=gte:TIMESTAMP_HERE
```

---

## Configuration Settings

### Environment Variables

Check `.env.local` for these settings:

```env
# HCS Configuration
HCS_ENABLED=true                                    # Must be true
MIRROR_REST=https://testnet.mirrornode.hedera.com  # Mirror Node REST API
WS_ENABLED=false                                     # Use REST polling instead of WebSocket

# Ingestion Settings
BACKFILL_PAGE_SIZE=200                              # Messages per page
REST_POLL_INTERVAL=10000                            # Poll every 10 seconds
CURSOR_STORAGE_PREFIX=trustmesh_cursor              # localStorage key prefix

# Topic IDs
NEXT_PUBLIC_HCS_TOPIC_CONTACTS=0.0.7148063
NEXT_PUBLIC_HCS_TOPIC_TRUST=0.0.7148064
NEXT_PUBLIC_HCS_TOPIC_PROFILE=0.0.7148066
```

### Lookback Window

The default lookback window is **7 days** when no cursor is found.

To change this, edit `lib/ingest/ingestor.ts`:

```typescript
// Line ~157
if (!since) {
  // Change 7 to desired number of days
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgoSec = Math.floor(sevenDaysAgo / 1000)
  since = `${sevenDaysAgoSec}.0`
}
```

---

## Common Workflows

### Daily Development
1. Start dev server: `pnpm dev`
2. Open browser, wait for ingestion to complete (check console)
3. Use app normally

### After Adding New Contacts
- Contacts appear within **30 seconds** (after next poll cycle)
- No action needed - optimistic UI shows immediately

### After Server Restart
- If contacts from >7 days ago are missing:
  ```javascript
  await window.trustmeshIngest.forceResync()
  ```
- Contacts from last 7 days will reload automatically

### Testing Edge Cases
```javascript
// 1. Clear everything
await window.trustmeshIngest.forceResync()

// 2. Check what was loaded
console.log('Contacts loaded:', window.circleState.getStats())

// 3. Manually add a test contact event (for testing)
window.circleState.addContactEvent({
  type: 'CONTACT_ACCEPT',
  actor: '0.0.7226146',
  target: '0.0.7226165',
  ts: Date.now(),
  metadata: {
    from: { acct: '0.0.7226146', handle: '01' },
    to: { acct: '0.0.7226165', handle: '03' }
  }
})

// 4. Verify it appears in UI
window.circleState.getContactsFor('0.0.7226146')
```

---

## When to File a Bug

File a bug if:
- ✅ You've run `forceResync()`
- ✅ You've waited 60 seconds
- ✅ You've verified the bond exists on HCS (via Mirror Node API)
- ✅ The bond is within the 7-day lookback window
- ❌ Contacts still don't appear

Include in bug report:
```javascript
// Copy output of these commands:
window.trustmeshIngest.stats()
window.trustmeshIngest.cursors()
window.circleState.getStats()
window.circleState.getCircleFor('YOUR_ACCOUNT_ID')
```

---

## Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `forceResync()` | Clear everything, reload from HCS | Contacts missing after restart |
| `restart()` | Restart ingestion, keep cursors | Polling stopped, need to reconnect |
| `clearCaches()` | Clear signals + circle state | Testing, want fresh state |
| `clearCursors()` | Clear saved timestamps | Want to reload older events |
| `stats()` | View ingestion metrics | Check if backfill completed |
| `cursors()` | View saved timestamps | Debug cursor issues |

---

## Contact Support

**Documentation**:
- [Anti-Surveillance Architecture](./ANTI_SURVEILLANCE_ARCHITECTURE.md)
- [Data Model Explanation](./TRUSTMESH_DATA_MODEL.md)
- [HCS-22 Identity Protocol](./HCS22_QUICKSTART.md)

**GitHub Issues**: [github.com/trustmesh/trustmesh/issues](https://github.com/trustmesh/trustmesh/issues)
