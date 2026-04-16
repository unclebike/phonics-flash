# Learn Mode (Stage 1) — SPEC.md

**Owner:** Learn Mode Agent
**Updated:** ADR-007 teacher-assisted redesign

## Flow (teacher-assisted)

1. Teacher and child sit together
2. Child selects zone -> session loads phonemes for that zone
3. RsvpEngine schedules a session of N items
4. Card presents with ORP highlighting, fixed focal point
5. Child says the sound out loud
6. Teacher marks "Correct" or "Try again"
7. On "Correct": Sparkle, advance to next card
8. On "Try again": whole session restarts from card 1 (after a brief friendly message)
9. Complete all cards correctly -> pass, mastery persisted, offer boss challenge

## UI Language (teacher-facing)

- Primary button: "Correct"
- Secondary button: "Try again"
- Restart message: "Great try! Let's start from the beginning."
- Complete message: "You did it! All the way through."
- NO "I know it!" / "Help me" (that was child self-assessment, removed per ADR-007)
- NO stars out of 5, numeric streak counters (removed)

## What persists to IndexedDB

- A phoneme is marked mastered only when the session completes WITHOUT a restart
- Attempts and correct counts track the clean-pass statistic
- Restart-count per session is NOT persisted (not a scoring mechanic)
