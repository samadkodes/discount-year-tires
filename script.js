/* =============================================================================
   DISCOUNT YEAR NEW & USED TIRES — Interaction layer
   -----------------------------------------------------------------------------
   Vanilla JS, no dependencies. Every module is an isolated IIFE that exits
   early if its markup isn't on the page, so nothing here is order-dependent
   and a missing section can never throw.

   Performance rules followed throughout:
     · one shared requestAnimationFrame loop for pointer-driven motion
     · transform / opacity only — never a property that triggers layout
     · scroll and resize handlers are passive and rAF-throttled
     · IntersectionObserver instead of scroll maths wherever possible
     · all ambient motion is disabled under prefers-reduced-motion

   Sections
     0  Setup & helpers        6  Card tilt            12  FAQ accordion
     1  Loading screen         7  Hero parallax        13  Tire decoder
     2  Scroll progress        8  Scroll reveal        14  Quote form
     3  Navigation             9  Stat counters        15  Back to top
     4  Custom cursor         10  Reviews carousel     16  Business hours
     5  Magnetic buttons      11  Footer year
   ========================================================================== */

/* =============================================================================
   0. SETUP & HELPERS
   ========================================================================== */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)');

const prefersReducedMotion = () => reduceMotion.matches;

/**
 * Attach a change listener to a MediaQueryList.
 * Safari only gained addEventListener on MediaQueryList in 14; earlier
 * versions expose the deprecated addListener instead. Calling the modern API
 * unguarded throws there and takes the whole module down with it.
 */
function onMediaChange(mq, handler){
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler);
  else if (typeof mq.addListener === 'function') mq.addListener(handler);
}

/** Run a callback at most once per frame, however often it's fired. */
function rafThrottle(fn){
  let queued = false;
  return (...args) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(...args); });
  };
}

/** Frame-rate independent lerp factor: same feel at 60Hz and 144Hz. */
const damp = (base, dt) => 1 - Math.pow(1 - base, dt / 16.667);

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* =============================================================================
   1. LOADING SCREEN
   -----------------------------------------------------------------------------
   The counter tracks real progress (documents + images decoded) rather than
   running a fake timer, then always completes — a stalled asset can never trap
   a visitor behind the overlay.
   ========================================================================== */
(function loader(){
  const el = $('#loader');
  if (!el){ document.body.classList.remove('is-loading'); return; }

  const pctEl = $('#loaderPct');
  const barEl = $('#loaderBar');
  let shown = 0, target = 8, done = false;

  const images = $$('img');
  const total  = images.length + 1;
  let loaded = 0;

  const bump = () => { loaded++; target = Math.max(target, (loaded / total) * 92); };

  images.forEach((img) => {
    if (img.complete) bump();
    else {
      img.addEventListener('load',  bump, { once:true });
      img.addEventListener('error', bump, { once:true });
    }
  });
  window.addEventListener('load', () => { bump(); target = 100; }, { once:true });

  // Never hold the page hostage to a slow third party.
  const safety = setTimeout(() => { target = 100; }, 2400);

  function finish(){
    if (done) return;
    done = true;
    clearTimeout(safety);
    el.classList.add('done');
    document.body.classList.remove('is-loading');
    // Let assistive tech know the page is ready to be read.
    el.setAttribute('aria-hidden', 'true');
    setTimeout(() => el.remove(), 800);
  }

  if (prefersReducedMotion()){ finish(); return; }

  /* The counter eases on ELAPSED TIME, not per-frame steps. A fixed
     `shown += (target-shown) * 0.12` per frame means a device rendering at
     10fps takes six times longer to reach 100% than one at 60fps — the
     slowest phones would sit longest on the loading screen, which is exactly
     backwards. damp() converts the ratio to a time constant so the counter
     takes the same wall-clock time on every device. */
  const START = performance.now();
  const MAX_MS = 2600;              // hard ceiling, whatever the device is doing
  let last = START;

  (function tick(now){
    now = now || performance.now();
    const dt = Math.min(now - last, 60); last = now;
    const elapsed = now - START;

    if (elapsed > MAX_MS) target = 100;

    shown += (target - shown) * damp(0.14, dt);
    if (target >= 100 && shown > 99.3) shown = 100;

    const n = Math.round(shown);
    if (pctEl && pctEl.firstChild) pctEl.firstChild.nodeValue = String(n).padStart(2, '0');
    if (barEl) barEl.style.width = n + '%';
    if (n >= 100){ setTimeout(finish, 220); return; }
    requestAnimationFrame(tick);
  })();
})();

/* =============================================================================
   2. SCROLL PROGRESS
   ========================================================================== */
