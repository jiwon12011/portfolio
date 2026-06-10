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
    /* 4 원형 이미지 — 팝 인 */
    gsap.from("#gw2 .gw-r2__circ", {
      opacity: 0, scale: 0.7, transformOrigin: "50% 50%",
      duration: 0.7, ease: "back.out(1.6)", stagger: 0.1,
      scrollTrigger: ST("#gw2 .gw-r2__center", "top 70%"),
    });
    gsap.from("#gw2 .gw-r2__cap", {
      opacity: 0, y: 16, duration: 0.7, ease: "power2.out", stagger: 0.08,
      scrollTrigger: ST("#gw2 .gw-r2__center", "top 64%"),
    });

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
    /* 스와치 — 위로 슬라이드(쌓이는 느낌) */
    gsap.from("#gw4 .gw-r4__sw", {
      opacity: 0, y: 34, duration: 0.85, ease: "power3.out", stagger: 0.12,
      scrollTrigger: ST("#gw4 .gw-r4__sw--main", "top 84%"),
    });
    gsap.from("#gw4 .gw-r4__col", {
      opacity: 0, y: 16, duration: 0.7, ease: "power2.out", stagger: 0.12,
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

  /* defer 순서상 보통 준비되지만 CDN 지연 시 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => {
      if (init() || ++n > 30) clearInterval(t);
    }, 80);
  }
})();
