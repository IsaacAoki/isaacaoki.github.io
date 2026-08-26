/* ============================================================
   The helix is geometry, not animation. It is built once (and
   again on resize) and then handed to CSS: the turning, the
   parallax and the precession are all compositor transforms.
   The only thing JavaScript touches while you scroll is a single
   custom property.
   ============================================================ */

const NS = 'http://www.w3.org/2000/svg';
const root = document.documentElement;
const svg = document.querySelector('.helix');

const TURN = 16;          // seconds per revolution, matches --turn
const BANDS = 9;          // depth steps on the near helix
const FAR_BANDS = 5;
const SCROLL_SPIN = 0.22; // how much of your scrolling becomes rotation
const FAR_PERIOD = 0.72;  // parallax layer's period, as a fraction of P
const FAR_LAG = 0.42;     // and how much of the scroll it takes up

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function params() {
  const w = innerWidth, h = innerHeight;
  const narrow = w < 768;
  const P = narrow ? 250 : 372;
  return {
    w, h, P, narrow,
    A: narrow ? 52 : Math.min(188, w * 0.132),
    cx: narrow ? w * 0.76 : w * 0.66,
    sep: narrow ? 70 : 170,
    H: h + P               // one period taller than the viewport, so the
  };                       // loop never reveals an edge
}

/* Split one strand into depth bands. Sampling z = cos(theta) and
   filing each run under the band it falls in gives a strand that
   thickens and brightens as it swings toward you — the difference
   between a line that slides and a solid that turns. Consecutive
   bands share their boundary point so the arcs meet without a seam. */
function strandBands(cx, A, P, H, phase, n) {
  const d = new Array(n).fill('');
  const open = new Array(n).fill(false);
  let prev = -1;

  for (let y = 0; y <= H; y += 4) {
    const t = 2 * Math.PI * y / P + phase;
    const i = Math.min(n - 1, Math.floor(((Math.cos(t) + 1) / 2) * n));
    const pt = (cx + A * Math.sin(t)).toFixed(1) + ' ' + y.toFixed(1) + ' ';

    if (prev !== -1 && prev !== i) { d[prev] += 'L' + pt; open[prev] = false; }
    d[i] += (open[i] ? 'L' : 'M') + pt;
    open[i] = true;
    prev = i;
  }
  return d.map((s) => s.trim());
}

const lerp = (a, b, t) => a + (b - a) * t;

function paintBands(group, paths, wNear, wFar, oNear, oFar) {
  group.replaceChildren();
  paths.forEach((d, i) => {
    if (!d) return;
    const t = i / (paths.length - 1);          // 0 = furthest, 1 = nearest
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', d);
    el.setAttribute('stroke-width', lerp(wFar, wNear, t).toFixed(2));
    el.setAttribute('opacity', lerp(oFar, oNear, t).toFixed(3));
    group.appendChild(el);
  });
}

function line(x1, y, x2, opacity, stroke) {
  const el = document.createElementNS(NS, 'line');
  el.setAttribute('x1', x1.toFixed(1));
  el.setAttribute('x2', x2.toFixed(1));
  el.setAttribute('y1', y.toFixed(1));
  el.setAttribute('y2', y.toFixed(1));
  el.setAttribute('opacity', opacity.toFixed(2));
  if (stroke) el.setAttribute('stroke', stroke);
  return el;
}

