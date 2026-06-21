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
          onUpdate: () => { el.textContent = o.v.toFixed(dec) + suf; },
          /* ⑥ 도착 펄스 — 목표 도달 순간 살짝 튀어오름(grid/block 요소라 scale 적용) */
          onComplete: () => gsap.fromTo(el, { scale: 1 },
            { scale: 1.14, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 50%" }) }) });
    });

    /* ── SECTION 3 ── */
    /* ── SECTION 3 GOAL — 스크롤 핀(A형, GOAL 선언 모먼트) ──
       헤딩 진입 → 고정 후 솔루션 1·2·3 순차 → 연결 점선 → GOAL 박스 팝 + 동전 낙하.
       페르소나 블록(.s3-persona)은 핀 밖에서 자연 스크롤. framing 은 뷰포트 적응. */
    const s3goalEl = scroller.querySelector("#sec3 .s3-goal");
    const setSec3Top = () => {
      if (!s3goalEl) return;
      const vp = scroller.clientHeight; if (!vp) return;
      const base = s3goalEl.getBoundingClientRect().top;
      const relT = (s) => { const e = s3goalEl.querySelector(s); return e ? e.getBoundingClientRect().top - base : 0; };
      const relB = (s) => { const e = s3goalEl.querySelector(s); return e ? e.getBoundingClientRect().bottom - base : 0; };
      const cTop = relT(".mk-eyebrow"), gBot = relB(".s3-goalbox"), fTop = relT(".s3-sols");
      const top = (gBot - cTop) <= vp
        ? (vp - (gBot - cTop)) / 2 - cTop
        : (vp - (gBot - fTop)) / 2 - fTop;
      s3goalEl.style.top = Math.round(top) + "px";
    };

    /* 동전 낙하 — GOAL 박스 위로 쏟아져 "절약이 쌓이는" 순간. 스티키 프레임(.s3-goal)에 부착 */
    let coinsActive = false;   // scrub 왕복 시 .call() 반복 발화로 동전 중복 생성 방지
    const dropGoalCoins = () => {
      if (coinsActive) return;
      const box = scroller.querySelector("#sec3 .s3-goalbox");
      if (!s3goalEl || !box) return;
      coinsActive = true;
      const land = box.offsetTop + box.offsetHeight * 0.35;
      let remaining = 12;
      for (let i = 0; i < 12; i++) {
        const c = document.createElement("div");
        c.className = "jg-coin"; c.textContent = "₩";
        c.setAttribute("aria-hidden", "true");   // 장식 — AT가 "₩" 반복해서 읽지 않게
        c.style.left = gsap.utils.random(34, 66) + "%";
        s3goalEl.appendChild(c);
        gsap.fromTo(c, { y: -40, opacity: 1, rotation: 0 },
          { y: land, rotation: gsap.utils.random(300, 680), opacity: 0,
            duration: gsap.utils.random(1.2, 1.9), ease: "power1.in", delay: i * 0.07,
            onComplete: () => { c.remove(); if (--remaining === 0) coinsActive = false; } });
      }
    };

    /* 헤딩 — 진입 단계 rise(고정 후 잘릴 수 있으므로 진입 시 노출) */
    gsap.from("#sec3 .s3-goal > :is(p,h2,span).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec3 .s3-goal", "top 84%") });

    /* 핀 scrub: 솔루션 1→2→3 → 연결 점선 → GOAL 박스 팝 → 동전 */
    const pinTl_s3 = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#sec3-pin", scroller, start: "top top", end: "bottom bottom", scrub: true, onRefreshInit: setSec3Top },
    });
    pinTl_s3
      .from("#sec3 .s3-sol", { opacity: 0, y: 34, stagger: 0.1, duration: 0.13 }, 0.16)
      /* 연결선(::before/::after 포함 컨테이너)도 솔루션 다 뜬 뒤 등장 → 도트 순차 팝 */
      .fromTo("#sec3 .s3-link", { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.5)
      .from("#sec3 .s3-link i", { scale: 0.3, transformOrigin: "50% 50%", stagger: 0.06, duration: 0.06 }, 0.54)
      .fromTo("#sec3 .s3-goalbox", { opacity: 0, scale: 0.94, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.12 }, 0.68)
      .call(dropGoalCoins, null, 0.74);

    setSec3Top();
    window.addEventListener("resize", setSec3Top);
    gsap.from("#sec3 .s3-persona > :is(p,h2,span).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST(".s3-persona", "top 80%") });
    gsap.from(".s3-pcard",   { opacity: 0, y: 42, stagger: .16, duration: .85, ease: "power3.out", scrollTrigger: ST(".s3-pcards", "top 82%") });

    /* ── SECTION 4 ── */
    /* 스크롤 핀(A형) — 반응형 프레이밍.
       헤딩은 진입 단계에서 rise(고정 전), 고정 후 프레임에서 5스텝 좌→우 + 루프 조립.
       sticky top 은 뷰포트에 맞춰 JS 로 계산(종횡비에 따라 콘텐츠 높이 vs 뷰포트가 달라짐):
         · 전체(헤딩~루프)가 뷰포트에 들어오면 → 전체를 세로 중앙
         · 안 들어오면 → flow+루프만 중앙(헤딩은 진입 시 이미 노출됨) */
    const sec4El = scroller.querySelector("#sec4");
    const setSec4Top = () => {
      if (!sec4El) return;
      const vp = scroller.clientHeight; if (!vp) return;
      const base = sec4El.getBoundingClientRect().top;
      const relT = (sel) => { const e = sec4El.querySelector(sel); return e ? e.getBoundingClientRect().top - base : 0; };
      const relB = (sel) => { const e = sec4El.querySelector(sel); return e ? e.getBoundingClientRect().bottom - base : 0; };
      const cTop = relT(".mk-eyebrow"), cBot = relB(".s4-loop");
      const fTop = relT(".s4-flow"), fBot = relB(".s4-loop");
      const top = (cBot - cTop) <= vp
        ? (vp - (cBot - cTop)) / 2 - cTop      // 전체가 들어옴 → 전체 중앙
        : (vp - (fBot - fTop)) / 2 - fTop;     // 안 들어옴 → flow+루프 중앙
      sec4El.style.top = Math.round(top) + "px";
    };

    /* 헤딩 — 진입 단계에서 rise(고정 후 잘릴 수 있으므로 진입 시 1회 노출) */
    gsap.from("#sec4 > :is(p,h2,span).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec4", "top 84%") });

    const pinTl_s4 = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#sec4-pin", scroller, start: "top top", end: "bottom bottom", scrub: true, onRefreshInit: setSec4Top },
    });
    pinTl_s4
      .from(".s4-step", { opacity: 0, y: 32, stagger: 0.12, duration: 0.14 }, 0.15)
      .from(".s4-loop", { opacity: 0, duration: 0.12 }, 0.85);

    setSec4Top();
    window.addEventListener("resize", setSec4Top);

    /* ── SECTION 5 ── */
    gsap.from("#sec5 .s5-intro .mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec5 .s5-intro", "top 84%") });
    gsap.from(".s5-hero", { opacity: 0, scale: .9, y: 16, duration: .9, ease: "back.out(1.5)", scrollTrigger: ST("#sec5 .s5-intro", "top 84%") });
    gsap.from(".s5-row", { opacity: 0, x: -26, stagger: .12, duration: .75, ease: "power3.out", scrollTrigger: ST(".s5-table", "top 84%") });

    /* ── SECTION 6 — 스크롤 핀(A형, 브랜드) ──
       헤딩은 진입 시 rise, 고정 후 프레임에서 브랜드 그리드(오브젝트/타이포/컬러) 조립.
       굴비는 BRAND OBJECT 카드 등장 시점에 감쇠 스윙으로 "착지". 목업은 핀 해제 후 노출.
       framing 은 뷰포트에 맞춰 적응(헤딩+그리드가 들어오면 전체, 아니면 그리드만 중앙). */
    const sec6El = scroller.querySelector("#sec6");
    const setSec6Top = () => {
      if (!sec6El) return;
      const vp = scroller.clientHeight; if (!vp) return;
      const base = sec6El.getBoundingClientRect().top;
      const relT = (s) => { const e = sec6El.querySelector(s); return e ? e.getBoundingClientRect().top - base : 0; };
      const relB = (s) => { const e = sec6El.querySelector(s); return e ? e.getBoundingClientRect().bottom - base : 0; };
      const cTop = relT(".mk-eyebrow"), gTop = relT(".s6-grid"), gBot = relB(".s6-grid");
      const top = (gBot - cTop) <= vp
        ? (vp - (gBot - cTop)) / 2 - cTop
        : (vp - (gBot - gTop)) / 2 - gTop;
      sec6El.style.top = Math.round(top) + "px";
    };

    /* 굴비 감쇠 스윙(천장에 매달린 조기가 흔들리다 안착) — 핀 조립 시 발화 + hover 재생 */
    const fishSwings = [];
    scroller.querySelectorAll("#sec6 .s6-objbox img").forEach((img) => {
      gsap.set(img, { transformOrigin: "50% 0%" });
      const swing = () => gsap.to(img, { keyframes: { rotation: [-13, 9, -6, 4, -2, 0] }, duration: 2.4, ease: "sine.inOut", overwrite: true });
      fishSwings.push(swing);
      const box = img.closest(".s6-objbox") || img;
      box.style.cursor = "pointer";
      box.addEventListener("mouseenter", swing);
    });

    /* 헤딩 — 진입 단계 rise */
    gsap.from("#sec6 > :is(p,h2).mk-rise", { opacity: 0, y: 28, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST("#sec6", "top 84%") });

    /* 핀 scrub: 브랜드 카드 3개 순차 → 굴비 착지 → 컬러 스와치 팝 */
    const pinTl_s6 = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#sec6-pin", scroller, start: "top top", end: "bottom bottom", scrub: true, onRefreshInit: setSec6Top },
    });
    pinTl_s6
      .from("#sec6 .s6-card", { opacity: 0, y: 34, stagger: 0.12, duration: 0.14 }, 0.15)
      .call(() => fishSwings.forEach((s, i) => gsap.delayedCall(i * 0.12, s)), null, 0.26)
      .from("#sec6 .s6-swatches figure", { opacity: 0, scale: 0.8, stagger: 0.05, duration: 0.1 }, 0.5);

    /* 목업 — 핀 해제 후 자연 스크롤로 등장 */
    gsap.from(".s6-mockup", { opacity: 0, y: 40, duration: .9, ease: "power3.out", scrollTrigger: ST(".s6-mockup", "top 88%") });

    setSec6Top();
    window.addEventListener("resize", setSec6Top);

    /* ── SECTION 7 ── */
    gsap.from(".s7-board", { opacity: 0, y: 34, duration: .9, ease: "power3.out", scrollTrigger: ST(".s7-board", "top 86%") });
    gsap.from("#sec7 .s7-ext .mk-rise", { opacity: 0, y: 30, stagger: .12, duration: .8, ease: "power3.out", scrollTrigger: ST(".s7-ext", "top 86%") });

    /* ── SECTION 8 ── */
    gsap.from(".s8-hero", { opacity: 0, y: 36, duration: 1, ease: "power3.out", scrollTrigger: ST(".s8-hero", "top 88%") });

    /* ── SECTION 9 ── */
    gsap.from(".s9-ov--text > *", { opacity: 0, y: 24, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST(".s9-board", "top 78%") });
    gsap.from(".s9-phone--1", { opacity: 0, y: 40, duration: .9, ease: "power3.out", scrollTrigger: ST(".s9-board", "top 80%") });
    gsap.from(".s9-phone--2", { opacity: 0, y: 40, delay: .12, duration: .9, ease: "power3.out", scrollTrigger: ST(".s9-board", "top 80%") });
    gsap.from(".s9-extra", { opacity: 0, y: 30, delay: .22, duration: .9, ease: "power3.out", scrollTrigger: ST(".s9-board", "top 80%") });

    /* ── SECTION 10 ── */
    gsap.from(".s10-ov--text > *", { opacity: 0, y: 22, stagger: .1, duration: .8, ease: "power3.out", scrollTrigger: ST(".s10-board", "top 80%") });
    gsap.from(".s10-phone", { opacity: 0, y: 38, stagger: .12, duration: .85, ease: "power3.out", scrollTrigger: ST(".s10-board", "top 78%") });
    gsap.from(".s10-char", { opacity: 0, scale: .8, duration: .8, delay: .3, ease: "back.out(1.5)", scrollTrigger: ST(".s10-board", "top 78%") });

    /* ── SECTION 11 ── */
    gsap.from(".s11-hero", { opacity: 0, y: 36, duration: 1, ease: "power3.out", scrollTrigger: ST(".s11-hero", "top 88%") });

    /* ── SECTION 12 ── */
    gsap.from(".s12-hero", { opacity: 0, y: 36, duration: 1, ease: "power3.out", scrollTrigger: ST(".s12-hero", "top 88%") });

    /* ── SECTION 13 (긴 이미지 → 가벼운 페이드만) ── */
    gsap.from(".s13-hero", { opacity: 0, duration: 1, ease: "power2.out", scrollTrigger: ST(".s13-hero", "top 92%") });

    /* ── SECTION 14 (크레딧 — 컬럼별 스태거) ── */
    gsap.from("#sec14 .s14-label",     { opacity: 0, y: 22, stagger: .12, duration: .7, ease: "power3.out", scrollTrigger: ST(".s14-grid", "top 84%") });
    gsap.from("#sec14 .s14-tools img", { opacity: 0, scale: .7, stagger: .05, duration: .5, ease: "back.out(1.7)", scrollTrigger: ST(".s14-tools", "top 86%") });
    gsap.from("#sec14 .s14-role li",   { opacity: 0, x: -18, stagger: .1, duration: .6, ease: "power2.out", scrollTrigger: ST(".s14-role", "top 86%") });
    gsap.from("#sec14 .s14-clock",     { opacity: 0, scale: .7, rotate: -30, duration: .8, ease: "back.out(1.6)", scrollTrigger: ST(".s14-col--time", "top 86%") });
    gsap.from("#sec14 .s14-time",      { opacity: 0, y: 18, duration: .7, delay: .15, ease: "power3.out", scrollTrigger: ST(".s14-col--time", "top 86%") });

    /* ── SECTION 15 (마무리 영상 페이드인) ── */
    gsap.from(".s15-video", { opacity: 0, duration: 1.1, ease: "power2.out", scrollTrigger: ST(".s15-video", "top 90%") });

    /* ===================================================================
       시그니처 모션 (자린고비 전용) — reduced-motion 시 상단 early-return 으로 전부 비실행.
       무한 루프(굴비·화살표)는 그 덕에 모션 최소화 환경에서 아예 생성되지 않음.
    =================================================================== */

    /* ① 섹션 배경 온도 전환(여정 페이싱) — .mk-sec 가 불투명 흰색이라 섹션 자체 배경을
       near-white 단계 틴트로. 웜크림 → 브랜드그린 옅게 → 웜베이지 → 쿨. once 아님(왕복 반영). */
    const tintMap = {
      sec1: "#FBF8F1", sec2: "#FBF8F1", sec3: "#FBF8F1", sec4: "#FBF8F1", sec5: "#FBF8F1",
      sec6: "#F4F8F1", sec6b: "#F4F8F1", sec7: "#F4F8F1", sec8: "#F4F8F1",
      sec9: "#FAF7F0", sec10: "#FAF7F0", sec11: "#FAF7F0", sec12: "#FAF7F0", sec13: "#FAF7F0",
      sec14: "#F1F5F0", sec15: "#F1F5F0",
    };
    Object.entries(tintMap).forEach(([id, tint]) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      const apply = () => gsap.to(sec, { backgroundColor: tint, duration: 1.0, ease: "power1.out", overwrite: "auto" });
      ScrollTrigger.create({ trigger: sec, scroller, start: "top 80%", onEnter: apply, onEnterBack: apply });
    });


    /* ③ 굴비 스윙은 SECTION 6 핀 블록(위)으로 이동 — 핀 조립 시점에 착지 발화 + hover 재생 */

    /* ④ 동전 낙하 — SECTION 3 핀 블록(위)으로 이동: GOAL 박스 팝 시점에 박스 위로 쏟아짐 */

    /* ⑧ sec4 선순환 화살표 — 자전 제거(화살촉이 빙글 돌던 버그 + gsap rotation 이 CSS
       translate 를 덮어 위치 틀어짐). 화살촉은 01 로 향해 고정. 등장은 핀 scrub(.s4-loop)이 담당. */

    /* ⑨ 제거 — sec13 은 내용이 담긴 통이미지라 scale 패럴랙스가 위아래를 크롭함. 기존 fade(line 116)만 유지. */

    /* ⑩ CTA 마그네틱 플레어 — 데스크톱 정밀 포인터에서만 추적(quickSetter). reduced-motion 은 미바인딩 */
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const cta = document.querySelector("#process .jg-cta");
      const flare = cta && cta.querySelector(".jg-cta__flare");
      if (cta && flare) {
        const xTo = gsap.quickSetter(flare, "x", "px");
        const yTo = gsap.quickSetter(flare, "y", "px");
        cta.addEventListener("pointermove", (e) => {
          const r = cta.getBoundingClientRect();
          xTo(e.clientX - r.left);
          yTo(e.clientY - r.top);
        });
      }
    }

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

/* =======================================================================
   SECTION 15 마무리 영상 — 화면에 들어올 때만 재생(디코딩 절약).
   GSAP·모션선호와 무관하게 동작. muted loop 라 모바일에서도 자동재생 가능.
======================================================================= */
(() => {
  const vid = document.querySelector(".s15-video");
  const root = document.querySelector(".process__content");
  if (!vid || !root || !("IntersectionObserver" in window)) {
    if (vid) { const p = vid.play && vid.play(); if (p && p.catch) p.catch(() => {}); }
    return;
  }
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (e.isIntersecting) { const p = vid.play(); if (p && p.catch) p.catch(() => {}); }
      else vid.pause();
    });
  }, { root, threshold: 0.25 });
  io.observe(vid);
})();
