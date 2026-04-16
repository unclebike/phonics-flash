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
