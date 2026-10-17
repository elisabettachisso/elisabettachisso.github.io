(function () {
  var root = document.documentElement;

  /* ---------- language ---------- */
  var buttons = document.querySelectorAll('[data-set-lang]');
  var post = document.querySelector('[data-translation]');

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
  }

  apply(root.getAttribute('data-lang') || 'it');

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-set-lang');
      try { localStorage.setItem('lang', lang); } catch (e) {}
      // On an article, switch to its translation if one exists.
      if (root.hasAttribute('data-force-lang') && lang !== root.getAttribute('data-force-lang')) {
        if (post) { window.location.href = post.getAttribute('data-translation'); return; }
      }
      apply(lang);
    });
  });

  /* ---------- theme ---------- */
  var themeListeners = [];
  var toggle = document.querySelector('[data-toggle-theme]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      themeListeners.forEach(function (fn) { fn(); });
    });
  }

  /* ---------- generative art ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function palette() {
    var s = getComputedStyle(root);
    return {
      ground: s.getPropertyValue('--ground').trim(),
      panel: s.getPropertyValue('--panel-2').trim(),
      inks: ['--a1', '--a3', '--a2'].map(function (v) { return s.getPropertyValue(v).trim(); }),
      light: root.getAttribute('data-theme') === 'light'
    };
  }

  // Small seeded PRNG (mulberry32) and 2D Perlin noise built on it.
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function noise2(rand) {
    var p = new Uint8Array(512), i, j, k;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { j = Math.floor(rand() * (i + 1)); k = p[i]; p[i] = p[j]; p[j] = k; }
    for (i = 0; i < 256; i++) p[i + 256] = p[i];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function grad(h, x, y) { return ((h & 1) ? -x : x) + ((h & 2) ? -y : y); }
    return function (x, y) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      var u = fade(x), v = fade(y), a = p[X] + Y, b = p[X + 1] + Y;
      var l1 = grad(p[a], x, y) + u * (grad(p[b], x - 1, y) - grad(p[a], x, y));
      var l2 = grad(p[a + 1], x, y - 1) + u * (grad(p[b + 1], x - 1, y - 1) - grad(p[a + 1], x, y - 1));
      return l1 + v * (l2 - l1);
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // A flow-field composition: particles follow the noise field and leave thin trails.
  // opts: canvas, seed, density (px² per particle), steps, scale, alpha, animate
  function Composition(opts) {
    var canvas = opts.canvas, ctx = canvas.getContext('2d');
    var frame = null, visible = true, state = null;

    function setup() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return null;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var pal = palette(), rand = rng(opts.seed), field = noise2(rand);
      ctx.fillStyle = opts.bg === 'panel' ? pal.panel : pal.ground;
      ctx.fillRect(0, 0, w, h);
      var n = Math.min(opts.max || 1600, Math.round(w * h / opts.density));
      var swirl = 1.5 + rand() * 2.5, drift = rand() * Math.PI * 2, zone = 0.6 + rand() * 1.2;
      var parts = [];
      for (var i = 0; i < n; i++) parts.push(spawn());
      function spawn() {
        var x = rand() * w, y = rand() * h;
        // colour by a slow second octave so hues gather in regions
        var c = (field(x / w * zone + 9.1, y / h * zone + 3.7) + 1) / 2;
        return { x: x, y: y, c: Math.min(2, Math.floor(c * 3.2)), life: 40 + rand() * opts.steps };
      }
      return {
        w: w, h: h, pal: pal, parts: parts, step: 0, spawn: spawn,
        angle: function (x, y) { return field(x * opts.scale, y * opts.scale) * Math.PI * swirl + drift; }
      };
    }

    function advance(s, frames) {
      ctx.lineWidth = opts.width || 1;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = s.pal.light ? 'source-over' : 'lighter';
      for (var f = 0; f < frames && s.step < opts.steps; f++, s.step++) {
        for (var c = 0; c < 3; c++) {
          ctx.strokeStyle = s.pal.inks[c];
          ctx.globalAlpha = opts.alpha * (s.pal.light ? 1.4 : 1);
          ctx.beginPath();
          for (var i = 0; i < s.parts.length; i++) {
            var p = s.parts[i];
            if (p.c !== c) continue;
            var a = s.angle(p.x, p.y), nx = p.x + Math.cos(a) * 1.6, ny = p.y + Math.sin(a) * 1.6;
            ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
            p.x = nx; p.y = ny;
            if (--p.life < 0 || nx < -5 || ny < -5 || nx > s.w + 5 || ny > s.h + 5) s.parts[i] = s.spawn();
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop() {
      frame = null;
      if (!state || state.step >= opts.steps) return;
      if (!visible) return;
      advance(state, 2);
      frame = requestAnimationFrame(loop);
    }

    function draw() {
      if (frame) cancelAnimationFrame(frame), frame = null;
      state = setup();
      if (!state) return;
      if (opts.animate && !reduced) loop();
      else advance(state, opts.steps);
    }

    this.draw = draw;
    this.reseed = function (seed) { opts.seed = seed; draw(); };
    this.setVisible = function (v) { visible = v; if (v && !frame) loop(); };
  }

  var resizers = [];
  var resizeTimer = null, lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    // ignore height-only changes (mobile toolbars) so the art does not restart on scroll
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 250);
  });

  // Hero: a new composition each visit, drawn live, then it rests.
  var heroCanvas = document.querySelector('[data-art]');
  if (heroCanvas) {
    var seedLabel = document.querySelector('[data-art-seed]');
    var newSeed = function () { return 1 + Math.floor(Math.random() * 9999); };
    var hero = new Composition({
      canvas: heroCanvas, seed: newSeed(), density: 520, max: 2600,
      steps: 520, scale: 0.0016, alpha: 0.075, width: 1.1, animate: true
    });
    var label = function (s) { if (seedLabel) seedLabel.textContent = String(s).padStart(4, '0'); };
    var current = 0;
    var start = function (s) { current = s; label(s); hero.reseed(s); };
    start(newSeed());
    var again = document.querySelector('[data-art-new]');
    if (again) again.addEventListener('click', function () { start(newSeed()); });
    resizers.push(function () { hero.reseed(current); });
    themeListeners.push(function () { hero.reseed(current); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        hero.setVisible(entries[0].isIntersecting);
      }).observe(heroCanvas);
    }
  }

  // Projects: every card gets its own glyph, seeded by its title, so it never changes.
  var glyphs = [];
  document.querySelectorAll('.projects li').forEach(function (li) {
    var title = li.querySelector('h4');
    var c = document.createElement('canvas');
    c.className = 'glyph';
    c.setAttribute('aria-hidden', 'true');
    li.insertBefore(c, li.firstChild);
    glyphs.push(new Composition({
      canvas: c, seed: hash(title ? title.textContent.trim() : 'x'), bg: 'panel',
      density: 70, max: 900, steps: 150, scale: 0.006, alpha: 0.16, width: 1, animate: false
    }));
  });
  function drawGlyphs() { glyphs.forEach(function (g) { g.draw(); }); }
  if (glyphs.length) {
    drawGlyphs();
    resizers.push(drawGlyphs);
    themeListeners.push(drawGlyphs);
  }
})();
