# /me Page Profile Loading Fix

## Problem
After completing onboarding and submitting profile via the "Create Profile" form, the `/me` page wasn't showing the submitted profile data (displayName, bio).

## Root Cause
The `/me` page was only loading profile data from `localStorage`, but the onboarding flow saves the profile to:
1. Backend `profileStore` (in-memory on server)
2. Hedera HCS (immutable ledger)

The `/me` page had no code to fetch from the backend.

## Solution

### 1. Enhanced `/api/profile/status` Endpoint
**Added** profile data fields to response:
```typescript
{
  accountId: string,
  hasCompletedOnboarding: boolean,
  profile: {
    displayName?: string,
    bio?: string,              // NEW
    createdAt?: string,
    hasLens: boolean,
    lens?: object              // NEW
  } | null
}
```

### 2. Updated `/me` Page Profile Loading
**Before**: Only checked `localStorage`
```typescript
useEffect(() => {
  const users = localStorage.getItem('tm:users')
  // ... only localStorage logic
}, [])
```

**After**: Fetches from backend first, falls back to localStorage
```typescript
useEffect(() => {
  async function loadProfile() {
    // 1. Fetch from backend (source of truth)
    const res = await fetch('/api/profile/status', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (data?.profile?.displayName) {
      setHandle(data.profile.displayName)
    }
    if (data?.profile?.bio) {
      setBio(data.profile.bio)
    }
    
    // 2. Fallback to localStorage for fields not in backend
    const users = localStorage.getItem('tm:users')
    if (!loadedHandle && u?.handle) setHandle(u.handle)
    // ...
  }
  loadProfile()
}, [accountId])
```

### 3. Added Loading State
- Shows spinner while fetching profile
- Prevents flash of empty form
- Better UX for slow connections

## Flow Now

1. User completes onboarding → Profile saved to `profileStore` + HCS
2. User navigates to `/me`
3. Page loads:
   - ✅ Fetches from `/api/profile/status` (backend)
   - ✅ Displays `displayName` and `bio` from backend
   - ✅ Falls back to localStorage for fields not in backend (visibility, location)
4. User sees their submitted profile data ✅

## Files Changed

1. **`app/api/profile/status/route.ts`**
   - Added `bio` and `lens` to response
   - Now returns full profile metadata

2. **`app/me/page.tsx`**
   - Added async profile loading from backend
   - Added loading state with spinner
   - Backend data takes precedence over localStorage
   - Proper fallback logic

## Data Source Priority

1. **Backend (profileStore)** - Source of truth
   - `displayName`
   - `bio`
   - `createdAt`
   - `lens` configuration

2. **localStorage** - Fallback only
   - Used if backend doesn't have the field
   - Also stores UI-only fields: `visibility`, `location`

## Testing

- [x] Complete onboarding with displayName + bio
- [x] Navigate to `/me` → Profile data appears
- [x] Refresh `/me` → Profile data persists
- [x] Clear localStorage → Profile still loads from backend
- [x] Clear backend data → Falls back to localStorage (if available)

## Technical Notes

### Why profileStore?
- Created during onboarding via `/api/hcs/profile` POST
- Stores profile metadata server-side
- Persists across sessions (until server restart in current implementation)
- Single source of truth for profile state

### Why Still Use localStorage?
- Faster initial load (no network request)
- Works offline
- Stores additional UI-only fields
- Fallback for demo/dev scenarios

### Future Improvements
- [ ] Migrate profileStore to persistent database (currently in-memory)
- [ ] Add profile caching with SWR or React Query
- [ ] Sync localStorage with backend on updates
- [ ] Add edit timestamps to detect stale data
- [ ] Support profile photos/avatars

## Related Fixes
- `EXISTING_USER_FIX.md` - Profile detection for routing
- `ONBOARDING_FLOW.md` - How profile is created
