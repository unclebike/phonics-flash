# Boss Mode — SPEC.md

**Owner:** Beat Mode Agent (now Boss Mode Agent under ADR-010)
**Current design:** ADR-010 drill-style flash-and-mask gauntlet

## Active modules

### BossSession.tsx
A timed flash-and-mask gauntlet through a zone's phoneme list.

- Ready overlay: "Boss Level — N sounds. Tap or press Space to begin."
- Tap / Space → first flash starts
- Each flash lasts `TEMPO_MS[tempo]` (slow=500, medium=300, fast=180)
- Between flashes: "Next — Tap or press Space" prompt
- After last flash → judging overlay: "Yes — correct" / "Try again"
- Pass: calls `onPass({ attempts })`, shows "You beat the boss!" overlay
- Fail: resets to flash 0, attempt counter increments

Props:
- `zoneName` — display string for the header label
- `items: string[]` — word/phoneme list (shuffled once on mount)
- `tempo: Tempo` — 'slow' | 'medium' | 'fast' → flash duration
- `onPass?: ({ attempts }) => void`
- `onBack?: () => void`

### BossLevel.tsx
Zone-aware wrapper. Loads zone phonemes from CONTENT_MANIFEST, renders
BossSession, calls `PersistenceAdapter.unlockZone(nextZoneId)` on pass.

## Retired modules (ADR-010)

Kept on disk but no longer referenced by the app:
- `BeatSession.tsx` — BPM/pattern-break rhythm game (M4)
- `/src/audio/beat-clock.ts` — Web Audio API lookahead scheduler
- `/src/core/beat-scheduler.ts` — pattern/oddball event generator

These remain reachable via imports and tests for possible V2 revival.
Pure-logic tests (`beat-clock.test.ts`, `beat-scheduler.test.ts`) still
pass — they cover framework-agnostic behavior that doesn't depend on
the app using the modules.
