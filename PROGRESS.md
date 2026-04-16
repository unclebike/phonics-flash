# PROGRESS.md — Agent Status

**Current Milestone:** M4 complete → M5 (Polish, A11y, Ship)
**Last Updated:** 2026-04-16

---

## Milestones
- M1 Foundation ✓
- M2 Content + Learn Mode ✓
- M3 World Map + Avatar ✓
- M4 Beat Mode + Boss Level ✓
- M5 Polish, A11y, Ship — IN PROGRESS

## Production
- Repo: https://github.com/unclebike/phonics-flash
- Live: https://phonics-flash.pages.dev
- Tests: 89/89 passing across 6 files
- Bundle: 22 KB JS + 3.08 KB CSS gzipped (~85% headroom under 150 KB budget)

## Agents

### Foundation Agent
Shipped: Preact+Vite scaffold, RsvpEngine, PersistenceAdapter, PWA, CI
with Jolly grep-ban, Cloudflare Pages deploy, BeatClock (Web Audio API
lookahead scheduler), BeatScheduler (pattern/oddball).

### UI/Design Agent
Shipped: Design tokens, global styles, Button, Card, Sparkle,
ProgressRing, Meter, IconLock, IconStar, a11y foundations.
M5 next: polish pass, axe-core audit, dyslexia font file sourcing.

### Content Agent
Shipped: 42-grapheme PHONICS_DATA across 7 sets, ContentManifest with 7
zones + 3 avatar tiers, Web Speech service.

### Learn Mode Agent
Shipped: LearnSession with showing/responding/feedback/complete phases,
RSVP timing, ORP highlighting, tap-to-advance, mastery persistence,
star summary.

### Beat Mode Agent
Shipped: BeatSession with pattern-break gameplay, ±200ms tap tolerance,
PEAT-safe single-pulse flashes, iOS AudioContext unlock via Start
button, visibilitychange pause. BossLevel wrapper gates zone unlock.

### World Agent
Shipped: UnlockEngine (15 tests), WorldMap SVG with 7 biome zones,
Avatar with 3 mastery tiers, WorldRoute with live progress reload.

### API/Worker Agent
Not started. Optional for V1 (no network calls in Learn/Beat/World
flows). Can skip or defer to post-M5.

## End-to-End Flow (verified in browser)
1. `/` Landing → "Start your journey"
2. `/#/world` → 7 zones, Whispering Meadows available, rest locked
3. Click available zone → `/#/learn/whispering-meadows` → Learn session
   with 10 cards, ORP highlighting, tap to advance, mastery persisted
4. Back → `/#/world` avatar reflects new mastery points
5. `/#/beat/whispering-meadows` → Boss Level with Start button,
   pattern-break rhythm gameplay, pass unlocks next zone

## M5 Remaining Work
- axe-core automated a11y tests on all routes
- Contrast audit (WCAG 2.1 AA)
- Dyslexia font files (OpenDyslexic woff2 in /public/fonts/)
- Motion-reduction verified across Beat Mode flashes
- Offline mode verified on real tablet (airplane mode)
- README + CONTRIBUTING
- Playwright E2E smoke suite (nice-to-have)
- Real child testing (5yo + 7yo on a real device — required per
  ROADMAP M5 exit criteria)
