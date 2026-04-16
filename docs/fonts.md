# Fonts

The design system offers a dyslexia-friendly font toggle. The primary
choice is **OpenDyslexic**; the project does not bundle the font files
(they are binary assets under a license distinct from ours) so they need
to be sourced once per fork.

Until the files are dropped in, `[data-font="dyslexia"]` falls through to
**Atkinson Hyperlegible** (via Google Fonts) and then to system sans-serif.
Nothing visually breaks in the meantime — the toggle simply has a smaller
effect than it will once OpenDyslexic is in place.

## Where to download

- Upstream site: <https://opendyslexic.org/>
- GitHub source: <https://github.com/antijingoist/opendyslexic>
- License: [SIL Open Font License 1.1](https://scripts.sil.org/OFL)
  — compatible with our MIT licensing.

Grab the latest `.woff2` release assets. You need:

- `OpenDyslexic-Regular.woff2`
- `OpenDyslexic-Bold.woff2`

(The italic and mono variants are not currently referenced by the design
tokens. Add them if and when a use case comes up.)

## Where to place them

Both files go under `public/fonts/` at the repo root:

```
public/
└── fonts/
    ├── OpenDyslexic-Regular.woff2
    └── OpenDyslexic-Bold.woff2
```

Vite serves `public/` verbatim, so the final served paths will be
`/fonts/OpenDyslexic-Regular.woff2` and `/fonts/OpenDyslexic-Bold.woff2`.

## Wiring the CSS

Open `src/ui/global.css` and uncomment the `@font-face` block at the top
of the file (currently between the `NOTE:` comment and the reset, lines
~15-30). It should become:

```css
@font-face {
  font-family: 'OpenDyslexic';
  src: url('/fonts/OpenDyslexic-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'OpenDyslexic';
  src: url('/fonts/OpenDyslexic-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

No other file needs to change — `--font-dyslexia` in `tokens.css` already
points at the `'OpenDyslexic'` family with Atkinson Hyperlegible as its
fallback.

## Verifying

1. `npm run dev`
2. In the browser, set `document.documentElement.dataset.font = 'dyslexia'`
   from the console (or use whatever settings UI the app exposes).
3. Inspect a block of body text in DevTools → Computed → `font-family`.
   It should resolve to `OpenDyslexic` rather than `Atkinson Hyperlegible`.
4. Confirm the font loads from `/fonts/…woff2` in the Network panel with
   a 200 response.

## Do NOT commit the font files blindly

The OFL allows redistribution, but the binary assets bloat the repo and
duplicate what the OpenDyslexic project already hosts. Prefer to fetch
them at build or deploy time, or commit them once on your own fork after
confirming your distribution plan.
