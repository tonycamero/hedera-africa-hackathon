# Runtime Persona Switching

**Purpose:** Explain how to toggle personas at runtime for demos, QA, and Vercel previews.

---

## ⚙️ Switch Methods

| Method | Description | When to use |
|--------|-------------|-------------|
| `NEXT_PUBLIC_TRUSTMESH_PERSONA` | Build-time selection | Production / stable previews |
| `?persona=genz` | Runtime via URL → cookie | QA / demos |
| Switcher UI | Dropdown toggler (requires `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true`) | Internal / demo builds |

---

## 🔁 Precedence

**`query → cookie → env → civic`**

1. **Query param** (`?persona=professional`) — sets cookie via middleware
2. **Cookie** (`tm_persona`) — persists choice across page loads
3. **Environment** (`NEXT_PUBLIC_TRUSTMESH_PERSONA`) — build-time default
4. **Fallback** — defaults to `civic`

---

## 🧪 Quick Test Checklist

```bash
# 1. Start dev server
pnpm dev

# 2. Visit homepage (should load Civic by default)
# → http://localhost:3000

# 3. Add query param to switch to Professional
# → http://localhost:3000/?persona=professional
# Check browser console: "[Persona] Loaded: TrustMesh Professional"

# 4. Navigate anywhere (cookie persists)
# → Still Professional across all routes

# 5. Refresh page
# → Still Professional (cookie remembers choice)

# 6. Enable switcher
echo "NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true" >> .env.local
# Restart dev server

# 7. Visit homepage (see dropdown in top-right)
# → Select "GenZ" → page reloads → GenZ dashboard loads

# 8. Clear persona
# → Delete tm_persona cookie via DevTools → refresh → back to env default
```

---

## 🧱 File Overview

### `middleware.ts`
- Intercepts all app routes
- Reads `?persona=` query param
- Sets `tm_persona` cookie (30-day expiry)
- Validates persona value (`professional`, `genz`, `civic`)

### `lib/config/persona.ts`
- Resolves persona from cookie/env
- Precedence: cookie → env → 'civic'
- Caches result in singleton
- Browser console logs selected persona

### `components/dev/PersonaSwitcher.tsx`
- Demo dropdown component
- Options: Professional | GenZ | Civic
- On change: writes cookie + `window.location.reload()`
- Only renders when feature flag enabled

### `app/layout.tsx`
- Mounts `PersonaSwitcher` when `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true`
- Positions switcher in top-right of nav bar

---

## 🚀 Vercel Environment Configuration

Create **4 separate preview environments** for comprehensive testing:

| Environment | Environment Variables | Use Case |
|-------------|----------------------|----------|
| **professional** | `NEXT_PUBLIC_TRUSTMESH_PERSONA=professional` | Production variant (enterprise features) |
| **genz** | `NEXT_PUBLIC_TRUSTMESH_PERSONA=genz` | Production variant (NFTs + gamification) |
| **civic** | `NEXT_PUBLIC_TRUSTMESH_PERSONA=civic` | Production variant (campaigns + events) |
| **demo** | `NEXT_PUBLIC_TRUSTMESH_PERSONA=civic`<br>`NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true` | Internal / hackathon demos (all personas switchable) |

### Setting Up in Vercel Dashboard

1. Go to **Project Settings → Environment Variables**
2. For each environment above:
   - Add `NEXT_PUBLIC_TRUSTMESH_PERSONA` with appropriate value
   - Optionally add `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER` (true for demo env only)
3. Deploy to each environment
4. Share preview URLs with stakeholders:
   - `trustmesh-professional.vercel.app` — Pro variant
   - `trustmesh-genz.vercel.app` — GenZ variant
   - `trustmesh-civic.vercel.app` — Civic variant
   - `trustmesh-demo.vercel.app` — Switchable demo

---

## 📖 Usage Examples

### Demo to Stakeholders
```bash
# Share this URL for live persona switching during demo:
https://trustmesh-demo.vercel.app/?persona=professional

# Or use the dropdown if ENABLE_PERSONA_SWITCHER=true
# Shows all 3 personas in one deployment
```