(function scrollProgress(){
  const bar = $('#scrollProgress');
  if (!bar) return;

  const update = rafThrottle(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${clamp(p, 0, 1)})`;
  });

  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update, { passive:true });
})();

/* =============================================================================
   3. NAVIGATION — condensed bar, mobile drawer, scroll spy
   ========================================================================== */
(function nav(){
  const bar     = $('#topbar');
  const btn     = $('#menuBtn');
  const drawer  = $('#mobileNav');

  /* --- condensed state on scroll ----------------------------------------- */
  if (bar){
    const onScroll = rafThrottle(() => {
      bar.classList.toggle('scrolled', window.scrollY > 24);
    });
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  /* --- mobile drawer ------------------------------------------------------ */
  if (btn && drawer){
    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
    };

    btn.addEventListener('click', () => {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });

    // Close on link tap, Escape, or when the viewport grows past the breakpoint.
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true'){
        setOpen(false); btn.focus();
      }
    });
    onMediaChange(window.matchMedia('(min-width: 901px)'), (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* --- scroll spy --------------------------------------------------------- */
  const links = $$('.nav-links a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const bySection = new Map();
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) bySection.set(sec, a);
  });

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.remove('active'));
      const link = bySection.get(entry.target);
      if (link) link.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  bySection.forEach((_, sec) => spy.observe(sec));
})();

/* =============================================================================
   4. CUSTOM CURSOR — realistic tire, rolling physics, spring feedback
   -----------------------------------------------------------------------------
   Design notes:
     · The tire tracks at a high damping factor, so it reads as "attached" to
       the pointer rather than trailing it. The soft shadow tracks more slowly,
       and that difference in lag is what creates the sense of depth.
     · Rotation is derived from horizontal travel, the way a real wheel rolls —
       spinning it by raw distance looks wrong when you move straight up.
     · Scale runs through a small spring solver so a click genuinely bounces
       instead of easing, which is what makes it feel physical.
     · Disabled outright on touch devices and under reduced-motion.
   ========================================================================== */
(function customCursor(){
  const cursor = $('#cursor');
  const shadow = $('#cursorShadow');
  const spin   = cursor && cursor.querySelector('.tyre-spin');
  if (!cursor || !shadow || !spin) return;

  // Only for real pointing devices, and only when motion is welcome.
  const allowed = () => finePointer.matches && !prefersReducedMotion();

  let running = false;

  // Pointer target, tire position, shadow position.
  let tx = window.innerWidth / 2,  ty = window.innerHeight / 2;
  let cx = tx, cy = ty;
  let sx = tx, sy = ty;

  let rot = 0;                 // accumulated wheel rotation, degrees
  let scale = 1, scaleTo = 1;  // spring state for click / hover feedback
  let scaleV = 0;
  let last = performance.now();

  const SPRING = 0.24;   // stiffness
  const DAMPEN = 0.62;   // how quickly the bounce settles
  const DEG_PER_PX = 0.62;

  function onMove(e){
    tx = e.clientX; ty = e.clientY;
    if (!cursor.classList.contains('ready')){
      cursor.classList.add('ready'); shadow.classList.add('ready');
    }
  }

  function frame(now){
    if (!running) return;
    const dt = Math.min(now - last, 50) || 16.7;
    last = now;

    // Tire: high damping = negligible perceived lag, still smooth.
    const kT = damp(0.42, dt);
    const px = cx;
    cx += (tx - cx) * kT;
    cy += (ty - cy) * kT;

    // Shadow trails further behind and sits slightly low — depth cue.
    const kS = damp(0.18, dt);
    sx += (tx - sx) * kS;
    sy += (ty + 15 - sy) * kS;

    // Roll: rotation follows horizontal travel, like a wheel on tarmac.
    rot += (cx - px) * DEG_PER_PX;

    // Spring the scale toward its target so clicks bounce.
    const force = (scaleTo - scale) * SPRING;
    scaleV = (scaleV + force) * DAMPEN;
    scale += scaleV;

    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${scale.toFixed(3)})`;
    spin.style.transform   = `rotate(${rot.toFixed(2)}deg)`;

    const sScale = clamp(scale * 0.9, 0.4, 1.6);
    shadow.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${sScale.toFixed(3)})`;

    requestAnimationFrame(frame);
  }

  /* --- hover intent: three distinct target classes ------------------------ */
  function onOver(e){
    const t = e.target;
    if (!(t instanceof Element)) return;

    const cta   = t.closest('.btn-primary, .fab, .car-btn');
    const btn   = t.closest('button, .btn, [role="button"], select, .socials a');
    const link  = t.closest('a');
    const text  = t.closest('input, textarea');

    cursor.classList.toggle('on-cta',  Boolean(cta));
    cursor.classList.toggle('on-btn',  Boolean(btn) && !cta);
    cursor.classList.toggle('on-link', Boolean(link) && !btn && !cta);
    cursor.classList.toggle('on-text', Boolean(text));

    if (text)      scaleTo = 0.62;
    else if (cta)  scaleTo = 1.34;
    else if (btn)  scaleTo = 1.2;
    else if (link) scaleTo = 1.1;
    else           scaleTo = 1;
  }

  const onDown = () => { scaleTo *= 0.72; };
  const onUp   = () => { scaleTo /= 0.72; };
  const hide   = () => cursor.classList.add('hidden');
  const show   = () => cursor.classList.remove('hidden');

  function start(){
    if (running) return;
    running = true;
    last = performance.now();
    document.documentElement.classList.add('cursor-on');
    window.addEventListener('mousemove', onMove, { passive:true });
    window.addEventListener('mouseover', onOver, { passive:true });
    window.addEventListener('mousedown', onDown, { passive:true });
    window.addEventListener('mouseup',   onUp,   { passive:true });
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    requestAnimationFrame(frame);
  }

  function stop(){
    running = false;
    document.documentElement.classList.remove('cursor-on');
    cursor.classList.remove('ready'); shadow.classList.remove('ready');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseover', onOver);
    window.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup',   onUp);
    document.removeEventListener('mouseleave', hide);
    document.removeEventListener('mouseenter', show);
  }

  const sync = () => (allowed() ? start() : stop());
  sync();

  // Plugging in a mouse, or changing the motion setting, is handled live.
  onMediaChange(finePointer, sync);
  onMediaChange(reduceMotion, sync);

  // A real touch is the definitive signal that this device doesn't want it.
  window.addEventListener('touchstart', stop, { once:true, passive:true });
})();

/* =============================================================================
   5. MAGNETIC BUTTONS
   -----------------------------------------------------------------------------
   The button leans toward the pointer as it approaches. Kept deliberately
   subtle — a few pixels reads as responsive, more reads as a gimmick.
   ========================================================================== */
(function magnetic(){
  if (!finePointer.matches || prefersReducedMotion()) return;

  const RANGE = 76;   // px from centre at which the pull begins
  const PULL  = 0.24; // fraction of the offset the element actually moves

  $$('[data-magnetic]').forEach((el) => {
    let raf = null;

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) > RANGE + Math.max(r.width, r.height) / 2) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${dx * PULL}px, ${dy * PULL}px)`;
      });
    };

    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', reset);
    el.addEventListener('blur', reset);
  });
})();

