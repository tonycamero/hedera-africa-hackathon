# TrustMesh Vercel Deployment Guide

## Prerequisites
- ✅ Git changes committed and pushed
- ✅ Vercel CLI installed (v48.1.6)
- ✅ Project linked to Vercel (trust-mesh-hackathon)

## Environment Variables to Set

You need to add all variables from `.env.local` to Vercel. You can do this either via:

### Option A: Vercel CLI (Recommended - Fastest)
```bash
# Set all env vars at once from your .env.local
vercel env pull .env.vercel.production
# Then review and push them
vercel env add NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY production
vercel env add MAGIC_SECRET_KEY production
# ... repeat for each variable
```

### Option B: Vercel Dashboard (Easiest)
1. Go to: https://vercel.com/dashboard
2. Select your project: `trust-mesh-hackathon`
3. Go to Settings → Environment Variables
4. Add each variable from `.env.local`:

**Critical Variables (MUST SET):**
- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` (pk_live_08FFD7D006DD53F9)
- `MAGIC_SECRET_KEY` (sk_live_29FFC3B9F8A9C349)
- `NEXT_PUBLIC_HEDERA_OPERATOR_ID` (0.0.5864559)
- `NEXT_PUBLIC_HEDERA_OPERATOR_KEY` (your private key)
- `HEDERA_OPERATOR_ID` (0.0.5864559)
- `HEDERA_OPERATOR_KEY` (your private key)

**HCS Topics (MUST SET):**
- `NEXT_PUBLIC_TOPIC_CONTACT` (0.0.7148063)
- `NEXT_PUBLIC_TOPIC_TRUST` (0.0.7148064)
- `NEXT_PUBLIC_TOPIC_SIGNAL` (0.0.7148065)
- `NEXT_PUBLIC_TOPIC_PROFILE` (0.0.7148066)
- `TOPIC_CONTACT` (0.0.7148063)
- `TOPIC_TRUST` (0.0.7148064)
- `TOPIC_SIGNAL` (0.0.7148065)
- `TOPIC_PROFILE` (0.0.7148066)

**Feature Flags:**
- `NEXT_PUBLIC_XMTP_ENABLED=true`
- `NEXT_PUBLIC_XMTP_ENV=dev`
- `NEXT_PUBLIC_HCS_ENABLED=true`
- `NEXT_PUBLIC_HCS_WS_ENABLED=false`
- `NEXT_PUBLIC_DEMO_MODE=true`

**Other Required:**
- `NEXT_PUBLIC_HEDERA_NETWORK=testnet`
- `NEXT_PUBLIC_TRST_TOKEN_ID` (0.0.5361653)
- `ADMIN_SEED_SECRET` (dev-seed-secret-change-in-prod)
- `HCS22_ENABLED=true`
- `HCS22_IDENTITY_TOPIC_ID` (0.0.7157980)
- `HCS22_DID_SALT` (your salt)

## Deployment Steps

### 1. Quick Deploy (Current Branch)
```bash
# Deploy to production
vercel --prod

# Or deploy to preview first
vercel
```

### 2. Deploy Specific Branch
```bash
# Deploy feature branch to production
git checkout feature/xmtp-nervous-system
vercel --prod
```

### 3. Set Production Branch (if needed)
```bash
# Via CLI
vercel project set feature/xmtp-nervous-system

# Or via dashboard:
# Settings → Git → Production Branch → feature/xmtp-nervous-system
```

## Post-Deployment Checklist

After deployment, test these features:

1. **Authentication**
   - [ ] Magic.link login works
   - [ ] User profile loads

2. **Hedera Integration**
   - [ ] Can view bonded contacts
   - [ ] Can allocate trust
   - [ ] Trust persists across refresh

3. **XMTP Messaging**
   - [ ] Can send messages
   - [ ] Can receive messages
   - [ ] Timestamps display correctly
   - [ ] No auto-scroll interruption

4. **Trust Agent**
   - [ ] LED indicator appears for new users
   - [ ] LED disappears after clicking
   - [ ] State persists across refresh

## Common Issues

### Build Fails
- Check build logs: `vercel logs <deployment-url>`
- Verify all env vars are set
- Check for TypeScript errors: `pnpm tsc --noEmit`

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify Hedera credentials are correct
- Check HCS topic IDs match

### Environment Variables Not Loading
- Ensure `NEXT_PUBLIC_` prefix for client-side vars
- Redeploy after adding env vars: `vercel --prod --force`

## Useful Commands

```bash
# Check current deployment status
vercel ls

# View logs
vercel logs <url>

# Check environment variables
vercel env ls

# Rollback deployment
vercel rollback <deployment-url>

# Open project dashboard
vercel --open
```

## Production URL
After deployment, your app will be at:
- Production: `https://trust-mesh-hackathon.vercel.app`
- Preview: `https://trust-mesh-hackathon-<branch>-<team>.vercel.app`
