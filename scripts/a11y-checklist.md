# Manual Accessibility Checklist

Phonics Flash ships without an automated axe-core runner — installing
Puppeteer or Playwright is too heavy for the disk budget we are working in,
and our route surface is small enough that a scripted browser walkthrough is
realistic. Run this checklist before every release.

## How to run

1. `npm run build && npm run preview`
2. Open the preview URL in Chrome or Firefox.
3. Visit each route below and run Chrome DevTools → **Lighthouse** →
   *Accessibility* only. Target score: **100** with zero "needs review"
   items. A score of 95+ is acceptable if all failures are `color-contrast`
   warnings on decorative SVG gradients.
4. Also run DevTools → **Rendering** panel and toggle
   *Emulate CSS media feature `prefers-reduced-motion: reduce`* — confirm
   the routes below do not animate.
5. With the keyboard only (Tab, Shift+Tab, Enter, Space, Esc), confirm the
   keyboard checks for each route.

## Routes

### `#/` — Landing
- [ ] Lighthouse a11y 100
- [ ] `h1` present ("Phonics Flash")
- [ ] "Start your journey" button reaches focus on first Tab and activates
      on Enter and Space
- [ ] Focus ring is visible (3px, token `--color-focus`)
- [ ] Reduced-motion: no transitions on button hover

### `#/world` — World Map
- [ ] Lighthouse a11y 100
- [ ] Zones reachable by Tab in a sensible order
- [ ] Locked zones are announced as disabled (aria-disabled or inert)
- [ ] Avatar tier change is described in an `aria-live="polite"` region
- [ ] Reduced-motion: zone hover pulse is suppressed

### `#/learn/whispering-meadows` — Learn Mode
- [ ] Lighthouse a11y 100
- [ ] Phoneme card has `aria-label` with the full grapheme + example word
- [ ] "Correct" / "Try again" buttons are the only interactive controls
      during the responding phase and both reach focus
- [ ] ORP highlight uses a colour that meets 4.5:1 on the card surface
      (token `--color-orp` on `--color-card` — verified in
      `docs/a11y-audit.md`)
- [ ] Reduced-motion: Sparkle component is skipped, card slide is instant
- [ ] Screen reader announces "Correct" or "Try again" phase transitions

### `#/beat/whispering-meadows` — Boss Level (Beat Mode)
- [ ] Lighthouse a11y 100
- [ ] Start button is focusable and triggers AudioContext unlock
- [ ] Beat flashes do **not** exceed three per second (PEAT guard)
- [ ] Reduced-motion: the rhythmic flash uses a static colour swap rather
      than a fade — verified by frame-stepping DevTools recording
- [ ] `visibilitychange` pauses cleanly (tab-blur during the level)
- [ ] Teacher pass/fail controls are keyboard-operable

## Regression notes

If any check fails, file it against the owning agent directory:

- Landing / world: `src/world/SPEC.md`, `src/ui/SPEC.md`
- Learn: `src/stages/learn/SPEC.md`
- Beat: `src/stages/beat/SPEC.md`
