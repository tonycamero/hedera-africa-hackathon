# Follow-Up Tickets (Post-Merge Enhancements)

These are optional 15-30 minute add-ons to improve the persona system after the core integration merges.

---

## P2.5: Edge Middleware for Runtime Persona Switching (Demo-Only)

**Goal**: Allow demo URLs like `?persona=genz` to persist via cookie.

**Steps**:
1. Create `middleware.ts` at project root
2. Read `persona` query param → set `tm_persona` cookie
3. Precedence: query > cookie > env
4. Only active in dev/demo (check `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER`)

**Files**:
- `middleware.ts`
- Update `.env.example` with `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=false`

**Verification**:
- Visit `http://localhost:3000?persona=professional` → cookie set → refresh maintains persona
- Visit without query → uses cookie or falls back to env

---

## P2.6: PersonaSwitcher Component (Demo-Only)

**Goal**: Dropdown UI to switch personas in dev/demo environments.

**Steps**:
1. Create `components/demo/PersonaSwitcher.tsx`
2. Dropdown with 3 options: Professional, GenZ, Civic
3. On change: write `tm_persona` cookie + `window.location.reload()`
4. Conditionally render based on `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true`
5. Add to `app/layout.tsx` (top-right corner, only when enabled)

**Files**:
- `components/demo/PersonaSwitcher.tsx`
- `app/layout.tsx` (conditional import)

**Verification**:
- Set `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=true`
- See switcher in UI
- Change persona → page reloads with new persona
- Set flag to `false` → switcher disappears

---

## P2.7: Route Guards for Persona-Exclusive Pages

**Goal**: Prevent wrong personas from accessing exclusive routes.

**Steps**:
1. Create `lib/guards/personaGuard.ts` with `requirePersona(allowed: PersonaType[])`
2. Returns redirect to `/` if persona not in allowed list
3. Apply to exclusive routes:
   - `/support`, `/volunteer`, `/events` → Civic only
   - `/contacts` → Professional only
   - `/signals`, `/wallet` → GenZ only

**Files**:
- `lib/guards/personaGuard.ts`
- Update route layouts: `app/(civic)/layout.tsx`, etc.

**Example**:
```ts
// app/(civic)/layout.tsx
import { requirePersona } from '@/lib/guards/personaGuard';
export default function CivicLayout({ children }) {
  requirePersona(['civic']);
  return <>{children}</>;
}
```

**Verification**:
- Set `NEXT_PUBLIC_TRUSTMESH_PERSONA=professional`
- Navigate to `/support` → redirects to `/`
- Set to `civic` → `/support` renders normally

---

## P2.8: Analytics Dimension for Persona Tracking

**Goal**: Include persona type in analytics events.

**Steps**:
1. Update analytics utility to include `persona: getPersona().type` on all events
2. Add to key events:
   - Page views
   - Recognition minted
   - Navigation clicks
   - Feature usage

**Files**:
- `lib/analytics/index.ts` (or wherever analytics are initialized)
- Add `persona` as a custom dimension

**Verification**:
- Fire test event in each persona
- Confirm `persona` dimension appears in analytics dashboard (Vercel Analytics, GA4, etc.)

---

## Execution Notes

- Each ticket is 15-30 minutes
- Can be executed independently
- All are **demo/dev conveniences** — not required for production
- Guards (P2.7) could be production-worthy if you want hard enforcement
- Analytics (P2.8) is valuable for understanding persona usage patterns

---

Want these as actual Warp YAML workflows? I can format them like P0-P8.
