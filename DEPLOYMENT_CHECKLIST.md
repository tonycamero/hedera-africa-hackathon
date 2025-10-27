# Vercel Deployment Checklist

## 🚀 Pre-Deployment Steps

### 1. Get Magic.link Publishable Key from CraftTrust
```bash
# In CraftTrust repo, find:
grep MAGIC_PUBLISHABLE_KEY .env.local
```

### 2. Add Environment Variables to Vercel

Go to Vercel Project Settings → Environment Variables and add:

#### Magic.link (REQUIRED)
```
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_xxxxx
```
(Copy from CraftTrust repo)

#### Hedera (Already configured)
```
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.5864559
HEDERA_OPERATOR_KEY=302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a

NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_OPERATOR_ID=0.0.5864559
NEXT_PUBLIC_HEDERA_OPERATOR_KEY=302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a
```

#### HCS Topics (Already configured)
```
NEXT_PUBLIC_HCS_RECOGNITION_TOPIC=0.0.6895261
NEXT_PUBLIC_TOPIC_RECOGNITION=0.0.6895261
NEXT_PUBLIC_TOPIC_CONTACT=0.0.6896005
NEXT_PUBLIC_TOPIC_SIGNAL=0.0.6895261
NEXT_PUBLIC_TRST_TOKEN_ID=0.0.5361653
```

---

## ✅ Post-Deployment Testing

### Test Flow (with your team)

1. **Visit landing page**
   - Clean login page with Magic.link
   - "Add contacts, grow your Trust Crew, send and receive recognition signals"

2. **Magic Login**
   - Enter email (e.g., `tony@scend.app`)
   - Check email for Magic link
   - Click link to authenticate

3. **Account Creation**
   - Backend creates Hedera account
   - Funds with 1 testnet HBAR
   - Transfers 1.35 TRST
   - Returns `0.0.xxxxx` account ID

4. **Verify Account**
   - Check console logs for account ID
   - Verify on HashScan: `https://hashscan.io/testnet/account/0.0.xxxxx`
   - Should see 1 HBAR + 1.35 TRST balance

5. **Check localStorage**
   ```javascript
   localStorage.getItem('tm:users')
   // Should show: { email, hederaAccountId, freeMints: 27, trstBalance: 1.35 }
   ```

---

## 🎬 Demo Preparation

### Team Members to Onboard
1. Tony - `tony@scend.app`
2. Alex - `alex@scend.app`
3. Sarah - `sarah@scend.app`
4. (Add more...)

### After Everyone Signs Up
- Each should have real `0.0.xxxxx` account
- 27 free mints + 1.35 TRST
- Ready to send recognition to each other

---

## 🐛 Troubleshooting

### Magic Login Fails
- Check `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` is set in Vercel
- Verify key is `pk_live_` (not `pk_test_`)
- Check browser console for errors

### Account Creation Fails
- Check Hedera operator has sufficient HBAR balance
- Verify operator key is valid (run locally first)
- Check TRST token ID is correct

### TRST Transfer Fails
- Operator account must have TRST balance
- Verify token ID: `0.0.5361653`
- Check operator is associated with TRST token

---

## 📊 Monitoring

### Check Vercel Logs
```bash
vercel logs --follow
```

### Check Hedera Transactions
- Operator account: https://hashscan.io/testnet/account/0.0.5864559
- Topic: https://hashscan.io/testnet/topic/0.0.6895261

---

## 🎯 Success Criteria

- [ ] Magic login working
- [ ] 3-4 team members signed up
- [ ] Each has real Hedera account visible on HashScan
- [ ] Each has 27 free mints + 1.35 TRST
- [ ] Ready to build T3 & T4 (contacts + feed)

---

## 📝 Notes

**Branch:** `integration/ure-v2-plus-genz`

**Features Deployed:**
- Production landing page with onboarding carousel
- Magic.link email authentication
- Hedera account creation with TRST preload
- Mint counter UI component

**Next Steps (after testing):**
- T3: Real team contacts page
- T4: Real HCS feed with recognition signals
- Recognition send flow with quota tracking
