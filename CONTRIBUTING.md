# Contributing to Phonics Flash

Thanks for your interest. This project is a shared but lightly supported
release — PRs and issues are welcome, but response times may vary. Please
read this guide before opening a large change.

## Philosophy

- **Filesystem-as-truth.** The canonical state of the project lives in
  `TRUTH.md`, `ROADMAP.md`, `DECISIONS.md`, and `PROGRESS.md`. If a behaviour
  isn't reflected there, it isn't settled.
- **Agent-owned directories.** Each major subsystem (`src/stages/learn`,
  `src/stages/beat`, `src/world`, `src/ui`, `src/audio`, `src/content`,
  `src/core`) has a clear owner and a `SPEC.md`. Prefer to extend within an
  owner's directory rather than cut across boundaries.
- **Ship vertical slices, not prototypes.** V1 scope is a full playable slice.
  Don't add features that don't fit the loop.

## How to propose changes

1. **Open an issue first** for anything non-trivial (new feature, schema
   change, UX shift). Tiny fixes (typos, obvious bugs) can go straight to PR.
2. **Branch, change, test.** Keep PRs focused — one concern per PR.
3. **Reference the issue** in the PR description and note which `SPEC.md` or
   ADR the change touches.

## Code quality

- **TypeScript strict.** `npm run lint` must pass (it runs `tsc --noEmit`).
- **Tests required for new logic.** Vitest lives under
  `src/**/__tests__/*.test.ts`. If you add a state machine, scheduler, or
  anything with branches, it gets tests.
- **No `any` without a written reason.** Use `unknown` and narrow.
- **The grep-ban.** CI fails if the string "Jolly" appears anywhere in
  shipped code or content. The industry-standard 42-grapheme sequence is
  public; the trademarked name, mascots, gestures, and songs are not. Build
  original mnemonics.

## Design principles

- **No worksheet aesthetic.** Warm palette, generous type, playful but not
  saccharine.
- **No owl mascot.** (Seriously.) Characters are zone-native, designed by the
  Content Agent.
- **Teacher-assisted.** The child does not self-score. See
  [ADR-007](./DECISIONS.md). Per-card UI gives the teacher "Correct" and
  "Try again". "Try again" restarts the session.
- **WCAG 2.1 AA minimum.** Every new surface must honour
  `prefers-reduced-motion`, meet the contrast thresholds in
  `src/ui/tokens.css`, and be keyboard-reachable. See
  [docs/a11y-audit.md](./docs/a11y-audit.md) and
  [scripts/a11y-checklist.md](./scripts/a11y-checklist.md).
- **PEAT-safe Beat Mode.** No flash pattern that risks photosensitive
  seizures. If in doubt, don't add the flash.

## License

By contributing you agree your work ships under the project's [MIT
license](./LICENSE).
