# DECISIONS.md — Architectural Decision Record

Append-only. Agents propose. Coordinator ratifies.

---

## ADR-001 · Stack Selection

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Need a lightweight, fast, offline-capable stack suitable for a children's PWA deployed on CDN edge.
**Decision:** Preact 10+ for UI, Vite 5+ for build, Cloudflare Pages for static hosting, Cloudflare Workers for API, Cloudflare D1 for persistence. Preact Signals for state. No React, no Next.js, no SSR.
**Consequences:** Smaller bundle than React. Preact's compat layer is available if needed but should be avoided. Workers have CPU time limits (10ms free, 50ms paid) — keep API logic thin.

---

## ADR-002 · Data Layer

**Date:** 2026-04-16
**Status:** Ratified
**Context:** V1 is local-only. V2 needs cloud sync. Must design for both without shipping V2 prematurely.
**Decision:** IndexedDB via `idb-keyval` for local persistence. D1 schema defined and migrated but write paths feature-flagged off in V1. Persistence adapter pattern — all storage access goes through a single adapter that can swap between local and remote backends.
**Consequences:** Schema exists in D1 from day one. No user data touches the network in V1. The persistence adapter is the only file that knows about IndexedDB or D1 directly.

---

## ADR-003 · License

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Open-source educational tool. Want maximum adoption, minimum friction.
**Decision:** MIT license. All dependencies must be MIT, BSD, Apache 2.0, or ISC compatible. No GPL in the dependency tree (copyleft would complicate downstream use).
**Consequences:** Anyone can fork, modify, commercialize. We accept this.

---

## ADR-004 · V1 Scope

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Must ship a vertical slice, not a prototype.
**Decision:** V1 = Stage 1 Learn Mode + Stage 2 Beat Mode + World Map (>=3 zones) + offline PWA + 42 graphemes. No accounts, no dashboards, no multi-language, no monetization.
**Consequences:** Aggressive but focused. Every agent knows exactly what ships and what doesn't.

---

## ADR-005 · Phonics Source

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Need a research-backed phoneme sequence. Industry standard Phase 2 order is well-established and not proprietary.
**Decision:** Use the standard Phase 2 sequence (s, a, t, i, p, n first). 42 graphemes across 7 sets. This sequence is industry-standard and unprotectable.
**Consequences:** Sequence matches what teachers expect. Content Agent builds original mnemonics, characters, and gestures around these phonemes.

---

## ADR-006 · IP Hygiene

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Jolly Phonics owns trademarks on their name, characters, action gestures, and songs. We must not infringe.
**Decision:** CI grep-ban on "Jolly" across all files. No use of known Jolly Phonics character names, gesture descriptions, or song lyrics. Content Agent builds fully original mnemonic system. Content linter blocks known trademarked terms.
**Consequences:** Content creation is harder — can't lean on existing mnemonics. The result is a genuinely original product. The grep-ban is the automated tripwire.

---

## ADR-007 · Teacher-Assisted Gameplay Model

**Date:** 2026-04-16
**Status:** Ratified
**Context:** V1 originally specced the child as their own judge via self-assessment buttons ("I know it!" / "Help me") and auto-scored tap-on-oddball Beat Mode. In practice this game will be played with a teacher (or parent) sitting alongside the child. Teachers know whether a child actually produced the correct phoneme sound — the child does not reliably self-assess, and auto-scoring via speech recognition is unreliable for isolated phonemes and young voices (see TRUTH.md risks).
**Decision:**
1. Teacher is the arbiter of correct/incorrect across both Stage 1 and Stage 2.
2. Per-card UI presents two teacher-facing buttons: "Correct" and "Try again".
3. Any "Try again" mark restarts the entire session from the first card. Complete all cards correctly in a row to pass the zone.
4. Self-scoring UI (stars out of 5, numeric streak counters, combo multipliers) is removed. Sparkle remains as a gentle visual "Correct" acknowledgement.
5. Mastery still persists to IndexedDB — a phoneme is marked mastered only when completed without a restart in its session.
6. Beat Mode: the pattern plays through; teacher marks pass/fail at the end (or per-beat if we expand later). Fail restarts the sequence.
**Consequences:**
- Clearer pedagogy: the teacher's judgment is what moves the child forward, matching real phonics instruction.
- Restart-on-fail is a true mastery gate. More frustrating-on-paper than self-paced, but the teacher's tone mediates this.
- Language across the app shifts from child-facing self-assessment ("I know it!") to observational ("Correct"). Tone remains warm; "Try again" not "Wrong".
- Speech recognition is fully deferred (no longer even a stretch goal for V1).

---

