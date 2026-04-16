# PROGRESS.md — Agent Status

**Current Milestone:** M2 complete → M3 next
**Last Updated:** 2026-04-16

---

## Foundation Agent
**Status:** M1 complete, deployed to production
**Shipped:** Preact+Vite scaffold, RsvpEngine (ORP, variable duration, scheduler), PersistenceAdapter, PWA (manifest + SW + icons), CI with Jolly grep-ban, Cloudflare Pages config.
**Next:** M4 audio clock for Beat Mode.

## UI/Design Agent
**Status:** M1 complete
**Shipped:** Design tokens (CSS custom properties), global stylesheet, Button/Card/Sparkle, a11y foundations (motion, fonts, contrast, sr-only).
**Next:** M3 world map components (Zone, Avatar), remaining primitives (Modal, Meter, Streak).

## Content Agent
**Status:** M2 complete
**Shipped:** 42-grapheme PHONICS_DATA (Sets 1-7), ContentManifest with 7 zones + 3 avatar tiers, Web Speech service (en-GB), 15 Vitest tests + Jolly linter.
**Next:** Zone/avatar asset production for M3; human audio recording pipeline (stretch).

## Learn Mode Agent
**Status:** M2 complete
**Shipped:** LearnSession component with showing/responding/feedback/complete phases, RSVP timing, ORP highlighting, tap-to-advance, gentle retry, mastery persistence to IndexedDB, star summary, hash routing.
**Next:** Speech recognition feature flag (stretch, V1 optional).

## Beat Mode Agent
**Status:** Not started
**Next:** M4 — audio clock integration, pattern-break mechanic, boss levels.

## World Agent
**Status:** Not started
**Next:** M3 — world map, 3 zones rendered, avatar with tier transitions, unlock state machine.

## API/Worker Agent
**Status:** Not started
**Next:** Schema migrations + /api/manifest/version + telemetry endpoint. Can proceed independently.

---

## Production
- Repo: https://github.com/unclebike/phonics-flash
- Live: https://phonics-flash.pages.dev
- Tests: 40/40 passing
- Bundle: 13.87 KB JS + 2.47 KB CSS gzipped (under 150 KB budget)
