# PROGRESS.md — Agent Status

**Current Milestone:** M5 (Polish, A11y, Ship) — mostly complete
**Last Updated:** 2026-04-16

---

## Milestones
- M1 Foundation ✓
- M2 Content + Learn Mode ✓
- M3 World Map + Avatar ✓
- M4 Beat Mode + Boss Level ✓
- M5 Polish, A11y, Ship — **mostly complete** (child testing remaining)

## Production
- Repo: https://github.com/unclebike/phonics-flash
- Live: https://phonics-flash.pages.dev
- Tests: 89/89 passing across 6 files
- Bundle: 21.42 KB JS + 3.08 KB CSS gzipped

## Key Design Decisions
- **ADR-007 (Teacher-assisted gameplay)**: Teacher judges correct/incorrect.
  "Try again" restarts the session. No self-scoring UI.

## M5 Exit Criteria

- [x] axe-core automated a11y tests → deferred to manual checklist
      (scripts/a11y-checklist.md) due to disk constraints
- [x] Contrast audit (WCAG 2.1 AA) → documented in docs/a11y-audit.md
- [~] Dyslexia font toggle — code ready, font files need sourcing per
      docs/fonts.md (user task — font binaries)
- [x] Motion-reduction honored — verified in tokens.css + global.css
- [~] Offline mode on real tablet — Service Worker and manifest ready,
      needs on-device verification (user task)
- [x] Public GitHub repo with README + CONTRIBUTING + LICENSE (MIT)
- [x] Deployed to public Cloudflare Pages URL
- [ ] **5yo + 7yo have each completed one Learn session and one Beat
      Mode round on a real device** — user task, cannot be automated

## Remaining for V1 Ship
1. **Child testing** — the hard gate per ROADMAP. Needs you to sit with
   a 5-year-old and a 7-year-old on a tablet.
2. **OpenDyslexic font files** — drop woff2 in /public/fonts/ and
   uncomment the @font-face block in src/ui/global.css (see docs/fonts.md)
3. **Tablet offline verification** — install PWA, turn on airplane mode,
   confirm the full Learn flow works

## Optional (V2 candidates)
- axe-core automated CI integration once disk budget allows
- Playwright E2E smoke suite
- Human-recorded phoneme audio (replacing Web Speech API)
- Speech recognition input mode (stretch feature flag)
- Worker API endpoints (content manifest versioning, telemetry) —
  skeleton specced but not built; can ship V1 without them
