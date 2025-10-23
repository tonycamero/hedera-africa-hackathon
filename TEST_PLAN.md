# Localhost Testing Plan

## Test 1: Default Civic Load
- [ ] Start: `pnpm dev`
- [ ] Visit: http://localhost:3000
- [ ] Expected: Civic Dashboard loads
- [ ] Check console: "[Persona] Loaded: TrustMesh Civic"
- [ ] Check nav: Home, Supporters, Volunteers, Events links visible
- [ ] Check switcher: Dropdown visible in top-right

## Test 2: URL Param Switch to Professional
- [ ] Visit: http://localhost:3000/?persona=professional
- [ ] Expected: Professional Dashboard loads
- [ ] Check console: "[Persona] Loaded: TrustMesh Professional"
- [ ] Check nav: Home, Contacts links visible (no Civic links)
- [ ] Refresh page → still Professional
- [ ] Navigate to any route → still Professional

## Test 3: URL Param Switch to GenZ
- [ ] Visit: http://localhost:3000/?persona=genz
- [ ] Expected: GenZ Dashboard loads
- [ ] Check console: "[Persona] Loaded: TrustMesh Campus"
- [ ] Check nav: Home, Signals, Wallet links visible
- [ ] Refresh page → still GenZ

## Test 4: Switcher Dropdown
- [ ] Use dropdown in top-right
- [ ] Select "Professional" → page reloads
- [ ] Verify Professional dashboard + nav
- [ ] Select "Civic" → page reloads
- [ ] Verify Civic dashboard + nav

## Test 5: Cookie Persistence
- [ ] Open DevTools → Application → Cookies
- [ ] Check `tm_persona` cookie exists
- [ ] Value should match current persona
- [ ] Clear cookie → reload → back to Civic (env default)

## Test 6: TypeScript Build
- [ ] Stop dev server
- [ ] Run: `pnpm build`
- [ ] Expected: No TypeScript errors
- [ ] Check build output for warnings

## Test 7: Multi-Persona Builds
- [ ] Run: `./scripts/ci/test-personas.sh`
- [ ] Expected: All 3 personas build successfully
- [ ] Professional, GenZ, Civic all compile

---

## Ready to Test?

Run: `pnpm dev`

Then open: http://localhost:3000

Watch console for: "[Persona] Loaded: TrustMesh Civic"
