# PROFILE_UPDATE Structure Change

## Summary
Changed PROFILE_UPDATE event structure from nested `payload` format to flat top-level fields.

## New Structure (Flat)
```json
{
  "type": "PROFILE_UPDATE",
  "accountId": "0.0.7159473",
  "displayName": "TESTFIVE",
  "bio": "My bio text",
  "avatar": "",
  "visibility": "public",
  "timestamp": "2025-10-30T..."
}
```

## Old Structure (Nested - DEPRECATED)
```json
{
  "type": "PROFILE_UPDATE",
  "payload": {
    "sessionId": "0.0.7159473",
    "handle": "TESTFIVE",
    "bio": "My bio text",
    "visibility": "public"
  }
}
```

## Files Updated

### ✅ Fixed - Now support flat structure
1. **lib/services/HCSDataUtils.ts** (lines 187-208)
   - `getBondedContactsFromHCS()` - Checks top-level fields first, then falls back to payload

2. **components/ContactProfileSheet.tsx** (lines 171-220)
   - Profile event filtering and data extraction
   - Reads from `metadata.accountId` and `metadata.displayName`

3. **lib/services/SignalsPoller.ts** (lines 158-183)
   - `convertToSignalEvent()` - Detects PROFILE_UPDATE and uses flat structure for metadata

4. **lib/services/HCSFeedService.ts** (lines 739-758)
   - PROFILE_UPDATE parsing in feed events
   - Extracts `accountId`, `displayName`, `bio`, `avatar` from top level

5. **app/api/profile/status/route.ts** (lines 48-76)
   - Already had backward compatibility
   - Checks `decoded.accountId` and `decoded.displayName` first

### ✅ Creates flat structure
6. **app/onboard/page.tsx** (lines 201-225)
   - Creates PROFILE_UPDATE with flat structure when publishing

7. **app/api/hcs/profile/route.ts**
   - Server endpoint that receives and publishes flat PROFILE_UPDATE

## How Data Flows

1. **User creates profile** → `app/onboard/page.tsx`
   - Creates flat structure with `accountId`, `displayName`, `bio`, etc.

2. **Published to HCS** → `app/api/hcs/profile/route.ts`
   - Stores in HCS with flat structure

3. **Ingested by clients** → `lib/ingest/normalizers.ts`
   - `enrichMetadata()` returns payload as-is for PROFILE_UPDATE
   - Stored in SignalEvent.metadata with flat structure

4. **Read by components**:
   - **Contacts list** → API `/api/circle` → `HCSDataUtils.getBondedContactsFromHCS()`
   - **Profile modal** → `ContactProfileSheet` reads from signals store
   - Both now correctly read from flat structure

## Testing
- ✅ Login bypasses onboarding (profile detected)
- ⏳ Contacts list shows correct display name (needs page refresh/cache clear)
- ⏳ Profile modal shows correct data

## Migration Notes
- All profile readers now check top-level fields FIRST
- Falls back to `payload.*` fields for backward compatibility
- No migration script needed - new format takes precedence
