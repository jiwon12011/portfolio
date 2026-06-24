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

    /* 모바일 세로(≤1024px portrait) — 핀/scrub 비활성.
       from-상태(opacity:0, scale·rotation 등)를 적용하지 않아 요소가 CSS 기본값(보임)으로 유지.
       once 진입 리빌은 데스크톱과 동일하게 유지. */
    const isMobile = matchMedia("(max-width:1024px) and (orientation:portrait)").matches;

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
    /* 헤딩(lead/label/title/desc) — 핀 진입 단계에서 자연 스크롤되며 rise.
       핀 고정 후엔 화면 위로 잘리므로 진입 시 한 번 보여주는 역할. */
    rise("#gw1 .gw-bg__lead", { y: 20, stagger: 0.14, duration: 0.9,
      scrollTrigger: ST("#gw1 .gw-bg__lead--1", "top 86%") });
    rise("#gw1 .gw-bg__label", { y: 20, scrollTrigger: ST("#gw1 .gw-bg__label", "top 84%") });
    rise("#gw1 .gw-bg__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw1 .gw-bg__title", "top 84%") });
    rise("#gw1 .gw-bg__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw1 .gw-bg__desc", "top 84%") });

    /* 핀 scrub 타임라인 — #gw1-pin(280svh) 기준.
       진입 0~0.33: 헤딩 스크롤(위 rise 담당) → top:-55.7cqw 로 고정되는 지점
       0.34~  : 고정된 프레임(shot+카드4+goal)에서 순차 조립
       모바일: 생성하지 않음 → from(opacity:0) 미적용, 요소가 CSS 기본값(보임)으로 유지 */
    if (!isMobile) {
    const pinTl1 = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#gw1-pin", scroller, start: "top top", end: "bottom bottom", scrub: true },
    });
    pinTl1
      .from("#gw1 .gw-bg__shot", { opacity: 0, x: 40, duration: 0.16 }, 0.34)
      .from("#gw1 .gw-pcard", { opacity: 0, y: 30, duration: 0.16, stagger: 0.09 }, 0.42)
      .from("#gw1 .gw-bg__goal",
        { opacity: 0, y: 22, scale: 0.97, transformOrigin: "50% 50%", duration: 0.14 }, 0.86);
    } /* /!isMobile — gw1 핀 scrub */

    /* ================================================================
       SECTION 2 · GAME RESEARCH (#gw2) — CSS sticky 핀 + 단일 scrub 타임라인
       · 래퍼 #gw2-pin(height:260svh) 이 스크롤 길이를 확보
       · #gw2 { position:sticky; top:-16.65cqw } CSS 규칙이 화면 고정 + 멈춤 framing(메달리온 중앙) 담당
       · 스크롤 진행도(0→1)를 4단계로 배분:
           0~0.15  label/title/desc 등장
           0.15~0.4  메달리온 스케일 인 + 링 회전 안착
           0.4~0.85  4 원형 이미지 빙글 돌며 조립
           0.85~1    캡션 등장
       · transform/opacity only — 60fps 사수
    ================================================================ */
    /* 모바일: gw2 scrub 전체 생성하지 않음.
       gsap.set(orbit/ring, xPercent/yPercent) 도 skip → CSS translate(-50%,-50%) 보존.
       from(opacity:0) 미적용 → 메달리온·원형이미지·캡션 모두 CSS 기본값(보임)으로 유지. */
    if (!isMobile) {
    const pinTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#gw2-pin",
        scroller,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    /* ── 0~0.15 : 텍스트 등장 ── */
    pinTl
      .from("#gw2 .gw-r2__label", { opacity: 0, y: 20, duration: 0.12 }, 0)
      .from("#gw2 .gw-r2__title", { opacity: 0, y: 28, duration: 0.12 }, 0.03)
      .from("#gw2 .gw-r2__desc",  { opacity: 0, y: 22, duration: 0.10 }, 0.05);

    /* ── 0.15~0.4 : 중앙 메달리온 스케일 인 + 링 회전 안착 ──
       orbit / ring--out : CSS translate(-50%,-50%) → xPercent/yPercent 선점(이중변환 방지).
       기존 ringSettle 패턴 유지.
       ring--mid / disc / logo : GSAP 가 현재 CSS transform 을 읽어 scale 보간. */
    const orbitEl   = scroller.querySelector("#gw2 .gw-r2__orbit");
    const ringOutEl = scroller.querySelector("#gw2 .gw-r2__ring--out");

    [orbitEl, ringOutEl].forEach((el) => {
      if (el) gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0, transformOrigin: "50% 50%" });
    });

    /* orbit: scale + rotation 결합(단일 tween 으로 transform 충돌 방지) */
    if (orbitEl) {
      pinTl.fromTo(orbitEl,
        { opacity: 0, scale: 0.6, rotation:  40 },
        { opacity: 1, scale: 1,   rotation:   0, duration: 0.25 }, 0.15);
    }
    /* ring--out: 같은 패턴, 반대 방향 */
    if (ringOutEl) {
      pinTl.fromTo(ringOutEl,
        { opacity: 0, scale: 0.6, rotation: -34 },
        { opacity: 1, scale: 1,   rotation:   0, duration: 0.25 }, 0.15);
    }
    /* ring--mid / disc / logo — scale 인만, 0.17 에 시작해 stagger 로 순차 팝 인 */
    const otherCenterEls = Array.from(
      scroller.querySelectorAll("#gw2 .gw-r2__center > *")
    ).filter((el) => el !== orbitEl && el !== ringOutEl);
    if (otherCenterEls.length) {
      pinTl.from(otherCenterEls,
        { opacity: 0, scale: 0.6, transformOrigin: "50% 50%", stagger: 0.025, duration: 0.22 }, 0.17);
    }

    /* ── 0.4~0.85 : 4 원형 이미지 — 메달리온 중심축 기준 rotation -52→0 + opacity ──
       transform-origin 값(기존 circOrigins 유지): 각 원→메달리온 중심까지의 오프셋 벡터 */
    const circOrigins = {
      "--tl": "30.764cqw 23.125cqw", "--tr": "-14.861cqw 23.125cqw",
      "--bl": "30.764cqw -7.292cqw", "--br": "-14.861cqw -7.292cqw",
    };
    Object.entries(circOrigins).forEach(([k, origin], i) => {
      const el = scroller.querySelector("#gw2 .gw-r2__circ" + k);
      if (!el) return;
      gsap.set(el, { transformOrigin: origin });
      /* 0.01 미세 stagger — 4원이 동시에 조립되되 찰나의 순차감 */
      pinTl.fromTo(el,
        { rotation: -52, opacity: 0 },
        { rotation:   0, opacity: 1, duration: 0.43 }, 0.40 + i * 0.01);
    });

    /* ── 0.85~1 : 캡션 페이드+업 등장 ── */
    scroller.querySelectorAll("#gw2 .gw-r2__cap").forEach((cap, i) => {
      pinTl.from(cap, { opacity: 0, y: 16, duration: 0.12 }, 0.86 + i * 0.025);
    });
    } /* /!isMobile — gw2 핀 scrub */

    /* ================================================================
       SECTION 3 · EXPERIMENT (#gw3) — 3 시안 목업
    ================================================================ */
    /* 헤딩 — 핀 진입 단계에서 자연 스크롤되며 rise(고정 후엔 위로 잘림) */
    rise("#gw3 .gw-r3__label", { y: 20, scrollTrigger: ST("#gw3 .gw-r3__label", "top 84%") });
    rise("#gw3 .gw-r3__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw3 .gw-r3__title", "top 84%") });
    rise("#gw3 .gw-r3__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw3 .gw-r3__desc", "top 84%") });

    /* 핀 scrub — #gw3-pin(260svh). top:-33.4cqw 로 고정 시 3 시안 목업+설명이 한 화면.
       0.28~ : EXP01→02→03 시안 순차 등장, 이어서 설명 텍스트
       모바일: 생성하지 않음 → from(opacity:0) 미적용, shot·exp 모두 CSS 기본값(보임)으로 유지 */
    if (!isMobile) {
    const pinTl3 = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#gw3-pin", scroller, start: "top top", end: "bottom bottom", scrub: true },
    });
    pinTl3
      .from("#gw3 .gw-r3__shot", { opacity: 0, y: 40, duration: 0.18, stagger: 0.12 }, 0.28)
      .from("#gw3 .gw-r3__exp", { opacity: 0, y: 24, duration: 0.14, stagger: 0.08 }, 0.58);
    } /* /!isMobile — gw3 핀 scrub */

    /* goal — 핀 해제 후 자연 스크롤로 등장 */
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
    /* 헤딩 — 핀 진입 단계에서 자연 스크롤되며 rise(고정 후 필름스트립으로 위로 흐름) */
    rise("#gw5 .gw-r5__label", { y: 20, scrollTrigger: ST("#gw5 .gw-r5__label", "top 86%") });
    rise("#gw5 .gw-r5__title", { y: 28, duration: 0.95, scrollTrigger: ST("#gw5 .gw-r5__title", "top 86%") });
    rise("#gw5 .gw-r5__desc", { y: 22, delay: 0.08, scrollTrigger: ST("#gw5 .gw-r5__desc", "top 86%") });

    /* ── 필름스트립 핀 ──
       .gw5-stage(뷰포트 높이, sticky, overflow hidden) 프레임을 고정하고,
       #gw5(1899px 타임라인 전체)를 위로 translateY 하며 5행이 차례로 프레임에 진입.
       각 행은 프레임 하단으로 들어오는 시점(progress)에 점등(shot 좌→ / tx 우← / node 팝). */
    const gw5El = scroller.querySelector("#gw5");
    const gw5Stage = document.querySelector("#gw5-stage");
    /* 모바일: 필름스트립 전체 skip → shot/tx/node fromTo(opacity:0) 미적용, 행 전체 보임.
       syncStageH 도 호출하지 않음(CSS 폴백 height 유지). */
    if (!isMobile && gw5El && gw5Stage) {
      /* stage 높이 = 스크롤러 가시 높이(모달 뷰포트). refresh 마다 재동기화 */
      /* 모달 닫힘(clientHeight 0) 때 0px 고정 방지 — CSS 폴백(88svh) 유지, open 시 refresh 가 교정 */
      const syncStageH = () => { if (scroller.clientHeight) gw5Stage.style.height = scroller.clientHeight + "px"; };
      syncStageH();
      const getTravel = () => Math.max(0, gw5El.offsetHeight - gw5Stage.clientHeight);

      const pinTl5 = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "#gw5-pin", scroller, start: "top top", end: "bottom bottom",
          scrub: true, invalidateOnRefresh: true, onRefreshInit: syncStageH,
        },
      });
      /* 연속 translate: 0 → -travel (함수값 + invalidateOnRefresh 로 반응형) */
      pinTl5.fromTo(gw5El, { y: 0 }, { y: () => -getTravel(), duration: 1 }, 0);

      /* 행별 점등 progress — 각 행이 프레임 하단(stageH*0.75)으로 진입하는 지점(설계 1899px 기준) */
      const revealAt = [0.01, 0.15, 0.38, 0.61, 0.84];
      for (let i = 1; i <= 5; i++) {
        const shot = scroller.querySelector(`#gw5 .gw-r5__shot--${i}`);
        const tx = scroller.querySelector(`#gw5 .gw-r5__tx--${i}`);
        const node = scroller.querySelector(`#gw5 .gw-r5__node--${i}`);
        const p = revealAt[i - 1];
        /* fromTo(명시적 end) — invalidateOnRefresh 가 from 의 end 값을 현재값(0)으로
           재캡처해 0→0 으로 망가뜨리는 GSAP 함정 회피 */
        if (shot) pinTl5.fromTo(shot, { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 0.07 }, p);
        if (tx) pinTl5.fromTo(tx, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.07 }, p + 0.02);
        if (node) pinTl5.fromTo(node, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, transformOrigin: "0% 50%", duration: 0.05 }, p + 0.035);
      }

      /* 세로 연결선 — 필름스트립 진행에 맞춰 위→아래로 그려짐(행 점등 구간과 동기) */
      const gw5Line = scroller.querySelector("#gw5 .gw-r5__line");
      if (gw5Line) {
        gsap.set(gw5Line, { transformOrigin: "50% 0%" });
        pinTl5.fromTo(gw5Line, { scaleY: 0 }, { scaleY: 1, duration: 0.83 }, 0.01);
      }
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
         영상 height 110% 헤드룸 → y 0%~-8% 범위에서 항상 커버 유지
         모바일: scrub skip → yPercent 0(CSS 기본) 유지, 영상 정상 표시 */
      if (!isMobile && vid) gsap.fromTo(vid,
        { yPercent: 4 },
        { yPercent: -4, ease: "none",
          scrollTrigger: { trigger: band, scroller, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });

    /* gw5 세로 연결선 드로우는 필름스트립 타임라인(pinTl5)에 통합됨 — 위 SECTION 5 블록 참조 */

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