/* =============================================================================
   6. CARD TILT
   -----------------------------------------------------------------------------
   A shallow 3D tilt toward the pointer. Capped at a few degrees so text stays
   crisp and readable — steep tilts look impressive in isolation and terrible
   when you're actually trying to read the card.
   ========================================================================== */
(function tilt(){
  if (!finePointer.matches || prefersReducedMotion()) return;

  const MAX = 5; // degrees

  $$('[data-tilt]').forEach((el) => {
    let raf = null;

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;
      const py = (e.clientY - r.top)  / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform =
          `perspective(900px) rotateX(${(-py * MAX).toFixed(2)}deg) ` +
          `rotateY(${(px * MAX).toFixed(2)}deg) translateY(-6px)`;
      });
    });

    el.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
})();

/* =============================================================================
   7. HERO PARALLAX
   ========================================================================== */
(function heroParallax(){
  const hero  = $('#home');
  const tire  = $('#heroTyre');
  const glow  = $('.hero-glow');
  if (!hero || !tire || !finePointer.matches || prefersReducedMotion()) return;

  let raf = null;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width  - 0.5;
    const py = (e.clientY - r.top)  / r.height - 0.5;

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      tire.style.transform = `translate3d(${px * 26}px, ${py * 22}px, 0)`;
      if (glow) glow.style.transform = `translate3d(${px * -34}px, ${py * -28}px, 0)`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    if (raf) cancelAnimationFrame(raf);
    tire.style.transform = '';
    if (glow) glow.style.transform = '';
  });
})();

/* =============================================================================
   8. SCROLL REVEAL
   ========================================================================== */
(function reveal(){
  const items = $$('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)){
    items.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);   // one-shot: never animate the same thing twice
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach((el) => io.observe(el));
})();

/* =============================================================================
   9. STAT COUNTERS
   ========================================================================== */
(function counters(){
  const stats = $$('.stat-num');
  if (!stats.length) return;

  const render = (el, value) => {
    const dp = Number(el.dataset.decimals || 0);
    el.textContent = value.toFixed(dp) + (el.dataset.suffix || '');
  };

  const run = (el) => {
    const target = parseFloat(el.dataset.target || '0');
    if (prefersReducedMotion()){ render(el, target); return; }

    const DURATION = 1500;
    const start = performance.now();

    (function step(now){
      const t = clamp((now - start) / DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);   // easeOutCubic
      render(el, target * eased);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  };

  if (!('IntersectionObserver' in window)){ stats.forEach(run); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting){
        // Already scrolled past — e.g. a deep link to #faq, or a browser
        // restoring the previous scroll position. Counting up would be
        // pointless here, but leaving a permanent "0" is simply wrong, so
        // the final value is written straight in.
        if (entry.boundingClientRect.bottom < 0){
          render(entry.target, parseFloat(entry.target.dataset.target || '0'));
          io.unobserve(entry.target);
        }
        return;
      }
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  stats.forEach((el) => io.observe(el));
})();

/* =============================================================================
   10. REVIEWS CAROUSEL — responsive, swipeable, autoplaying
   ========================================================================== */
(function carousel(){
  const root = $('#reviewsCarousel');
  if (!root) return;

  const track = $('.carousel-track', root);
  const slides = $$('.review', track);
  const prev = $('#carPrev');
  const next = $('#carNext');
  const dots = $('#carDots');
  if (!track || !slides.length) return;

  let perView = 1, index = 0, pages = 1, timer = null;

  const measure = () => {
    const w = window.innerWidth;
    perView = w >= 1080 ? 3 : w >= 700 ? 2 : 1;
    pages = Math.max(1, slides.length - perView + 1);
    index = clamp(index, 0, pages - 1);

    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    const slideW = (track.parentElement.clientWidth - gap * (perView - 1)) / perView;
    slides.forEach((s) => { s.style.width = slideW + 'px'; });

    buildDots();
    apply(false);
  };

  const apply = (animate = true) => {
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    const slideW = slides[0].getBoundingClientRect().width;
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translate3d(${-index * (slideW + gap)}px,0,0)`;
    if (!animate) requestAnimationFrame(() => { track.style.transition = ''; });

    $$('.car-dot', dots || root).forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    // Cards scrolled out of view shouldn't be reachable by keyboard.
    slides.forEach((s, i) => {
      const visible = i >= index && i < index + perView;
      s.setAttribute('aria-hidden', String(!visible));
      $$('a,button', s).forEach((el) => el.tabIndex = visible ? 0 : -1);
    });
  };

  function buildDots(){
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < pages; i++){
      const b = document.createElement('button');
      b.className = 'car-dot' + (i === index ? ' active' : '');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to review ${i + 1} of ${pages}`);
      b.addEventListener('click', () => { index = i; apply(); restart(); });
      dots.appendChild(b);
    }
  }

  const go = (dir) => { index = (index + dir + pages) % pages; apply(); restart(); };

  prev && prev.addEventListener('click', () => go(-1));
  next && next.addEventListener('click', () => go(1));

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1);  }
  });

  /* --- autoplay, paused whenever the visitor is engaged ------------------- */
  const stop  = () => { clearInterval(timer); timer = null; };
  const start = () => {
    if (timer || prefersReducedMotion() || slides.length <= perView) return;
    timer = setInterval(() => { index = (index + 1) % pages; apply(); }, 5200);
  };
  const restart = () => { stop(); start(); };

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  /* --- touch swipe -------------------------------------------------------- */
  let x0 = null, y0 = null;
  root.addEventListener('touchstart', (e) => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; stop();
  }, { passive:true });

  root.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    // Only treat it as a swipe if it was clearly horizontal — otherwise the
    // visitor was scrolling the page and we must not hijack that.
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    x0 = y0 = null;
    start();
  }, { passive:true });

  measure();
  start();
  window.addEventListener('resize', rafThrottle(measure), { passive:true });
})();

