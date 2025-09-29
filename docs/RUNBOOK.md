# Ops Runbook

## Smoke checks (after deploy)

1) `/api/registry/topics` → non-empty topic map  
2) `/api/health/hcs` → ok: true  
3) `/api/health/ingestion` → ws.connected OR rest.active

## Common fixes

- **No data in UI**
  - Check `NEXT_PUBLIC_*` topics (client) vs server topics.
  - Verify Mirror URLs (must include `/api/v1`, ws `:5600`).
  - Hit `/api/health/ingestion?reset=true` (dev-only) and refresh.

- **WS flapping**
  - Expected; backoff+jitter active.
  - Confirm REST backfill is incrementing counts.

- **Env weirdness**
  - Carriage returns in Vercel vars: clear & re-enter values.  
  - Use boolean cleaner (`true/1/yes/on`) and avoid trailing spaces.

## Key commands

```bash
# Local
pnpm dev

# Tests (guards, normalizers, ingestion)
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Incident checklist

* Capture: `/api/health/ingestion` JSON + console logs.
* Validate topics via HashScan (testnet) by ID.
* If needed, switch to cached view (UI shows last-good) while ingestion recovers.