### QA Testing
```bash
# Test Professional persona
http://localhost:3000/?persona=professional

# Test GenZ persona
http://localhost:3000/?persona=genz

# Test Civic persona
http://localhost:3000/?persona=civic
```

### Production Deployment
```bash
# Build separate production instances per persona
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional pnpm build
NEXT_PUBLIC_TRUSTMESH_PERSONA=genz pnpm build
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic pnpm build

# Deploy each build to separate domains/subdomains:
# - pro.trustmesh.com
# - genz.trustmesh.com
# - civic.trustmesh.com
```

---

## 🔧 Development Tips

### Check Current Persona
```javascript
// Browser console
document.cookie.match(/tm_persona=(\w+)/)?.[1]
// → "professional" | "genz" | "civic" | null
```

### Clear Persona Cookie
```javascript
// Browser console
document.cookie = 'tm_persona=; Max-Age=0'
window.location.reload()
```

### Test All Personas in CI
```bash
# scripts/ci/test-personas.sh already handles this:
for p in professional genz civic; do
  NEXT_PUBLIC_TRUSTMESH_PERSONA=$p pnpm build
done
```

---

## 🎯 Production Best Practices

### ✅ Do
- Use clean per-persona builds with `NEXT_PUBLIC_TRUSTMESH_PERSONA`
- Keep `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=false` in production
- Use URL params (`?persona=`) for internal demos/staging
- Create separate Vercel environments for each persona
- Test persona switching before major releases

### ❌ Don't
- Enable switcher in customer-facing production (security/UX risk)
- Rely on cookies for production persona selection (use build-time env)
- Mix personas in a single production deployment (confusing for users)
- Share demo URLs with switcher enabled to external users without context

---

## 🐛 Troubleshooting

### Persona not switching?
1. **Check browser console**: Look for `[Persona] Loaded: TrustMesh [Name]`
2. **Check cookie**: DevTools → Application → Cookies → `tm_persona`
3. **Clear cookie**: `document.cookie = 'tm_persona=; Max-Age=0'`
4. **Hard refresh**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Switcher not showing?
1. Verify `.env.local` has `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true`
2. Restart dev server after changing env vars
3. Check flag is string `'true'` (not boolean `true`)
4. Confirm `PersonaSwitcher` import in `app/layout.tsx`

### Wrong persona after build?
1. Verify `NEXT_PUBLIC_TRUSTMESH_PERSONA` at build time
2. Check `pnpm build` output logs for env vars
3. Clear `.next` cache: `rm -rf .next && pnpm build`
4. Ensure no conflicting env vars in deployment platform

### Middleware not setting cookie?
1. Check `middleware.ts` is at project root (not in `app/` or `src/`)
2. Verify query param format: `?persona=genz` (lowercase, no spaces)
3. Check browser DevTools → Network → Response Headers for `Set-Cookie`
4. Ensure persona value is valid: `professional`, `genz`, or `civic`

---

## 📚 Related Documentation

- **PR Review Checklist**: `PR_REVIEW_CHECKLIST.md`
- **Follow-Up Tickets**: `docs/consolidation/FOLLOW_UP_TICKETS.md`
- **Test Matrix**: `docs/consolidation/test-matrix.md`
- **CI Smoke Script**: `scripts/ci/test-personas.sh`

---

## 🎬 Demo Flow (30 seconds)

1. **Start**: Load demo site (Civic by default)
2. **Switch via URL**: Add `?persona=professional` → Professional dashboard
3. **Switch via UI**: Open switcher dropdown → select "GenZ" → GenZ dashboard
4. **Persist**: Navigate to any route → persona stays consistent
5. **Reset**: Clear cookie → back to default (Civic)

**Perfect for**:
- Hackathon judges
- Partner demos
- Internal QA
- Feature showcases

---

**Status**: ✅ Runtime switching complete  
**Commit**: `9236893`  
**PR**: https://github.com/scendmoney/hedera-africa-hackathon/pull/1
