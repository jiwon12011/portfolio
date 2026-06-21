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
       SECTION 2 · IA REBUILD (#mh2) — 스크롤 핀 (A형)
       섹션을 화면 중앙 sticky 고정(setMh2Top, ≈1.02× 라 거의 딱) + #mh2-pin 범위 scrub:
       헤더→인용→BEFORE→AFTER(파란틴트)→4 카테고리 카드 흩어져→정렬 조립(시그니처: 카오스→구조).
       기존 once 트리거 전부 교체. fromTo+명시값 → refresh 안전. reduced-motion: init early-return + CSS 폴백.
    ================================================================ */
    const mh2Pin = scroller.querySelector("#mh2-pin");
    const mh2El  = scroller.querySelector("#mh2");
    if (mh2Pin && mh2El) {
      const setMh2Top = () => {
        mh2El.style.top = Math.round((scroller.clientHeight - mh2El.offsetHeight) / 2) + "px";
      };
      const q  = (s) => scroller.querySelector(s);
      const qa = (s) => Array.from(scroller.querySelectorAll(s));
      const mh2No = q("#mh2 .mh-s2__no"), mh2Cat = q("#mh2 .mh-s2__cat");
      const mh2Title = q("#mh2 .mh-s2__title"), mh2Lead = q("#mh2 .mh-s2__lead");
      const mh2Quote = q("#mh2 .mh-s2__quote");
      const beforePanel = q("#mh2 .mh-s2__panel--before");
      const afterPanel  = q("#mh2 .mh-s2__panel--after");
      const beforeBits = qa("#mh2 .mh-s2__panel--before .mh-s2__pill, #mh2 .mh-s2__panel--before .mh-s2__panel-title, #mh2 .mh-s2__panel--before .mh-s2__panel-desc, #mh2 .mh-s2__before-shot");
      const afterBits  = qa("#mh2 .mh-s2__panel--after .mh-s2__pill, #mh2 .mh-s2__panel--after .mh-s2__panel-title, #mh2 .mh-s2__panel--after .mh-s2__panel-desc");
      const cards = qa("#mh2 .mh-s2__cat-card");
      /* 카드별 흩어진 출발점(px) — 좌우 바깥 + 아래에서 살짝 회전하며 모여듦 */
      const CARD_FROM = [
        { x: -54, y: 30, rotate: -9 },
        { x: -18, y: 52, rotate:  6 },
        { x:  18, y: 52, rotate: -6 },
        { x:  54, y: 30, rotate:  9 },
      ];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mh2Pin, scroller,
          start: "top top", end: "bottom bottom",
          scrub: true, onRefreshInit: setMh2Top,
        },
      });
      if (mh2No && mh2Cat) tl.fromTo([mh2No, mh2Cat], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.06 }, 0);
      if (mh2Title) tl.fromTo(mh2Title, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.06);
      if (mh2Lead)  tl.fromTo(mh2Lead,  { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.16);
      if (mh2Quote) tl.fromTo(mh2Quote, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.26);
      if (beforePanel) tl.fromTo(beforePanel, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, 0.34);
      if (beforeBits.length) tl.fromTo(beforeBits, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.05 }, 0.44);
      if (afterPanel) {
        tl.fromTo(afterPanel, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, 0.54);
        tl.fromTo(afterPanel, { backgroundColor: "rgba(49,110,250,0)" }, { backgroundColor: "rgba(49,110,250,0.05)", duration: 0.5, ease: "power1.out" }, 0.6);
      }
      if (afterBits.length) tl.fromTo(afterBits, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.05 }, 0.66);
      /* 시그니처: 4 카테고리 카드 흩어져 → 그리드 정렬 (카오스→구조) */
      if (cards.length) tl.fromTo(cards,
        { opacity: 0, scale: 0.78, x: (i) => CARD_FROM[i].x, y: (i) => CARD_FROM[i].y, rotate: (i) => CARD_FROM[i].rotate },
        { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.6, ease: "back.out(1.5)", stagger: 0.12 },
        0.78);
      setMh2Top();
      window.addEventListener("resize", setMh2Top);
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
       SECTION 4 · CONTENT NAVIGATION (#mh4) — 스크롤 핀 (적응형 A형)
       섹션이 뷰포트보다 큼(≈1.62×) → setMh4Top 으로 다이어그램(메인 목업+콜아웃 샷+커넥터+레전드)을
       화면 중앙 프레이밍(헤딩은 진입 시 노출 후 위로 잘림). #mh4-pin scrub:
       헤더→메인 scale-in→콜아웃 샷→커넥터 왼→오 드로우+노드 팝(시그니처)→레전드 텍스트.
       기존 once 트리거+connTl 교체. fromTo+명시값(refresh 안전).
    ================================================================ */
    const mh4Pin = scroller.querySelector("#mh4-pin");
    const mh4El  = scroller.querySelector("#mh4");
    if (mh4Pin && mh4El) {
      const q4  = (s) => scroller.querySelector(s);
      const qa4 = (s) => Array.from(scroller.querySelectorAll(s));
      const mh4Main  = q4("#mh4 .mh-s4__main");
      const mh4Shots = qa4("#mh4 .mh-s4__shot");
      const mh4Legs  = qa4("#mh4 .mh-s4__leg");
      const mh4No = q4("#mh4 .mh-s4__no"), mh4Cat = q4("#mh4 .mh-s4__cat");
      const mh4Title = q4("#mh4 .mh-s4__title"), mh4Lead = q4("#mh4 .mh-s4__lead");
      const connEls = [1, 2, 3].map((n) => q4(`#mh4 .mh-s4__conn--${n}`));
      const nodeEls = [1, 2, 3].map((n) => q4(`#mh4 .mh-s4__node--${n}`));

      /* 다이어그램(메인+샷+레전드) bbox 를 뷰포트 중앙에 프레이밍 — 헤딩은 위로 잘림(진입 시 노출) */
      const setMh4Top = () => {
        const els = [mh4Main, ...mh4Shots, ...mh4Legs].filter(Boolean);
        if (!els.length) return;
        let top = Infinity, bot = -Infinity;
        els.forEach((el) => { top = Math.min(top, el.offsetTop); bot = Math.max(bot, el.offsetTop + el.offsetHeight); });
        const center = (top + bot) / 2;
        const vp = scroller.clientHeight, secH = mh4El.offsetHeight;
        let t = Math.round(vp / 2 - center);
        t = Math.max(-(secH - vp), Math.min(0, t));
        mh4El.style.top = t + "px";
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mh4Pin, scroller,
          start: "top top", end: "bottom bottom",
          scrub: true, onRefreshInit: setMh4Top,
        },
      });
      if (mh4No && mh4Cat) tl.fromTo([mh4No, mh4Cat], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.06 }, 0);
      if (mh4Title) tl.fromTo(mh4Title, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.06);
      if (mh4Lead)  tl.fromTo(mh4Lead,  { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.16);
      if (mh4Main)  tl.fromTo(mh4Main,  { opacity: 0, scale: 0.95, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }, 0.28);
      if (mh4Shots.length) tl.fromTo(mh4Shots, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.1 }, 0.42);
      /* 커넥터 왼→오 드로우 + 노드 팝 (체이닝) */
      connEls.forEach((conn, i) => {
        if (conn) tl.fromTo(conn, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power2.inOut" }, 0.55 + i * 0.2);
        const node = nodeEls[i];
        if (node) tl.fromTo(node, { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.2)" }, 0.55 + i * 0.2 + 0.34);
      });
      if (mh4Legs.length) tl.fromTo(mh4Legs, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.14 }, 0.6);
      setMh4Top();
      window.addEventListener("resize", setMh4Top);
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
       SECTION 7 · TROUBLESHOOTING + OUTRO (#mh7) — 커밋로그 부분 핀 (적응형 A형)
       섹션이 매우 큼(≈2.80×) → 커밋로그+코드 영역(24~66cqw, 뷰포트 내)만 setMh7Top 으로 화면 중앙 프레이밍.
       #mh7-pin scrub: 헤더→로그카드/깃아이콘/타이틀/구분선→코드→세로 타임라인 위→아래 드로우(scaleY)+
       닷 팝+커밋(feat/fix/fix/refactor) ctype←/cmsg→ 순차 캐스케이드.
       outro·hero 는 핀 뒤 자연 노출(아래 once-reveal 유지). 기존 once(헤더~코드) 교체. fromTo+명시값(refresh 안전).
    ================================================================ */
    const mh7Pin = scroller.querySelector("#mh7-pin");
    const mh7El  = scroller.querySelector("#mh7");
    if (mh7Pin && mh7El) {
      const q7  = (s) => scroller.querySelector(s);
      const qa7 = (s) => Array.from(scroller.querySelectorAll(s));
      const m7No = q7("#mh7 .mh-s7__no"), m7Cat = q7("#mh7 .mh-s7__cat");
      const m7Title = q7("#mh7 .mh-s7__title"), m7Lead = q7("#mh7 .mh-s7__lead");
      const logBox = q7("#mh7 .mh-s7__log"), code = q7("#mh7 .mh-s7__code");
      const logBits = qa7("#mh7 .mh-s7__gh, #mh7 .mh-s7__log-title, #mh7 .mh-s7__log-divider");
      const timeline = q7("#mh7 .mh-s7__timeline");
      const dots = [1, 2, 3, 4].map((n) => q7(`#mh7 .mh-s7__dot--${n}`));
      const commits = [1, 2, 3, 4].map((n) => q7(`#mh7 .mh-s7__commit--${n}`));

      const setMh7Top = () => {
        const els = [logBox, code].filter(Boolean);
        if (!els.length) return;
        let top = Infinity, bot = -Infinity;
        els.forEach((el) => { top = Math.min(top, el.offsetTop); bot = Math.max(bot, el.offsetTop + el.offsetHeight); });
        const center = (top + bot) / 2;
        const vp = scroller.clientHeight, secH = mh7El.offsetHeight;
        let t = Math.round(vp / 2 - center);
        t = Math.max(-(secH - vp), Math.min(0, t));
        mh7El.style.top = t + "px";
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mh7Pin, scroller,
          start: "top top", end: "bottom bottom",
          scrub: true, onRefreshInit: setMh7Top,
        },
      });
      if (m7No && m7Cat) tl.fromTo([m7No, m7Cat], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.06 }, 0);
      if (m7Title) tl.fromTo(m7Title, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.06);
      if (m7Lead)  tl.fromTo(m7Lead,  { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.16);
      if (logBox)  tl.fromTo(logBox,  { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, 0.28);
      if (logBits.length) tl.fromTo(logBits, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.06 }, 0.38);
      if (code) tl.fromTo(code, { opacity: 0, x: 36 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, 0.4);
      /* 세로 타임라인 위→아래 드로우 */
      if (timeline) tl.fromTo(timeline, { scaleY: 0 }, { scaleY: 1, transformOrigin: "50% 0%", duration: 0.8, ease: "none" }, 0.5);
      /* 닷 팝 + 커밋 ctype←/cmsg→ 캐스케이드 (드로우와 동기) */
      [0, 1, 2, 3].forEach((i) => {
        const dot = dots[i], commit = commits[i];
        const ctype = commit && commit.querySelector(".mh-s7__ctype");
        const cmsg  = commit && commit.querySelector(".mh-s7__cmsg");
        const at = 0.54 + i * 0.16;
        if (dot)   tl.fromTo(dot,   { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.2)" }, at);
        if (ctype) tl.fromTo(ctype, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, at);
        if (cmsg)  tl.fromTo(cmsg,  { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, at + 0.08);
      });
      setMh7Top();
      window.addEventListener("resize", setMh7Top);
    }
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
