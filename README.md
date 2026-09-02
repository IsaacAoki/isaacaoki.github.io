# isaacaoki.github.io

Personal site for Isaac Aoki, medical writer. Plain HTML/CSS/JS — no build step, no
dependencies, no framework. GitHub Pages serves it straight from `main`, so a push to
`main` *is* a deploy. It goes live about a minute later.

## The design

Built on the **4A** artboard from the Claude Design canvas: warm paper, a serif display
face, and a DNA double helix turning in the hero. Three bands under it, in order:

| | Section | What it holds |
| --- | --- | --- |
| **01** | Research Interests | The MScR thesis (opens its abstract) and the BSc dissertation |
| **02** | Writing | Published patient-facing work |
| **03** | Same paragraph, twice | One clinical paragraph and its plain-language rewrite |

The last one is the demonstration piece — it shows the skill rather than describing it.

Type is Newsreader (display), Public Sans (body) and IBM Plex Mono (labels). Colours are
CSS custom properties at the top of `styles.css`, with a full dark palette below them;
the page follows whatever the reader's system is set to.

## How the helix works

Worth reading before you touch `script.js`.

It's one SVG in a fixed `0 0 300 760` viewBox, redrawn each frame by advancing a single
phase angle. Everything else falls out of that angle:

**Depth is what makes it read as a solid.** Each backbone is cut into four bands by
`cos(angle)` — the nearest band is 3.9 px and nearly opaque, the farthest 1 px at 15%.
The lettered bases scale and fade on the same value. Without that gradient it reads as
flat lines sliding around rather than a shape turning.

**The sequence is real.** Bases are drawn A opposite T and G opposite C, with two hydrogen
bonds on A–T and three on G–C. It comes from a seeded random number generator (`SEED` in
`script.js`), so the same sequence appears on every load — change the seed for a different
one.

**It stops when nobody's looking.** The loop pauses when the hero scrolls out of view and
when the tab is hidden. Under `prefers-reduced-motion` it draws one frame and never starts.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Every word on the page, plus the abstract dialog at the bottom |
| `styles.css` | Tokens at the top (`:root`), then hero, bands, dialog, footer, narrow screens |
| `script.js` | The helix renderer, then the dialog open/close |
| `resume.pdf` | The CV both "Download CV" buttons point at |
| `design/` | Artboards from the earlier "Unwinding" direction. Not served, not current. |

## Editing the content

Everything you write lives in `index.html`. You never need to open `styles.css` or
`script.js`.

**The split that catches people out:** everything above `<body>` is invisible. The `<head>`
holds the browser tab title, the description Google shows under your search result, and the
preview card that appears when someone pastes your link into Slack or LinkedIn. Change
those when your positioning changes, but they never appear on the page. Everything from
`<body>` down is the page itself.

### The hero

```html
<p class="eyebrow">Aspiring Medical Writer · Bristol</p>
<h1>The last step of the central dogma is translation. So is mine.</h1>
<p class="lede">Passionate about childhood cancers…</p>
```

Keep the `h1` short. It is set at 56px and gets three lines at most before it starts
crowding the helix.

### A research card

```html
<div class="card">
  <span class="meta">BSc dissertation · 2020</span>
  <span class="card-title">Thrombin inhibition by D-dimer</span>
  <span class="card-desc">Testing whether a benchtop coagulation analyser could…</span>
</div>
```

Copy the whole block to add another. Two cards sit side by side; a third wraps to a new
row. To fit three across, change `.cards` in `styles.css` from `1fr 1fr` to
`repeat(3, 1fr)`.

The thesis card is different — it's a `<button>` rather than a `<div>`, because it opens
something. That's deliberate: only the card that leads somewhere looks like it does.

### A writing row

```html
<button class="row row-b row-open" type="button" data-dialog="als">
  <span class="row-body">
    <span class="row-title">If you could cure any disease, which would you choose?</span>
    <span class="row-desc">A written task for Ogilvy Health, on ALS…</span>
  </span>
  <span class="row-tag tag-b">Read →</span>
</button>
```

A row that opens a dialog is a `<button>` with `data-dialog`; a row that goes somewhere
else is an `<a href="...">`. `row-tag` is the small label on the right — `tag-b` colours
it rust, plain `row-tag` leaves it grey.

The Klarity row is neither: it's a plain `<div class="row row-static">` whose three
articles are `<a class="pill">` links inside it, because a row can't be a link and
contain links.

### The thesis abstract

The `<dialog id="thesis">` block at the bottom of `index.html`. One `<p>...</p>` per
paragraph inside `<div class="modal-body">`. It scrolls internally, so length isn't a
problem. The line underneath about emailing for the full copy is `<footer class="modal-foot">`.

To make another card open its own dialog: copy the whole `<dialog>`, give it a new `id`,
and point a card at it with `data-dialog="that-id"`. The script wires it up automatically.

### Contact

Two places carry the email address: the page footer and the dialog's closing line. Each
writes it twice — once in the `mailto:` link and once as the visible text — so search for
`isaacaokilsx` and change every hit rather than the first one you spot.

## Working on it

Preview locally before pushing:

```bash
python3 -m http.server 4173
```

Then http://localhost:4173. Safari caches hard — ⌥⌘R reloads from origin, and a private
window (⇧⌘N) ignores the cache entirely.

Publish:

```bash
git add -A && git commit -m "What changed" && git push
```

If you edited on github.com instead, run `git pull` before your next local edit, or the
two copies diverge.