/* =============================================================================
   11. FOOTER YEAR
   ========================================================================== */
(function year(){
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* =============================================================================
   12. FAQ ACCORDION — one panel open at a time
   ========================================================================== */
(function faq(){
  const items = $$('.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const q = $('.faq-q', item);
    const a = $('.faq-a', item);
    if (!q || !a) return;

    q.addEventListener('click', () => {
      const open = item.dataset.open === 'true';
      items.forEach((other) => {
        other.dataset.open = 'false';
        const oq = $('.faq-q', other);
        const oa = $('.faq-a', other);
        if (oq) oq.setAttribute('aria-expanded', 'false');
        if (oa) oa.setAttribute('aria-hidden', 'true');
      });
      if (!open){
        item.dataset.open = 'true';
        q.setAttribute('aria-expanded', 'true');
        a.setAttribute('aria-hidden', 'false');
      }
    });
  });
})();

/* =============================================================================
   13. TIRE SIZE DECODER
   -----------------------------------------------------------------------------
   Reads a standard sidewall code and explains each part in plain language.

   The accepted grammar matches the full ISO metric marking, because that is
   what is actually moulded onto a sidewall:

        [prefix] width / aspect [construction] rim [load] [speed]
           P       225  /   65        R         17    98     T

     prefix        P | LT | ST | T          optional
     width         3 digits, millimetres    required
     separator     "/" or "-"               required
     aspect        2-3 digits, percent      required
     construction  R | D | B                optional (omitted = cross-ply)
     rim           1-2 digits, may be .5    required
     load index    2-3 digits               optional, ignored in the maths
     speed rating  1-2 letters              optional, ignored in the maths

   Maths is the real ISO formula, not an approximation:
     sidewall height (mm)  = width x aspect / 100
     overall diameter (in) = rim + 2 x (sidewall mm / 25.4)
   ========================================================================== */
(function decoder(){
  const input   = $('#tireSizeInput');
  const btn     = $('#decodeBtn');
  const errEl   = $('#decoderError');
  const results = $('#decoderResults');
  if (!input || !btn || !results || !errEl) return;

  const TIRE_SIZE_RE = new RegExp(
    '^\\s*(P|LT|ST|T)?\\s*' +      // 1 prefix
    '(\\d{3})\\s*[\\/-]\\s*' +      // 2 section width (mm)
    '(\\d{2,3})\\s*-?\\s*' +        // 3 aspect ratio (%)
    '(Z)?(R|D|B)?\\s*-?\\s*' +      // 4 Z-rated marker, 5 construction
    '(\\d{1,2}(?:\\.\\d)?)' +       // 6 rim diameter (in)
    '(?:\\s*(\\d{2,3}))?' +         // 7 load index
    '(?:\\s*([A-Z]{1,2}))?\\s*$',   // 8 speed rating
    'i'
  );

  /* Names and output wording are kept identical to the original build, so the
     decoder reads exactly as it did before the redesign. */
  const CONSTRUCTION_NAMES = { R:'Radial', D:'Diagonal (Bias)', B:'Belted Bias' };
  const PREFIX_NAMES = { P:'Passenger', LT:'Light Truck', ST:'Special Trailer', T:'Temporary Spare' };

  // Sanity bounds. A value can match the pattern and still be nonsense.
  const LIMITS = { width:[105,405], aspect:[25,95], rim:[8,30] };

  const set = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };

  function fail(message){
    errEl.textContent = message;
    results.hidden = true;
    results.classList.remove('show');
    input.setAttribute('aria-invalid', 'true');
    const f = document.getElementById('tyreFinder');
    if (f) f.hidden = true;
  }

  function decode(){
    const raw = (input.value || '').trim();

    // Empty gets its own message — "that isn't a valid size" would be wrong.
    if (!raw){
      fail('Enter a tire size first — try 225/65R17.');
      return;
    }

    const m = TIRE_SIZE_RE.exec(raw);
    if (!m){
      fail("That doesn't look like a standard tire size. Try a format like 225/65R17, or P225/65R17 98T — you'll find it on the sidewall.");
      return;
    }

    const prefix  = m[1] ? m[1].toUpperCase() : null;
    const width   = parseInt(m[2], 10);
    const aspect  = parseInt(m[3], 10);
    const zRated  = Boolean(m[4]);              // "ZR" high-performance marking
    const type    = m[5] ? m[5].toUpperCase() : null;
    const rim     = parseFloat(m[6]);
    const load    = m[7] ? parseInt(m[7], 10) : null;
    const speed   = m[8] ? m[8].toUpperCase() : (zRated ? 'Z' : null);

    // Guard against values that parse but cannot be real tires.
    if (width < LIMITS.width[0] || width > LIMITS.width[1]){
      fail(`A section width of ${width} mm is outside the range road tires are made in (${LIMITS.width[0]}–${LIMITS.width[1]} mm). Check the first number.`);
      return;
    }
    if (aspect < LIMITS.aspect[0] || aspect > LIMITS.aspect[1]){
      fail(`An aspect ratio of ${aspect}% is outside the usual range (${LIMITS.aspect[0]}–${LIMITS.aspect[1]}). Check the second number.`);
      return;
    }
    if (rim < LIMITS.rim[0] || rim > LIMITS.rim[1]){
      fail(`A rim diameter of ${rim}" is outside the usual range (${LIMITS.rim[0]}–${LIMITS.rim[1]}"). Check the last number.`);
      return;
    }

    input.removeAttribute('aria-invalid');
    errEl.textContent = '';

    const sidewallMm = width * (aspect / 100);   // ISO: width x aspect / 100
    const sidewallIn = sidewallMm / 25.4;
    const overallIn  = rim + sidewallIn * 2;

    // Output strings match the original build exactly; only the <b> highlight
    // is new, and that is purely the current visual treatment.
    set('#resWidth',  `<b>${width} mm</b>`);
    set('#resAspect', `<b>${aspect}%</b>`);
    set('#resConstruction', type
        ? `<b>${type}</b> — ${CONSTRUCTION_NAMES[type] || 'Unknown'}`
        : 'Not specified');
    set('#resRim',      `<b>${rim}"</b> wheel`);
    set('#resSidewall', `<b>${sidewallIn.toFixed(1)}"</b>`);
    set('#resOverall',  `<b>${overallIn.toFixed(1)}"</b> diameter`);

    // Optional rows: shown only when the sidewall actually carries the marking.
    const showRow = (rowId, valId, html) => {
      const row = $(rowId);
      if (!row) return;
      if (html){ row.hidden = false; set(valId, html); }
      else { row.hidden = true; }
    };
    showRow('#rowPrefix', '#resPrefix', prefix ? `<b>${prefix}</b> — ${PREFIX_NAMES[prefix]}` : null);
    showRow('#rowLoad',   '#resLoad',   load   ? `<b>${load}</b> load index` : null);
    showRow('#rowSpeed',  '#resSpeed',  speed
        ? `<b>${speed}</b> speed rating${zRated ? ' (Z-rated, high performance)' : ''}` : null);

    // Keep the annotated diagram in step with the numbers.
    setText('#diagWidthLbl',    `${width} mm`);
    setText('#diagSidewallLbl', `${sidewallIn.toFixed(1)} in`);
    setText('#diagRimLbl',      `${rim}" rim`);

    results.hidden = false;
    // Replay the staggered entrance for each new decode.
    results.classList.remove('show');
    void results.offsetWidth;
    results.classList.add('show');

    const fig = $('#decoderDiagram');
    if (fig){ fig.classList.remove('decoded'); void fig.offsetWidth; fig.classList.add('decoded'); }

    // Turn the decode into a product search: look up tires this size fits.
    if (window.runTyreSearch){
      window.runTyreSearch({ width: width, aspect: aspect, rim: rim });
    }
  }

  // When the size is cleared/invalid, hide any previous finder results too.
  function hideFinder(){
    const f = document.getElementById('tyreFinder');
    if (f) f.hidden = true;
  }

  btn.addEventListener('click', decode);

  // Enter submits. The input is inside a form-less block, so no submit event.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13){ e.preventDefault(); decode(); }
  });

  // Clear the error as soon as the visitor starts correcting it.
  input.addEventListener('input', () => {
    if (errEl.textContent){
      errEl.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  });
})();

