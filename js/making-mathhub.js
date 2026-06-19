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
   -----------------------------------------------------------------------
   [모션 8종 구현 — 2026-06-19]
   · mh-hero : 배경 줌 유지 + 워드마크 2비트 지연 등장(+0.15s fade+up)
   · mh1     : pcard-no data-count 숫자 카운트업(00→01/02/03, once)
   · mh2     : after 패널 진입 파란 틴트 gsap.fromTo backgroundColor
   · mh-search: (03~04 사이 독립 밴드) 검색창 등장 → 키워드 타이핑 → 필터칩 back.out 팝
   · mh3     : AFTER 스크린샷 stagger reveal
   · mh4     : conn clip-path inset 와이프 + 노드 팝 체이닝 타임라인
               [교체] 기존 fade(conn) + 별도 up(node)
   · mh5     : 스크린샷 3그룹 진입 방향 교차 리듬(y↑ / x← / y↓)
               [교체] 기존 3 group 호출(방향만 달라짐)
   · mh6     : 컬러 스와치 clip-path 페인트-필(아래→위) + 텍스트 절반 후 등장
               + 섹션 파란 배경 틴트 clearProps
               [교체] 기존 group card
   · mh7     : commit 항목 ctype←28 / cmsg→28 row별 타임라인(gw7 패턴)
               [교체] 기존 group(".mh-s7__commit")
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
       · __title: [class$="__title"](base) + [class*="__title--"](modifier)로 한정 */
    const header = (id) => {
      up(`${id} [class$="__no"], ${id} [class$="__cat"]`, "top 88%", { y: 16, duration: 0.7 });
      up(`${id} [class$="__title"], ${id} [class*="__title--"]`, "top 86%", { y: 28, duration: 0.95 });
      up(`${id} [class*="__lead"]`, "top 86%", { y: 22 });
    };

    /* ================================================================
       HERO (#mh-hero)
       [기존] 배경 줌-세틀
       [추가] 워드마크 2비트 지연 등장 — gwihon gw-hero 패턴
    ================================================================ */
    const heroBg = scroller.querySelector("#mh-hero .mh-hero__bg");
    if (heroBg) gsap.from(heroBg, {
      scale: 1.06, opacity: 0.6, transformOrigin: "50% 50%",
      duration: 1.4, ease: "power3.out",
      scrollTrigger: ST("#mh-hero", "top 92%"),
    });

    /* ================================================================
       SECTION 1 · OVERVIEW + PROBLEM (#mh1)
       [기존] 헤더·카드·shot·band·pcard·diagram 유지
       [추가] pcard-no data-count 카운트업 (once, 00→01/02/03)
    ================================================================ */
    header("#mh1");
    /* PROBLEM FINDING 서브헤더(modifier 클래스) */
    up("#mh1 .mh-s1__no--2, #mh1 .mh-s1__cat--2", "top 88%", { y: 16, duration: 0.7 });
    group("#mh1 .mh-s1__card", "top 82%", { y: 24, stagger: 0.1 });
    up("#mh1 .mh-s1__shot", "top 80%", { y: 0, x: 44, duration: 1.0 });
    up("#mh1 .mh-s1__band", "top 82%", { y: 30 });
    group("#mh1 .mh-s1__pcard", "top 82%", { y: 32, stagger: 0.12 });
    /* 큰 이미지+drop-shadow → opacity만 (레이아웃 유발 회피) */
    fade("#mh1 .mh-s1__diagram", "top 82%", { duration: 1.0 });

    /* pcard-no 숫자 카운트업 (data-count 속성이 있는 요소만) */
    scroller.querySelectorAll("#mh1 .mh-s1__pcard-no[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 0.65, ease: "power2.out",
        onUpdate() { el.textContent = String(Math.round(obj.v)).padStart(2, "0"); },
        scrollTrigger: ST(el, "top 88%"),
      });
    });

    /* ================================================================
       SECTION 2 · IA REBUILD (#mh2)
       [기존] 헤더·quote·panel·pill·cat-card 유지
       [추가] after 패널 파란 틴트 fromTo(backgroundColor)
    ================================================================ */
    header("#mh2");
    fade("#mh2 .mh-s2__quote", "top 80%", { duration: 1.1 });   /* static 래퍼 → opacity만 */
    up("#mh2 .mh-s2__panel", "top 84%", { y: 30 });
    up("#mh2 .mh-s2__pill, #mh2 .mh-s2__panel-title, #mh2 .mh-s2__panel-desc, #mh2 .mh-s2__before-shot",
       "top 82%", { y: 22 });
    group("#mh2 .mh-s2__cat-card", "top 84%", { y: 26, stagger: 0.1, ease: "back.out(1.3)" });

    /* After 패널 파란 틴트 (Before 대비 강화) */
    const afterPanel2 = scroller.querySelector("#mh2 .mh-s2__panel--after");
    if (afterPanel2) {
      gsap.fromTo(afterPanel2,
        { backgroundColor: "rgba(49,110,250,0)" },
        {
          backgroundColor: "rgba(49,110,250,0.05)",
          duration: 1.1, ease: "power1.out",
          scrollTrigger: ST(afterPanel2, "top 78%"),
        }
      );
    }

    /* ================================================================
       SECTION 3 · SEARCH & FILTER UX (#mh3)
       [기존] 헤더·panel·pill·before-shot/title/desc·step·leg 유지
       [교체] group("#mh3 .mh-s3__shot") →
              검색창 타이핑 → 칩 팝 → 스크린샷 stagger 시퀀스
              (mock 요소 없으면 폴백으로 기존 group 실행)
    ================================================================ */
    header("#mh3");
    up("#mh3 .mh-s3__panel", "top 84%", { y: 30 });
    up("#mh3 .mh-s3__pill, #mh3 .mh-s3__before-title, #mh3 .mh-s3__before-desc", "top 82%", { y: 22 });
    up("#mh3 .mh-s3__before-shot", "top 80%", { y: 28, duration: 0.95 });
    up("#mh3 .mh-s3__step", "top 80%", {
      y: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)",
    });
    group("#mh3 .mh-s3__leg", "top 86%", { y: 22, stagger: 0.12 });

    /* AFTER 스크린샷 — 일반 stagger reveal (검색 데모는 별도 밴드로 분리됨) */
    group("#mh3 .mh-s3__shot", "top 80%", { y: 30, stagger: 0.12 });

    /* ================================================================
       검색 밴드 (#mh-search · mh2~mh3 사이 독립 밴드)
       크게 키운 검색창: 등장 → 키워드 타이핑 → 필터칩 back.out 팝 (once)
    ================================================================ */
    const searchBar   = scroller.querySelector("#mh-search .mh-search__bar");
    const searchText  = searchBar && searchBar.querySelector(".mh-search__text");
    const searchChips = searchBar ? Array.from(searchBar.querySelectorAll(".mh-search__chip")) : [];
    if (searchBar && searchText) {
      gsap.set(searchBar, { opacity: 0, y: 16 });
      if (searchChips.length) gsap.set(searchChips, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });
      ScrollTrigger.create({
        trigger: "#mh-search", scroller, start: "top 78%", once: true,
        onEnter() {
          const keyword = "기출 수학 SAT";
          let idx = 0;
          gsap.to(searchBar, {
            opacity: 1, y: 0, duration: 0.42, ease: "power2.out",
            onComplete() {
              const tid = setInterval(() => {
                idx++;
                searchText.textContent = keyword.slice(0, idx);
                if (idx >= keyword.length) {
                  clearInterval(tid);
                  if (searchChips.length) gsap.to(searchChips, {
                    opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2)", stagger: 0.1,
                    onComplete() { searchChips.forEach((c) => c.classList.add("is-active")); },
                  });
                }
              }, 80);
            },
          });
        },
      });
    }

    /* ================================================================
       SECTION 4 · CONTENT NAVIGATION (#mh4)
       [기존] 헤더·main·shot·leg 유지
       [교체] fade(conn) + up(node) →
              conn clip-path inset(0 100% 0 0)→(0 0 0 0) 와이프 +
              노드 팝 체이닝 타임라인
    ================================================================ */
    header("#mh4");
    up("#mh4 .mh-s4__main", "top 78%", {
      y: 0, scale: 0.97, opacity: 0, transformOrigin: "50% 50%", duration: 1.0, ease: "power3.out",
    });
    group("#mh4 .mh-s4__shot", "top 82%", { y: 26, stagger: 0.12 });
    group("#mh4 .mh-s4__leg", "top 86%", { y: 22, stagger: 0.12 });

    /* conn 클립 와이프 + 노드 팝 체이닝 */
    const connEls = [1, 2, 3].map((n) => scroller.querySelector(`#mh4 .mh-s4__conn--${n}`));
    const nodeEls = [1, 2, 3].map((n) => scroller.querySelector(`#mh4 .mh-s4__node--${n}`));
    const firstConn = connEls.find(Boolean);
    if (firstConn) {
      const connTl = gsap.timeline({ scrollTrigger: ST(firstConn, "top 82%") });
      connEls.forEach((conn, i) => {
        if (!conn) return;
        /* 연결선 왼→오른 클립 와이프 */
        connTl.from(conn, {
          clipPath: "inset(0 100% 0 0)", duration: 0.48, ease: "power2.inOut",
        }, i * 0.24);
        /* 노드: 와이프 완료 직후 팝 */
        const node = nodeEls[i];
        if (node) connTl.from(node, {
          opacity: 0, scale: 0, transformOrigin: "50% 50%",
          duration: 0.38, ease: "back.out(2.2)",
        }, i * 0.24 + 0.42);
      });
    }

    /* ================================================================
       SECTION 5 · PAGE-SPECIFIC UI (#mh5)
       [기존] 헤더·panel·badge·cat/sub/desc 유지
       [교체] 스크린샷 그룹 진입 방향 교차 리듬
              그룹1(shot--1~3) y↑ 아래에서 / 그룹2(shot--4~5) x← 왼쪽에서
              / 그룹3(shot--6~7) y↓ 위에서
    ================================================================ */
    header("#mh5");
    up("#mh5 .mh-s5__panel", "top 84%", { y: 30 });
    up("#mh5 .mh-s5__badge", "top 84%", {
      y: 0, scale: 0.5, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(1.8)",
    });
    up("#mh5 .mh-s5__cat, #mh5 .mh-s5__sub, #mh5 .mh-s5__desc", "top 84%", { y: 20 });

    /* 방향 교차 리듬 */
    group(
      "#mh5 .mh-s5__shot--1, #mh5 .mh-s5__shot--2, #mh5 .mh-s5__shot--3",
      "top 80%",
      { y: 28, x: 0, stagger: 0.1 }          /* y↑ — 아래에서 */
    );
    group(
      "#mh5 .mh-s5__shot--4, #mh5 .mh-s5__shot--5",
      "top 80%",
      { y: 0, x: -44, stagger: 0.1 }         /* x← — 왼쪽에서 */
    );
    group(
      "#mh5 .mh-s5__shot--6, #mh5 .mh-s5__shot--7",
      "top 80%",
      { y: -28, x: 0, stagger: 0.1 }         /* y↓ — 위에서 */
    );

    /* ================================================================
       SECTION 6 · COLOR GUIDELINES (#mh6)
       [기존] 헤더 유지
       [교체] group(card) →
              카드별 타임라인: 스와치 clip-path 페인트-필(아래→위) +
              텍스트 절반 후 등장 + 섹션 파란 배경 틴트(clearProps)
    ================================================================ */
    header("#mh6");

    /* 섹션 진입 파란 배경 틴트 (clearProps로 완료 후 CSS 복원) */
    const s6 = scroller.querySelector("#mh6");
    if (s6) {
      gsap.fromTo(s6,
        { backgroundColor: "rgba(49,110,250,0)" },
        {
          backgroundColor: "rgba(49,110,250,0.04)",
          duration: 1.4, ease: "power1.out",
          clearProps: "backgroundColor",
          scrollTrigger: ST(s6, "top 72%"),
        }
      );
    }

    /* 컬러카드 페인트-필 */
    scroller.querySelectorAll("#mh6 .mh-s6__card").forEach((card, i) => {
      const swatch = card.querySelector(".mh-s6__swatch");
      const texts  = card.querySelectorAll(".mh-s6__name, .mh-s6__hex");
      const tl = gsap.timeline({
        scrollTrigger: ST(card, "top 86%"),
        delay: i * 0.1,
      });
      /* 카드 전체: 살짝 스케일 인 */
      tl.from(card, {
        opacity: 0, scale: 0.93, transformOrigin: "50% 50%",
        duration: 0.48, ease: "power3.out",
      }, 0);
      /* 스와치: 아래→위 페인트 필 */
      if (swatch) tl.from(swatch, {
        clipPath: "inset(100% 0 0 0)", duration: 0.68, ease: "power2.out",
      }, 0.12);
      /* 텍스트: 스와치 50% 지점(~0.46s) 이후 등장 */
      if (texts.length) tl.from(texts, {
        opacity: 0, y: 8, duration: 0.45, ease: "power2.out", stagger: 0.1,
      }, 0.46);
    });

    /* ================================================================
       SECTION 7 · TROUBLESHOOTING + OUTRO (#mh7)
       [기존] 헤더·log·gh·log-title·log-divider·dot·code·outro 유지
       [교체] group(".mh-s7__commit") →
              row별 타임라인: ctype x:-28 / cmsg x:28 (gw7 패턴)
    ================================================================ */
    header("#mh7");
    up("#mh7 .mh-s7__log", "top 82%", { x: -36, y: 0, duration: 0.95 });
    up("#mh7 .mh-s7__gh, #mh7 .mh-s7__log-title, #mh7 .mh-s7__log-divider", "top 82%", {
      y: 18, duration: 0.7,
    });

    /* commit 좌우 reveal — gw7 패턴 이식 */
    scroller.querySelectorAll("#mh7 .mh-s7__commit").forEach((commit) => {
      const ctype = commit.querySelector(".mh-s7__ctype");
      const cmsg  = commit.querySelector(".mh-s7__cmsg");
      const tl = gsap.timeline({ scrollTrigger: ST(commit, "top 88%") });
      if (ctype) tl.from(ctype, { opacity: 0, x: -28, duration: 0.68, ease: "power3.out" }, 0);
      if (cmsg)  tl.from(cmsg,  { opacity: 0, x: 28,  duration: 0.68, ease: "power3.out" }, 0.24);
    });

    up("#mh7 .mh-s7__dot", "top 80%", {
      y: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.2)",
    });
    up("#mh7 .mh-s7__code", "top 78%", { x: 44, y: 0, duration: 1.0 });
    /* outro: translateX(-50%) 중앙정렬 → clearProps로 완료 후 CSS 복원 */
    up("#mh7 .mh-s7__outro", "top 84%", { y: 28, duration: 0.95, clearProps: "transform" });
    up("#mh7 .mh-s7__outro-1, #mh7 .mh-s7__outro-2", "top 86%", { y: 22, clearProps: "transform" });
    gsap.from("#mh7 .mh-s7__hero", {
      opacity: 0, scale: 1.05, transformOrigin: "50% 60%",
      duration: 1.4, ease: "power3.out",
      scrollTrigger: ST("#mh7 .mh-s7__hero", "top 88%"),
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
