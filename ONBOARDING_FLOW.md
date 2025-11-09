# Onboarding Flow (Updated for Single-Lens Mode)

## Overview
The onboarding sequence has been streamlined to remove lens selection and properly handle both new and returning users.

## Flow for NEW Users

1. **Login Page (`/`)**
   - User enters email
   - Magic.link sends OTP email
   - User clicks link to authenticate

2. **Profile Check**
   - System checks if user has existing profile via `/api/profile/get-lens`
   - New users proceed to onboarding
   - Existing users skip to contacts

3. **Onboarding Page (`/onboard`)**
   
   **Step 1: Welcome Carousel** (first-time only)
   - 5 slides explaining TrustMesh
   - Can be skipped
   - "Skip" button or complete carousel
   
   **Step 2: Accept Stipend**
   - User accepts 1 HBAR + 1.35 TRST
   - Creates Hedera account if needed
   - Associates TRST token
   - Marked in localStorage to prevent double-claim
   
   **Step 3: Create Profile**
   - Auto-initializes with `base` lens (no user choice)
   - User enters display name (required, min 2 chars)
   - User enters bio (optional)
   - Profile signed with Magic Hedera keys
   - Published to HCS via `/api/hcs/profile`
   
4. **Redirect to Contacts (`/contacts`)**
   - User can now exchange recognitions

## Flow for RETURNING Users

1. **Login Page (`/`)**
   - User enters email
   - Magic.link authenticates

2. **Profile Check**
   - System detects existing profile
   - **Direct redirect to `/contacts`**
   - Skips onboarding entirely

3. **Contacts Page (`/contacts`)**
   - User continues using the app

## Key Changes

### ✅ Removed
- ❌ `ChooseFirstLens` component step
- ❌ Lens selection UI in onboarding
- ❌ Manual lens configuration

### ✅ Added
- ✅ Auto-initialization with `base` lens via `SINGLE_LENS`
- ✅ Smart routing in `MagicLogin` (checks for existing profile)
- ✅ Existing user detection in `/onboard` page
- ✅ Automatic redirect for returning users

### ✅ Preserved
- ✅ Welcome carousel for first-time users
- ✅ Stipend acceptance flow (1 HBAR + 1.35 TRST)
- ✅ Profile creation with Magic.link signatures
- ✅ Resume-friendly (can refresh during onboarding)

## Technical Details

### Profile Detection
Uses `/api/profile/get-lens` endpoint to check:
```typescript
if (data?.accountId || (data?.owned && data.owned.length > 0)) {
  // User has profile → /contacts
} else {
  // New user → /onboard
}
```

### Lens Initialization
Automatically called during profile creation:
```typescript
await fetch('/api/lens/init-first', {
  method: 'POST',
  body: JSON.stringify({ lens: SINGLE_LENS }), // 'base'
})
```

### State Management
- `tm:users` - localStorage array of Magic users
- `tm:stipend:{accountId}` - Tracks if stipend claimed
- `tm:carousel:seen` - Tracks if carousel completed
- `tm:lens` - Lens configuration (now auto-set to base)

## Files Modified

1. **`app/onboard/page.tsx`**
   - Removed `ChooseFirstLens` component
   - Added existing profile detection
   - Auto-initializes base lens during profile creation
   - Removed lens-related state variables

2. **`components/MagicLogin.tsx`**
   - Added profile check after login
   - Smart routing: existing users → `/contacts`, new users → `/onboard`

3. **`components/onboarding/ChooseFirstLens.tsx`**
   - Already updated to return `null` when `ENABLE_SWITCHER=false`
   - Auto-advances if called in single-lens mode

## Environment Variables

Required in `.env.local`:
```bash
TRUSTMESH_SINGLE_LENS=base
NEXT_PUBLIC_ENABLE_LENS_SWITCHER=false
ENABLE_LENS_UNLOCK=false
```

## Testing Checklist

### New User Flow
- [ ] Login with new email at `/`
- [ ] See welcome carousel (or skip)
- [ ] Accept stipend (should create account + associate TRST)
- [ ] Enter display name and bio
- [ ] Submit profile creation
- [ ] Redirect to `/contacts`
- [ ] Verify no lens selection UI appeared

### Returning User Flow
- [ ] Login with existing email at `/`
- [ ] **Immediately** redirect to `/contacts` (skip onboarding)
- [ ] Verify profile/recognitions still work
- [ ] Verify stipend not offered again

### Edge Cases
- [ ] Refresh during onboarding (should resume, not restart)
- [ ] Back button during onboarding (should preserve state)
- [ ] Network failure during profile creation (should show error)
- [ ] Multiple browser tabs (localStorage sync)

## Error Handling

- Profile check failure → Continues to onboarding (safe default)
- Lens init failure → Non-critical warning (profile still created)
- Stipend failure → Logged but doesn't block profile creation
- Magic token expiry → User prompted to re-authenticate

## Next Steps (Future)

To re-enable multi-lens:
1. Set env flags to `true`
2. Uncomment lens selection UI
3. Remove auto-initialization logic
4. Test lens unlock/payment flow

No code removal needed—everything is feature-flagged!
