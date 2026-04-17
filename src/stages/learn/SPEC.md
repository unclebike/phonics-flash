# Learn Stage — SPEC.md

**Owner:** Learn Mode Agent
**Current design:** ADR-008 flash-and-mask drill, ADR-009 zone-aware entry

## Active module: DrillSession

`/src/stages/learn/DrillSession.tsx` is the primary Stage 1 experience.

### Inputs
- `zoneId?` — if set, loads that zone's phonemes from CONTENT_MANIFEST
  as a per-session list override (does NOT persist)
- `configOverride?` — full TeacherConfig override (tests / deep links)
- `onExit?` — callback fired on Done / Escape

### List resolution priority
1. `configOverride.rawList` (tests)
2. zone phonemes when `zoneId` matches a manifest zone
3. `loadConfig()` from localStorage (teacher panel default)

### Flow
1. Default state: dark mask, "Ready — Tap or press Space to flash"
2. Tap / click / Space / Enter → word flashes for configured duration
3. Mask returns, pointer advances, counter increments
4. No per-card judgment. Teacher paces and makes calls verbally.
5. Escape or Done button → onExit

### Zone context
When launched with a zoneId, a small "Zone: {name}" context label appears
in the header / corner so the child and teacher know which zone they're in.

## Retired module: LearnSession (ADR-009)

`/src/stages/learn/LearnSession.tsx` is no longer reachable via any UI
route. The file is retained for possible V2 revival (per-card teacher
judgment mode). Do not delete without a follow-up ADR.
