/* =======================================================================
   making-pledis.js — 플레디스 제작 과정 본문 스크롤 모션
   -----------------------------------------------------------------------
   · scroller: #process-pledis .process__content (모달 전용 스크롤러)
   · GSAP + ScrollTrigger, once 진입 트리거 — transform/opacity만(60fps)
   · prefers-reduced-motion → 모션 없이 정상 표시
   · 초기 상태는 gsap.from() 으로만 → GSAP 미로드 시 요소 그대로 보임
   · 다른 프로젝트 대비 한 단계 강한 연출(거리↑, expo.out, stagger 더 또렷)
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 refresh 호출
   -----------------------------------------------------------------------
   [버그 수정 2025-06]
   · 기본 start "top 84%" → "top 90%" (짧은 모달 스크롤러에서 도달 불가 문제)
   · header() 내부 start "top 86%" → "top 92%"
   · pd7 img / pd8 outro: "top bottom" — 섹션 진입 즉시 발동 보장
   · 안전망 추가: 스크롤러 바닥 도달 시 미발동 once 트리거를 즉시 완료
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;

    const scroller = document.querySelector("#process-pledis .process__content");
    if (!scroller) return true; // 마크업 없으면 통과

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* once 진입 트리거 공통 옵션
       기본값 "top 90%"로 여유 확보 — 짧은 모달 스크롤러에서 하위 섹션 도달 불가 방지 */
    const ST = (trigger, start = "top 90%") => ({ trigger, scroller, start, once: true });

    /* 공통 섹션 헤더(번호/이브로/제목/리드) — 기존 프로젝트 대비 거리·이징 강화 */
    const header = (id) => {
      const sec = scroller.querySelector(id);
      if (!sec) return;
      const els = sec.querySelectorAll(
        '[class*="__num"],[class*="__eyebrow"],[class*="__h1"],[class*="__h2"],[class*="__lead"]'
      );
      if (!els.length) return;
      gsap.from(els, {
        opacity: 0, y: 40, duration: 1.05, ease: "expo.out", stagger: 0.1,
        scrollTrigger: ST(sec, "top 92%"),  /* 86% → 92%: 짧은 스크롤러 대응 */
        /* 완료 후 인라인 transform 제거 — 그라데이션 채움(background-clip:text)+외곽선(text-stroke)
           숫자에 식별 transform 이 남으면 webkit 에서 채움/외곽선이 어긋나 ghost 가 생김. */
        clearProps: "transform",
      });
    };

    /* ================================================================
       SECTION · 히어로 (#pd-hero) — 시네마틱 진입
       배경 줌-세틀(scale 1.14) + 로고 스케일인 + 타이틀/메타 라인별 stagger
    ================================================================ */
    const heroBg = scroller.querySelector("#pd-hero .pd-hero__img");
    if (heroBg) gsap.from(heroBg, {
      opacity: 0.15, scale: 1.14, transformOrigin: "50% 50%",
      duration: 1.9, ease: "power3.out",
      scrollTrigger: ST("#pd-hero", "top 92%"),
    });

    const heroLogo = scroller.querySelector("#pd-hero .pd-hero__logo");
    if (heroLogo) gsap.from(heroLogo, {
      opacity: 0, y: 44, scale: 0.86, transformOrigin: "50% 50%",
      duration: 1.15, delay: 0.2, ease: "expo.out",
      scrollTrigger: ST("#pd-hero", "top 90%"),
    });

    /* 타이틀·메타 — 라인별 순차 */
    [".pd-hero__title", ".pd-hero__meta"].forEach((sel, i) => {
      const el = scroller.querySelector(`#pd-hero ${sel}`);
      if (el) gsap.from(el, {
        opacity: 0, y: 26, duration: 0.95, ease: "expo.out", delay: 0.38 + i * 0.12,
        scrollTrigger: ST("#pd-hero", "top 90%"),
      });
    });

    /* ================================================================
       SECTION 1 · WHY REDESIGN (#pd-r1)
       — 헤더 stagger / 스크린샷 레이어별 속도차 / nav라벨 / 카드 팝
    ================================================================ */
    header("#pd-r1");

    /* Before 라벨 */
    gsap.from("#pd-r1 .pd-r1__before, #pd-r1 .pd-r1__before-sub", {
      opacity: 0, y: 22, duration: 0.8, ease: "power3.out", stagger: 0.09,
      scrollTrigger: ST("#pd-r1 .pd-r1__ss--1", "top 92%"),
    });

    /* 스크린샷 4개 — 레이어별 y 오프셋으로 깊이감 */
    ["--1", "--2", "--3", "--4"].forEach((suf, i) => {
      const el = scroller.querySelector(`#pd-r1 .pd-r1__ss${suf}`);
      if (!el) return;
      gsap.from(el, {
        opacity: 0,
        y: 46 + i * 12,   /* 뒤 요소일수록 더 멀리서 진입 */
        scale: 0.94,
        transformOrigin: "50% 50%",
        duration: 1.0, ease: "power3.out",
        scrollTrigger: ST(el, "top 92%"),
      });
    });

    /* nav 라벨 4개 — 위에서 순차 */
    gsap.from("#pd-r1 .pd-r1__nav", {
      opacity: 0, y: 20, duration: 0.75, ease: "power3.out", stagger: 0.1,
      scrollTrigger: ST("#pd-r1 .pd-r1__nav--1", "top 90%"),
    });

    /* 문제점 카드 3개 — scale 팝 + stagger */
    gsap.from("#pd-r1 .pd-r1__card", {
      opacity: 0, y: 48, scale: 0.92, transformOrigin: "50% 50%",
      duration: 0.95, ease: "back.out(1.4)", stagger: 0.15,
      scrollTrigger: ST("#pd-r1 .pd-r1__card--1", "top 90%"),
    });

    /* ================================================================
       SECTION 2 · REDESIGN DIRECTION (#pd2)
       — 카드 왼쪽 슬라이드(x: -54) + 다이어그램 스케일인
    ================================================================ */
    header("#pd2");

    gsap.from("#pd2 .pd-r2__card", {
      opacity: 0, x: -54, duration: 1.05, ease: "expo.out", stagger: 0.16,
      scrollTrigger: ST("#pd2 .pd-r2__card--1", "top 90%"),  /* 84% → 90% */
    });

    gsap.from("#pd2 .pd-r2__diagram", {
      opacity: 0, y: 52, scale: 0.87, transformOrigin: "50% 50%",
      duration: 1.15, ease: "back.out(1.3)",
      scrollTrigger: ST("#pd2 .pd-r2__diagram", "top 90%"),  /* 84% → 90% */
    });

    /* ================================================================
       SECTION 3 · MAIN EXPERIENCE (#pd3)
       — 스크린 좌우 교차 진입 / flow 아이템 badge 팝 + 텍스트 stagger
    ================================================================ */
    header("#pd3");

    const screenHero = scroller.querySelector("#pd3 .pd-r3__screen--hero");
    const screenFlow = scroller.querySelector("#pd3 .pd-r3__screen--flow");
    if (screenHero) gsap.from(screenHero, {
      opacity: 0, x: -60, duration: 1.1, ease: "expo.out",
      scrollTrigger: ST(screenHero, "top 88%"),
    });
    if (screenFlow) gsap.from(screenFlow, {
      opacity: 0, x: 60, duration: 1.1, ease: "expo.out",
      scrollTrigger: ST(screenFlow, "top 88%"),  /* 80% → 88%: 너무 안쪽 기준값 완화 */
    });

    /* flow 5개 아이템 — 행별 badge 팝 + 텍스트 x 슬라이드 */
    scroller.querySelectorAll("#pd3 .pd-r3__item").forEach((item) => {
      const badge = item.querySelector(".pd-r3__badge");
      const tl = gsap.timeline({ scrollTrigger: ST(item, "top 92%") });  /* 88% → 92% */
      if (badge) tl.from(badge, {
        opacity: 0, scale: 0.45, transformOrigin: "50% 50%",
        duration: 0.6, ease: "back.out(2.2)",
      }, 0);
      const texts = item.querySelectorAll("strong, em, p");
      if (texts.length) tl.from(texts, {
        opacity: 0, x: 30, duration: 0.75, ease: "power3.out", stagger: 0.08,
      }, 0.1);
    });

    /* ================================================================
       SECTION 4 · SUB PAGE REDESIGN (#pd4)
       — 카드 순차 y 진입 / before·after 샷 좌우 분리
    ================================================================ */
    header("#pd4");

    scroller.querySelectorAll("#pd4 .pd-r4__card").forEach((card) => {
      const tl = gsap.timeline({ scrollTrigger: ST(card, "top 90%") });  /* 86% → 90% */
      /* 카드 전체 진입 */
      tl.from(card, {
        opacity: 0, y: 60, scale: 0.95, transformOrigin: "50% 50%",
        duration: 1.05, ease: "expo.out",
      }, 0);
      /* before/after 샷 좌우 분리(카드 내부) */
      const before = card.querySelector(".pd-r4__shot--before");
      const after = card.querySelector(".pd-r4__shot--after");
      if (before) tl.from(before, { opacity: 0, x: -36, duration: 0.9, ease: "power3.out" }, 0.28);
      if (after) tl.from(after, { opacity: 0, x: 36, duration: 0.9, ease: "power3.out" }, 0.38);
    });

    /* ================================================================
       SECTION 5 · AI WORKFLOW (#pd5)
       — 두 카드 좌우 교차 진입 / 내부 요소 딜레이 stagger
    ================================================================ */
    header("#pd5");

    const cardPrompt = scroller.querySelector("#pd5 .pd-r5__card--prompt");
    const cardCode = scroller.querySelector("#pd5 .pd-r5__card--code");

    if (cardPrompt) {
      const tl = gsap.timeline({ scrollTrigger: ST(cardPrompt, "top 90%") });  /* 84% → 90% */
      tl.from(cardPrompt, { opacity: 0, x: -54, duration: 1.1, ease: "expo.out" }, 0);
      const visual = cardPrompt.querySelector(".pd-r5__visual");
      const prompt = cardPrompt.querySelector(".pd-r5__prompt");
      if (visual) tl.from(visual, { opacity: 0, y: 30, duration: 0.85, ease: "power3.out" }, 0.32);
      if (prompt) tl.from(prompt, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" }, 0.48);
    }

    if (cardCode) {
      const tl = gsap.timeline({ scrollTrigger: ST(cardCode, "top 90%") });  /* 84% → 90% */
      tl.from(cardCode, { opacity: 0, x: 54, duration: 1.1, ease: "expo.out" }, 0);
      const chips = cardCode.querySelector(".pd-r5__chips");
      const codeimg = cardCode.querySelector(".pd-r5__codeimg");
      if (chips) tl.from(chips, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" }, 0.32);
      if (codeimg) tl.from(codeimg, { opacity: 0, y: 30, duration: 0.85, ease: "power3.out" }, 0.44);
    }

    /* ================================================================
       SECTION 6 · TROUBLE & SOLUTION (#pd6)
       — pd6는 DOM 순서가 lead/h1/h2 → num/eyebrow 로 다름 → 직접 쿼리
       — 카드 3개 순차 y 진입
    ================================================================ */
    const pd6Heads = scroller.querySelectorAll(
      "#pd6 .pd-r6__lead, #pd6 .pd-r6__h1, #pd6 .pd-r6__h2, #pd6 .pd-r6__num, #pd6 .pd-r6__eyebrow"
    );
    if (pd6Heads.length) gsap.from(pd6Heads, {
      opacity: 0, y: 40, duration: 1.05, ease: "expo.out", stagger: 0.1,
      scrollTrigger: ST("#pd6 .pd-r6__lead", "top 92%"),  /* 86% → 92% */
      clearProps: "transform",   // 숫자 ghost 방지(완료 후 인라인 transform 제거)
    });

    /* 카드 3개 — y 진입 + stagger */
    gsap.from("#pd6 .pd-r6__card", {
      opacity: 0, y: 54, scale: 0.94, transformOrigin: "50% 50%",
      duration: 1.0, ease: "power3.out", stagger: 0.18,
      scrollTrigger: ST("#pd6 .pd-r6__card--1", "top 90%"),  /* 84% → 90% */
    });

    /* ================================================================
       SECTION 7 · RESULT (#pd7)
       — 헤더 stagger + 결과 이미지 줌-세틀
       — "top bottom": 짧은 스크롤러에서 섹션 top이 84%에 도달 불가 → 진입 즉시 발동
    ================================================================ */
    header("#pd7");

    gsap.from("#pd7 .pd-r7__img", {
      opacity: 0, y: 44, scale: 1.07, transformOrigin: "50% 50%",
      duration: 1.35, ease: "power3.out",
      scrollTrigger: ST("#pd7 .pd-r7__img", "top bottom"),  /* 84% → "top bottom": 도달 보장 */
    });

    /* ================================================================
       SECTION 8 · OUTRO (#pd8) — 강한 줌-세틀
       — "top bottom": 마지막 섹션, 짧은 스크롤러에서 진입 즉시 발동 필수
    ================================================================ */
    const outroImg = scroller.querySelector("#pd8 .pd-outro__img");
    if (outroImg) gsap.from(outroImg, {
      opacity: 0, scale: 1.11, transformOrigin: "50% 50%",
      duration: 1.9, ease: "power3.out",
      scrollTrigger: ST("#pd8", "top bottom"),  /* 86% → "top bottom": 도달 보장 */
    });

    /* ================================================================
       안전망: 스크롤러 바닥 도달 시 미발동 once 트리거를 즉시 완료
       — 짧은 스크롤러에서 threshold 미도달로 고착된 opacity:0 요소 구제
       — once:true 트리거는 발동 후 자가 kill → getAll()에 남은 것 = 미발동
    ================================================================ */
    let safetyFired = false;
    scroller.addEventListener("scroll", function safetyNet() {
      if (safetyFired) return;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      if (scrollTop + clientHeight < scrollHeight - 2) return;
      safetyFired = true;
      scroller.removeEventListener("scroll", safetyNet);
      ScrollTrigger.getAll().forEach(st => {
        /* 이 스크롤러 소속이고 once인 것만 처리 */
        if (st.vars.scroller !== scroller || !st.vars.once) return;
        try {
          const anim = st.animation;
          if (anim && anim.totalProgress() < 1) {
            anim.progress(1, true); /* 최종 상태로 즉시 점프 */
            st.kill();
          }
        } catch (e) {}
      });
    }, { passive: true });

    /* ── 이미지 로드 후 위치 재계산(레이아웃 점프 보정) ── */
    scroller.querySelectorAll(".process__making--pledis img").forEach((img) => {
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
