# Phonics Flash

An open-source phonics tool that teaches letter sounds through rapid serial
visual presentation (RSVP) flash cards. A child and a teacher (or parent) work
through short sessions together — the teacher listens to the child sound out
each phoneme and marks it correct, and the world map slowly opens up as
mastery grows.

Live demo: <https://phonics-flash.pages.dev>

## Features

- **RSVP flash cards** with variable timing, tuned for early readers
- **ORP highlighting** — the optimal recognition point of each word is
  emphasised so young eyes know where to land
- **Teacher-assisted pass/fail** — the teacher is the arbiter of correct, not
  auto-scoring or speech recognition (see ADR-007)
- **World map** with seven biome zones unlocked by real mastery, not points
- **Beat Mode** — a rhythmic, PEAT-safe pattern-break challenge gated behind
  Learn Mode
- **Offline PWA** — installs on a tablet, works on airplane mode after first
  load
- **WCAG 2.1 AA** — contrast-audited palette, dyslexia font toggle,
  reduced-motion honoured, keyboard navigable

## Who it's for

Children aged roughly 4-9, learning the 42-grapheme Phase 2 phonics sequence,
sitting alongside a teacher or parent who can listen and call the shots.
It is *not* a stand-alone drill app for unsupervised play.

## Tech stack

- [Preact](https://preactjs.com/) + [Preact Signals](https://preactjs.com/guide/v10/signals/)
- [Vite](https://vitejs.dev/) 5
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting,
  [Workers](https://workers.cloudflare.com/) for the (optional) API,
  [D1](https://developers.cloudflare.com/d1/) for persistence when it lands
- IndexedDB via `idb-keyval` for local progress
- MIT licensed

No React. No Next.js. No SSR beyond what Pages Functions gives for free.

## Getting started

```sh
npm install
npm run dev       # local dev server
npm test          # vitest suite
npm run build     # type-check + production build
npm run preview   # serve the built bundle
```

Node 20+ is recommended.

## Project structure

```
/
├── src/
│   ├── a11y/         # motion, contrast, font-preference helpers
│   ├── audio/        # Web Speech fallback + BeatClock scheduler
│   ├── content/      # 42-grapheme phonics data + zone manifest
│   ├── core/         # RsvpEngine, PersistenceAdapter
│   ├── stages/
│   │   ├── learn/    # Stage 1 — flash cards + teacher buttons
│   │   └── beat/     # Stage 2 — rhythmic boss level
│   ├── ui/           # design tokens, global CSS, components
│   └── world/        # map, avatar, unlock engine
├── worker/           # Cloudflare Worker (optional, not required for V1)
├── public/           # PWA manifest, icons, service worker
└── docs/             # a11y audit, fonts, orchestration notes
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). This is a shared but lightly
supported release — issues and PRs are welcome, response times will vary.

## License

[MIT](./LICENSE).