function build() {
  const { w, h, P, A, cx, sep, H } = params();

  svg.setAttribute('width', w);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${w} ${H}`);
  root.style.setProperty('--sep', sep + 'px');
  document.querySelectorAll('.spin').forEach((g) => g.style.setProperty('--helix-period', P + 'px'));

  // near helix
  paintBands(svg.querySelector('.l-strand-a'), strandBands(cx, A, P, H, 0, BANDS), 3.2, 0.75, 1, 0.09);
  paintBands(svg.querySelector('.l-strand-b'), strandBands(cx, A, P, H, Math.PI, BANDS), 3.2, 0.75, 1, 0.09);

  // parallax helix, further off and turning slower
  const fA = A * 0.42, fP = P * FAR_PERIOD, fcx = cx + A * 1.02, fH = h + fP;
  document.querySelector('.spin-far').style.setProperty('--helix-period', fP + 'px');
  paintBands(svg.querySelector('.l-far-a'), strandBands(fcx, fA, fP, fH, 0, FAR_BANDS), 1.1, 0.5, 0.22, 0.06);
  paintBands(svg.querySelector('.l-far-b'), strandBands(fcx, fA, fP, fH, Math.PI, FAR_BANDS), 1.1, 0.5, 0.22, 0.06);

  // paired bases
  const rungs = svg.querySelector('.l-rungs');
  rungs.replaceChildren();
  for (let y = P / 14; y <= H; y += P / 7) {
    const t = 2 * Math.PI * y / P;
    const dx = A * Math.sin(t);
    const z = Math.cos(t);
    // depth-sorted: a pair swinging toward you is brighter than one behind
    rungs.appendChild(line(cx + dx, y, cx - dx,
      (0.10 + 0.30 * Math.abs(Math.sin(t))) * (0.4 + 0.6 * ((z + 1) / 2)),
      z >= 0 ? 'var(--teal)' : 'var(--rust)'));
  }

  // unpaired bases — what is left once the strands part
  const bases = svg.querySelector('.l-bases');
  bases.replaceChildren();
  for (let y = P / 14; y <= H; y += P / 7) {
    const t = 2 * Math.PI * y / P;
    const x = cx + A * Math.sin(t);
    const dir = Math.cos(t) >= 0 ? 1 : -1;
    bases.appendChild(line(x, y, x + dir * (A * 0.34 + 16), 0.35 + 0.5 * Math.abs(Math.sin(t))));
  }

  // the reader: the one fixed thing on the page
  const rx = cx - sep * 0.45, ry = h * 0.5;
  const body = svg.querySelector('.reader-body');
  body.setAttribute('cx', rx); body.setAttribute('cy', ry);
  body.setAttribute('rx', 62); body.setAttribute('ry', 45);
  const cap = svg.querySelector('.reader-cap');
  cap.setAttribute('cx', rx); cap.setAttribute('cy', ry - 17);
  cap.setAttribute('rx', 40); cap.setAttribute('ry', 25);

  // the folded chain that comes out the far end
  const k = Math.min(2.6, Math.max(1.5, w / 560));
  const pts = [[-72, 42], [-30, -6], [-58, -54], [4, -80], [58, -40], [38, 18], [72, 54]]
    .map(([x, y]) => [cx + x * k, ry + y * k]);
  svg.querySelector('.chain-line')
     .setAttribute('d', 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'));
  const beads = svg.querySelector('.chain-beads');
  beads.replaceChildren();
  pts.forEach(([x, y], i) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('r', i % 2 ? 3.4 : 4.8);
    c.setAttribute('opacity', i % 2 ? 0.62 : 1);
    beads.appendChild(c);
  });

  phasePairs(P);
}

/* Each work row's rung sits at the phase its position on the page
   demands — a negative delay, set once. Rows added later inherit it
   from their own y. */
function phasePairs(P) {
  document.querySelectorAll('.pair').forEach((pair) => {
    const y = pair.getBoundingClientRect().top + scrollY;
    pair.style.setProperty('--d', (-((y % P) / P) * TURN).toFixed(2) + 's');
  });
}

/* Scrolling turns the helix. The pattern repeats every P, so the
   offset is kept inside one period and the transform never grows. */
let phaseQueued = false;
function applyScrollPhase() {
  phaseQueued = false;
  const { P } = params();
  const y = scrollY * SCROLL_SPIN;
  root.style.setProperty('--sp', (-(y % P)).toFixed(1) + 'px');
  // must wrap on the far layer's OWN period, or it jumps every wrap
  root.style.setProperty('--sp-far', (-((y * FAR_LAG) % (P * FAR_PERIOD))).toFixed(1) + 'px');
}

build();

/* ============================================================
   Which zone the reader is standing in: whichever section spans
   the middle of the viewport. Bounds are measured once and cached,
   so scrolling costs an integer comparison and never a layout.
   ============================================================ */
let bands = [];

function measureZones() {
  // `main` scopes this to the sections — <html> carries data-zone too,
  // and would otherwise match as a band spanning the whole document.
  bands = [...document.querySelectorAll('main [data-zone]')].map((el) => {
    const top = el.getBoundingClientRect().top + scrollY;
    return { top, bottom: top + el.offsetHeight, zone: el.dataset.zone };
  });
}

function updateZone() {
  const mid = scrollY + innerHeight / 2;
  const band = bands.find((b) => mid >= b.top && mid < b.bottom)
            || (mid < bands[0]?.top ? bands[0] : bands[bands.length - 1]);
  if (band && root.dataset.zone !== band.zone) root.dataset.zone = band.zone;
}

measureZones();
updateZone();
addEventListener('load', () => { measureZones(); updateZone(); phasePairs(params().P); });

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { build(); measureZones(); updateZone(); }, 180);
});

/* ============================================================
   Chrome
   ============================================================ */
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

const links = [...nav.querySelectorAll('a[href^="#"]')];
const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const navSpy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) =>
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
targets.forEach((t) => navSpy.observe(t));

const header = document.querySelector('.site-header');

addEventListener('scroll', () => {
  header.classList.toggle('is-stuck', scrollY > 8);
  updateZone();
  if (!phaseQueued && !reduced.matches) {
    phaseQueued = true;
    requestAnimationFrame(applyScrollPhase);
  }
}, { passive: true });

document.getElementById('year').textContent = new Date().getFullYear();
