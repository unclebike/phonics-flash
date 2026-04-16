# Fonts

The design system offers a dyslexia-friendly font toggle. The primary
choice is **OpenDyslexic** and the font files are **bundled in this
repo** under `public/fonts/` along with the OFL license text.

OpenDyslexic is licensed under the SIL Open Font License 1.1, which
explicitly permits redistribution, so forks inherit the fonts with no
action required.

## Sources

- Upstream site: <https://opendyslexic.org/>
- GitHub source: <https://github.com/antijingoist/opendyslexic>
- Release used: **v0.91.12** (2019-10-17)
- License: [SIL Open Font License 1.1](https://scripts.sil.org/OFL) —
  compatible with our MIT licensing. Full text in `public/fonts/OFL.txt`.

The shipped files are `Regular.woff2` and `Bold.woff2` only (~235 KB
total). Italic and mono variants are not wired.

## File layout

```
public/
└── fonts/
    ├── OFL.txt                     — license text (required by OFL)
    ├── OpenDyslexic-Regular.woff2
    └── OpenDyslexic-Bold.woff2
```

Vite serves `public/` verbatim, so the runtime paths are
`/fonts/OpenDyslexic-Regular.woff2` and `/fonts/OpenDyslexic-Bold.woff2`.
The `@font-face` declarations live in `src/ui/global.css`.

## Verifying

1. `npm run dev`
2. In the browser console:
   `document.documentElement.dataset.font = 'dyslexia'`
3. DevTools → Computed → `font-family` should resolve to `OpenDyslexic`.
4. Network panel: woff2 files should 200.

## Refreshing the fonts

To bump to a newer OpenDyslexic release:

```bash
curl -LO https://github.com/antijingoist/opendyslexic/releases/download/<tag>/<release>.zip
unzip -j -o <release>.zip "OpenDyslexic-Regular.woff2" "OpenDyslexic-Bold.woff2" -d public/fonts/
curl -sL https://raw.githubusercontent.com/antijingoist/opendyslexic/main/OFL.txt -o public/fonts/OFL.txt
```
