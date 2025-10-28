# TrustMesh Clean Topics Migration (v2)

**Date**: 2025-10-28  
**Status**: ✅ Complete - Ready for Testing

## Summary

Successfully migrated TrustMesh to new clean HCS topics, removing all demo data pollution and implementing schema v2 with proper filtering guardrails.

---

## 🎯 What We Fixed

### Problem
- Old topics contained demo/fake data (tm-alex-chen, etc.)
- Random session IDs not linked to real user accounts
- No schema versioning or validation
- Demo data polluting production UI

### Solution
- Created 4 new clean HCS topics
- Seeded ONLY recognition token catalog (44 definitions)
- Implemented type/version/audience whitelist
- Session IDs now use Hedera Account IDs

---

## 📋 New HCS Topics

| Purpose | Old Topic | New Topic (Clean v2) |
|---------|-----------|---------------------|
| **Contact** | 0.0.6896006 | **0.0.7148063** |
| **Trust** | 0.0.6896005 | **0.0.7148064** |
| **Recognition** | 0.0.6895261 | **0.0.7148065** |
| **Profile** | 0.0.6896008 | **0.0.7148066** |

All topic IDs updated in `.env.local`.

---

## ✅ Completed Tasks

### 1. Created Clean Topics
- ✅ Generated 4 new topics on Hedera testnet
- ✅ All topics have `submitKey` and `adminKey` set
- ✅ Topics memo includes "Clean v2" marker

### 2. Updated Configuration
- ✅ `.env.local` updated with new topic IDs
- ✅ Both `NEXT_PUBLIC_*` and server-side vars synced
- ✅ Old topic IDs documented for reference

### 3. Seeded Catalog Only
- ✅ Created `scripts/seed-catalog-only-v2.ts`
- ✅ Seeded 44 recognition token definitions
- ✅ All definitions use **v:2 schema**
- ✅ Unique `jti` per definition (no replays)
- ✅ Marked with `origin: "seed"` for filtering
- ✅ `aud: "trustmesh"` for audience validation
- ✅ 100% success rate (44/44 submitted)

### 4. Implemented Whitelist Filter
- ✅ Added type/version filter to `/api/circle`
- ✅ Whitelisted types: `CONTACT_REQUEST`, `CONTACT_ACCEPT`, `CONTACT_MIRROR`, `TRUST_ALLOCATE`, `TRUST_REVOKE`, `RECOGNITION_DEFINITION`, `RECOGNITION_MINT`
- ✅ Schema version check: v1 or v2 only
- ✅ Audience validation: v2 requires `aud: "trustmesh"`
- ✅ Logs filtered events for debugging

### 5. Verified TRST Balance
- ✅ Confirmed `/api/trst/balance` queries HTS Mirror Node directly
- ✅ Queries by `token.id` + `accountId` (not HCS)
- ✅ Balance unaffected by topic migration

### 6. Cleared Caches
- ✅ No Redis in current setup (in-memory only)
- ✅ Server restarted with new config
- ✅ Client-side localStorage unchanged (sessions persist)

---

## 🔬 Schema v2 Details

### Envelope Format
```typescript
{
  type: 'RECOGNITION_DEFINITION',  // Type whitelist
  from: '0.0.5864559',              // Operator account
  nonce: 1730085600,                // Monotonic, prevents replay
  ts: 1730085600,                   // Unix timestamp
  
  payload: {
    v: 2,                           // Schema version
    t: 'catalog.definition@2',      // Typed namespace
    jti: 'uuid-v4',                 // Unique identifier
    aud: 'trustmesh',               // Audience filter
    origin: 'seed',                 // Source marker
    
    def: {
      id: 'delulu',
      name: 'Delulu',
      description: 'delicious confidence',
      icon: '🤡',
      category: 'social',
      rarity: 'Common'
    },
    
    iat: 1730085600,                // Issued at
    exp: 1761621600                 // Expires (1 year)
  }
}
```

### Filtering Rules
1. **Type whitelist** - Only allowed message types
2. **Version check** - `v: 1` or `v: 2` only
3. **Audience validation** - v2 requires `aud: "trustmesh"`
4. **No heuristics** - Filter by schema fields, not ID prefixes

---

## 🧪 Testing Checklist

### Ready to Test
- [ ] Login as `tony@scend.cash` (real account)
- [ ] Login as `admin@scend.cash` (second test account)
- [ ] Generate QR contact request
- [ ] Scan/accept contact between accounts
- [ ] Verify contact appears in `/contacts` page
- [ ] Verify no demo data visible anywhere
- [ ] Check browser console for HCS submission logs
- [ ] Confirm Mirror Node lag is acceptable (~3-5 sec)

### Expected Behavior
- ✅ Clean contacts page (no demo users)
- ✅ QR exchange creates v2 envelopes
- ✅ Contacts appear after Mirror Node confirmation
- ✅ No "tm-alex-chen" or fake IDs visible
- ✅ TRST balance loads correctly
- ✅ Session ID = Hedera Account ID

---

## 🚨 Important Notes

### What Changed
- **Session IDs**: Now use Hedera Account ID (e.g., `0.0.12345`)
- **All HCS messages**: Must include v2 envelope fields
- **Filter is strict**: Invalid messages are dropped silently
- **No backward migration**: Old demo data stays on old topics

### What Didn't Change
- **TRST balances**: Still query HTS directly
- **Magic auth**: Still works the same
- **User localStorage**: Not affected by migration
- **Recognition catalog**: Same 44 tokens, just clean data

### Gotchas
- **Mirror Node lag**: Normal 3-5 second delay for consensus
- **Nonce validation**: Must be monotonically increasing per `from`
- **Type routing**: `/api/hcs/submit` routes by `type` field
- **No demo toggle**: Old demo data not accessible from new topics

---

## 🔧 Rollback Plan (if needed)

If migration fails, revert `.env.local` to old topic IDs:

```bash
# OLD TOPICS
TOPIC_CONTACT=0.0.6896006
TOPIC_TRUST=0.0.6896005
TOPIC_RECOGNITION=0.0.6895261
TOPIC_PROFILE=0.0.6896008

# (Update all NEXT_PUBLIC_* vars too)
```

Then restart server. Old demo data will be visible again.

---

## 📊 Migration Stats

- **Topics Created**: 4
- **Catalog Definitions Seeded**: 44
- **Success Rate**: 100%
- **Demo Data Migrated**: 0 (intentionally)
- **Schema Version**: v2
- **Time to Migrate**: ~5 minutes
- **Downtime**: 0 (rolling update)

---

## ✅ Sign-Off

Migration complete. System is ready for real-user testing with:
- Clean HCS topics
- v2 schema enforcement
- No demo data pollution
- Proper filtering guardrails

**Next**: Test contact exchange with real accounts.

---

## 📚 Reference Files

- Topic creation: `scripts/create-clean-topics.ts`
- Catalog seeding: `scripts/seed-catalog-only-v2.ts`
- API filter: `app/api/circle/route.ts` (lines 47-84)
- Session management: `lib/session.ts`
- TRST balance: `lib/services/trstBalanceService.ts`

---

**Questions?** Check the conversation summary or see:
- `BACKEND_HANDOFF_DOCUMENT.md`
- `docs/HCS_V2_AUDIT.md`
- `REGISTRY_IMPLEMENTATION.md`
