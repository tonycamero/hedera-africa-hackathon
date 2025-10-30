# Enable HCS22 Identity Service on Production

## Problem
The HCS22 identity assertion service is **disabled** in production:
```json
{
  "enabled": false,
  "topic": null
}
```

This means DID token validation is not working on trustmesh.app.

## Solution
Add the following environment variables to Vercel:

### Required Environment Variables

1. **HCS22_ENABLED**
   - Value: `true`
   - Description: Enables the HCS22 identity resolution service

2. **HCS22_IDENTITY_TOPIC_ID**
   - Value: `0.0.7157980`
   - Description: Hedera Consensus Service topic ID for identity binding events

## How to Add on Vercel

### Option 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/scend-technologies-hackathon-team/trust-mesh-hackathon/settings/environment-variables
2. Add two new environment variables:
   ```
   HCS22_ENABLED = true
   HCS22_IDENTITY_TOPIC_ID = 0.0.7157980
   ```
3. Select environments: **Production**, **Preview**, **Development**
4. Click "Save"
5. Redeploy: Go to Deployments → Click on latest deployment → Click "Redeploy"

### Option 2: Vercel CLI
```bash
cd /home/tonycamero/code/TrustMesh_hackathon

# Add HCS22_ENABLED
vercel env add HCS22_ENABLED production
# Enter: true

# Add HCS22_IDENTITY_TOPIC_ID
vercel env add HCS22_IDENTITY_TOPIC_ID production
# Enter: 0.0.7157980

# Trigger redeployment
vercel --prod
```

## Verification

After deployment, check the health endpoint:
```bash
curl https://trustmesh.app/api/hcs22/health
```

Expected response:
```json
{
  "success": true,
  "metrics": {
    "enabled": true,
    "topic": "0.0.7157980",
    "eventsPublished": 0,
    "eventsFailed": 0,
    "lastEventAt": null
  }
}
```

## What This Enables

With HCS22 enabled, the following features will work:

1. **Identity Assertion** - Magic DID tokens are validated and logged to HCS
2. **Identity Resolution** - DIDs can be resolved to Hedera account IDs
3. **Secure Authentication** - Cryptographic proof of identity on blockchain
4. **Audit Trail** - All identity events are recorded on HCS topic 0.0.7157980

## Related Files

- `/lib/server/hcs22/init.ts` - Checks HCS22_ENABLED flag
- `/lib/hcs22/health.ts` - Health metrics endpoint
- `/app/api/hcs22/assert/route.ts` - Identity assertion endpoint
- `/app/api/hcs22/resolve/route.ts` - DID resolution endpoint

## Testing After Enabling

1. **Health Check**
   ```bash
   curl https://trustmesh.app/api/hcs22/health
   ```

2. **Sign in with Magic**
   - The identity assertion should log to console:
   ```
   [HCS22 ASSERT] Response status: 200
   [HCS22 ASSERT] Result: {success: true, disabled: false}
   ```

3. **Check HCS Topic**
   - View events on HashScan: https://hashscan.io/testnet/topic/0.0.7157980

## Notes

- The HCS22 service will automatically warmup historical events (last 7 days) on first load
- Live subscription is currently disabled in production (can be enabled later)
- Metrics are in-memory only (will reset on each deployment)
