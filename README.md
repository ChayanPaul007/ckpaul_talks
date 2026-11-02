# ckpaul-talks

Web slide decks by Chayan Kumar Paul (reveal.js + KaTeX, fully offline; no CDN needed).

| Talk | Path |
|---|---|
| Postdoctoral interview, KFUPM CIE (4 Nov 2026) | `kfupm-2026/` |

The site is **unlisted**: the root page does not link to talks, every page carries `noindex`, and `robots.txt` disallows crawling. Share talks by direct link.

## Present
- Open `kfupm-2026/index.html` in Chrome (works straight from disk, or from the deployed URL). Press `F` for full screen.
- `→`/`Space`: next step · `↓` on the last slide: backup slides · `S`: speaker view with notes and timer · `Esc`: overview.
- The spatiotemporal-tube slide animates continuously while it is on screen; other figures animate once on entry or with the next click.

## PDF fallback
`kfupm-2026/kfupm-2026-slides.pdf` is a static export of every slide with all steps shown (no animation). Keep it open as a backup during a live talk.

## Deploy
Static site, no build step.
- **Vercel:** import this repository; framework preset "Other"; output directory `/`.
- **GitHub Pages:** Settings → Pages → deploy from branch `main`, folder `/`.

## Structure
```
kfupm-2026/   index.html, css/theme.css, js/figures.js (animated SVG figures), figures/
vendor/       reveal.js 5.1.0, KaTeX 0.16.11, Source Serif 4 / Source Sans 3 (woff2)
```
Third-party licenses: reveal.js (MIT), KaTeX (MIT), Source fonts (SIL OFL 1.1).
