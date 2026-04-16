# Beat Mode (Stage 2) — SPEC.md

**Owner:** Beat Mode Agent
**Updated:** ADR-007 teacher-assisted redesign

## Flow (teacher-assisted)

1. Teacher and child sit together at the Boss Level
2. Start button unlocks AudioContext (iOS Safari) and begins the sequence
3. Pattern plays at the zone's configured tempo: phonemes flash in runs of 3-5 (same sound), then an oddball break (new sound) with a visible arena flash
4. Child says each sound out loud as it appears; teacher observes
5. Sequence completes → phase transitions to 'judging'
6. Teacher sees "Yes — correct" / "Try again" buttons
7. On "Try again": phase returns to 'ready', attempt counter increments, child can restart from beat 0
8. On "Yes — correct": zone unlocks, complete overlay shows

## Tempos (from CONTENT_MANIFEST bossConfig)

- slow = 80 BPM
- medium = 110 BPM
- fast = 140 BPM

## Safety (PEAT)

- Single-pulse break flash, 220ms, NOT chained
- At 140 BPM (fastest), beats are 429ms apart — flash rate max ~2.3 Hz, well below 3 Hz PEAT floor
- Flash color is a soft lift to `--color-orp-bg`, luminance change <30%
- `prefers-reduced-motion` collapses transitions to 0ms via global.css

## Removed per ADR-007

- No self-scoring score/combo/miss counters (teacher is the judge)
- No tap-on-oddball mechanic
- No per-beat hit tolerance windows
- No end-of-session numeric pass threshold (teacher decides)

## Retained

- Web Audio clock (lookahead scheduler, iOS unlock, ±8ms accuracy)
- Pattern-break scheduler (visual cue for the teacher/child as a rhythm game aid)
- Tab-blur pause, resume/quit overlay
- Zone-unlock side-effect on pass