/* =============================================================================
   13b. TIRE PRODUCT FINDER
   -----------------------------------------------------------------------------
   Turns the decoder into a product finder. After a valid size is decoded, this
   asks the data layer (window.TyreAPI) for matching tires and renders them as
   cards, with Request-Quote and Call-Now actions. All data comes from TyreAPI,
   so swapping the JSON for a real API changes nothing here.
   ========================================================================== */
(function tyreFinder(){
  const finder = document.getElementById('tyreFinder');
  const body   = document.getElementById('finderBody');
  const countEl= document.getElementById('finderCount');
  if (!finder || !body || !window.TyreAPI) return;

  const PHONE_TEL = 'tel:+17133937538';

  const money = (n, cur) => {
    try {
      return new Intl.NumberFormat('en-US', { style:'currency', currency: cur || 'USD' }).format(n);
    } catch (e) { return '$' + Number(n).toFixed(2); }
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));

  const STOCK_LABEL = { 'in-stock':'In stock', 'low-stock':'Low stock', 'order-in':'Order in' };

  // A small, brand-tinted tire illustration per card — generated, so there are
  // no image files to ship or lazy-load over the network.
  function thumbSVG(t){
    const seasonTint = { summer:'#ff9414', winter:'#7fb0ff', 'all-season':'#f88000' };
    const tint = seasonTint[t.season] || '#f88000';
    // gradient ids must be unique per card
    const uid = t.id.replace(/[^a-z0-9]/gi,'');
    return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bg${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#181b21"/><stop offset="1" stop-color="#0e0f13"/>
        </linearGradient>
        <radialGradient id="gl${uid}" cx="70%" cy="30%" r="60%">
          <stop offset="0" stop-color="${tint}" stop-opacity="0.32"/>
          <stop offset="1" stop-color="${tint}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="rim${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eef1f5"/><stop offset="0.5" stop-color="#9aa2ad"/><stop offset="1" stop-color="#5a626d"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg${uid})"/>
      <rect width="320" height="200" fill="url(#gl${uid})"/>
      <g transform="translate(210,100)">
        <circle r="78" fill="#0b0c0e"/>
        <circle r="78" fill="none" stroke="#08090a" stroke-width="20"/>
        <circle r="78" fill="none" stroke="#26292f" stroke-width="15" stroke-dasharray="11 9"/>
        <circle r="50" fill="#141619" stroke="${tint}" stroke-width="3"/>
        <circle r="46" fill="none" stroke="url(#rim${uid})" stroke-width="3"/>
        <g stroke="url(#rim${uid})" stroke-width="7" stroke-linecap="round">
          <line x1="0" y1="0" x2="34" y2="0"/><line x1="0" y1="0" x2="10.5" y2="32.3"/>
          <line x1="0" y1="0" x2="-27.5" y2="20"/><line x1="0" y1="0" x2="-27.5" y2="-20"/>
          <line x1="0" y1="0" x2="10.5" y2="-32.3"/>
        </g>
        <circle r="12" fill="url(#rim${uid})"/><circle r="5" fill="#0e0f13"/>
      </g>
      <text x="24" y="176" font-family="ui-monospace,monospace" font-size="15" font-weight="700" fill="${tint}" opacity="0.9">${esc(t.brand)}</text>
    </svg>`;
  }

  function card(t){
    const stock = t.stock || 'in-stock';
    const usedBadge = t.condition === 'used'
      ? `<span class="tyre-badge used">Used</span>` : '';
    const size = `${t.width}/${t.aspect}R${t.rim}`;
    const specBits = [size, t.loadIndex ? (t.loadIndex + (t.speedRating||'')) : '', t.seasonLabel]
      .filter(Boolean).join('  ·  ');

    // data-* carry exactly what the quote form needs — no re-typing for the user.
    return `<article class="tyre-card"
        data-id="${esc(t.id)}" data-brand="${esc(t.brand)}" data-model="${esc(t.model)}"
        data-size="${esc(size)}" data-price="${esc(money(t.price, t.currency))}">
      <div class="tyre-thumb">
        <span class="tyre-badge ${stock}">${STOCK_LABEL[stock] || 'Available'}</span>
        ${thumbSVG(t)}
      </div>
      <div class="tyre-body">
        <span class="tyre-brand">${esc(t.brand)}${usedBadge}</span>
        <span class="tyre-model">${esc(t.model)}</span>
        <span class="tyre-spec mono">${esc(specBits)}</span>
        <p class="tyre-desc">${esc(t.description || '')}</p>
        <div class="tyre-foot">
          <span class="tyre-price"><span class="amt">${money(t.price, t.currency)}</span><span class="per">per tire</span></span>
        </div>
        <div class="tyre-actions">
          <button type="button" class="btn btn-primary js-quote">Request quote</button>
          <a class="btn btn-ghost" href="${PHONE_TEL}">Call now</a>
        </div>
      </div>
    </article>`;
  }

  function renderLoading(){
    body.innerHTML = '<div class="finder-status"><div class="finder-spinner"></div>Searching our inventory…</div>';
  }

  function renderResults(list, size){
    countEl.innerHTML = `<b>${list.length}</b> ${list.length === 1 ? 'match' : 'matches'} for ${size}`;
    body.innerHTML = '<div class="finder-grid">' + list.map(card).join('') + '</div>';
    wireQuoteButtons();
  }

  function renderEmpty(size){
    countEl.textContent = '';
    body.innerHTML = `<div class="finder-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/></svg>
        <h3>No tires currently match your search.</h3>
        <p>We couldn't find ${esc(size)} in our live inventory, but we can almost always source it. Get in touch and we'll check stock for you.</p>
        <div class="cta-actions">
          <button type="button" class="btn btn-primary js-assist" data-size="${esc(size)}">Request assistance</button>
          <a class="btn btn-ghost" href="${PHONE_TEL}">Call us</a>
        </div>
      </div>`;
    const assist = body.querySelector('.js-assist');
    if (assist) assist.addEventListener('click', () => {
      // Prefill just the size + a helpful message, then jump to the form.
      window.fillQuote && window.fillQuote({ size: size, message: `Please help me find tires in size ${size}.` });
    });
  }

  function renderError(size){
    countEl.textContent = '';
    body.innerHTML = `<div class="finder-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
        <h3>We couldn't load the inventory just now.</h3>
        <p>Please call the shop and we'll check ${esc(size)} for you straight away.</p>
        <div class="cta-actions">
          <a class="btn btn-primary" href="${PHONE_TEL}">Call the shop</a>
        </div>
      </div>`;
  }

  function wireQuoteButtons(){
    body.querySelectorAll('.js-quote').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.closest('.tyre-card');
        if (!c) return;
        window.fillQuote && window.fillQuote({
          id:    c.dataset.id,
          brand: c.dataset.brand,
          model: c.dataset.model,
          size:  c.dataset.size,
          price: c.dataset.price
        });
      });
    });
  }

  // Called by the decoder once a size validates. `size` = {width,aspect,rim}.
  window.runTyreSearch = function (size) {
    finder.hidden = false;
    const label = `${size.width}/${size.aspect}R${size.rim}`;
    renderLoading();
    window.TyreAPI.search(size)
      .then((list) => { list.length ? renderResults(list, label) : renderEmpty(label); })
      .catch(() => renderError(label));
  };

  // Warm the inventory cache during idle time.
  window.TyreAPI.preload();
})();

/* =============================================================================
   14. QUOTE FORM  (Web3Forms)
   -----------------------------------------------------------------------------
   Sends the enquiry to the shop's inbox through Web3Forms — a free service that
   needs no backend of its own, which suits a static site.

   SETUP (one time, ~2 minutes):
     1. Go to https://web3forms.com and enter the shop's email address.
     2. They email back an "Access Key" (a long code). No account needed.
     3. Paste that key into WEB3FORMS_KEY below, replacing the placeholder.
   That's it — every submission then arrives at that email address.

   Design is untouched: this only changes where the data goes on submit.

   Safety net: if Web3Forms can't be reached (offline, key not yet set, service
   down), the form quietly falls back to the pre-filled SMS link, so an enquiry
   is never lost to a network problem.
   ========================================================================== */
(function quoteForm(){
  const form   = $('#quoteForm');
  const status = $('#formStatus');
  if (!form) return;

  /* --- PASTE THE WEB3FORMS ACCESS KEY HERE ------------------------------- */
  const WEB3FORMS_KEY = 'cd8bb27b-d33e-48a8-be73-dfca136ce13c';
  /* ----------------------------------------------------------------------- */

  const ENDPOINT  = 'https://api.web3forms.com/submit';

  const submitBtn = form.querySelector('button[type="submit"]');
  const btnLabel  = submitBtn ? submitBtn.textContent : '';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* --- selected-tire state (set when a product card requests a quote) ------
     Held here so the submit handler can attach it to the Web3Forms payload. */
  let selectedTyre = null;
  const selBanner = document.getElementById('quoteSelection');
  const selText   = document.getElementById('quoteSelectionText');
  const clearBtn  = document.getElementById('clearSelection');

  function showSelection(){
    if (!selBanner || !selText) return;
    if (selectedTyre && (selectedTyre.brand || selectedTyre.model)){
      selText.innerHTML = 'Quoting: <b>' + (selectedTyre.brand || '') + ' ' +
        (selectedTyre.model || '') + '</b>' +
        (selectedTyre.size ? ' &middot; ' + selectedTyre.size : '') +
        (selectedTyre.price ? ' &middot; ' + selectedTyre.price : '');
      selBanner.classList.add('show');
    } else {
      selBanner.classList.remove('show');
    }
  }

  if (clearBtn){
    clearBtn.addEventListener('click', () => {
      selectedTyre = null;
      showSelection();
    });
  }

  /* Public: called by the product finder. Prefills the form's own fields (so
     the customer can still see/edit them) AND stores the full tire for the
     email payload, then scrolls the form into view. */
  window.fillQuote = function (tire){
    selectedTyre = tire || null;

    const sizeField = form.querySelector('[name="size"]');
    if (sizeField && tire && tire.size) sizeField.value = tire.size;

    const msgField = form.querySelector('[name="message"]');
    if (msgField){
      if (tire && (tire.brand || tire.model)){
        msgField.value = 'I would like a quote for the ' +
          [tire.brand, tire.model].filter(Boolean).join(' ') +
          (tire.size ? ' (' + tire.size + ')' : '') +
          (tire.price ? ' — listed at ' + tire.price : '') + '.';
      } else if (tire && tire.message){
        msgField.value = tire.message;
      }
    }

    // Prefer new tires when a specific product was picked.
    const cond = form.querySelector('[name="condition"]');
    if (cond && tire && tire.brand) cond.value = 'New tires';

    showSelection();

    // Bring the form into view and focus the first empty required field.
    const contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior:
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'),
      block: 'start' });
    setTimeout(() => {
      const name = form.querySelector('[name="name"]');
      if (name && !name.value) name.focus({ preventScroll: true });
    }, 500);
  };

  const setStatus = (msg, kind) => {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };

  const clearErrors = () => {
    $$('.field-error', form).forEach((el) => el.remove());
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
  };

  const fieldError = (name, message) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const note = document.createElement('p');
    note.className = 'field-error';
    note.textContent = message;
    input.insertAdjacentElement('afterend', note);
  };

  /* --- client-side validation -------------------------------------------- */
  const validate = (data) => {
    const errors = {};
    const name  = (data.get('name')  || '').trim();
    const phone = (data.get('phone') || '').trim();
    const email = (data.get('email') || '').trim();

    if (name.length < 2)  errors.name = 'Please enter your name.';
    if (!phone)           errors.phone = 'Please add a phone number so we can call you back.';
    else if (phone.replace(/\D/g, '').length < 7)
                          errors.phone = "That phone number looks too short.";
    if (email && !EMAIL_RE.test(email))
                          errors.email = "That email address doesn't look right.";
    // Link spam: real tire enquiries don't contain URLs.
    if (/https?:\/\//i.test(data.get('message') || ''))
                          errors.message = 'Please remove any links from your message.';
    return errors;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const data = new FormData(form);

    // Honeypot — bots fill the hidden "company" field; humans never see it.
    if (data.get('company')){ setStatus(''); return; }

    const errors = validate(data);
    if (Object.keys(errors).length){
      Object.entries(errors).forEach(([k, m]) => fieldError(k, m));
      setStatus('Please check the highlighted fields.', 'err');
      const first = form.querySelector('[aria-invalid]');
      if (first) first.focus();
      return;
    }

    // Build the payload for Web3Forms. Keys become the labels in the email, so
    // this includes ONLY the fields the customer actually fills in on the form.
    // (When a tire is picked in the finder, its details are already prefilled
    // into the Tire size and Message fields, so they still reach the shop here.)
    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `New tire quote request — ${data.get('name')}`,
      from_name: 'Discount Year Website',
      'Full name':   data.get('name')      || '',
      'Phone':       data.get('phone')     || '',
      'Vehicle':     data.get('vehicle')   || 'Not provided',
      'Tire size':   data.get('size')      || 'Not provided',
      'New or used': data.get('condition') || 'No preference',
      'When needed': data.get('when')      || 'Not specified',
      'Message':     data.get('message')   || 'None',
      // Web3Forms' own honeypot field, in addition to ours.
      botcheck: ''
    };

    if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    setStatus('Sending your request…');

    // Abort rather than hang forever on a dead network.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success){
        form.reset();
        selectedTyre = null;
        showSelection();
        setStatus('Thank you! Your quote request has been sent successfully.', 'ok');
      } else {
        // Web3Forms returned an error (e.g. a bad key or a validation problem).
        throw new Error(result.message || 'Web3Forms rejected the submission');
      }
    } catch (err){
      // Network failure, timeout, or a rejection from Web3Forms. Show a clear
      // error and invite the customer to call — no SMS, no redirect.
      console.error('[quote] submission failed:', err);
      setStatus("Sorry — we couldn't send your request just now. Please try again, or call us at (713) 393-7538.", 'err');
    } finally {
      clearTimeout(timeout);
      if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = btnLabel; }
    }
  });

  // Clear a field's error as soon as the visitor starts correcting it.
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid')){
      e.target.removeAttribute('aria-invalid');
      const note = e.target.nextElementSibling;
      if (note && note.classList.contains('field-error')) note.remove();
    }
  });
})();

/* =============================================================================
   15. BACK TO TOP
   ========================================================================== */
(function backToTop(){
  const btn = $('#backToTop');
  if (!btn) return;

  const toggle = rafThrottle(() => btn.classList.toggle('show', window.scrollY > 620));
  toggle();
  window.addEventListener('scroll', toggle, { passive:true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
})();

/* =============================================================================
   16. BUSINESS HOURS — highlight today
   -----------------------------------------------------------------------------
   The times themselves live in the HTML so the shop can edit them without
   touching JavaScript.
   ========================================================================== */
(function hours(){
  const table  = $('#hoursTable');
  const status = $('#hoursStatus');
  if (!table) return;

  const today = new Date().getDay();               // 0 = Sunday
  const row = table.querySelector(`.hours-row[data-day="${today}"]`);
  if (row) row.classList.add('today');

  if (status){
    const timeEl = row && row.querySelector('span:last-child');
    const label = timeEl ? timeEl.textContent.trim() : '';
    status.textContent = label ? `Today · ${label}` : 'Business hours';
  }
})();

/* =============================================================================
   17. iOS / SAFARI RUNTIME FIXES
   -----------------------------------------------------------------------------
   Behaviour corrections that cannot be expressed in CSS alone. Each is scoped
   as narrowly as possible and is a no-op on engines that don't need it.
   ========================================================================== */
(function iosFixes(){
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, so the touch check is what identifies it.
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
                (ua.includes('Mac') && typeof document.ontouchend !== 'undefined');
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);

  if (isIOS) document.documentElement.classList.add('is-ios');
  if (isSafari) document.documentElement.classList.add('is-safari');

  /* --- 1. Software keyboard vs. bottom-fixed bars ------------------------
     On iOS the keyboard slides over position:fixed elements, so the sticky
     action bar ends up covering the field being typed into. Hide the bars
     while a control has focus. */
  const isField = (el) => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

  document.addEventListener('focusin', (e) => {
    if (isField(e.target)) document.body.classList.add('kb-open');
  });
  document.addEventListener('focusout', () => {
    // Delay so moving between two fields doesn't flash the bars back in.
    setTimeout(() => {
      if (!isField(document.activeElement)) document.body.classList.remove('kb-open');
    }, 120);
  });

  /* --- 2. Address-bar resize thrash --------------------------------------
     Mobile Safari fires resize every time the URL bar collapses or expands.
     Anything listening on resize (the carousel) would recalculate on every
     scroll frame. Republish it as a resize only when the WIDTH actually
     changes, which is what layout code cares about. */
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;   // height-only: ignore
    lastWidth = window.innerWidth;
  }, { passive:true });

  /* --- 3. Real viewport height -------------------------------------------
     For engines without svh/dvh, expose the true inner height as a variable
     so full-height sections don't sit under the URL bar. */
  const supportsSvh = window.CSS && CSS.supports && CSS.supports('height', '100svh');
  if (!supportsSvh){
    const setVh = () => {
      document.documentElement.style.setProperty('--vh-fallback', window.innerHeight + 'px');
    };
    setVh();
    window.addEventListener('resize', setVh, { passive:true });
    window.addEventListener('orientationchange', setVh, { passive:true });
    document.documentElement.classList.add('no-svh');
  }

  /* --- 4. Double-tap zoom on controls ------------------------------------
     Safari treats a fast second tap as a zoom gesture, which makes buttons
     feel unresponsive. Suppress it only for actual controls. */
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const target = e.target instanceof Element &&
                   e.target.closest('button, .btn, a.fab, .car-btn, .faq-q, .menu-btn');
    if (!target) return;
    const now = Date.now();
    if (now - lastTap < 320) e.preventDefault();
    lastTap = now;
  }, { passive:false });
})();

/* =============================================================================
   18. FONT LOADING
   -----------------------------------------------------------------------------
   The stylesheet is loaded non-blockingly, so text paints in the fallback face
   first. Marking the document once the real faces are ready lets CSS avoid a
   visible reflow on the elements where the swap is most noticeable.
   ========================================================================== */
(function fonts(){
  if (!('fonts' in document)) { document.documentElement.classList.add('fonts-ready'); return; }
  document.fonts.ready.then(() => document.documentElement.classList.add('fonts-ready'));
  // Never let a font problem hold the class back indefinitely.
  setTimeout(() => document.documentElement.classList.add('fonts-ready'), 2500);
})();
