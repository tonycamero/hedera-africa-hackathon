# GENZ_LENS_UX_SPEC.md

## Summary

**Goal:** Ship a GenZ Lens (flagged UI) that layers **zero-friction send → share → boost** on top of the existing Professional branch infra.
**Principle:** Viral, positive, bounded. No Circle logic in this pass. All changes gated by `GENZ_LENS`.

## Core User Loop (v1)

1. **Send Signal** (template-first, optional short note)
2. **Share** a public **Boost Page** (deep link)
3. Anyone can **⚡ Boost** (anon agree) or **Suggest** a better template (requires auth)
4. **Counts** update in Signals list; recipient can **hide/report** the page

## Primary Screens

### A. Signals (tab)

* Each row: token chip • recipient @handle • snippet • **⚡ Boost N** • Share
* Tap Share → native share sheet (mobile) or copy link (desktop)

### B. Send Signal Modal

* 6 edgy templates (radio) + optional "why it mattered" (≤120 chars)
* Submit → HCS mint via existing recognition service → **Success sheet** (copy/share/visit boost page)

### C. Public Boost Page `/boost/:boostId` (SSR)

* Header: token chip, "HCS Verified" badge
* Body: quote (template filled), optional note, recipient @handle → `/u/[handle]`
* Actions: **⚡ Boost** (anon), **Suggest a better token** (template picker → auth wall → submit)
* Footer: Share button, hide/report (recipient only), abuse-safe message when hidden

### D. Public Contact Card `/u/[handle]`

* Avatar, display name, handle, short bio
* 3 recent public signals (titles only)
* CTAs: **Send a Signal** (if authed) / **Get TrustMesh** (if anon)

## Copy (v1)

* Modal title: **Send real props**
* Templates:

  1. *Clutched ___ under fire*
  2. *Carried the team on ___*
  3. *Called it clean on ___*
  4. *Made the hard call on ___*
  5. *Showed up when it counted*
  6. *Kept it classy under pressure*
* Hint (textarea): *why it mattered (optional)*
* Success: *Live. Share it so friends can ⚡ Boost.*
* Boost CTA: **⚡ Boost**
* Suggest CTA: **Suggest a better token**
* Hidden state: *This boost is no longer public.*

## Interaction Rules

* **Boost (anon):** 1 / 18h / boostId per visitor (IP+UA+cookie). No auth. Writes to HCS via operator.
* **Suggest (verified):** Template-only + optional filtered note. Requires auth. Writes to HCS via operator.
* **Hide/Report:** Recipient can hide/unhide. Report stores payload; no auto-action v1.

## Accessibility & Motion

* 44px min targets; focus traps in modals; ARIA on interactive elements
* Micro-motion only (count pulse, light confetti on first boost); maintain 60fps on mid-range devices

## Metrics (events)

* `send_signal_open|submit|success|fail`
* `signals_boost_chip_click`, `signals_share_click`
* `boost_page_view`, `boost_agree_click`, `boost_suggest_open|submit`
* `rate_limit_hit|blocked`, `boost_hide_submit|boost_report_submit`

## Non-Goals (this pass)

* Circle of 9 (selection/weighting/visuals)
* Trust math changes from boosts (counts only)
* KNS write ops (read-only resolve is OK)

## Flagging & Theming

* Env: `GENZ_LENS=on` enables neon dark theme & components
* Do not mutate Professional/Community defaults when flag is off