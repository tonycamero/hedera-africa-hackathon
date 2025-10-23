# PR Review Checklist — Persona Integration System

## Code Structure

- [ ] `lib/config/persona.types.ts` and `persona.ts` exist and export `PERSONA_CONFIGS`, `getPersona`, `getServiceMode`, etc.
- [ ] `app/(tabs)/page.tsx` routes to three variants under `app/(tabs)/variants/*Dashboard.tsx`
- [ ] `components/navigation/PersonaNav.tsx` shows persona-appropriate links
- [ ] `lib/services/recognition/index.ts` returns the correct service per persona
- [ ] Professional assets exist:
  - [ ] `lib/themes/metallic.ts`
  - [ ] `lib/services/recognition/Recognition.Service.Pro.ts`
  - [ ] `components/persona-aware/variants/ProfessionalRecognitionCard.tsx`
- [ ] Catalog routers exist:
  - [ ] `lib/data/recognition-tokens/index.ts`
  - [ ] `lib/data/signal-types/index.ts`

## Schema & Tests

- [ ] `lib/schema/RecognitionEnvelope.V1.ts` and `Recognition.Migrate.ts` present
- [ ] Unit tests added in `lib/schema/__tests__/Recognition.Migrate.spec.ts` and pass locally

## Env + Boot

- [ ] `.env.example` includes `NEXT_PUBLIC_TRUSTMESH_PERSONA`
- [ ] `pnpm dev` boots; switching `NEXT_PUBLIC_TRUSTMESH_PERSONA` to each persona loads the correct dashboard+nav

## Deps & Build

- [ ] `pnpm install`, `pnpm dedupe`, `pnpm lint`, `pnpm type-check`, `pnpm build` all pass
- [ ] `scripts/ci/test-personas.sh` succeeds for `professional | genz | civic`

## Sanity

- [ ] No dead imports or unused files in the new directories
- [ ] No persona-specific routes exposed in the wrong lens

---

## Quick QA: Run These Locally

```bash
# Build all three personas
./scripts/ci/test-personas.sh

# Manual dev check for each persona
for p in professional genz civic; do
  echo "=== Persona: $p ==="
  NEXT_PUBLIC_TRUSTMESH_PERSONA=$p pnpm dev &
  sleep 5
  # Visit http://localhost:3000 manually
  # Visual inspection: nav/dashboard/theme
  pkill -f "next dev"
done
```

### What to Look For

- **Professional**: metallic styles present, NFTs/gamification **hidden**, pro badges visible
- **GenZ**: mobile-first look, NFT/Hashinal elements appear, gamification present
- **Civic**: glass-morphism look, Support/Volunteer/Events visible

---

## Vercel Preview Deployments

Create 3 preview deployments off `feat/persona-integration`:

- `trustmesh-professional` → `NEXT_PUBLIC_TRUSTMESH_PERSONA=professional`
- `trustmesh-genz` → `NEXT_PUBLIC_TRUSTMESH_PERSONA=genz`
- `trustmesh-civic` → `NEXT_PUBLIC_TRUSTMESH_PERSONA=civic`

Add the three preview URLs to the PR description for reviewers.
