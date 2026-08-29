/* ============================================================
   The lettered helix.

   Two backbones, base-pair rungs between them, and the bases
   themselves named — A opposite T, G opposite C, correctly paired.

   Everything is drawn into a fixed 300x760 viewBox and animated
   by advancing a single phase angle. Depth comes from cos(angle):
   each backbone is split into four bands that thicken and brighten
   as they come toward you, and the letters scale and fade the
   same way. That's what makes it read as a solid turning rather
   than lines sliding.

   Under prefers-reduced-motion it draws one frame and stops.
   ============================================================ */

(function () {
  'use strict';

  var svg = document.querySelector('.helix');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var TWO = Math.PI * 2;

  var P = 300;              // one full turn, in viewBox units
  var AMP = P * 0.294;      // how far a backbone swings from the axis
  var CX = 150;             // the axis
  var H = 760;              // drawn height
  var RISE = P / 10;        // vertical spacing between base pairs
  var OFF = (140 * Math.PI) / 180;  // strand B's phase offset — the minor groove
  var PERIOD = 13;          // seconds per turn
  var SEED = 15;

  var BASE = { A: 'var(--n-a)', T: 'var(--n-t)', G: 'var(--n-g)', C: 'var(--n-c)' };

  // Seeded RNG, so the sequence is the same on every load.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mk(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---- build -------------------------------------------------- */

  var bands = [];
  for (var st = 0; st < 2; st++) {
    for (var bi = 0; bi < 4; bi++) {
      var f = bi / 3;
      var path = mk('path', {
        fill: 'none',
        stroke: st ? 'var(--b)' : 'var(--a)',
        'stroke-width': (1 + 2.9 * f).toFixed(2),
        'stroke-linecap': 'round',
        opacity: (0.15 + 0.75 * f).toFixed(3)
      });
      svg.appendChild(path);
      bands.push({ s: st, b: bi, path: path });
    }
  }

  function letterGroup(ch) {
    var g = mk('g', {});
    var t = mk('text', {
      x: 0, y: 0,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-family': "'IBM Plex Mono', monospace",
      'font-size': 15,
      'font-weight': 500,
      fill: BASE[ch],
      // halo, so a letter stays legible when it crosses a backbone
      stroke: 'var(--paper2)',
      'stroke-width': 2.6,
      'paint-order': 'stroke',
      'stroke-linejoin': 'round'
    });
    t.textContent = ch;
    g.appendChild(t);
    svg.appendChild(g);
    return g;
  }

  var rand = rng(SEED);
  var rows = [];

  for (var y = -RISE; y <= H + RISE; y += RISE) {
    var r = rand();
    var pair = r < 0.25 ? ['A', 'T'] : r < 0.5 ? ['T', 'A'] : r < 0.75 ? ['G', 'C'] : ['C', 'G'];
    var bonds = pair[0] === 'G' || pair[0] === 'C' ? 3 : 2;  // G–C is a triple bond

    var g = mk('g', {});
    for (var bd = 0; bd < bonds; bd++) {
      var dy = (bd - (bonds - 1) / 2) * 4.4;
      g.appendChild(mk('line', {
        x1: -50, x2: 0, y1: dy, y2: dy, stroke: BASE[pair[0]],
        'stroke-width': 2.3, 'stroke-linecap': 'round',
        'stroke-dasharray': '0.01 5', 'vector-effect': 'non-scaling-stroke'
      }));
      g.appendChild(mk('line', {
        x1: 0, x2: 50, y1: dy, y2: dy, stroke: BASE[pair[1]],
        'stroke-width': 2.3, 'stroke-linecap': 'round',
        'stroke-dasharray': '0.01 5', 'vector-effect': 'non-scaling-stroke'
      }));
    }
    svg.appendChild(g);

    rows.push({ y: y, rung: g, ga: letterGroup(pair[0]), gb: letterGroup(pair[1]) });
  }

  /* ---- draw --------------------------------------------------- */

  function draw(t) {
    var ph = (t / PERIOD) * TWO;
    var ang = function (yy, extra) { return ph + (TWO * yy) / P + extra; };

    // Backbones, split by depth into four bands each. A run is
    // emitted whenever the sample crosses into a different band.
    var runs = [[[], [], [], []], [[], [], [], []]];
    for (var si = 0; si < 2; si++) {
      var base = si ? OFF : 0;
      var cur = -1;
      var buf = [];
      for (var yy = -14; yy <= H + 14; yy += 6) {
        var a = ang(yy, base);
        var x = CX + AMP * Math.sin(a);
        var band = Math.min(3, Math.floor(((Math.cos(a) + 1) / 2) * 4));
        if (band !== cur) {
          if (cur >= 0 && buf.length) { buf.push([x, yy]); runs[si][cur].push(buf); }
          cur = band;
          buf = [];
          var py = yy - 6;
          if (py >= -14) buf.push([CX + AMP * Math.sin(ang(py, base)), py]);
        }
        buf.push([x, yy]);
      }
      if (cur >= 0 && buf.length) runs[si][cur].push(buf);
    }

    for (var i = 0; i < bands.length; i++) {
      var bd = bands[i];
      var d = '';
      var group = runs[bd.s][bd.b];
      for (var j = 0; j < group.length; j++) {
        d += 'M' + group[j].map(function (pt) { return pt[0].toFixed(1) + ',' + pt[1]; }).join('L');
      }
      bd.path.setAttribute('d', d);
    }

    // Rungs and lettered bases.
    for (var k = 0; k < rows.length; k++) {
      var row = rows[k];
      var aA = ang(row.y, 0), aB = ang(row.y, OFF);
      var xA = CX + AMP * Math.sin(aA), xB = CX + AMP * Math.sin(aB);
      var fA = (Math.cos(aA) + 1) / 2, fB = (Math.cos(aB) + 1) / 2;
      var fP = (fA + fB) / 2;

      // The rung stops short of each backbone so the letters have room.
      var span = xB - xA;
      var x1 = xA + span * 0.3, x2 = xB - span * 0.3;
      row.rung.setAttribute('transform',
        'translate(' + ((x1 + x2) / 2).toFixed(1) + ',' + row.y + ') scale(' + ((x2 - x1) / 100).toFixed(4) + ',1)');
      row.rung.setAttribute('opacity', ((0.14 + 0.6 * fP) * 0.85).toFixed(3));

      row.ga.setAttribute('transform',
        'translate(' + xA.toFixed(1) + ',' + row.y + ') scale(' + (0.6 + 0.62 * fA).toFixed(3) + ')');
      row.ga.setAttribute('opacity', (0.2 + 0.78 * fA).toFixed(3));
      row.gb.setAttribute('transform',
        'translate(' + xB.toFixed(1) + ',' + row.y + ') scale(' + (0.6 + 0.62 * fB).toFixed(3) + ')');
      row.gb.setAttribute('opacity', (0.2 + 0.78 * fB).toFixed(3));
    }
  }

  /* ---- run ---------------------------------------------------- */

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(0);
    return;
  }

  var raf = null;
  var t0 = performance.now();
  var elapsed = 0;   // seconds of turn accumulated while visible

  function frame(now) {
    elapsed += (now - t0) / 1000;
    t0 = now;
    draw(elapsed);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = null;
  }

  draw(0);
  start();

  // Nothing to animate once the hero has scrolled away.
  var hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }).observe(hero);
  }

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
})();

/* ============================================================
   Dialogs. A [data-dialog="id"] button opens <dialog id="id">.
   Esc closes it for free; this adds the close button and a
   click on the backdrop.
   ============================================================ */

(function () {
  'use strict';

  document.querySelectorAll('[data-dialog]').forEach(function (trigger) {
    var dlg = document.getElementById(trigger.dataset.dialog);
    if (!dlg || typeof dlg.showModal !== 'function') return;

    trigger.addEventListener('click', function () { dlg.showModal(); });
  });

  document.querySelectorAll('dialog').forEach(function (dlg) {
    // The dialog element's own box is the backdrop area as far as
    // click targets go — a click that lands on it, not on anything
    // inside, is a click outside the content.
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
    dlg.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { dlg.close(); });
    });
    // Esc closes a modal <dialog> natively; this makes it explicit
    // so the behaviour doesn't depend on the browser.
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') dlg.close();
    });
  });
})();
