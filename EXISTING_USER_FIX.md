# Existing User Detection Fix

## Problem
User `admin@scend.cash` (existing user) was seeing the onboarding/stipend page and getting error: **"Stipend already claimed for this account"**

## Root Cause
1. Profile detection endpoint `/api/profile/get-lens` wasn't returning enough data to identify existing users
2. Detection logic was checking for `accountId` or `owned` array, but neither was reliable
3. Backend stipend tracking used in-memory `global` state that resets on server restart
4. No robust check for "has this user completed onboarding?"

## Solution

### 1. Created New Endpoint: `/api/profile/status`
**Purpose**: Clear, single-purpose endpoint to check onboarding completion

**Response**:
```typescript
{
  accountId: string,
  hasCompletedOnboarding: boolean,
  profile: {
    displayName?: string,
    createdAt?: string,
    hasLens: boolean
  } | null
}
```

**Detection Logic**:
```typescript
const hasCompletedOnboarding = !!(
  profile?.displayName || 
  profile?.createdAt ||
  (profile?.lens?.owned && profile.lens.owned.length > 0)
)
```

### 2. Updated Detection in MagicLogin
**Before**: Checked unreliable `get-lens` endpoint
**After**: Uses `profile/status` with clear `hasCompletedOnboarding` flag

```typescript
if (data?.hasCompletedOnboarding) {
  console.log('[MagicLogin] Returning user, routing to /contacts')
  router.push('/contacts')
  return
}
// New user → /onboard
```

### 3. Updated Detection in Onboarding Page
**Before**: Same unreliable check
**After**: Uses `profile/status` and redirects immediately

```typescript
if (data?.hasCompletedOnboarding) {
  console.log('[Onboarding] Returning user detected, redirecting to contacts')
  router.push('/contacts')
  return
}
```

### 4. Graceful Stipend Error Handling
**Before**: Crashed with error toast
**After**: Detects "already claimed" error and continues gracefully

```typescript
if (error.error?.includes('already claimed')) {
  console.log('[Onboarding] Stipend already claimed, continuing to profile')
  localStorage.setItem(stipendAcceptedKey, 'true')
  setStipendAccepted(true)
  return // Just mark as accepted and continue
}
```

### 5. Improved `/api/profile/get-lens` Response
Added more metadata for better debugging:
```typescript
{
  accountId,
  owned,
  active,
  hasProfile,
  displayName,
  createdAt
}
```

## Files Changed

1. **`app/api/profile/status/route.ts`** - NEW
   - Dedicated endpoint for onboarding completion check

2. **`app/api/profile/get-lens/route.ts`**
   - Added `hasProfile`, `displayName`, `createdAt` to response

3. **`components/MagicLogin.tsx`**
   - Now uses `/api/profile/status`
   - Clearer routing logic

4. **`app/onboard/page.tsx`**
   - Now uses `/api/profile/status`
   - Graceful handling of "stipend already claimed" error
   - Better redirect logic for returning users

## Flow Now

### Existing User (like admin@scend.cash)
1. Login at `/`
2. **Check**: `/api/profile/status` → `hasCompletedOnboarding: true`
3. **Redirect**: → `/contacts` (skip onboarding entirely)
4. ✅ Never sees stipend page

### New User
1. Login at `/`
2. **Check**: `/api/profile/status` → `hasCompletedOnboarding: false`
3. **Redirect**: → `/onboard`
4. Goes through: Carousel → Stipend → Profile Form → `/contacts`

### Edge Case: Existing User on Onboarding Page
(e.g., direct navigation or page refresh)
1. Page loads `/onboard`
2. **Check**: `/api/profile/status` → `hasCompletedOnboarding: true`
3. **Immediate Redirect**: → `/contacts`
4. ✅ Never stuck on onboarding

### Edge Case: Stipend Already Claimed
(e.g., backend restart cleared in-memory flag, but user already received funds)
1. User tries to accept stipend
2. Backend returns: "Stipend already claimed"
3. **Handler**: Mark as accepted in localStorage, continue to profile form
4. ✅ No error shown to user

## Testing Results

- [ ] Existing user (admin@scend.cash) logs in → Goes to `/contacts`
- [ ] Existing user navigates to `/onboard` → Redirected to `/contacts`
- [ ] New user logs in → Goes to `/onboard`
- [ ] New user completes onboarding → Goes to `/contacts`
- [ ] Stipend already claimed → Continues gracefully

## Technical Notes

### Why profileStore Check?
- `profileStore` is the single source of truth for completed profiles
- A profile exists when:
  - `displayName` is set (from profile creation form)
  - `createdAt` is set (profile was published to HCS)
  - `lens.owned` array has entries (lens was initialized)

### Why Not Just Check localStorage?
- localStorage can be cleared by user
- Backend state (profileStore) is authoritative
- Multiple devices/browsers need consistent state

### Future Improvements
- [ ] Move stipend tracking to database (not in-memory `global`)
- [ ] Add profile completion percentage
- [ ] Store onboarding step progress for resumption
- [ ] Add profile version/migration tracking

## Related Docs
- `ONBOARDING_FLOW.md` - Full onboarding sequence
- `LENS_ROLLBACK.md` - Lens feature flag changes
