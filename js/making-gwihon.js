/* =======================================================================
   making-gwihon.js — 귀혼(Soul Saver) 제작 과정 본문 스크롤 모션
   -----------------------------------------------------------------------
   · scroller: #process-gwihon .process__content (모달 전용 스크롤러)
   · GSAP + ScrollTrigger, once 진입 트리거 위주 — transform/opacity만(60fps)
   · prefers-reduced-motion → 모션 없이 정상 표시(초기화 완료 처리)
   · 초기 상태는 gsap.from() 으로만 설정 → GSAP 미로드 시 요소가 그대로 보임
     (translateX(-50%) 등 CSS 중앙정렬은 GSAP가 기존 transform을 보존)
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 refresh 호출 →
     귀혼 트리거도 함께 갱신됨
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;

    const scroller = document.querySelector("#process-gwihon .process__content");
    if (!scroller) return true; // 마크업 없으면 통과

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* once 진입 트리거 공통 옵션 */
    const ST = (trigger, start = "top 84%") => ({ trigger, scroller, start, once: true });
    /* 진입 페이드+업 헬퍼 */
    const rise = (sel, opt = {}) =>
      gsap.from(sel, Object.assign({
        opacity: 0, y: 26, duration: 0.85, ease: "power3.out",
      }, opt));

    /* ================================================================
       SECTION · 히어로 (#gw-hero) — 배경 은은한 줌-세틀 + 로고 페이드/스케일
    ================================================================ */
    const heroBg = scroller.querySelector("#gw-hero .gw-hero__bg");
    const heroLogo = scroller.querySelector("#gw-hero .gw-hero__logo");
    if (heroBg) {
      gsap.from(heroBg, {
        scale: 1.08, opacity: 0.5, transformOrigin: "50% 50%",
        duration: 1.4, ease: "power3.out",
        scrollTrigger: ST("#gw-hero", "top 90%"),
      });
    }
    if (heroLogo) {
      gsap.from(heroLogo, {
        opacity: 0, y: 24, scale: 0.92, transformOrigin: "50% 50%",
        duration: 1.05, delay: 0.15, ease: "power3.out",
        scrollTrigger: ST("#gw-hero", "top 80%"),
      });
    }

    /* ================================================================
       SECTION 1 · BACKGROUND (#gw1)
    ================================================================ */
    rise("#gw1 .gw-bg__lead", { y: 20, stagger: 0.14, duration: 0.9,
      scrollTrigger: ST("#gw1 .gw-bg__lead--1", "top 86%") });
    rise("#gw1 .gw-bg__label", { y: 20, scrollTrigger: ST("#gw1 .gw-bg__label", "top 84%") });
    rise("#gw1 .gw-bg__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw1 .gw-bg__title", "top 84%") });
    rise("#gw1 .gw-bg__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw1 .gw-bg__desc", "top 84%") });
    gsap.from("#gw1 .gw-bg__shot", {
      opacity: 0, x: 40, duration: 1.0, ease: "power3.out",
      scrollTrigger: ST("#gw1 .gw-bg__shot", "top 80%"),
    });
    gsap.from("#gw1 .gw-pcard", {
      opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.12,
      scrollTrigger: ST("#gw1 .gw-pcard--1", "top 84%"),
    });
    gsap.from("#gw1 .gw-bg__goal", {
      opacity: 0, y: 22, scale: 0.97, transformOrigin: "50% 50%",
      duration: 0.9, ease: "back.out(1.3)",
      scrollTrigger: ST("#gw1 .gw-bg__goal", "top 88%"),
    });

    /* ================================================================
       SECTION 2 · GAME RESEARCH (#gw2) — 중앙 메달리온 + 원형 4
    ================================================================ */
    rise("#gw2 .gw-r2__label", { y: 20, scrollTrigger: ST("#gw2 .gw-r2__label", "top 84%") });
    rise("#gw2 .gw-r2__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw2 .gw-r2__title", "top 84%") });
    rise("#gw2 .gw-r2__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw2 .gw-r2__desc", "top 84%") });
    /* 동심원/디스크/로고 — 중앙에서 스케일 인 (translate(-50%,-50%) 보존) */
    gsap.from("#gw2 .gw-r2__center > *", {
      opacity: 0, scale: 0.6, transformOrigin: "50% 50%",
      duration: 0.9, ease: "power3.out", stagger: 0.08,
      scrollTrigger: ST("#gw2 .gw-r2__center", "top 78%"),
    });
    /* 4 원형 이미지 — 스크롤 따라 중심축으로 회전해 들어와 섹션 중앙쯤서 제자리 안착(scrub).
       각 원의 transform-origin을 메달리온 중심(50cqw, 52.847cqw)으로 두고 함께 회전 */
    const circOrigins = {
      "--tl": "30.764cqw 23.125cqw", "--tr": "-14.861cqw 23.125cqw",
      "--bl": "30.764cqw -7.292cqw", "--br": "-14.861cqw -7.292cqw",
    };
    Object.entries(circOrigins).forEach(([k, origin]) => {
      const el = scroller.querySelector("#gw2 .gw-r2__circ" + k);
      if (!el) return;
      gsap.set(el, { transformOrigin: origin });
      gsap.fromTo(el,
        { rotation: -52, opacity: 0 },
        { rotation: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: "#gw2", scroller, start: "top 64%", end: "center center", scrub: 0.6 } });
    });
    gsap.from("#gw2 .gw-r2__cap", {
      opacity: 0, y: 16, duration: 0.7, ease: "power2.out", stagger: 0.08,
      scrollTrigger: ST("#gw2 .gw-r2__center", "top 64%"),
    });
    /* 동심원 링 — 스크롤 진입 시 살짝 회전해 들어와 중앙서 안착(scrub). 무한 회전 아님.
       translate(-50%,-50%) 중앙정렬 → xPercent/yPercent 선점(이중변환 방지) */
    const ringSettle = (sel, from) => {
      const el = scroller.querySelector(sel);
      if (!el) return;
      gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0, transformOrigin: "50% 50%" });
      gsap.fromTo(el, { rotation: from }, { rotation: 0, ease: "none",
        scrollTrigger: { trigger: "#gw2", scroller, start: "top 64%", end: "center center", scrub: 0.6 } });
    };
    ringSettle("#gw2 .gw-r2__orbit", 40);
    ringSettle("#gw2 .gw-r2__ring--out", -34);

    /* ================================================================
       SECTION 3 · EXPERIMENT (#gw3) — 3 시안 목업
    ================================================================ */
    rise("#gw3 .gw-r3__label", { y: 20, scrollTrigger: ST("#gw3 .gw-r3__label", "top 84%") });
    rise("#gw3 .gw-r3__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw3 .gw-r3__title", "top 84%") });
    rise("#gw3 .gw-r3__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw3 .gw-r3__desc", "top 84%") });
    gsap.from("#gw3 .gw-r3__shot", {
      opacity: 0, y: 40, duration: 0.95, ease: "power3.out", stagger: 0.14,
      scrollTrigger: ST("#gw3 .gw-r3__shot--1", "top 82%"),
    });
    gsap.from("#gw3 .gw-r3__exp", {
      opacity: 0, y: 24, duration: 0.8, ease: "power3.out", stagger: 0.12,
      scrollTrigger: ST("#gw3 .gw-r3__exp--1", "top 88%"),
    });
    gsap.from("#gw3 .gw-r3__goal", {
      opacity: 0, y: 22, scale: 0.97, transformOrigin: "50% 50%",
      duration: 0.9, ease: "back.out(1.3)",
      scrollTrigger: ST("#gw3 .gw-r3__goal", "top 90%"),
    });

    /* ================================================================
       SECTION 4 · VISUAL DIRECTION (#gw4) — 컬러 스와치 + 무드 2×2
    ================================================================ */
    rise("#gw4 .gw-r4__label", { y: 20, scrollTrigger: ST("#gw4 .gw-r4__label", "top 84%") });
    rise("#gw4 .gw-r4__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw4 .gw-r4__title", "top 84%") });
    rise("#gw4 .gw-r4__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw4 .gw-r4__desc", "top 84%") });
    /* 스와치 — 왼쪽에서 팬인(팔레트가 펼쳐지는 느낌) */
    gsap.from("#gw4 .gw-r4__sw", {
      opacity: 0, x: -46, duration: 0.85, ease: "power3.out", stagger: 0.12,
      scrollTrigger: ST("#gw4 .gw-r4__sw--main", "top 84%"),
    });
    /* 컬러명/HEX — 오른쪽에서 진입(좌우 맞물림) */
    gsap.from("#gw4 .gw-r4__col", {
      opacity: 0, x: 28, duration: 0.7, ease: "power2.out", stagger: 0.12,
      scrollTrigger: ST("#gw4 .gw-r4__sw--main", "top 82%"),
    });
    /* 무드 이미지 — 팝 인 */
    gsap.from("#gw4 .gw-r4__mood", {
      opacity: 0, scale: 0.88, y: 18, transformOrigin: "50% 50%",
      duration: 0.8, ease: "back.out(1.4)", stagger: 0.1,
      scrollTrigger: ST("#gw4 .gw-r4__mood--1", "top 84%"),
    });

    /* ================================================================
       SECTION 5 · SECTION DESIGN (#gw5) — 5행 타임라인 (행별 진입)
    ================================================================ */
    rise("#gw5 .gw-r5__label", { y: 20, scrollTrigger: ST("#gw5 .gw-r5__label", "top 86%") });
    rise("#gw5 .gw-r5__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw5 .gw-r5__title", "top 86%") });
    rise("#gw5 .gw-r5__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw5 .gw-r5__desc", "top 86%") });
    for (let i = 1; i <= 5; i++) {
      const shot = scroller.querySelector(`#gw5 .gw-r5__shot--${i}`);
      const tx = scroller.querySelector(`#gw5 .gw-r5__tx--${i}`);
      const node = scroller.querySelector(`#gw5 .gw-r5__node--${i}`);
      if (shot) gsap.from(shot, {
        opacity: 0, x: -36, duration: 0.9, ease: "power3.out",
        scrollTrigger: ST(shot, "top 82%"),
      });
      if (tx) gsap.from(tx, {
        opacity: 0, x: 30, duration: 0.9, delay: 0.08, ease: "power3.out",
        scrollTrigger: ST(shot || tx, "top 82%"),
      });
      if (node) gsap.from(node, {
        opacity: 0, scale: 0.4, transformOrigin: "0% 50%",
        duration: 0.5, delay: 0.18, ease: "back.out(2)",
        scrollTrigger: ST(shot || node, "top 80%"),
      });
    }

    /* ================================================================
       SECTION 6 · INTERACTION DESIGN (#gw6) — 5행 리스트
    ================================================================ */
    rise("#gw6 .gw-r6__label", { y: 20, scrollTrigger: ST("#gw6 .gw-r6__label", "top 86%") });
    rise("#gw6 .gw-r6__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw6 .gw-r6__title", "top 86%") });
    rise("#gw6 .gw-r6__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw6 .gw-r6__desc", "top 86%") });
    scroller.querySelectorAll("#gw6 .gw-r6__row").forEach((row) => {
      const icon = row.querySelector(".gw-r6__icon");
      const head = row.querySelector(".gw-r6__rhead");
      const desc = row.querySelector(".gw-r6__rdesc");
      const tl = gsap.timeline({ scrollTrigger: ST(row, "top 88%") });
      if (icon) tl.from(icon, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.7)" }, 0);
      if (head) tl.from(head, { opacity: 0, x: -22, duration: 0.7, ease: "power3.out" }, 0.06);
      if (desc) tl.from(desc, { opacity: 0, x: 22, duration: 0.7, ease: "power3.out" }, 0.1);
    });

    /* ================================================================
       SECTION 7 · DEVELOPMENT (#gw7) — 문제→해결 5행
    ================================================================ */
    rise("#gw7 .gw-r7__label", { y: 20, scrollTrigger: ST("#gw7 .gw-r7__label", "top 86%") });
    rise("#gw7 .gw-r7__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw7 .gw-r7__title", "top 86%") });
    rise("#gw7 .gw-r7__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw7 .gw-r7__desc", "top 86%") });
    scroller.querySelectorAll("#gw7 .gw-r7__row").forEach((row) => {
      const prob = row.querySelector(".gw-r7__prob");
      const arrow = row.querySelector(".gw-r7__arrow");
      const sol = row.querySelector(".gw-r7__sol");
      const tl = gsap.timeline({ scrollTrigger: ST(row, "top 88%") });
      if (prob) tl.from(prob, { opacity: 0, x: -28, duration: 0.7, ease: "power3.out" }, 0);
      if (arrow) tl.from(arrow, { opacity: 0, duration: 0.5, ease: "power1.out" }, 0.18);
      if (sol) tl.from(sol, { opacity: 0, x: 28, duration: 0.7, ease: "power3.out" }, 0.24);
    });

    /* ================================================================
       SECTION 8 · TOOLS / ROLE / TIME (#gw-credit)
    ================================================================ */
    gsap.from("#gw-credit .gw-r8__col", {
      opacity: 0, y: 26, duration: 0.8, ease: "power3.out", stagger: 0.14,
      scrollTrigger: ST("#gw-credit", "top 84%"),
    });
    gsap.from("#gw-credit .gw-r8__grid img", {
      opacity: 0, scale: 0.6, transformOrigin: "50% 50%",
      duration: 0.5, ease: "back.out(1.7)", stagger: 0.06,
      scrollTrigger: ST("#gw-credit .gw-r8__grid", "top 86%"),
    });
    gsap.from("#gw-credit .gw-r8__role li", {
      opacity: 0, x: -16, duration: 0.6, ease: "power2.out", stagger: 0.1,
      scrollTrigger: ST("#gw-credit .gw-r8__role", "top 86%"),
    });

    /* ================================================================
       SECTION 9 · OUTRO (#gw-outro) — 페이드 + 은은한 줌-세틀
    ================================================================ */
    gsap.from("#gw-outro .gw-r9__img", {
      opacity: 0, scale: 1.06, transformOrigin: "50% 50%",
      duration: 1.4, ease: "power3.out",
      scrollTrigger: ST("#gw-outro", "top 86%"),
    });

    /* ================================================================
       NEW · 시그니처 모션 (기존 진입 모션 위에 얹음)
    ================================================================ */

    /* 배너 씬컷 리빌(스크림 디졸브 + 스케일 착지) + 세로 패닝(scrub object-position) */
    ["#gw-band-1", "#gw-band-2"].forEach((bandSel) => {
      const band = scroller.querySelector(bandSel);
      if (!band) return;
      const vid = band.querySelector(".gw-band__vid");
      const scrim = band.querySelector(".gw-band__scrim");
      const tl = gsap.timeline({ scrollTrigger: ST(band, "top 88%") });
      if (vid) tl.from(vid, { scale: 1.12, duration: 1.1, ease: "power3.out" }, 0);
      if (scrim) tl.to(scrim, { opacity: 0, duration: 1.0, ease: "power2.out" }, 0.05);
      /* 카메라 패닝 — 래퍼(overflow:hidden) 안에서 영상 translateY(compositor only, paint 없음).
         영상 height 110% 헤드룸 → y 0%~-8% 범위에서 항상 커버 유지 */
      if (vid) gsap.fromTo(vid,
        { yPercent: 4 },
        { yPercent: -4, ease: "none",
          scrollTrigger: { trigger: band, scroller, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });

    /* gw5 세로 연결선 드로우(scaleY 0→1, scrub) */
    if (scroller.querySelector("#gw5 .gw-r5__line")) {
      gsap.fromTo("#gw5 .gw-r5__line", { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: "#gw5 .gw-r5__node--1", scroller, start: "top 80%",
          endTrigger: "#gw5 .gw-r5__node--5", end: "top 60%", scrub: 0.5 },
      });
    }

    /* gw5 노드 펄스 — 섹션 화면 안일 때만 가동(밖이면 정지, idle CPU 보호) */
    const gw5 = scroller.querySelector("#gw5");
    if (gw5) {
      ScrollTrigger.create({ trigger: gw5, scroller, start: "top bottom", end: "bottom top",
        onToggle: (self) => gw5.classList.toggle("is-pulsing", self.isActive) });
    }

    /* gw6 인터랙션 아이콘 활성화 링 — 행 진입 시 1회 ping */
    scroller.querySelectorAll("#gw6 .gw-r6__row").forEach((row) => {
      ScrollTrigger.create({ trigger: row, scroller, start: "top 80%", once: true,
        onEnter: () => row.classList.add("is-pinged") });
    });

    /* gw-band-2 진입 시 모달 골드 틴트(리서치→완성 무드 전환) */
    const panel = document.querySelector("#process-gwihon .process__panel") || document.querySelector("#process-gwihon");
    if (panel) {
      const tint = document.createElement("span");
      tint.className = "gw-tint";
      tint.setAttribute("aria-hidden", "true");
      panel.appendChild(tint);
      ScrollTrigger.create({ trigger: "#gw-band-2", scroller, start: "top 60%",
        onEnter: () => gsap.to(tint, { opacity: 1, duration: 1.4, ease: "power2.out" }),
        onLeaveBack: () => gsap.to(tint, { opacity: 0, duration: 1.0, ease: "power2.out" }) });
    }

    /* 혼불 파티클(hero · band-1 · outro) + CTA 골드 마그네틱 플레어 */
    initSoulFlames(scroller.querySelectorAll(".gw-flame"), scroller);
    initCtaFlare(document.querySelector("#process-gwihon .gw-cta"));

    /* ── 이미지 로드 후 위치 재계산(레이아웃 점프 보정) ── */
    scroller.querySelectorAll(".process__making--gwihon img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", () => {
          try { ScrollTrigger.refresh(); } catch (e) {}
        }, { once: true });
      }
    });

    return true;
  };

  /* ===== 혼불 파티클 (Canvas2D) — 골드 입자가 아래→위 부유하며 소멸 =====
     · IntersectionObserver(root: scroller)로 보이는 캔버스만 렌더
     · 모달 닫히거나 화면 밖이면 rAF 정지 → 모바일 60fps 보호 */
  function initSoulFlames(canvases, scroller) {
    canvases = [...(canvases || [])];
    if (!canvases.length || !window.gsap) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const spawn = (initial) => ({
      x: Math.random(),
      y: initial ? Math.random() : 1.06,
      r: 1.4 + Math.random() * 1.8,
      spd: 0.0011 + Math.random() * 0.0017,
      amp: 0.002 + Math.random() * 0.006,
      ph: Math.random() * Math.PI * 2,
    });
    const systems = [];
    canvases.forEach((cv) => {
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const sys = { cv, ctx, parts: [], visible: false, w: 0, h: 0,
        dpr: Math.min(2, window.devicePixelRatio || 1) };
      sys.resize = () => {
        const r = cv.getBoundingClientRect();
        if (!r.width) return;
        sys.w = r.width; sys.h = r.height;
        cv.width = Math.round(r.width * sys.dpr);
        cv.height = Math.round(r.height * sys.dpr);
        ctx.setTransform(sys.dpr, 0, 0, sys.dpr, 0, 0);
      };
      for (let i = 0; i < 16; i++) sys.parts.push(spawn(true));
      systems.push(sys);
    });
    if (!systems.length) return;

    /* 글로우 스프라이트 1회 프리렌더 → drawImage 재사용(ctx.shadowBlur 금지: 모바일 GPU 가속 해제 방지) */
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 24;
    const sc = sprite.getContext("2d");
    const grad = sc.createRadialGradient(12, 12, 0, 12, 12, 12);
    grad.addColorStop(0,   "rgba(255,205,110,.95)");
    grad.addColorStop(0.45,"rgba(255,165,45,.5)");
    grad.addColorStop(1,   "rgba(255,130,20,0)");
    sc.fillStyle = grad;
    sc.fillRect(0, 0, 24, 24);

    const isOpen = () => {
      const m = document.querySelector("#process-gwihon");
      return m && m.classList.contains("is-open");
    };
    let running = false;
    const tick = () => {
      let any = false;
      for (const sys of systems) {
        if (!sys.visible || !sys.w) continue;
        any = true;
        const { ctx, w, h } = sys;
        ctx.clearRect(0, 0, w, h);
        for (const p of sys.parts) {
          p.y -= p.spd; p.ph += 0.03;
          if (p.y < -0.06) Object.assign(p, spawn(false));
          const px = (p.x + Math.sin(p.ph) * p.amp) * w;
          const py = p.y * h;
          const fade = p.y < 0.15 ? Math.max(0, p.y / 0.15)
            : (p.y > 0.85 ? Math.max(0, (1.06 - p.y) / 0.21) : 1);
          const s = p.r * 6;
          ctx.globalAlpha = 0.6 * fade;
          ctx.drawImage(sprite, px - s / 2, py - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
      }
      if (any && isOpen()) requestAnimationFrame(tick);
      else running = false;
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(tick); } };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const sys = systems.find((s) => s.cv === e.target);
        if (!sys) return;
        sys.visible = e.isIntersecting;
        if (e.isIntersecting) { sys.resize(); start(); }
      });
    }, { root: scroller, rootMargin: "20% 0px", threshold: 0 });
    systems.forEach((s) => io.observe(s.cv));
    window.addEventListener("resize", () => systems.forEach((s) => s.visible && s.resize()));
  }

  /* ===== CTA 골드 마그네틱 플레어 — 포인터 따라 광원 이동(스크롤 무관) ===== */
  function initCtaFlare(cta) {
    if (!cta || !window.gsap) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const flare = cta.querySelector(".gw-cta__flare");
    if (!flare) return;
    const xTo = gsap.quickSetter(flare, "x", "px");
    const yTo = gsap.quickSetter(flare, "y", "px");
    cta.addEventListener("pointermove", (e) => {
      const r = cta.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
    });
  }

  /* defer 순서상 보통 준비되지만 CDN 지연 시 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => {
      if (init() || ++n > 30) clearInterval(t);
    }, 80);
  }
})();
