# PROGRESS.md — Agent Status

**Current Milestone:** M1 · Foundation
**Last Updated:** 2026-04-16

---

## Foundation Agent
**Status:** M1 code complete — awaiting npm install + test verification
**Shipped:**
- package.json with Preact + Vite + TypeScript + Vitest + idb-keyval
- tsconfig.json (strict, Preact JSX)
- vite.config.ts with @preact/preset-vite
- Preact app entry (index.html, src/index.tsx, src/app.tsx)
- RsvpEngine with ORP, variable duration (all 5 rules), spaced-repetition scheduler
- Persistence adapter (idb-keyval based)
- 22 Vitest unit tests for RsvpEngine
- PWA manifest + service worker
- CI workflow with Jolly grep-ban
- Cloudflare Pages config (wrangler.toml, _routes.json)
**Blocked:** npm install needed (disk space was constrained during agent run)
**Next:** Install deps, run tests, verify build, verify Lighthouse PWA score.

## UI/Design Agent
**Status:** M1 code complete — awaiting integration verification
**Shipped:**
- Design tokens (tokens.css) — colors, typography, spacing, motion, themes
- Global stylesheet (global.css)
- Button component (primary/secondary/ghost, lg/md sizes, 44px+ touch targets)
- Card component (RSVP display with ORP highlighting, aria-live)
- Sparkle component (reward animation, motion-safe)
- A11y motion utilities (reduced motion signal, safeDuration)
- A11y font toggle (dyslexia font mode with localStorage persistence)
- A11y screen reader component (SrOnly)
- A11y contrast utilities (theme + high-contrast with OS pref detection)
- Barrel exports for ui/components and a11y
**Blocked:** No
**Next:** Font files (OpenDyslexic woff2) need sourcing. Remaining components (Modal, Meter, Streak) are M2+.

## Content Agent
**Status:** Not started
**Next:** Awaiting M2 start. Can pre-work on phonics sequence JSON.

## Learn Mode Agent
**Status:** Not started
**Blocked:** Needs verified RsvpEngine + design tokens
**Next:** Awaiting M2 start.

## Beat Mode Agent
**Status:** Not started
**Next:** Awaiting M4 start.

## World Agent
**Status:** Not started
**Next:** Awaiting M3 start.

## API/Worker Agent
**Status:** Not started
**Next:** Can begin D1 schema + Worker scaffold after M1 verification.
