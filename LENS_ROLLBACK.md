# Lens Switching Feature Flag Rollback

## Summary
Implemented a clean "soft rollback" that disables multi-lens switching for the hackathon while preserving all recognition infrastructure. The system now operates in **single-lens mode** with `base` as the default lens.

## What Changed

### ✅ Feature Flags Added
Three new environment variables control lens behavior:

```bash
TRUSTMESH_SINGLE_LENS=base                    # Force which lens to use
NEXT_PUBLIC_ENABLE_LENS_SWITCHER=false        # Hide lens switcher UI
ENABLE_LENS_UNLOCK=false                       # Disable lens unlock/payment
```

### ✅ Files Modified

1. **`.env.local.template`** - Added feature flag documentation
2. **`.env.local`** - Enabled rollback flags
3. **`lib/lens/lensConfig.ts`** - Added `SINGLE_LENS`, `ENABLE_LENS_UNLOCK`, `ENABLE_SWITCHER` constants
4. **`lib/hooks/useLens.ts`** - Enforces single-lens mode when `SINGLE_LENS` is set
5. **`components/layout/HeaderLensSwitcher.tsx`** - Returns `null` when `ENABLE_SWITCHER=false`
6. **`components/LensUnlockModal.tsx`** - Returns `null` when `ENABLE_LENS_UNLOCK=false`
7. **`app/api/profile/unlock-lens/route.ts`** - Returns `410 Gone` when `ENABLE_LENS_UNLOCK=false`
8. **`components/onboarding/ChooseFirstLens.tsx`** - Auto-advances with `SINGLE_LENS` in single-lens mode

## What This Achieves

✅ **Keeps recognition infrastructure intact** - All immutable recognition minting works exactly as before  
✅ **Hides lens switching UI** - No switcher in header, no unlock modals  
✅ **Blocks lens unlock payments** - API endpoint disabled (410 status)  
✅ **Simplifies onboarding** - Auto-selects base lens without showing choice  
✅ **Fully reversible** - Just flip env flags to re-enable multi-lens  

## What Still Works

- ✅ Recognition minting (0.01 TRST per mint)
- ✅ All existing recognition data and metadata
- ✅ HCS event publishing for recognitions
- ✅ Catalog system (all three catalogs still exist, only base is exposed)
- ✅ Profile system
- ✅ TRST balance and transfers

## What's Disabled

- ❌ Lens switcher UI in header
- ❌ Lens unlock modal/payment flow
- ❌ `/api/profile/unlock-lens` endpoint
- ❌ Onboarding lens selection screen
- ❌ HCS events for lens unlock/switch
- ❌ Multi-lens vocabulary switching

## How to Re-enable Later

To restore full multi-lens functionality, just update `.env.local`:

```bash
# Re-enable lens switching
TRUSTMESH_SINGLE_LENS=          # Remove or comment out
NEXT_PUBLIC_ENABLE_LENS_SWITCHER=true
ENABLE_LENS_UNLOCK=true
```

Then restart your dev server. **No code changes required.**

## Testing Checklist

- [ ] Verify base lens loads by default
- [ ] Confirm header lens switcher is hidden
- [ ] Test recognition minting still works
- [ ] Verify onboarding doesn't show lens choice
- [ ] Check `/api/profile/unlock-lens` returns 410
- [ ] Confirm no lens-related errors in console

## Notes

- All lens-related code remains in the codebase (preserves git history)
- Recognition metadata is still immutable and lens-stamped at mint time
- The catalog system still has all three lens vocabularies for future use
- This is a **feature flag**, not a code deletion—easy to toggle on/off
