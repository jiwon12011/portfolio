/* =======================================================================
   making-yumi.js — 유미의 세포들 제작 과정 본문 스크롤 모션
   -----------------------------------------------------------------------
   · scroller: #process-yumi .process__content (모달 전용 스크롤러)
   · GSAP + ScrollTrigger, once 진입 트리거 — transform/opacity만(60fps)
   · prefers-reduced-motion → 모션 없이 정상 표시
   · 초기 상태는 gsap.from() 으로만 → GSAP 미로드 시 요소 그대로 보임
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 refresh
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;
    const scroller = document.querySelector("#process-yumi .process__content");
    if (!scroller) return true;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    const ST = (trigger, start = "top 84%") => ({ trigger, scroller, start, once: true });

    /* 섹션 헤더(번호/이브로/제목/리드) 공통 페이드+업 */
    const header = (id) => {
      const sec = scroller.querySelector(id);
      if (!sec) return;
      const els = sec.querySelectorAll('[class*="__num"],[class*="__eyebrow"],[class*="__title"],[class*="__lead"]');
      if (els.length) gsap.from(els, {
        opacity: 0, y: 22, duration: 0.8, ease: "power3.out", stagger: 0.08,
        scrollTrigger: ST(sec, "top 86%"),
      });
    };
    const stagger = (sel, trigger, opt = {}) => {
      const els = scroller.querySelectorAll(sel);
      if (!els.length) return;
      gsap.from(els, Object.assign({
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.1,
        scrollTrigger: ST(trigger || els[0], "top 84%"),
      }, opt));
    };

    /* 히어로 — 줌-세틀 */
    const heroImg = scroller.querySelector("#ym-hero .ym-hero__img");
    if (heroImg) gsap.from(heroImg, {
      opacity: 0, scale: 1.06, transformOrigin: "50% 50%", duration: 1.4, ease: "power3.out",
      scrollTrigger: ST("#ym-hero", "top 88%"),
    });

    /* SECTION 1 — 5 카드 팝 */
    header("#ym1");
    stagger("#ym1 .ym-r1__card", "#ym1 .ym-r1__card--c1",
      { y: 32, scale: 0.96, transformOrigin: "50% 50%", ease: "back.out(1.3)", stagger: 0.09 });

    /* SECTION 2 — 팔레트/씬/캐릭터 */
    header("#ym2");
    gsap.from("#ym2 .ym-r2__palette", { opacity: 0, y: 34, duration: 0.9, ease: "power3.out",
      scrollTrigger: ST("#ym2 .ym-r2__palette", "top 84%") });
    gsap.from("#ym2 .ym-r2__scene", { opacity: 0, x: 40, duration: 1.0, ease: "power3.out",
      scrollTrigger: ST("#ym2 .ym-r2__scene", "top 82%") });
    stagger("#ym2 .ym-r2__cha", "#ym2 .ym-r2__cha--1",
      { y: 24, scale: 0.7, transformOrigin: "50% 100%", ease: "back.out(1.6)", duration: 0.6, stagger: 0.07 });

    /* SECTION 3 — 설계포인트/그룹/메뉴카드 */
    header("#ym3");
    gsap.from("#ym3 .ym-r3__points", { opacity: 0, x: -36, duration: 0.9, ease: "power3.out",
      scrollTrigger: ST("#ym3 .ym-r3__points", "top 84%") });
    gsap.from("#ym3 .ym-r3__group", { opacity: 0, y: 30, scale: 0.94, transformOrigin: "50% 100%",
      duration: 0.95, ease: "back.out(1.4)", scrollTrigger: ST("#ym3 .ym-r3__group", "top 84%") });
    stagger("#ym3 .ym-r3__menu", "#ym3 .ym-r3__menu--home", { x: 36, y: 0, ease: "power3.out", stagger: 0.08 });

    /* SECTION 4 — 3 카드 */
    header("#ym4");
    stagger("#ym4 .ym-r4__card", "#ym4 .ym-r4__card--1", { y: 34, stagger: 0.12 });

    /* SECTION 5 — 4 문제카드 */
    header("#ym5");
    stagger("#ym5 .ym-r5__q", "#ym5 .ym-r5__q--1", { y: 32, scale: 0.97, transformOrigin: "50% 50%", stagger: 0.1 });

    /* SECTION 6 — 4 인사이트 카드 + 인용구 */
    header("#ym6");
    stagger("#ym6 .ym-r6__card", "#ym6 .ym-r6__card--1", { y: 30, stagger: 0.1 });
    gsap.from("#ym6 .ym-r6__quote", { opacity: 0, y: 28, scale: 0.98, transformOrigin: "50% 50%",
      duration: 0.9, ease: "back.out(1.2)", scrollTrigger: ST("#ym6 .ym-r6__quote", "top 88%") });

    /* OUTRO — 줌-세틀 */
    const outImg = scroller.querySelector("#ym-outro .ym-outro__img");
    if (outImg) gsap.from(outImg, {
      opacity: 0, scale: 1.06, transformOrigin: "50% 50%", duration: 1.4, ease: "power3.out",
      scrollTrigger: ST("#ym-outro", "top 86%"),
    });

    /* 이미지 로드 후 위치 재계산 */
    scroller.querySelectorAll(".process__making--yumi img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", () => {
        try { ScrollTrigger.refresh(); } catch (e) {}
      }, { once: true });
    });

    return true;
  };

  if (!init()) {
    let n = 0;
    const t = setInterval(() => { if (init() || ++n > 30) clearInterval(t); }, 80);
  }
})();