## ADR-008 · Flash-and-Mask Drill + Teacher Panel

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Testing an independent implementation (Phonics Flash Awesomer) surfaced two pedagogical and UX gaps in our design. First, our Learn session does "presentation-and-reveal" — show grapheme for a duration, reveal phoneme, teacher judges — which tests *"did they know it on seeing"*. The actual RSVP flash-exposure science is "flash-and-mask": a neutral mask, a brief flash, mask returns, child must *recall what they saw*. That builds orthographic mapping speed. Second, our content model is a locked 42-grapheme manifest; teachers have no surface to author a day-specific word list (sight words, this week's spellings, the 5 graphemes this kid keeps missing) without editing source code.
**Decision:**
1. Add a Teacher Panel route at `#/teacher` with:
   - Freeform textarea for a comma-or-newline-separated word list
   - Flash duration slider (50ms – 1500ms)
   - Randomize toggle
   - Preset loader (one preset per zone from the manifest) to seed the list
   - localStorage persistence of the teacher's config across sessions and reloads
2. Rewrite the Learn session as flash-and-mask drill:
   - Default state: neutral mask + "Ready. Tap or press Space to flash." prompt
   - Tap / click / Space / Enter → flash word for the configured duration → mask returns
   - No per-card Correct/Try-again interruption. Drill is open-ended.
   - Teacher-facing corner controls: Shuffle (reshuffle list), Done (return to teacher or world)
3. Preserve the Beat Mode boss level's teacher-judged pass/fail gate (ADR-007) — it's a mastery checkpoint, not a drill.
4. Preserve the world map, avatar, zones as the gamified progression wrapper. Zone entry now pre-populates the teacher panel with that zone's phonemes as a starting list.
5. Session length boundaries and star ratings stay removed (ADR-007).
**Consequences:**
- The daily drill loop now matches how phonics actually gets taught: teacher configures today's list, paces the taps, observes the child's recall, restarts or switches lists as needed.
- Teachers can author arbitrary lists without touching JSON or source code.
- Mastery tracking via Learn is de-emphasized — the drill loop doesn't auto-record success/failure. Mastery progression now flows primarily through Beat Mode boss levels (still teacher-judged).
- Two separate interaction models coexist: flash-and-mask drill (Learn) and pattern/oddball with end-of-sequence judgment (Beat Mode). Each serves a different purpose.
- The ORP highlighting and variable-timing duration rules from M1/M2 are kept in the engine but become *optional* — teacher panel defaults to clean flash-and-mask with a flat duration, with per-zone or per-preset opt-ins for the fancier behaviors later.

---

## ADR-009 · Zone-Aware Drill Integration

**Date:** 2026-04-16
**Status:** Ratified
**Context:** ADR-008 introduced the flash-and-mask drill at `#/drill` with a teacher-configurable word list, but the world map's zone entry still routed to the older `#/learn/:zoneId` presentation-and-reveal session. This created two inconsistent interaction models on the same app: the gamified journey (world → zone → old LearnSession with Correct/Try-again) and the drill loop (teacher panel → drill). Teachers testing the app would see the zone journey and learn a different muscle memory than the one the app actually optimizes for.
**Decision:**
1. World map zones now route to `#/drill/:zoneId`, which loads the flash-and-mask drill preloaded with that zone's phonemes.
2. Add `#/drill/:zoneId` route alongside `#/drill`. With a zone id, DrillSession uses the zone's phonemes as a per-session override (does NOT write to localStorage, preserving the teacher's custom list).
3. Retain the standalone `#/drill` for custom-list sessions configured via the Teacher Panel.
4. The old `#/learn/:zoneId` LearnSession route is removed from the app router. The code stays on disk under `src/stages/learn/LearnSession.tsx` so nothing breaks and the history is preserved for a V2 revival if we want the per-card judgment mode back, but it's no longer reachable via any UI path.
5. The drill renders a small zone context label when launched with a zoneId so the child (and teacher) know which zone they're in.
6. Unlock logic simplifies: zones progress via Beat Mode boss passes only. The old LearnSession mastery writes are no longer the primary driver. Zone statuses flow locked → available → completed (via boss unlockZone), skipping the "in-progress" state unless phonemes were attempted via the now-retired LearnSession path.
**Consequences:**
- One interaction model across both entry paths (teacher panel custom list, world map zone).
- Teachers get zone context "for free" — clicking a zone on the map loads its phonemes without manual textarea copy-paste.
- The world map remains the gamified journey, the teacher panel remains the classroom-driver surface; the drill loop is the same underneath.
- LearnSession is dead code but intentionally preserved for now. Add a code comment noting ADR-009.
- DrillSession now has two inputs: localStorage teacher config (default), or a zoneId prop (override). The prop takes precedence when set.

---

## ADR-010 · Boss Mode Becomes Drill-Style Gauntlet

