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

## Adding your own content — a walkthrough

Everything you edit is in `index.html`. You never touch `styles.css` or `script.js` —
those are the helix and the layout, and they adjust to whatever you write.

### Step 1 — start the preview, and leave it running

```bash
python3 -m http.server 4173
```

Open http://localhost:4173 in a browser. Every time you save `index.html`, refresh that
tab and your change is there. This is only on your machine — nobody else can see it.

### Step 2 — open index.html and learn the two markers

Two things in the file mark work still to do:

```html
<!-- TODO: rewrite this headline in your own voice. Keep it one sentence. -->
```

That is a note from me to you. It never appears on the page. Delete it once you've done it.

```html
<h1>Evidence has to survive the whole journey from data to a person.</h1>
```

Anything in `[square brackets]` is dummy text that DOES appear on the page. Replace it,
brackets included.

To list everything still outstanding at any point:

```bash
grep -n "TODO\|\[" index.html
```

The number at the start of each line is the line number, so you can jump straight to it.

### Step 3 — the edits, in the order I'd do them

**1. Your email address.** Search the file for `hello@example.com`. It is on one line, but
it appears twice on that line — once as the link, once as the words people see. Change both.

Find this:

```html
<a class="btn" href="mailto:hello@example.com">hello@example.com</a>
```

Change it to:

```html
<a class="btn" href="mailto:you@yourdomain.com">you@yourdomain.com</a>
```

**2. Your links.** Just below the email. Put in your real URLs, or delete any line you
don't want — deleting a whole `<li>...</li>` line is safe.

```html
<li><a href="https://www.linkedin.com/in/your-profile">LinkedIn</a></li>
<li><a href="https://orcid.org/0000-0000-0000-0000">ORCID</a></li>
<li><a href="resume.pdf">CV</a></li>
```

The `CV` one only works once you put a file called `resume.pdf` in this folder. Until then,
delete that line.

**3. The headline.** Near the top, inside `<h1>`. One sentence. Keep the `<h1>` and `</h1>`
tags — change only the words between them.

**4. The opening paragraph**, the `<p class="lede">` right underneath. Mine describes the
helix. Yours should describe you: who you help and what you make. If you rewrite it so it
no longer mentions the helix, also change the line below it that says
`Scroll · the helix unwinds`, or it won't follow on.

**5. The before/after rewrite.** Search for `rewrite-text`. Two paragraphs: a dense original
and your plain-language version of it. Use a real pair from your own work. This is the only
place on the site that demonstrates the skill rather than asserting it, so it is worth more
than anything else on this list.

**6. Your writing samples.** See below.

**7. About and Experience.** Ordinary paragraphs — replace the bracketed text.

### Adding a piece of writing

Find the zone it belongs in, then find `<ul class="works">` inside it. Copy one whole block
that starts `<li class="work">` and ends `</li>`, paste it underneath, and edit the words:

```html
<li class="work">
  <span class="pair" aria-hidden="true"></span>
  <div class="work-body">
    <p class="work-meta"><span class="work-type">Protocol</span><span class="work-year">[2024]</span></p>
    <h3><a href="#contact">[Phase II protocol — indication]</a></h3>
    <p class="work-desc">[What the study was, what you drafted, and the constraint that made it hard.]</p>
    <p class="work-detail"><strong>Standard:</strong> [e.g. ICH E6(R2)] · <strong>Role:</strong> [e.g. Lead writer]</p>
  </div>
</li>
```

What each line is:

- `work-type` — the kind of document, in small caps above the title
- `work-year` — the year
- `<h3>` — the title, and the link it points at
- `work-desc` — a sentence or two on what it was and what it achieved
- `work-detail` — the small grey line at the bottom. Use it for whatever is worth knowing:
  standard met, reading level, journal, length. Delete the line if there is nothing to say.

Two rules:

- **Leave `<span class="pair">` exactly as it is.** That is the base pair on the helix. It
  works out its own position from where the row lands on the page, so you never set anything
  by hand — add twenty rows and they still read as one continuous helix.
- **Change `href="#contact"`** to the real URL when the piece is public. Leave it as
  `#contact` for anything confidential; it then reads as "ask me about this", which is the
  honest thing to do for unpublished work.

**Which zone does a piece go in?** Ask what the document does:

- Defines a study before it runs → **DNA**
- Reports it to people who already speak the language → **RNA**
- Puts it in a patient's hands → **Protein**

A consent form is genuinely both ends at once. It sits in DNA on purpose: it is the one
source document a patient has to understand.

### Deleting things you don't need

Delete whole blocks, never half of one. A `<li class="work">` block ends at its matching
`</li>`. If you delete an opening tag you must delete its closing tag too, or the page will
render oddly. If something looks wrong after a delete, `git diff` shows exactly what changed
and `git checkout index.html` puts it back.

### When you are happy with it

```bash
git add -A
git commit -m "Add my content"
git push -u origin main
```

That last line publishes it. Within a minute or so it is live at isaacaoki.github.io, and
from then on it stays live — every later push updates it.

## Accessibility and fallbacks

- The helix is `aria-hidden` — it is decoration, and nothing in it is load-bearing for meaning.
- Under `prefers-reduced-motion` every animation stops and the scroll coupling is skipped.
  The helix stays a helix; only the turning goes.
- Dark and light both follow the visitor's OS setting.
- Printing drops the helix and expands everything.
- No contact form — a static GitHub Pages site can't process one. Formspree or Netlify Forms
  will do it without a backend if you want one later.
