/* =======================================================================
   making.js — 제작 과정 본문 스크롤 모션 (GSAP + ScrollTrigger)
   -----------------------------------------------------------------------
   · 스크롤 컨테이너가 모달 안(.process__content)이라 scroller 를 지정한다.
   · 모달은 닫혀 있을 땐 display:none → 열릴 때 ScrollTrigger.refresh() 필요
     (process.js open() 에서 window.__makingRefresh() 호출).
   · prefers-reduced-motion 이면 모션 없이 정상 표시.
   · GSAP 미로드(CDN 실패) 시에도 요소는 그대로 보임(인라인 opacity 미적용).
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;
    const scroller = document.querySelector(".process__content");
    if (!scroller) return true;

    const { gsap, ScrollTrigger } = window;
    window.__makingRefresh = () => { try { ScrollTrigger.refresh(); } catch (e) {} };

    // 모션 최소화 → 애니메이션 없이 정상 표시
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    gsap.registerPlugin(ScrollTrigger);
    const ST = (trigger, start = "top 86%") => ({ trigger, scroller, start, once: true });

    /* ── SECTION 1 ── */
    gsap.from(".s1-char",         { opacity: 0, x: -46, duration: .9, ease: "power3.out", scrollTrigger: ST(".s1-char", "top 85%") });
    gsap.from(".s1-text .mk-rise",{ opacity: 0, y: 30,  duration: .8, ease: "power3.out", stagger: .12, scrollTrigger: ST(".s1-text", "top 84%") });
    gsap.from(".s1-panel",        { opacity: 0, y: 48,  duration: .9, ease: "power3.out", scrollTrigger: ST(".s1-panel", "top 84%") });
    gsap.from(".s1-panel__head",  { x: -30, duration: .9, ease: "power3.out", scrollTrigger: ST(".s1-panel", "top 84%") });
    gsap.from(".s1-panel__cards", { x: 36, duration: .9, delay: .1, ease: "power3.out", scrollTrigger: ST(".s1-panel", "top 84%") });

    /* ── SECTION 2 ── */
    gsap.from(".s2-text .mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST(".s2-text", "top 82%") });
    gsap.from(".s2-note",          { opacity: 0, y: 24, rotate: -7, duration: .9, ease: "back.out(1.6)", scrollTrigger: ST(".s2-note", "top 82%") });
    gsap.from(".s2-card",          { opacity: 0, y: 42, stagger: .12, duration: .85, ease: "power3.out", scrollTrigger: ST(".s2-cards", "top 82%") });

    /* 도넛: 빈 상태에서 68% 까지 그려짐 */
    const donut = scroller.querySelector(".s2-donut__fill");
    if (donut) {
      const C = 2 * Math.PI * 50, pct = +donut.dataset.pct;
      gsap.set(donut, { strokeDashoffset: C });
      ScrollTrigger.create({ trigger: ".s2-donutwrap", scroller, start: "top 80%", once: true,
        onEnter: () => gsap.to(donut, { strokeDashoffset: C * (1 - pct / 100), duration: 1.3, ease: "power2.out" }) });
    }

    /* 막대: 좌→우 자라기 */
    if (scroller.querySelector(".s2-bar i")) {
      gsap.set(".s2-bar i", { scaleX: 0 });
      ScrollTrigger.create({ trigger: ".s2-bars", scroller, start: "top 84%", once: true,
        onEnter: () => gsap.to(".s2-bar i", { scaleX: 1, duration: 1, ease: "power2.out", stagger: .12 }) });
    }

    /* 체크: 하나씩 등장 */
    gsap.from(".s2-checks li", { opacity: 0, x: -16, stagger: .12, duration: .6, ease: "power2.out", scrollTrigger: ST(".s2-checks", "top 84%") });

    /* 숫자 카운트업(도넛·막대 %) */
    scroller.querySelectorAll(".s2-count").forEach((el) => {
      const to = +el.dataset.to, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
      const o = { v: 0 }; el.textContent = "0" + suf;
      ScrollTrigger.create({ trigger: el, scroller, start: "top 90%", once: true,
        onEnter: () => gsap.to(o, { v: to, duration: 1.3, ease: "power2.out",
          onUpdate: () => { el.textContent = o.v.toFixed(dec) + suf; } }) });
    });

    /* ── SECTION 3 ── */
    gsap.from("#sec3 .s3-goal > :is(p,h2,span).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec3 .s3-goal", "top 84%") });
    gsap.from(".s3-sol",     { opacity: 0, y: 34, stagger: .12, duration: .8, ease: "power3.out", scrollTrigger: ST(".s3-sols", "top 84%") });
    gsap.from(".s3-goalbox", { opacity: 0, scale: .94, y: 20, duration: .9, ease: "back.out(1.3)", scrollTrigger: ST(".s3-goalbox", "top 86%") });
    gsap.from("#sec3 .s3-persona > :is(p,h2,span).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST(".s3-persona", "top 80%") });
    gsap.from(".s3-pcard",   { opacity: 0, y: 42, stagger: .16, duration: .85, ease: "power3.out", scrollTrigger: ST(".s3-pcards", "top 82%") });

    /* ── SECTION 4 ── */
    gsap.from("#sec4 > :is(p,h2,span).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec4", "top 84%") });
    gsap.from(".s4-step", { opacity: 0, y: 32, stagger: .1, duration: .75, ease: "power3.out", scrollTrigger: ST(".s4-flow", "top 84%") });
    gsap.from(".s4-loop", { opacity: 0, duration: .7, ease: "power2.out", scrollTrigger: ST(".s4-loop", "top 94%") });

    /* ── SECTION 5 ── */
    gsap.from("#sec5 .s5-intro .mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec5 .s5-intro", "top 84%") });
    gsap.from(".s5-hero", { opacity: 0, scale: .9, y: 16, duration: .9, ease: "back.out(1.5)", scrollTrigger: ST("#sec5 .s5-intro", "top 84%") });
    gsap.from(".s5-row", { opacity: 0, x: -26, stagger: .12, duration: .75, ease: "power3.out", scrollTrigger: ST(".s5-table", "top 84%") });

    /* ── SECTION 6 ── */
    gsap.from("#sec6 > :is(p,h2).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec6", "top 84%") });
    gsap.from("#sec6 .s6-card", { opacity: 0, y: 34, stagger: .12, duration: .8, ease: "power3.out", scrollTrigger: ST(".s6-grid", "top 84%") });
    gsap.from(".s6-swatches figure", { opacity: 0, scale: .8, stagger: .08, duration: .5, ease: "back.out(1.6)", scrollTrigger: ST(".s6-swatches", "top 88%") });
    gsap.from(".s6-mockup", { opacity: 0, y: 40, duration: .9, ease: "power3.out", scrollTrigger: ST(".s6-mockup", "top 88%") });

    /* ── SECTION 7 ── */
    gsap.from(".s7-board", { opacity: 0, y: 34, duration: .9, ease: "power3.out", scrollTrigger: ST(".s7-board", "top 86%") });
    gsap.from("#sec7 .s7-ext .mk-rise", { opacity: 0, y: 30, stagger: .12, duration: .8, ease: "power3.out", scrollTrigger: ST(".s7-ext", "top 86%") });

    /* ── SECTION 8 ── */
    gsap.from(".s8-hero", { opacity: 0, y: 36, duration: 1, ease: "power3.out", scrollTrigger: ST(".s8-hero", "top 88%") });

    /* 본문 이미지 로드되면 위치 재계산(레이아웃 점프 보정) */
    scroller.querySelectorAll(".process__making img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    });
    return true;
  };

  /* defer 순서상 보통 바로 준비되지만, 혹시 늦으면 잠깐 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => { if (init() || ++n > 25) clearInterval(t); }, 80);
  }
})();
