/* =======================================================================
   making-pledis.js — 플레디스 제작 과정 본문 스크롤 모션 v2
   -----------------------------------------------------------------------
   · scroller: #process-pledis .process__content (모달 전용 스크롤러)
   · GSAP + ScrollTrigger, once 진입 트리거 — transform/opacity/clip-path만(60fps)
   · prefers-reduced-motion → 모션 없이 정상 표시
   · 초기 상태는 gsap.from() 으로만 → GSAP 미로드 시 요소 그대로 보임
   · smooth-process(Lenis) 적용 → scrub 가능(transform/opacity만, invalidateOnRefresh:true)
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 refresh 호출
   -----------------------------------------------------------------------
   [버그 수정 2025-06]
   · 기본 start "top 84%" → "top 90%" (짧은 모달 스크롤러에서 도달 불가 문제)
   · header() 내부 start "top 86%" → "top 92%"
   · pd7 img / pd8 outro: "top bottom" — 섹션 진입 즉시 발동 보장
   · 안전망 추가: 스크롤러 바닥 도달 시 미발동 once 트리거를 즉시 완료
   [v2 추가 2026-06]
   · pd-hero : bg scrub 패럴랙스 [추가] + 타이틀/메타 clipPath 마스크 리빌 [교체]
   · pd-r1   : h1/h2 clipPath 커튼 와이프 [추가] + prob-line scaleX 드로잉 [추가]
   · pd2     : 카드별 TL + icon scale 팝 체이닝 [교체] + h1/h2 letterSpacing 수렴 [추가]
   · pd3     : pd-r3__line scaleX 드로잉 아이템 TL에 체이닝 [추가]
   · pd4     : before/after clipPath 커튼 전환 [교체 x분리]
   · pd5     : 프롬프트 char-split 타이핑 리빌 [추가] + SVG 연결선 strokeDashoffset [추가]
   · pd6     : 카드별 TL [교체] + rule scaleX 드로잉 [추가] + problem/solution 순차 [추가]
   · pd7     : clipPath 하단→상단 와이프 [교체 zoom-only]
   · pd8     : scrub 느린 줌 scale 1→1.06 [추가]
   · ⭐ 별빛 파티클 어셈블 (Pleiades 컨셉) — pd-hero [추가]
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;

    const scroller = document.querySelector("#process-pledis .process__content");
    if (!scroller) return true; // 마크업 없으면 통과

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* prefers-reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* once 진입 트리거 공통 옵션
       기본값 "top 90%" — 짧은 모달 스크롤러에서 하위 섹션 도달 불가 방지 */
    const ST = (trigger, start = "top 90%") => ({ trigger, scroller, start, once: true });

    /* 공통 섹션 헤더(h1/h2 포함 전부) */
    const header = (id) => {
      const sec = scroller.querySelector(id);
      if (!sec) return;
      const els = sec.querySelectorAll(
        '[class*="__num"],[class*="__eyebrow"],[class*="__h1"],[class*="__h2"],[class*="__lead"]'
      );
      if (!els.length) return;
      gsap.from(els, {
        opacity: 0, y: 40, duration: 1.05, ease: "expo.out", stagger: 0.1,
        scrollTrigger: ST(sec, "top 92%"),
        clearProps: "transform",
      });
    };

    /* ================================================================
       SECTION · 히어로 (#pd-hero) — 시네마틱 진입 (once, 핀은 사용자 요청으로 원복)
    ================================================================ */
    const heroBg = scroller.querySelector("#pd-hero .pd-hero__img");
    if (heroBg) {
      gsap.from(heroBg, {
        opacity: 0.15, scale: 1.14, transformOrigin: "50% 50%",
        duration: 1.9, ease: "power3.out",
        scrollTrigger: ST("#pd-hero", "top 92%"),
      });
      gsap.to(heroBg, {
        yPercent: 22, ease: "none",
        scrollTrigger: {
          trigger: scroller.querySelector("#pd-hero"), scroller,
          start: "top top", end: "bottom top", scrub: 1.4, invalidateOnRefresh: true,
        },
      });
    }
    const heroLogo = scroller.querySelector("#pd-hero .pd-hero__logo");
    if (heroLogo) gsap.from(heroLogo, {
      opacity: 0, y: 44, scale: 0.86, transformOrigin: "50% 50%",
      duration: 1.15, delay: 0.2, ease: "expo.out",
      scrollTrigger: ST("#pd-hero", "top 90%"),
    });
    [".pd-hero__title", ".pd-hero__meta"].forEach((sel, i) => {
      const el = scroller.querySelector(`#pd-hero ${sel}`);
      if (!el) return;
      gsap.from(el, {
        clipPath: "inset(0 0 100% 0)", opacity: 0,
        duration: 0.82, ease: "expo.out", delay: 0.44 + i * 0.14,
        scrollTrigger: ST("#pd-hero", "top 90%"),
        clearProps: "clip-path,opacity",
      });
    });
    const starsWrap = scroller.querySelector("#pd-hero .pd-hero__stars");
    if (starsWrap) {
      const dots = starsWrap.querySelectorAll(".pd-hero__star");
      if (dots.length) {
        const rnd = gsap.utils.random;
        const starTL = gsap.timeline({ scrollTrigger: ST(starsWrap, "top 92%") });
        dots.forEach((dot, i) => {
          starTL.from(dot, {
            x: rnd(-150, 150, 1), y: rnd(-130, -50, 1), opacity: 0,
            scale: rnd(0.15, 0.65, 0.01), duration: rnd(0.85, 1.45, 0.01), ease: "back.out(1.7)",
          }, i * 0.055);
        });
      }
    }

    /* ================================================================
       SECTION 1 · WHY REDESIGN (#pd-r1)
       [추가] h1/h2 clipPath 커튼 와이프 + prob-line scaleX 드로잉
    ================================================================ */
    /* num/eyebrow/lead는 기존 opacity+y */
    (() => {
      const sec = scroller.querySelector("#pd-r1");
      if (!sec) return;
      const numEyeLead = sec.querySelectorAll(
        ".pd-r1__num, .pd-r1__eyebrow, .pd-r1__lead1, .pd-r1__lead2"
      );
      if (numEyeLead.length) gsap.from(numEyeLead, {
        opacity: 0, y: 40, duration: 1.05, ease: "expo.out", stagger: 0.1,
        scrollTrigger: ST(sec, "top 92%"),
        clearProps: "transform",
      });
      /* [추가] h1/h2 clipPath 커튼 와이프 (왼→오, 읽기 방향) */
      [".pd-r1__h1", ".pd-r1__h2"].forEach((sel, i) => {
        const el = sec.querySelector(sel);
        if (!el) return;
        gsap.from(el, {
          clipPath: "inset(0 100% 0 0)",
          opacity: 0,
          duration: 0.88, ease: "expo.out",
          delay: 0.16 + i * 0.12,
          scrollTrigger: ST(sec, "top 92%"),
          clearProps: "clip-path,opacity",
        });
      });
    })();

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
        y: 46 + i * 12,
        scale: 0.94,
        transformOrigin: "50% 50%",
        duration: 1.0, ease: "power3.out",
        scrollTrigger: ST(el, "top 92%"),
      });
    });

    /* nav 라벨 4개 */
    gsap.from("#pd-r1 .pd-r1__nav", {
      opacity: 0, y: 20, duration: 0.75, ease: "power3.out", stagger: 0.1,
      scrollTrigger: ST("#pd-r1 .pd-r1__nav--1", "top 90%"),
    });

    /* [추가] prob-line scaleX 드로잉 */
    const probLine = scroller.querySelector("#pd-r1 .pd-r1__prob-line");
    if (probLine) gsap.from(probLine, {
      scaleX: 0, transformOrigin: "left center",
      duration: 0.7, ease: "expo.out",
      scrollTrigger: ST(probLine, "top 92%"),
    });

    /* 문제점 카드 3개 */
    gsap.from("#pd-r1 .pd-r1__card", {
      opacity: 0, y: 48, scale: 0.92, transformOrigin: "50% 50%",
      duration: 0.95, ease: "back.out(1.4)", stagger: 0.15,
      scrollTrigger: ST("#pd-r1 .pd-r1__card--1", "top 90%"),
    });

    /* ================================================================
       SECTION 2 · REDESIGN DIRECTION (#pd2)
       [교체] 카드 bulk x → 카드별 TL + icon scale 팝
       [추가] h1/h2 letterSpacing 수렴
    ================================================================ */
    (() => {
      const sec = scroller.querySelector("#pd2");
      if (!sec) return;
      /* num/eyebrow/lead 기존 방식 */
      const numEye = sec.querySelectorAll(
        ".pd-r2__num, .pd-r2__eyebrow, .pd-r2__lead1, .pd-r2__lead2"
      );
      if (numEye.length) gsap.from(numEye, {
        opacity: 0, y: 40, duration: 1.05, ease: "expo.out", stagger: 0.1,
        scrollTrigger: ST(sec, "top 92%"),
        clearProps: "transform",
      });
      /* [추가] h1/h2 letterSpacing 수렴 (0.45em → 정상) */
      [".pd-r2__h1", ".pd-r2__h2"].forEach((sel, i) => {
        const el = sec.querySelector(sel);
        if (!el) return;
        gsap.from(el, {
          opacity: 0,
          letterSpacing: "0.45em",
          duration: 1.05, ease: "expo.out",
          delay: 0.18 + i * 0.12,
          scrollTrigger: ST(sec, "top 92%"),
          clearProps: "letter-spacing,opacity",
        });
      });
    })();

    /* [교체] 카드 bulk x → 카드별 TL + icon scale 팝 체이닝 */
    scroller.querySelectorAll("#pd2 .pd-r2__card").forEach((card) => {
      const tl = gsap.timeline({ scrollTrigger: ST(card, "top 90%") });
      tl.from(card, {
        opacity: 0, x: -54, duration: 1.05, ease: "expo.out",
      }, 0);
      const icon = card.querySelector(".pd-r2__icon");
      if (icon) tl.from(icon, {
        scale: 0, transformOrigin: "50% 50%",
        duration: 0.52, ease: "back.out(2.4)",
      }, 0.38);
    });

    gsap.from("#pd2 .pd-r2__diagram", {
      opacity: 0, y: 52, scale: 0.87, transformOrigin: "50% 50%",
      duration: 1.15, ease: "back.out(1.3)",
      scrollTrigger: ST("#pd2 .pd-r2__diagram", "top 90%"),
    });

    /* ================================================================
       SECTION 3 · MAIN EXPERIENCE (#pd3)
       [추가] pd-r3__line scaleX 드로잉을 아이템 TL에 체이닝
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
      scrollTrigger: ST(screenFlow, "top 88%"),
    });

    /* [추가] flow 아이템 TL — line scaleX 드로잉 체이닝 */
    scroller.querySelectorAll("#pd3 .pd-r3__item").forEach((item) => {
      const line  = item.querySelector(".pd-r3__line");
      const badge = item.querySelector(".pd-r3__badge");
      const tl = gsap.timeline({ scrollTrigger: ST(item, "top 92%") });
      /* [추가] line 드로잉 먼저 */
      if (line) tl.from(line, {
        scaleX: 0, transformOrigin: "left center",
        duration: 0.52, ease: "expo.out",
      }, 0);
      if (badge) tl.from(badge, {
        opacity: 0, scale: 0.45, transformOrigin: "50% 50%",
        duration: 0.6, ease: "back.out(2.2)",
      }, 0.18);
      const texts = item.querySelectorAll("strong, em, p");
      if (texts.length) tl.from(texts, {
        opacity: 0, x: 30, duration: 0.75, ease: "power3.out", stagger: 0.08,
      }, 0.28);
    });

    /* ================================================================
       SECTION 4 · SUB PAGE REDESIGN (#pd4)
       [교체] before/after x분리 → clipPath 커튼 전환
    ================================================================ */
    header("#pd4");

    scroller.querySelectorAll("#pd4 .pd-r4__card").forEach((card) => {
      const tl = gsap.timeline({ scrollTrigger: ST(card, "top 90%") });
      /* 카드 전체 진입 */
      tl.from(card, {
        opacity: 0, y: 60, scale: 0.95, transformOrigin: "50% 50%",
        duration: 1.05, ease: "expo.out",
      }, 0);
      const before = card.querySelector(".pd-r4__shot--before");
      const after  = card.querySelector(".pd-r4__shot--after");
      /* [교체] x분리 → clipPath 커튼 (before: 우→좌 리빌, after: 좌→우 리빌) */
      if (before) tl.from(before, {
        clipPath: "inset(0 0 0 100%)",
        opacity: 0,
        duration: 0.9, ease: "expo.out",
        clearProps: "clip-path",
      }, 0.28);
      if (after) tl.from(after, {
        clipPath: "inset(0 100% 0 0)",
        opacity: 0,
        duration: 0.9, ease: "expo.out",
        clearProps: "clip-path",
      }, 0.38);
    });

    /* ================================================================
       SECTION 5 · AI WORKFLOW (#pd5) — [차별화 핵심]
       [추가] char-split 타이핑 리빌 + SVG strokeDashoffset 드로잉
    ================================================================ */
    header("#pd5");

    /* 카드 교차 진입 (기존 유지) */
    const cardPrompt = scroller.querySelector("#pd5 .pd-r5__card--prompt");
    const cardCode   = scroller.querySelector("#pd5 .pd-r5__card--code");

    if (cardPrompt) {
      const tl = gsap.timeline({ scrollTrigger: ST(cardPrompt, "top 90%") });
      tl.from(cardPrompt, { opacity: 0, x: -54, duration: 1.1, ease: "expo.out" }, 0);
      const visual = cardPrompt.querySelector(".pd-r5__visual");
      if (visual) tl.from(visual, { opacity: 0, y: 30, duration: 0.85, ease: "power3.out" }, 0.32);
    }

    if (cardCode) {
      const tl = gsap.timeline({ scrollTrigger: ST(cardCode, "top 90%") });
      tl.from(cardCode, { opacity: 0, x: 54, duration: 1.1, ease: "expo.out" }, 0);
      const chips   = cardCode.querySelector(".pd-r5__chips");
      const codeimg = cardCode.querySelector(".pd-r5__codeimg");
      if (chips)   tl.from(chips,   { opacity: 0, y: 24, duration: 0.8,  ease: "power3.out" }, 0.32);
      if (codeimg) tl.from(codeimg, { opacity: 0, y: 30, duration: 0.85, ease: "power3.out" }, 0.44);
    }

    /* [추가] SVG 연결선 strokeDashoffset 드로잉 + 끝점 dot 팝 */
    const connSvg = scroller.querySelector("#pd5 .pd-r5__connector");
    if (connSvg) {
      const connLine = connSvg.querySelector(".pd-r5__connector-line");
      const connDots = connSvg.querySelectorAll(".pd-r5__connector-dot");
      if (connLine) {
        /* getTotalLength(): SVG viewBox 좌표 기준 길이. line (2,3)→(46,3) = 44.
           모달이 닫혀(display:none) 비-렌더일 때 getTotalLength 가 InvalidStateError 를 던지므로
           try/catch — 폴백 44 가 실제 길이와 동일이라 값 손실 없음(콘솔 에러만 제거). */
        let lineLen = 44;
        try { if (connLine.getTotalLength) lineLen = connLine.getTotalLength(); } catch (e) {}
        gsap.set(connLine, { strokeDasharray: lineLen, strokeDashoffset: lineLen });
        gsap.set(connDots, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });
        const connTL = gsap.timeline({ scrollTrigger: ST(connSvg, "top 90%") });
        connTL
          .to(connLine, { strokeDashoffset: 0, duration: 0.75, ease: "expo.out" }, 0)
          .to(connDots, {
            opacity: 1, scale: 1,
            duration: 0.38, ease: "back.out(2.6)", stagger: 0.14,
          }, 0.58);
      }
    }

    /* [추가] 프롬프트 텍스트 수동 char-split 타이핑 리빌
       SplitText CDN 금지 → innerHTML 직접 분해, aria-label 보존 */
    (() => {
      const promptBox = scroller.querySelector("#pd5 .pd-r5__prompt");
      if (!promptBox) return;
      const p = promptBox.querySelector("p");
      if (!p) return;

      /* 전체 텍스트 aria-label로 보존 (<br> 경계는 공백으로) */
      const fullText = (p.innerHTML || "").replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      p.setAttribute("aria-label", fullText);

      /* innerHTML 파싱: <br> 태그 보존하며 글자 분해 */
      const rawHTML = p.innerHTML;
      const segments = rawHTML.split(/(<br\s*\/?>)/gi);
      let rebuilt = "";
      segments.forEach((seg) => {
        if (/^<br/i.test(seg)) {
          rebuilt += "<br>";
        } else {
          /* HTML 엔티티 대응: 텍스트 노드만 추출 */
          const tmp = document.createElement("span");
          tmp.innerHTML = seg;
          const txt = tmp.textContent || "";
          Array.from(txt).forEach((ch) => {
            const safe = ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch;
            rebuilt += `<span class="pd-char" aria-hidden="true">${safe}</span>`;
          });
        }
      });
      p.innerHTML = rebuilt;

      const chars = p.querySelectorAll(".pd-char");
      if (!chars.length) return;

      gsap.from(chars, {
        opacity: 0,
        duration: 0.001,     /* 즉시 전환으로 타이핑 느낌 */
        stagger: 0.016,      /* 글자당 16ms — 빠른 타이핑 리듬 */
        ease: "none",
        scrollTrigger: ST(promptBox, "top 88%"),
        clearProps: "opacity",
      });
    })();

    /* ================================================================
       SECTION 6 · TROUBLE & SOLUTION (#pd6) — 카드별 TL (once, 핀은 사용자 요청으로 원복)
    ================================================================ */
    const pd6Heads = scroller.querySelectorAll(
      "#pd6 .pd-r6__lead, #pd6 .pd-r6__h1, #pd6 .pd-r6__h2, #pd6 .pd-r6__num, #pd6 .pd-r6__eyebrow"
    );
    if (pd6Heads.length) gsap.from(pd6Heads, {
      opacity: 0, y: 40, duration: 1.05, ease: "expo.out", stagger: 0.1,
      scrollTrigger: ST("#pd6 .pd-r6__lead", "top 92%"),
      clearProps: "transform",
    });
    scroller.querySelectorAll("#pd6 .pd-r6__card").forEach((card) => {
      const rule     = card.querySelector(".pd-r6__rule");
      const problem  = card.querySelector(".pd-r6__problem");
      const solution = card.querySelector(".pd-r6__solution");
      const tl = gsap.timeline({ scrollTrigger: ST(card, "top 90%") });
      tl.from(card, {
        opacity: 0, y: 54, scale: 0.94, transformOrigin: "50% 50%",
        duration: 1.0, ease: "power3.out",
      }, 0);
      if (problem) tl.from(problem, { opacity: 0, y: 18, duration: 0.65, ease: "power3.out" }, 0.28);
      if (rule) tl.fromTo(rule,
        { scaleX: 0, rotate: 90, transformOrigin: "0% 0%" },
        { scaleX: 1, rotate: 90, transformOrigin: "0% 0%", duration: 0.52, ease: "expo.out", clearProps: "transform" },
        0.5
      );
      if (solution) tl.from(solution, { opacity: 0, y: 14, duration: 0.6, ease: "power3.out" }, 0.72);
    });

    /* ================================================================
       SECTION 7 · RESULT (#pd7)
       [교체] zoom-only → clipPath 하단→상단 와이프
    ================================================================ */
    header("#pd7");

    const r7img = scroller.querySelector("#pd7 .pd-r7__img");
    if (r7img) gsap.from(r7img, {
      clipPath: "inset(0 0 100% 0)",
      opacity: 0,
      duration: 1.25, ease: "expo.out",
      scrollTrigger: ST("#pd7 .pd-r7__img", "top bottom"),
      clearProps: "clip-path,opacity",
    });

    /* ================================================================
       SECTION 8 · OUTRO (#pd8)
       [교체] once zoom-settle → opacity once + scrub 느린 줌 분리
    ================================================================ */
    const outroImg = scroller.querySelector("#pd8 .pd-outro__img");
    if (outroImg) {
      /* opacity once fade */
      gsap.from(outroImg, {
        opacity: 0, duration: 1.5, ease: "power3.out",
        scrollTrigger: ST("#pd8", "top bottom"),
      });
      /* [추가] scrub 느린 줌 scale 1→1.06 */
      gsap.fromTo(outroImg,
        { scale: 1.0, transformOrigin: "50% 50%" },
        {
          scale: 1.06, transformOrigin: "50% 50%",
          ease: "none",
          scrollTrigger: {
            trigger: scroller.querySelector("#pd8"),
            scroller,
            start: "top bottom",
            end: "bottom center",
            scrub: 2.2,
            invalidateOnRefresh: true,
          },
        }
      );
    }

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

    /* ================================================================
       타이틀 색강조 — 글로우 점화 (전 7곳 확정)
       어두운 burnt 색에서 시작 → 진입 시 #ff4600 으로 점화 + 글로우 플레어→정착.
       대상: pd-r1/r2 __hl + pd-r3~r7 h1/h2 강조 span (전 7곳). once(top 85%).
       color 는 getComputedStyle 로 읽어 dim/glow 자동 산출. reduced-motion 시 init early-return.
    ================================================================ */
    const _pdEmph = [
      "#pd-r1 .pd-r1__hl", "#pd2 .pd-r2__hl",
      "#pd3 .pd-r3__h1 span", "#pd4 .pd-r4__h2 span", "#pd5 .pd-r5__h2 span",
      "#pd6 .pd-r6__h2 span", "#pd7 .pd-r7__h2 span",
    ];
    const _rgb = (c) => (c.match(/\d+/g) || [255, 70, 0]).slice(0, 3).map(Number);
    _pdEmph.forEach((sel) => {
      const el = scroller.querySelector(sel);
      if (!el) return;
      const [r, g, b] = _rgb(getComputedStyle(el).color);
      const lit = `rgb(${r}, ${g}, ${b})`;
      const dim = `rgb(${Math.round(r * 0.34)}, ${Math.round(g * 0.34)}, ${Math.round(b * 0.34)})`; /* 꺼진 burnt */
      const glow = (a) => `rgba(${r}, ${g}, ${b}, ${a})`;
      gsap.set(el, { color: dim });
      gsap.timeline({ scrollTrigger: ST(el, "top 85%") })
        .to(el, { color: lit, duration: 0.5, ease: "power2.out" }, 0)
        .fromTo(el, { textShadow: "0 0 0px " + glow(0) },
                    { textShadow: "0 0 9px " + glow(0.45), duration: 0.4, ease: "power2.out" }, 0.05)
        .to(el, { textShadow: "0 0 3px " + glow(0.14), duration: 0.7, ease: "power2.out" }, 0.45);
    });

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
