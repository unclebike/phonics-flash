# Core — SPEC.md

**Owner:** Foundation Agent

## RSVP Engine

See `INTERFACES.md` for the `RsvpEngine` contract.

### ORP Formula

- n <= 4: position = floor(n / 3) (at least 0)
- n >= 5: position = floor(n / 2) - 1

### Duration Rules (Non-Negotiable)

1. Base duration = 60000 / WPM ms per word
2. Words of 5+ letters: multiply by 1.35x
3. Digraphs and trigraphs: multiply by 1.5x
4. Previously incorrect in-session: multiply by 1.2x
5. After punctuation or sequence boundary: insert full beat pause
6. **Never use flat WPM. Variable timing always.**

### Scheduler

Spaced-repetition-lite within a session. Recently incorrect items reappear 3-5 items later.
