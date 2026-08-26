# isaacaoki.github.io

Personal site for Isaac Aoki, medical writer. Plain HTML/CSS/JS — no build step, no
dependencies. GitHub Pages serves it straight from `main`.

## The idea

The page is built around a DNA double helix that never stops turning. Scroll and it comes
apart, performing the central dogma on itself — which is also the shape of the work:

| Zone | The helix | The writing |
| --- | --- | --- |
| **DNA** | Both backbones, wound tight | Protocols, SAPs, investigator brochures, consent forms |
| **Transcription** | The strands part; the rust backbone leaves | *(interstitial — no work items)* |
| **RNA** | One backbone alone, bases unpaired | CSRs, manuscripts, abstracts, posters |
| **Translation** | The strand feeds a reader held still | The plain-language rewrite, before and after |
| **Protein** | No helix left — a folded chain, tumbling | Lay summaries, decision aids, patient materials |

Schematics for the whole design, including the two directions not taken:
https://claude.ai/code/artifact/639de280-7c3f-457f-987b-7010b149c06b

## How the motion works

Worth knowing before you change anything, because it is deliberately cheap.

**Rotation is vertical translation.** Seen head-on, a helix turning about its axis and a
helix travelling upward are the same picture. So the whole strand is drawn one period taller
than the viewport and moved by exactly that period on a loop — one compositor transform, no
redraw, no JavaScript in the render path.

**Depth is what makes it a solid.** Each strand is sliced into nine bands by `cos(theta)`.
The nearest band is 3.2 px and fully opaque, the farthest 0.75 px at 9% — so the strand
thickens and brightens as it swings toward you. Without that gradient the whole thing reads
as flat lines sliding around. The base pairs are depth-sorted the same way.

**Four motions run at once, on periods that do not divide into each other**: a 16 s turn, a
23 s parallax turn on the second helix behind it, a 47 s precession, and your scrolling. The
composite never visibly repeats.

**Scrolling turns it too.** `--sp` adds scroll position to the phase, wrapped inside one
period so the transform never grows. The far layer lags at 42% for parallax. This is the one
thing that touches JS while you scroll: a single custom property, rAF-throttled.

If you change the helix period, change it in `params()` only — `FAR_PERIOD` and the scroll
wrap both derive from it. Hard-coding a second value there is how the parallax layer starts
jumping.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | All page content. Sections carry `data-zone`, which drives the helix. |
| `styles.css` | Tokens at the top (`:root`), then the helix layer, then the page. |
| `script.js` | Helix geometry, zone tracking, scroll phase, mobile menu. |
| `design/` | The schematic artboards the design came from. Not served. |

## Filling in your content

Placeholders appear two ways:

- `<!-- TODO: ... -->` — an instruction to you, invisible on the page. Delete once done.
- `[text in square brackets]` — visible dummy text. Replace it.

Find everything left to do:

```bash
grep -n "TODO\|\[" index.html
```

Priority order, highest impact first:

1. **Contact email** — `mailto:hello@example.com`. Change the `href` *and* the visible text.
2. **The before/after rewrite** in the Translation zone. It is the one place the site proves
   the claim instead of asserting it, so use a real rewrite of your own.
3. **Hero headline and lede.**
4. **The work items** in the DNA, RNA and Protein zones.
5. **Experience timeline** and **About** bio.
6. **Tools & standards** — delete anything you can't stand behind.

Drop a `resume.pdf` in this folder to make the two CV links work, or delete those links.

### Adding a piece of writing

Copy an existing `<li class="work">` into the right zone's `<ul class="works">`. Leave the
`<span class="pair">` in — it is the base pair, and it works out its own phase from where the
row lands on the page. Nothing to set by hand.

### Adding a section

Give it `data-zone="..."` with one of the five zone names, and put it inside `<main>`. The
helix will follow it. Sections after Protein should stay `protein` so the chain carries
through to the end.

## Preview locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Accessibility and fallbacks

- The helix is `aria-hidden` — it is decoration, and nothing in it is load-bearing for meaning.
- Under `prefers-reduced-motion` every animation stops and the scroll coupling is skipped.
  The helix stays a helix; only the turning goes.
- Dark and light both follow the visitor's OS setting.
- Printing drops the helix and expands everything.
- No contact form — a static GitHub Pages site can't process one. Formspree or Netlify Forms
  will do it without a backend if you want one later.
