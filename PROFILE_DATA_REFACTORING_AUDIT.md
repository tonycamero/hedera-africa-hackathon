# Profile Data Refactoring Audit

## Problem Summary
The app has inconsistent profile data sources and formats:
1. **Old HCS messages**: nested `payload.handle`, no `accountId` field
2. **New HCS messages**: flat `displayName`, `accountId` at top level
3. **localStorage (`tm:users`)**: Used as source of truth in many places
4. **API inconsistency**: Two profile update endpoints with different formats

## Critical Issues

### 1. Two Profile Update Endpoints
- ❌ **OLD**: `/api/profile/update` - writes nested `payload.handle`, no `accountId`
- ✅ **NEW**: `/api/hcs/profile` - writes flat `displayName`, `accountId`
- **Action**: Deprecate or remove `/api/profile/update`

### 2. localStorage as Source of Truth
Multiple files treat `tm:users` localStorage as authoritative instead of HCS:

#### **lib/session.ts** (Lines 31, 96, 145)
- Reads `tm:users` to get `hederaAccountId`, `displayName`, `email`
- Used in `getSessionId()` and `getSessionProfile()`
- **Issue**: Returns localStorage data instead of querying HCS
- **Fix**: Query `/api/profile/status` for profile data instead

#### **lib/services/MagicWalletService.ts** (Lines 327-351)
- Stores and retrieves users from `tm:users` localStorage
- `storeUser()`, `getStoredUsers()`, `updateUser()`
- **Issue**: This is the write path for user data, bypassing HCS
- **Fix**: These functions should be minimal (only for auth state), not profile data

#### **app/me/page.tsx** (Lines 59-69, 143-158)
- Loads profile from backend FIRST (good!)
- Falls back to localStorage if backend has no data
- Updates localStorage on save
- **Issue**: localStorage fallback may show stale data
- **Fix**: Remove localStorage fallback, trust backend only

#### **components/HeaderMenu.tsx** (Lines 31-40, 52)
- Reads email and accountId from `tm:users`
- **Issue**: Won't reflect profile updates until page refresh
- **Fix**: Fetch from `/api/profile/status` or use React context

#### **lib/hooks/useProfileGate.ts** (Lines 31-43)
- Checks `tm:users` to verify login state
- **Issue**: Mixes auth check with profile check
- **Fix**: Check Magic auth separately, then query HCS for profile

### 3. Old Payload Structure References

#### **lib/ingest/normalizers.ts** (Lines 170, 327, 335)
- `extractActor()` checks `payload.sessionId` (line 170)
- **Issue**: Still supports old nested format
- **Status**: ✅ CORRECT - needs backward compatibility for reading old messages
- **Action**: Keep for reading, ensure no new writes use this format

#### **lib/hcs/canonical-events.ts** (Lines 327, 335)
- References `payload.handle` and `payload.name` in contact state folding
- **Status**: ✅ CORRECT - this is for contact events, not profile events
- **Action**: No change needed

#### **components/ActivityFeed.tsx** (Line 135)
- References `payload.handle`
- **Need to check**: What is the context?

## Refactoring Plan

### Phase 1: Audit and Document (CURRENT)
- [x] Identify all localStorage dependencies
- [x] Map profile data flow
- [ ] Check ActivityFeed usage

### Phase 2: API Consolidation
- [ ] Mark `/api/profile/update` as deprecated
- [ ] Ensure all profile saves go through `/api/hcs/profile`
- [ ] Verify onboarding uses correct endpoint (already done ✅)

### Phase 3: Data Source Migration
- [ ] Create React context for current user profile
- [ ] Context fetches from `/api/profile/status` on mount
- [ ] Replace all localStorage profile reads with context
- [ ] Keep `tm:users` ONLY for auth state (email, accountId, publicKey)

### Phase 4: Backend Query Layer
- [ ] Update `lib/session.ts` to query backend instead of localStorage
- [ ] Remove profile fields from `tm:users` localStorage structure
- [ ] Keep only: `email`, `magicDID`, `hederaAccountId`, `publicKey`

### Phase 5: Component Updates
- [ ] `HeaderMenu.tsx` - use profile context
- [ ] `useProfileGate.ts` - separate auth check from profile check
- [ ] `app/me/page.tsx` - remove localStorage fallback

### Phase 6: Cleanup
- [ ] Remove unused `updateUser()` calls that write profile data to localStorage
- [ ] Add migration script to clear old localStorage profile data
- [ ] Update all documentation

## Backward Compatibility Strategy

**Reading old HCS messages**: ✅ Keep support
- `/api/profile/status` already checks both flat and nested formats
- Normalizers handle both structures
- Contact/signal ingestion supports old payload formats

**Writing new HCS messages**: ✅ Use flat structure only
- All new profile updates use `/api/hcs/profile`
- Flat structure: `{ accountId, displayName, bio, avatar, timestamp }`

## Testing Checklist
- [ ] Test with account that has old nested profile data
- [ ] Test with account that has new flat profile data
- [ ] Test profile update flow (should write flat structure)
- [ ] Test contacts list (should show display names from HCS)
- [ ] Test HeaderMenu (should show current user email/display name)
- [ ] Test onboarding (should detect existing profiles correctly)

## Files to Modify

### High Priority
1. `lib/session.ts` - Query backend instead of localStorage
2. `components/HeaderMenu.tsx` - Use profile context or API
3. `lib/hooks/useProfileGate.ts` - Separate auth from profile checks
4. `app/me/page.tsx` - Remove localStorage fallback

### Medium Priority
5. `lib/services/MagicWalletService.ts` - Reduce to auth-only storage
6. Create new `contexts/ProfileContext.tsx` - Centralized profile state

### Low Priority (Monitoring)
7. `lib/ingest/normalizers.ts` - Already handles both formats ✅
8. `components/ActivityFeed.tsx` - Check usage of `payload.handle`

## Notes
- **Do NOT remove backward compatibility for reading** - old HCS messages won't change
- **Focus on write path** - ensure all new data uses flat structure
- **Separate concerns**: Auth state (localStorage) vs Profile data (HCS)