**Date:** 2026-04-16
**Status:** Ratified
**Context:** Stage 2 (Beat Mode) was built under M4 as a BPM-paced, auto-advancing rhythm game with pattern/oddball scheduling via Web Audio API lookahead clock. Under ADR-007 it was adjusted to teacher-judged pass/fail at end of sequence. Under ADR-008 the main Stage 1 loop became flash-and-mask. Under ADR-009 zone entry unified to the drill mechanic. Stage 2 was left on the old auto-paced rhythm mechanic, which (a) is inconsistent with the rest of the app's interaction vocabulary, (b) doesn't match the teacher-led pedagogy that drives the rest of the UX, and (c) carries significant complexity (BeatClock, BeatScheduler, pattern-break oddball math, PEAT-safe flash rates) for behavior that no longer fits the design.
**Decision:**
1. Retire the BPM/rhythm/oddball model for V1 Boss Mode. The Boss is now a timed flash-and-mask gauntlet:
   - Teacher and child take the zone's full phoneme list (shuffled once).
   - Flash duration comes from the zone's `bossConfig.tempo`:
     * `slow` → 500ms, `medium` → 300ms, `fast` → 180ms (harder than the Teacher Panel's 250ms default).
   - Teacher or child paces taps/Space like the drill. Each flash is a gauntlet step.
   - After the last flash, phase transitions to `'judging'` — teacher sees "Yes — correct" / "Try again" buttons.
   - Correct → unlock next zone, success overlay, back to world.
   - Try again → reset to first flash, attempt counter increments.
2. `BeatSession.tsx`, `BeatClock`, `BeatScheduler`, and their test files remain on disk but are no longer referenced by the app — following the same preservation pattern we applied to `LearnSession.tsx` under ADR-009. They are candidates for V2 revival if we want to reintroduce a true rhythm game as a separate stage.
3. `BossLevel.tsx` is rewritten to render the new `BossSession` component (flash-and-mask gauntlet) and still side-effects `PersistenceAdapter.unlockZone(nextZoneId)` on pass.
4. The `#/beat/:zoneId` route is preserved (no URL churn, existing bookmarks keep working); it now renders the drill-style gauntlet. A future clean-up could rename to `#/boss/:zoneId` with a redirect.
5. `bossConfig.requiredScore` and `bossConfig.length` fields are no longer read; they remain in the content manifest schema for V2 compatibility. `bossConfig.tempo` maps to flash duration as above.
**Consequences:**
- One interaction vocabulary across the entire app: flash-and-mask, teacher-judged.
- Simpler code. The BeatClock (Web Audio lookahead scheduler) and BeatScheduler (pattern/oddball generator) are ~300 lines each plus tests; removing them from the active path drops bundle size and test surface.
- Loses the "rhythm drill" dimension entirely for V1. That was a research-backed hook but not the core pedagogy.
- The PEAT-safety guarantees on the old BeatSession (single-pulse flashes at <3 Hz) still apply: the drill's flash rate depends on how fast the teacher taps, which is nowhere near strobe range.

---

## ADR-011 · Positional Variance for Optical Training

**Date:** 2026-04-16
**Status:** Ratified
**Context:** TRUTH.md originally specified "fixed focal point" to minimize eye-movement cost during RSVP flash-exposure drills. That is correct for early readers learning grapheme-sound correspondences. However, advanced drills benefit from *saccadic / peripheral recognition training* — deliberately varying where on screen the flash appears so the eye has to find the target rather than relying on fixation. This is a separate skill from grapheme recognition and is what lets fluent readers parse text at real-world speeds. A single app can support both by making positional variance a configurable dimension of difficulty, not a constant.
**Decision:**
1. Add a new `positionVariance` field (0-100) to `TeacherConfig`, default 0.
   - 0 = letters always centered (current behavior, safest for new readers).
   - 100 = maximum safe range (letters can appear near the screen edges, still fully visible).
2. Teacher Panel exposes a "Letter position variance" slider alongside the existing flash-duration slider.
3. DrillSession renders each flash at a per-flash random offset within the variance range. Offsets are expressed as unit multipliers (-1..+1) applied via CSS custom properties (`--drill-ox`, `--drill-oy`) to a `transform: translate(...)` on the word element. Actual pixel distance uses `clamp()` so letters stay fully on screen at any viewport size.
4. BossSession defaults variance based on the zone's `bossConfig.tempo`:
   - `slow` → variance 0 (no movement)
   - `medium` → variance 40 (moderate)
   - `fast` → variance 80 (substantial)
   Zones can still opt into different values later; the tempo→variance map is a sensible default that keeps harder zones genuinely harder.
5. Variance is a per-flash random roll, not an animated path. Letters appear at a fixed position for the duration of each flash, move nowhere during it, then mask returns and the next flash rolls a new position. This keeps the mechanic compatible with the flash-and-mask pedagogy (no moving targets during recall).
6. Accessibility: `prefers-reduced-motion` does not need to affect this — the letters are static during each flash. Position variance is a recognition challenge, not motion.
**Consequences:**
- TRUTH.md's "fixed focal point" principle is relaxed to "fixed focal point by default, configurable variance for advanced drills". Annotated in TRUTH.md.
- Zone progression now has a built-in difficulty axis: later zones ship medium/fast tempos which imply more variance.
- Teachers can isolate the difficulty they want: a student struggling with grapheme recognition gets variance 0; a student practicing fluency gets variance 60+.
- No external dependencies. Pure CSS custom properties + JS per-flash roll.
