/* =======================================================================
   danmi-anim.js — BEAUTY CONTENT LAB section entrance & ambient animations
   IntersectionObserver (root = about scroller) + counter + SVG draw
======================================================================= */
(() => {
  'use strict';

  const about = document.getElementById('about');
  if (!about) return;

  let observer = null;
  let initialized = false;

  /* ── SVG path draw ─────────────────────────────────────── */
  function prepareSVGPaths() {
    const svg = about.querySelector('.proc-connectors');
    if (!svg) return;
    /* paths hidden via dashoffset */
    svg.querySelectorAll('path').forEach(path => {
      const len = Math.ceil(path.getTotalLength ? path.getTotalLength() : 500);
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.style.transition = 'none';
    });
    /* circles initially hidden */
    svg.querySelectorAll('circle').forEach(c => {
      c.style.opacity = '0';
      c.style.transition = 'none';
    });
  }

  function playSVGPaths() {
    const svg = about.querySelector('.proc-connectors');
    if (!svg) return;
    /* card delays match proc-card--1~4 --bcl-delay values */
    const cardDelays  = [0.1, 0.2, 0.3, 0.4];
    const pathDur     = 1.1;

    requestAnimationFrame(() => {
      const circles = svg.querySelectorAll('circle');
      const paths   = svg.querySelectorAll('path');

      /* center origin circle: appears first */
      if (circles[0]) {
        circles[0].style.transition = 'opacity 0.3s ease 0.05s';
        circles[0].style.opacity = '1';
      }

      /* each path draws in sync with its matching card */
      paths.forEach((path, i) => {
        path.style.transition =
          `stroke-dashoffset ${pathDur}s cubic-bezier(0.4,0,0.2,1) ${cardDelays[i] ?? 0.1}s`;
        path.style.strokeDashoffset = '0';
      });

      /* endpoint dot appears exactly when path finishes drawing */
      for (let i = 1; i <= 4; i++) {
        if (circles[i]) {
          const t = (cardDelays[i - 1] ?? 0) + pathDur;
          circles[i].style.transition = `opacity 0.25s ease ${t}s`;
          circles[i].style.opacity = '1';
        }
      }
    });
  }

  /* ── Counter animation ──────────────────────────────────── */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    const m = raw.match(/^([^\d]*)([0-9][0-9,.]*)(.*)$/);
    if (!m) return;
    const prefix = m[1];
    const numStr = m[2].replace(/,/g, '');
    const suffix = m[3];
    const target = parseFloat(numStr);
    if (isNaN(target) || target === 0) return;

    const isFloat  = numStr.includes('.');
    const hasComma = m[2].includes(',');
    const duration = 1300;
    const startTime = performance.now();

    const tick = now => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = target * ease;
      let display;
      if (isFloat)       display = val.toFixed(1);
      else if (hasComma) display = Math.round(val).toLocaleString('ko-KR');
      else               display = Math.round(val);
      el.textContent = prefix + display + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ── Observer callback ──────────────────────────────────── */
  function onIntersect(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);

      /* SVG connector: animate paths, no bcl-visible needed */
      if (el.classList.contains('proc-connectors')) {
        playSVGPaths();
        return;
      }

      /* standard entrance */
      el.classList.add('bcl-visible');

      /* donut fill */
      if (el.classList.contains('rslt-donut-card')) {
        const donut = el.querySelector('.rslt-donut');
        if (donut) donut.classList.add('bcl-donut-play');
      }

      /* result stat counters */
      if (el.classList.contains('rslt-stat')) {
        const num = el.querySelector('.rslt-stat__num');
        if (num) { num.classList.add('bcl-num-glow'); setTimeout(() => animateCounter(num), 200); }
      }

      /* overview stat counters */
      if (el.classList.contains('mktg-stat')) {
        const num = el.querySelector('.mktg-stat__num');
        if (num) setTimeout(() => animateCounter(num), 300);
      }
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    if (initialized) return;
    initialized = true;

    const scroller = about.querySelector('.about__scroll');
    if (!scroller) return;

    prepareSVGPaths();

    observer = new IntersectionObserver(onIntersect, {
      root: scroller,
      rootMargin: '-4% 0px -4% 0px',
      threshold: 0.12,
    });

    /* SVG: observe directly WITHOUT data-bcl-anim (CSS doesn't hide it) */
    const svgEl = about.querySelector('.proc-connectors');
    if (svgEl) observer.observe(svgEl);

    /* all other animated elements */
    about.querySelectorAll('[data-bcl-anim]').forEach(el => observer.observe(el));
  }

  window.addEventListener('about:open', () => setTimeout(init, 180));
  if (about.classList.contains('is-open')) setTimeout(init, 180);
})();
