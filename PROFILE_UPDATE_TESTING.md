# Profile Update Testing Guide

## Overview
This guide explains how to test the new HCS-11 profile update feature for tony@ and admin@ to ensure bonded contacts appear correctly in `/contacts`.

## Problem Being Fixed
- Bonded contacts (tony@ and admin@) have proof on HCS but aren't showing in the contacts list
- Both users need their HCS-11 Profile updated with valid profile data
- Once profiles are published to HCS topic 11, contacts should appear properly

## New Features Added

### 1. Profile Editor on `/me` page
- Full profile editing form with:
  - Handle (display name) - e.g., "tony@", "admin@"
  - Bio (up to 500 characters)
  - Location
  - Visibility (public or contacts-only)
- "Save Profile to HCS-11" button publishes directly to Hedera Consensus Service
- Shows confirmation with sequence number

### 2. Profile Status on `/operations` page
- Alert banner if profile not set up (orange warning)
- Success indicator if profile is active (green)
- Quick link to edit profile

## Testing Steps

### For tony@ account:

1. **Login as tony@**
   - Ensure you're logged in with the tony@ Hedera account
   - Check browser console for session ID - should be a valid `0.0.xxxxx` format

2. **Navigate to Profile page**
   - Go to `/me` page
   - You should see your Hedera Account ID displayed

3. **Update Profile**
   - Fill in the following:
     - Handle: `tony@`
     - Bio: `TrustMesh admin and developer`
     - Location: (optional)
     - Visibility: `Public`
   - Click "Save Profile to HCS-11"
   - Wait for success toast showing sequence number

4. **Verify on Contacts page**
   - Navigate to `/contacts`
   - Wait ~5-10 seconds for HCS ingestion
   - Refresh if needed
   - admin@ should now appear in your contacts list if bonded

### For admin@ account:

1. **Login as admin@**
   - Switch to admin@ account
   - Verify session ID in console

2. **Navigate to Profile page**
   - Go to `/me` page

3. **Update Profile**
   - Fill in:
     - Handle: `admin@`
     - Bio: `System administrator`
     - Visibility: `Public`
   - Click "Save Profile to HCS-11"

4. **Verify on Contacts page**
   - Navigate to `/contacts`
   - tony@ should appear if bonded

## Expected Results

✅ **Success Indicators:**
- Toast notification: "Profile updated on HCS-11!" with sequence number
- Profile data saved to localStorage
- Contacts page shows bonded contacts after ~5-10 seconds
- Operations page shows green "Profile Active" banner
- Console shows: `[ProfileUpdateAPI] Profile published successfully: hcs://11/0.0.xxxxx/yy`

❌ **Failure Indicators:**
- Error toast with message
- Console errors about invalid session ID format
- Contacts still not appearing after 30 seconds
- Operations page still shows orange warning

## Debugging

### If contacts still don't appear:

1. **Check Session ID**
   ```javascript
   // In browser console:
   JSON.parse(localStorage.getItem('tm:users'))
   ```
   - Verify `hederaAccountId` is in `0.0.xxxxx` format
   - NOT `tm-alex-chen` or similar

2. **Check Profile HRL**
   ```javascript
   // In browser console:
   const users = JSON.parse(localStorage.getItem('tm:users'))
   console.log(users[0].profileHrl)
   ```
   - Should be `hcs://11/0.0.xxxxx/yy` format

3. **Check API Response**
   - Open Network tab in DevTools
   - Look for POST to `/api/profile/update`
   - Response should have `ok: true` and `sequenceNumber`

4. **Check HCS Ingestion**
   - Navigate to `/debug/hcs` if available
   - Check if profile messages are being ingested from topic 11

5. **Check Backend Logs**
   ```bash
   # Check for profile update logs
   grep "ProfileUpdateAPI" <your-log-file>
   ```

## Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_HCS_ENABLED=true
NEXT_PUBLIC_PROFILE_TOPIC_ID=0.0.6896004  # Or your profile topic ID
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=<private-key>
```

## API Endpoint Details

**POST** `/api/profile/update`

Request:
```json
{
  "sessionId": "0.0.12345",
  "handle": "tony@",
  "bio": "TrustMesh admin",
  "visibility": "public",
  "location": "San Francisco",
  "avatar": ""
}
```

Response (success):
```json
{
  "ok": true,
  "sequenceNumber": "42",
  "profileHrl": "hcs://11/0.0.6896004/42",
  "topicId": "0.0.6896004"
}
```

Response (error):
```json
{
  "ok": false,
  "error": "Invalid sessionId format. Must be Hedera Account ID (0.0.xxxxx)"
}
```

## Next Steps After Testing

Once both tony@ and admin@ have updated their profiles:
1. Verify mutual bonded contacts appear
2. Test trust allocation in Circle page
3. Test recognition signals between bonded contacts
4. Verify contact search and filtering works correctly
