# ROADMAP.md — Phonics Flash Tool V1

Five milestones. Exit criteria are binary.

---

## M1 · Foundation (Week 1)

**Owners:** Foundation Agent, UI/Design Agent (parallel)

**Exit Criteria:**
- [ ] Repo scaffolded (Preact + Vite + TypeScript)
- [ ] Preact + Vite boots locally
- [ ] Cloudflare Pages deploys on push
- [ ] PWA installs on a tablet
- [ ] Lighthouse PWA >= 95
- [ ] Design tokens exist as CSS custom properties
- [ ] `RsvpEngine` interface defined and unit-tested with dummy data
- [ ] CI runs lint + test + build on every push
- [ ] "Jolly" grep-ban wired in CI

---

## M2 · Content + Learn Mode v0 (Week 2-3)

**Owners:** Content Agent, Learn Mode Agent, UI/Design Agent

**Exit Criteria:**
- [ ] 42-grapheme dataset complete and schema-valid
- [ ] Web Speech API fallback plays each phoneme
- [ ] Learn Mode presents a 10-card session with ORP highlighting and variable RSVP timing
- [ ] Tap-to-advance works
- [ ] Correct/incorrect micro-rewards fire
- [ ] Mastery persists to IndexedDB across page reload
- [ ] Vitest + Playwright suites green

---

## M3 · World Map + Avatar (Week 4)

**Owners:** World Agent, UI/Design Agent, Content Agent (character assets)

**Exit Criteria:**
- [ ] 3 zones rendered with distinct geography
- [ ] Avatar renders and shows visible state change at three mastery tiers
- [ ] Zone unlock logic gated on Learn Mode completion
- [ ] Map navigable by touch and keyboard
- [ ] Visual regression snapshots captured

---

## M4 · Beat Mode + Boss Level (Week 5-6)

**Owners:** Beat Mode Agent, Foundation Agent (audio clock), UI/Design Agent

**Exit Criteria:**
- [ ] Beat Mode runs at 3 tempos
- [ ] Flash events within +/-8ms of audio clock
- [ ] Pattern-break mechanic demonstrable
- [ ] Zone 1 boss level playable, completion gates zone 2 unlock
- [ ] PEAT check passes
- [ ] iOS Safari audio unlock works
- [ ] Tab-blur pauses cleanly

---

## M5 · Polish, A11y, Ship (Week 7)

**Owners:** All agents, UI/Design Agent lead

**Exit Criteria:**
- [ ] axe-core green on all routes
- [ ] Contrast audit passes WCAG 2.1 AA
- [ ] Dyslexia font toggle works
- [ ] Motion-reduction honored
- [ ] Offline mode verified on real tablet with airplane mode
- [ ] Public GitHub repo with README + CONTRIBUTING + LICENSE (MIT)
- [ ] Deployed to public Cloudflare Pages URL
- [ ] A 5-year-old and a 7-year-old have each completed one Learn session and one Beat Mode round on a real device
