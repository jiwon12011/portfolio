/* =======================================================================
   making-mathhub.js — MathHub 제작 과정 본문 스크롤 모션
   -----------------------------------------------------------------------
   · scroller: #process-mathhub .process__content (모달 전용 스크롤러)
   · GSAP + ScrollTrigger, once 진입 트리거 위주 — transform/opacity만(60fps)
   · prefers-reduced-motion → 모션 없이 정상 표시(초기화 완료 처리)
   · 초기 상태는 gsap.from() 으로만 설정 → GSAP 미로드 시 요소가 그대로 보임
   · 절대배치(translateX(-50%)) 요소는 GSAP가 기존 transform(px)으로 보존하므로
     y/opacity 애니메이션이 중앙정렬을 깨지 않음.
   · ⚠ 단, position:static 래퍼(.mh-s2__quote)는 transform 주면 containing block이
     생겨 absolute 자식이 튀므로 opacity만 사용(fade).
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 refresh 호출 →
     mathhub 트리거도 함께 갱신됨. smooth-process.js 는 native scrollTop 을 lerp 하므로
     ScrollTrigger 와 공존(scroll 이벤트 그대로 발생).
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;

    const scroller = document.querySelector("#process-mathhub .process__content");
    if (!scroller) return true; // 마크업 없으면 통과

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* once 진입 트리거 공통 옵션 */
    const ST = (trigger, start = "top 84%") => ({ trigger, scroller, start, once: true });

    /* 셀렉터 각각을 "자기 자신" 트리거로 페이드+업 */
    const up = (sel, start = "top 86%", opt = {}) =>
      scroller.querySelectorAll(sel).forEach((el) =>
        gsap.from(el, Object.assign({
          opacity: 0, y: 24, duration: 0.8, ease: "power3.out",
          scrollTrigger: ST(el, start),
        }, opt)));

    /* 그룹을 "첫 요소" 트리거로 스태거 진입 */
    const group = (sel, start = "top 82%", opt = {}) => {
      const els = scroller.querySelectorAll(sel);
      if (!els.length) return;
      gsap.from(els, Object.assign({
        opacity: 0, y: 28, duration: 0.8, ease: "power3.out", stagger: 0.1,
        scrollTrigger: ST(els[0], start),
      }, opt));
    };

    /* opacity-only 페이드 (transform 금지 요소용) */
    const fade = (sel, start = "top 84%", opt = {}) =>
      scroller.querySelectorAll(sel).forEach((el) =>
        gsap.from(el, Object.assign({
          opacity: 0, duration: 1.0, ease: "power2.out",
          scrollTrigger: ST(el, start),
        }, opt)));

    /* ── 섹션 헤더(라벨/번호/제목/리드) 공통 진입 ──
       · __no/__cat: [class$=]는 modifier(__no--2)가 붙으면 매칭 실패 → mh1 서브헤더는 아래서 별도 처리
       · __title: [class*=]는 __panel-title/__before-title/__log-title/__pcard-title 까지 과매칭 →
         [class$="__title"](base) + [class*="__title--"](modifier)로 한정 */
    const header = (id) => {
      up(`${id} [class$="__no"], ${id} [class$="__cat"]`, "top 88%", { y: 16, duration: 0.7 });
      up(`${id} [class$="__title"], ${id} [class*="__title--"]`, "top 86%", { y: 28, duration: 0.95 });
      up(`${id} [class*="__lead"]`, "top 86%", { y: 22 });
    };

    /* ================================================================
       HERO (#mh-hero) — 키 비주얼 은은한 줌-세틀
    ================================================================ */
    const heroBg = scroller.querySelector("#mh-hero .mh-hero__bg");
    if (heroBg) gsap.from(heroBg, {
      scale: 1.06, opacity: 0.6, transformOrigin: "50% 50%",
      duration: 1.4, ease: "power3.out", scrollTrigger: ST("#mh-hero", "top 92%"),
    });

    /* ================================================================
       SECTION 1 · OVERVIEW + PROBLEM (#mh1)
    ================================================================ */
    header("#mh1");
    up("#mh1 .mh-s1__no--2, #mh1 .mh-s1__cat--2", "top 88%", { y: 16, duration: 0.7 }); /* PROBLEM FINDING 서브헤더(modifier 클래스) */
    group("#mh1 .mh-s1__card", "top 82%", { y: 24, stagger: 0.1 });
    up("#mh1 .mh-s1__shot", "top 80%", { y: 0, x: 44, duration: 1.0 });
    up("#mh1 .mh-s1__band", "top 82%", { y: 30 });
    group("#mh1 .mh-s1__pcard", "top 82%", { y: 32, stagger: 0.12 });
    fade("#mh1 .mh-s1__diagram", "top 82%", { duration: 1.0 }); /* 큰 이미지+drop-shadow → transform 재래스터 버벅임 회피, opacity만 */

    /* ================================================================
       SECTION 2 · IA REBUILD (#mh2)
    ================================================================ */
    header("#mh2");
    fade("#mh2 .mh-s2__quote", "top 80%", { duration: 1.1 });   /* static 래퍼 → opacity만 */
    up("#mh2 .mh-s2__panel", "top 84%", { y: 30 });
    up("#mh2 .mh-s2__pill, #mh2 .mh-s2__panel-title, #mh2 .mh-s2__panel-desc, #mh2 .mh-s2__before-shot",
       "top 82%", { y: 22 });
    group("#mh2 .mh-s2__cat-card", "top 84%", { y: 26, stagger: 0.1, ease: "back.out(1.3)" });

    /* ================================================================
       SECTION 3 · SEARCH & FILTER UX (#mh3)
    ================================================================ */
    header("#mh3");
    up("#mh3 .mh-s3__panel", "top 84%", { y: 30 });
    up("#mh3 .mh-s3__pill, #mh3 .mh-s3__before-title, #mh3 .mh-s3__before-desc", "top 82%", { y: 22 });
    up("#mh3 .mh-s3__before-shot", "top 80%", { y: 28, duration: 0.95 });
    group("#mh3 .mh-s3__shot", "top 80%", { y: 30, stagger: 0.12 });
    up("#mh3 .mh-s3__step", "top 80%", { y: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" });
    group("#mh3 .mh-s3__leg", "top 86%", { y: 22, stagger: 0.12 });

    /* ================================================================
       SECTION 4 · CONTENT NAVIGATION (#mh4)
    ================================================================ */
    header("#mh4");
    up("#mh4 .mh-s4__main", "top 78%", { y: 0, scale: 0.97, opacity: 0, transformOrigin: "50% 50%", duration: 1.0, ease: "power3.out" });
    group("#mh4 .mh-s4__shot", "top 82%", { y: 26, stagger: 0.12 });
    group("#mh4 .mh-s4__leg", "top 86%", { y: 22, stagger: 0.12 });
    fade("#mh4 .mh-s4__conn", "top 82%", { duration: 0.8 });
    up("#mh4 .mh-s4__node", "top 82%", { y: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.2)" });

    /* ================================================================
       SECTION 5 · PAGE-SPECIFIC UI (#mh5)
    ================================================================ */
    header("#mh5");
    up("#mh5 .mh-s5__panel", "top 84%", { y: 30 });
    up("#mh5 .mh-s5__badge", "top 84%", { y: 0, scale: 0.5, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(1.8)" });
    up("#mh5 .mh-s5__cat, #mh5 .mh-s5__sub, #mh5 .mh-s5__desc", "top 84%", { y: 20 });
    group("#mh5 .mh-s5__shot--1, #mh5 .mh-s5__shot--2, #mh5 .mh-s5__shot--3", "top 80%", { y: 28, stagger: 0.1 });
    group("#mh5 .mh-s5__shot--4, #mh5 .mh-s5__shot--5", "top 80%", { y: 28, stagger: 0.1 });
    group("#mh5 .mh-s5__shot--6, #mh5 .mh-s5__shot--7", "top 80%", { y: 28, stagger: 0.1 });

    /* ================================================================
       SECTION 6 · COLOR GUIDELINES (#mh6)
    ================================================================ */
    header("#mh6");
    group("#mh6 .mh-s6__card", "top 84%", { y: 34, stagger: 0.1, duration: 0.85 });

    /* ================================================================
       SECTION 7 · TROUBLESHOOTING + OUTRO (#mh7)
    ================================================================ */
    header("#mh7");
    up("#mh7 .mh-s7__log", "top 82%", { x: -36, y: 0, duration: 0.95 });
    up("#mh7 .mh-s7__gh, #mh7 .mh-s7__log-title, #mh7 .mh-s7__log-divider", "top 82%", { y: 18, duration: 0.7 });
    group("#mh7 .mh-s7__commit", "top 80%", { y: 22, stagger: 0.12 });
    up("#mh7 .mh-s7__dot", "top 80%", { y: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.2)" });
    up("#mh7 .mh-s7__code", "top 78%", { x: 44, y: 0, duration: 1.0 });
    /* outro 3종은 translateX(-50%) 중앙정렬 → clearProps로 완료 후 CSS 복원(리사이즈 안전) */
    up("#mh7 .mh-s7__outro", "top 84%", { y: 28, duration: 0.95, clearProps: "transform" });
    up("#mh7 .mh-s7__outro-1, #mh7 .mh-s7__outro-2", "top 86%", { y: 22, clearProps: "transform" });
    gsap.from("#mh7 .mh-s7__hero", {
      opacity: 0, scale: 1.05, transformOrigin: "50% 60%",
      duration: 1.4, ease: "power3.out", scrollTrigger: ST("#mh7 .mh-s7__hero", "top 88%"),
    });

    /* ── 이미지 로드 후 위치 재계산(레이아웃 점프 보정) ── */
    scroller.querySelectorAll(".process__making--mathhub img").forEach((img) => {
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
