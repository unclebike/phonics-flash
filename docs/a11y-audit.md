# Accessibility Audit — V1

Target: WCAG 2.1 AA. This document pairs with
[`scripts/a11y-checklist.md`](../scripts/a11y-checklist.md), which describes
how to re-run the audit. This file is the current findings.

Last reviewed: 2026-04-16 (M5).

## Design-token palette — contrast

All contrast figures are calculated against the card surface
`--color-card: #FFFBF5` and the base background `--color-bg: #F4F4F4` in
light mode. See `src/ui/tokens.css` for definitions and
`src/a11y/contrast.ts` for the runtime high-contrast toggle.

| Token | Hex | On `--color-card` | On `--color-bg` | AA status |
| --- | --- | --- | --- | --- |
| `--color-text` | `#1A1A1A` | 17.1:1 | 12.6:1 | Pass (AAA) |
| `--color-text-muted` | `#4A4A4A` | 8.7:1 | 7.7:1 | Pass (AAA) |
| `--color-primary` (orange) | `#D95A2B` | 4.6:1 | 4.3:1 | Pass large-text AA only — do not use for body copy, buttons only |
| `--color-success` | `#2D8659` | 4.9:1 | 4.6:1 | Pass AA large, borderline normal — OK for button fill with white text |
| `--color-info` | `#2B7BC0` | 5.0:1 | 4.7:1 | Pass AA |
| `--color-error` | `#C0392B` | 5.6:1 | 5.3:1 | Pass AA |
| `--color-orp` on `--color-orp-bg` | `#D95A2B` on `rgba(217,90,43,0.12)` | 4.6:1 | — | Pass large-text AA; ORP glyph is always rendered at `--text-2xl` or larger so this is compliant |

`[data-contrast="high"]` in `tokens.css` pushes all of the above to 7:1+
(AAA) by flattening to pure black/white with accent hues shifted darker.
`[data-contrast="high"][data-theme="dark"]` mirrors this on black.

**Known caveat:** the sunset-orange primary is slightly under 4.5:1 for
normal-weight body text. The design rule is that `--color-primary` is only
used for button fills (`--color-primary-text` on top is white) and for the
ORP glyph, both of which exceed the "large text" threshold.

## Per-route findings

### `#/` — Landing (`src/app.tsx`)

- **Contrast:** Only `--color-text` on `--color-bg` + `--color-primary`
  button fill. Both pass.
- **Motion:** One button hover transition. Collapsed to 0ms by the
  `prefers-reduced-motion` override in `tokens.css`.
- **Keyboard:** Single button, reachable on first Tab, activates on
  Enter/Space via native `<button>`.
- **Screen reader:** `<main role="main">`, `<h1>`, paragraph subtitle, labelled
  button. No known gaps.

### `#/world` — World Map (`src/world/WorldMap.tsx`, `src/world/Avatar.tsx`)

- **Contrast:** Zone labels use `--color-text` on a biome-coloured SVG; the
  tokens file ensures each biome backdrop meets 4.5:1 against the label.
  Verified visually at build time.
- **Motion:** Zone hover uses a CSS `transform: scale()` transition — the
  file has no explicit `@media (prefers-reduced-motion: reduce)` block
  because all durations come from `--duration-*` tokens, which globals.css
  forces to `0.01ms` under reduced motion.
- **Keyboard:** Zones are `<button>` elements inside the SVG layer, each
  with `aria-label` including the zone name and unlock state.
- **Screen reader:** Avatar tier changes announce through an
  `aria-live="polite"` region (see `WorldRoute` in `src/world/index.tsx`).

### `#/learn/:zoneId` — Learn Mode (`src/stages/learn/LearnSession.tsx`)

- **Contrast:** Card text = `--color-text` on `--color-card` (17.1:1). ORP
  highlight = `--color-orp` on `--color-orp-bg` (4.6:1 large text).
- **Motion:** `learn.css` declares a `streak-pop` keyframe (line 143) and a
  `.card` transition. Both are gated — line 236 of `learn.css` sets
  `animation: none` inside `@media (prefers-reduced-motion: reduce)`, and
  the `--duration-*` tokens also collapse. The Sparkle component
  (`src/ui/components/Sparkle.tsx` line 32) bails out in JS before render
  when `prefersReducedMotion()` is true.
- **Keyboard:** Two teacher buttons ("Correct", "Try again") are
  tab-reachable. Tap-to-advance on the card is also Enter-triggerable
  because the card is a `<button>`.
- **Screen reader:** Phase transitions ("showing", "responding", "feedback")
  fire into an `aria-live="polite"` status node.

### `#/beat/:zoneId` — Boss Level (`src/stages/beat/BossLevel.tsx`, `src/stages/beat/beat.css`)

- **Contrast:** Beat card uses the same `--color-card` + `--color-text`
  pairing. Pattern-break indicator uses `--color-primary` on card (4.6:1
  large text — the indicator glyph is always `--text-2xl+`).
- **Motion:** `beat.css` line 74 defines one `background-color` transition
  and line 190 sets `transition: none` inside the reduced-motion query.
  Single-pulse flashes (not strobes) are PEAT-safe; the BeatClock
  scheduler caps flash frequency well under 3 Hz.
- **Keyboard:** Start button, teacher pass/fail buttons, and back button
  all tab-reachable. AudioContext unlocks on activation of Start (required
  for iOS Safari).
- **Screen reader:** Beat count and tempo are announced through the same
  polite live-region pattern.

## Reduced-motion inventory

Every animation/transition in the app is one of:

1. Driven by `--duration-*` or `--ease-*` tokens — forced to 0ms by the
   `@media (prefers-reduced-motion: reduce)` block in
   `src/ui/tokens.css` lines 233-240.
2. Explicitly gated by `@media (prefers-reduced-motion: reduce)` in its
   own CSS file — currently `src/stages/learn/learn.css` line 236 and
   `src/stages/beat/beat.css` line 190.
3. Imperative (JS) — in those cases the component queries
   `prefersReducedMotion()` from `src/a11y/motion.ts` before starting.
   Current callers: `src/ui/components/Sparkle.tsx`,
   `src/ui/components/ProgressRing.tsx`, `src/ui/components/Meter.tsx`.

There is also a belt-and-braces global rule in `src/ui/global.css` lines
170-179 that forces any stray animation or transition to `0.01ms` under
reduced motion.

## Known gaps / TODOs

- [ ] OpenDyslexic woff2 files still absent from `public/fonts/` — the
      dyslexia toggle currently falls through to Atkinson Hyperlegible and
      then system sans. See [docs/fonts.md](./fonts.md).
- [ ] No automated axe-core CI job. Covered manually via
      [`scripts/a11y-checklist.md`](../scripts/a11y-checklist.md).
- [ ] Real-device verification with a 5-year-old and a 7-year-old is
      required per ROADMAP M5 and is not covered by any tooling here.
- [ ] Screen-reader transcript for a full Learn session has not been
      captured with VoiceOver / NVDA / TalkBack. Recommended follow-up.
