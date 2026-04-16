# TRUTH.md — Phonics Flash Tool

**Version:** 1.0.0
**Content Hash:** sha256-pending-first-commit

---

## Constraints (Non-Negotiable)

- **Stack:** Preact 10+, Vite 5+, Cloudflare Pages for hosting, Cloudflare Workers for API, Cloudflare D1 for persistence. No React. No Next.js. No SSR beyond what Cloudflare Pages Functions provides.
- **Licensing:** MIT. Repository is public from day one. No proprietary dependencies. No paid SaaS in the critical path.
- **IP hygiene:** The phonics 42-grapheme sequence is industry-standard and not protectable. The Jolly Phonics name, character mascots, action gestures, and songs are trademarked and MUST NOT appear anywhere in the product, repo, marketing copy, or asset names. Build original characters. Build original gestures. Build original mnemonic stories. The word "Jolly" does not appear in shipped code or content.
- **Audio V1:** Web Speech API synthesis is the baseline. Content schema must accept human-recorded audio files as a drop-in upgrade. Do not ship Web Speech as a permanent solution; ship it as the default fallback with a clear content pipeline for real recordings.
- **Target users:** Children ages 4-9. All UX decisions prioritize this group. Assume low reading ability at entry. Assume touch-first on tablets. Assume co-viewing with adults on TV in Beat Mode.
- **Accessibility:** WCAG 2.1 AA minimum. Dyslexia-friendly typography (OpenDyslexic or Atkinson Hyperlegible as options). High-contrast theme. No autoplay audio without user action. No flashing patterns that could trigger photosensitive seizures — Beat Mode must pass PEAT-equivalent scrutiny.
- **Scope V1:** Full vertical slice — Stage 1 Learn Mode + Stage 2 Beat Mode + world map with at least three zones unlocked by progress. Not a prototype. A shippable slice.
- **Performance:** First paint under 1.5s on a mid-tier tablet over 4G. Lighthouse PWA score 95+. Works offline after first load. Total initial JS under 150 KB gzipped before phoneme audio.

## Non-Goals (V1)

- Accounts, authentication, or cloud sync. V1 ships with local-only progress (IndexedDB). Accounts are a V2 concern; schema must anticipate them but the feature does not ship.
- Monetization. No ads. No paywalls. No analytics beyond anonymous self-hosted (Cloudflare Web Analytics or Plausible-compatible).
- Multi-language. English only. Content schema must permit localization; V1 ships English.
- Parent/teacher dashboards.
- Classroom management, rostering, or LMS integration.
- Camera-based attention tracking (SmartRSVP). Documented in the research but out of V1 scope.

## Condensed Truth

- Preact + Vite + Cloudflare Pages + Workers + D1. No React. No SSR. MIT license.
- Children 4-9. Touch-first. TV-aware in Beat Mode. WCAG 2.1 AA. PEAT-safe.
- V1 ships Stage 1 + Stage 2 + world map with >=3 populated zones.
- 42-grapheme Phase 2 scope. Original characters and mnemonics. Web Speech fallback. Human-recording upgrade path baked in.
- Variable RSVP timing. ORP highlighting. Fixed focal point. Neutral background. Slow in Learn, pressured-but-kind in Beat.
- Autonomy, competence, relatedness — every screen.
- The world is the hook. Not a progress bar.
- No Jolly. No purple-gradient-SaaS UI. No worksheet. No owl.
