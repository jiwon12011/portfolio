/* =======================================================================
   making-yumi.js — 유미의 세포들 제작 과정 본문 스크롤 모션 v2
   -----------------------------------------------------------------------
   · scroller: #process-yumi .process__content (모달 전용 스크롤러)
   · GSAP + ScrollTrigger, once 진입 트리거 — transform/opacity/clip-path/strokeDashoffset만
   · prefers-reduced-motion → 모션 없이 정상 표시
   · 초기 상태는 gsap.from() / gsap.set() 으로만 → GSAP 미로드 시 요소 그대로 보임
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 refresh 호출
   · smooth-process(Lenis) 적용 → scrub 가능(transform만, invalidateOnRefresh:true)
   -----------------------------------------------------------------------
   [v2 추가/교체 2026-06]
   · ym-hero : bg scrub 패럴랙스 yPercent [추가]
   · ym1     : 카드 테두리 SVG strokeDashoffset draw-on [추가] (카드 팝 유지)
   · ym2     : 감정 색번짐 bleed scale 0→3 fade [추가]
             + 타이틀 <b> char-split 컬러 플래시 [추가]
             + 팔레트 chip scale 팝 stagger [추가]
             + 캐릭터 squash&stretch elastic [교체]
   · ym-band : clipPath inset(0 0 100% 0)→0 와이프 [추가]
   · ym3     : 메뉴 카드별 TL (아이콘→라벨→캐릭터) [교체]
   · ym4     : pill stagger scale back.out 팝 [추가]
             + .ym-r4__hero scrub 패럴랙스 yPercent [추가]
   · ym5     : q 카드 좌/우 split reveal + 내부 solve/result 분리 TL [교체]
   · ym6     : .ym-r6__pink/.ym-r6__purple clipPath 와이프 [추가]
             + 감정 입자 플로트 (once, 무한루프 없음) [추가]
   · ym-outro: opacity once 유지 + scrub 느린 줌 scale 1→1.06 분리 [추가]
   · 안전망: 스크롤러 바닥 도달 시 미발동 once 트리거 즉시 완료 [추가]
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;
    const scroller = document.querySelector("#process-yumi .process__content");
    if (!scroller) return true;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* prefers-reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* ── 공통 헬퍼 ─────────────────────────────────────────────────── */

    /* once 진입 트리거 — 요소 또는 셀렉터 문자열 */
    const ST = (trigger, start = "top 84%") => ({ trigger, scroller, start, once: true });

    /* 섹션 헤더(번호/아이브로/제목/리드) 공통 페이드+업 */
    const header = (id) => {
      const sec = scroller.querySelector(id);
      if (!sec) return;
      const els = sec.querySelectorAll(
        '[class*="__num"],[class*="__eyebrow"],[class*="__title"],[class*="__lead"]'
      );
      if (els.length) gsap.from(els, {
        opacity: 0, y: 22, duration: 0.8, ease: "power3.out", stagger: 0.08,
        scrollTrigger: ST(sec, "top 86%"),
      });
    };

    /* 일반 stagger 헬퍼 — 필요한 섹션에서만 사용 */
    const stagger = (sel, triggerEl, opt = {}) => {
      const els = scroller.querySelectorAll(sel);
      if (!els.length) return;
      gsap.from(els, Object.assign({
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.1,
        scrollTrigger: ST(triggerEl || els[0], "top 84%"),
      }, opt));
    };

    /* ================================================================
       타이틀 강조어 컬러 롤업 — 강조(<b>) 단어가 "검정이었다가" 스크롤 진입 시
       색있는 글자가 아래에서 올라와 그 자리로(뾰옹). ym2 는 기존 char-split 유지 → 제외.
    ================================================================ */
    const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    ["#ym1", "#ym3", "#ym4", "#ym5", "#ym6"].forEach((id) => {
      const title = scroller.querySelector(id + " [class$='__title']");
      const b = title && title.querySelector("b");
      if (!b) return;
      const text = b.textContent || "";
      if (!text.trim()) return;
      const emphColor = getComputedStyle(b).color;        // 강조색(핑크)
      const inkColor = getComputedStyle(title).color;       // 타이틀 기본색(검정값)
      b.classList.add("ym-emph");
      b.setAttribute("aria-label", text);
      b.innerHTML =
        '<span class="ym-emph__base" aria-hidden="true">' + escHtml(text) + "</span>" +
        '<span class="ym-emph__color" aria-hidden="true">' + escHtml(text) + "</span>";
      const baseEl = b.querySelector(".ym-emph__base");
      const colorEl = b.querySelector(".ym-emph__color");
      baseEl.style.color = inkColor;
      colorEl.style.color = emphColor;
      /* 천천히 — 색 올라오는 게 또렷이 보이게. 약간 늦게 시작(타이틀이 화면에 들어온 뒤) + 짧은 delay */
      gsap.timeline({ scrollTrigger: ST(b, "top 80%"), delay: 0.15 })
        .fromTo(colorEl, { yPercent: 110 }, { yPercent: 0, duration: 1.25, ease: "back.out(1.3)" }, 0)
        .to(baseEl, { yPercent: -110, duration: 1.25, ease: "back.out(1.3)" }, 0);
    });

    /* ================================================================
       SECTION · 히어로 (#ym-hero)
       기존: zoom-settle once — 유지
       [추가] bg scrub 패럴랙스 yPercent
    ================================================================ */
    const heroImg = scroller.querySelector("#ym-hero .ym-hero__img");
    if (heroImg) {
      /* 기존: zoom-settle */
      gsap.from(heroImg, {
        opacity: 0, scale: 1.06, transformOrigin: "50% 50%", duration: 1.4, ease: "power3.out",
        scrollTrigger: ST("#ym-hero", "top 88%"),
      });
      /* [추가] scrub 패럴랙스 — once와 별개 트리거 */
      gsap.to(heroImg, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: scroller.querySelector("#ym-hero"),
          scroller,
          start: "top top",
          end: "bottom top",
          scrub: 1.4,
          invalidateOnRefresh: true,
        },
      });
    }

    /* ================================================================
       SECTION 1 · PROJECT OVERVIEW (#ym1)
       기존: 카드 팝 — 유지
       [추가] 카드 테두리 SVG strokeDashoffset draw-on (좌소→메인→우소→하단 순)
    ================================================================ */
    header("#ym1");

    /* 기존: 카드 팝 */
    stagger(
      "#ym1 .ym-r1__card",
      scroller.querySelector("#ym1 .ym-r1__card--c1"),
      { y: 32, scale: 0.96, transformOrigin: "50% 50%", ease: "back.out(1.3)", stagger: 0.09 }
    );

    /* ================================================================
       SECTION 2 · VISUAL CONCEPT (#ym2)
       기존: palette y 페이드 + scene x 슬라이드 + cha back.out
       [추가] 감정 색번짐 bleed
       [추가] 타이틀 <b>색과 움직임</b> char-split 컬러 플래시
       [추가] 팔레트 chip stagger 팝
       [교체] 캐릭터 6개: squash&stretch elastic
    ================================================================ */
    header("#ym2");

    /* [추가] 감정 색번짐 bleed: scale 0→1.5(opacity 0.6)→3(opacity 0) */
    const bleed = scroller.querySelector("#ym2 .ym-r2__bleed");
    if (bleed) {
      gsap.set(bleed, { scale: 0, opacity: 0, transformOrigin: "50% 50%" });
      const bleedTL = gsap.timeline({
        scrollTrigger: ST(scroller.querySelector("#ym2"), "top 84%"),
      });
      bleedTL
        .to(bleed, { scale: 1.5, opacity: 0.6, duration: 0.9, ease: "power2.out" })
        .to(bleed, { scale: 3, opacity: 0, duration: 0.95, ease: "power2.in" });
    }

    /* [추가] 타이틀 <b>색과 움직임</b> char-split 컬러 플래시
       SplitText CDN 금지 → 수동 innerHTML 분해, aria-label 보존 */
    (() => {
      const titleEl = scroller.querySelector("#ym2 .ym-r2__title");
      if (!titleEl) return;
      const boldEl = titleEl.querySelector("b");
      if (!boldEl) return;

      const fullText = boldEl.textContent || "";
      if (!fullText.length) return;

      /* aria-label로 원문 보존 */
      boldEl.setAttribute("aria-label", fullText);

      /* 글자별 스팬으로 분해 */
      const flashColors = ["#ff6b9d", "#4a90e2", "#ffb347"];
      let rebuilt = "";
      Array.from(fullText).forEach((ch, i) => {
        const safe = ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch;
        rebuilt += `<span class="ym-char" aria-hidden="true" data-col="${flashColors[i % flashColors.length]}">${safe}</span>`;
      });
      boldEl.innerHTML = rebuilt;

      const chars = boldEl.querySelectorAll(".ym-char");
      if (!chars.length) return;

      /* fromTo: 각 색 플래시 → b 요소 CSS 색(#ff6b9d) 수렴 */
      gsap.fromTo(chars,
        { color: (i, el) => el.dataset.col || "#ff6b9d" },
        {
          color: "#ff6b9d",
          duration: 0.5, ease: "power2.out", stagger: 0.06,
          scrollTrigger: ST(titleEl, "top 84%"),
          clearProps: "color",
        }
      );
    })();

    /* 기존: palette y 페이드 유지 */
    const paletteEl = scroller.querySelector("#ym2 .ym-r2__palette");
    if (paletteEl) {
      gsap.from(paletteEl, {
        opacity: 0, y: 34, duration: 0.9, ease: "power3.out",
        scrollTrigger: ST(paletteEl, "top 84%"),
      });
      /* [추가] chip stagger scale 팝 */
      const chips = paletteEl.querySelectorAll(".ym-r2__chip");
      if (chips.length) {
        gsap.from(chips, {
          scale: 0, opacity: 0, transformOrigin: "50% 50%",
          duration: 0.48, ease: "back.out(2.2)", stagger: 0.065,
          scrollTrigger: ST(paletteEl, "top 82%"),
        });
      }
    }

    /* 기존: scene x 슬라이드 유지 */
    const sceneEl = scroller.querySelector("#ym2 .ym-r2__scene");
    if (sceneEl) {
      gsap.from(sceneEl, {
        opacity: 0, x: 40, duration: 1.0, ease: "power3.out",
        scrollTrigger: ST(sceneEl, "top 82%"),
      });
    }

    /* [교체] 캐릭터 6개: back.out(1.6) → squash&stretch (납작→튕김→elastic 정착) */
    const chaEls = scroller.querySelectorAll("#ym2 .ym-r2__cha");
    if (chaEls.length) {
      const chaTrigger = scroller.querySelector("#ym2 .ym-r2__cha--1");
      if (chaTrigger) {
        const chaTL = gsap.timeline({ scrollTrigger: ST(chaTrigger, "top 84%") });
        chaEls.forEach((el, i) => {
          const s = i * 0.1; /* 각 캐릭터 stagger 오프셋 */
          /* 1) 등장 (opacity) */
          chaTL.from(el, { opacity: 0, duration: 0.15, ease: "none" }, s);
          /* 2) 납작 squash */
          chaTL.fromTo(el,
            { scaleX: 1.3, scaleY: 0.45, transformOrigin: "50% 100%" },
            { scaleX: 0.88, scaleY: 1.18, transformOrigin: "50% 100%",
              duration: 0.22, ease: "power2.out" },
            s + 0.15
          );
          /* 3) elastic 정착 */
          chaTL.to(el, {
            scaleX: 1, scaleY: 1, transformOrigin: "50% 100%",
            duration: 0.62, ease: "elastic.out(1, 0.5)",
          }, s + 0.37);
        });
      }
    }

    /* ================================================================
       SECTION 2.5 · 캐릭터 러닝 배너 (#ym-band)
       [추가] clipPath 하단→상단 와이프 리빌 (inset(0 0 100% 0)→0)
    ================================================================ */
    const bandEl = scroller.querySelector("#ym-band");
    if (bandEl) {
      gsap.from(bandEl, {
        clipPath: "inset(0 0 100% 0)",
        duration: 1.1, ease: "expo.out",
        scrollTrigger: ST(bandEl, "top 88%"),
        clearProps: "clip-path",
      });
    }

    /* ================================================================
       SECTION 3 · STRUCTURE & FLOW (#ym3)
       기존: header + points + group 유지
       [교체] 메뉴 카드 bulk x → 카드별 TL (아이콘 scale팝 → 라벨 x → 캐릭터 팝)
    ================================================================ */
    header("#ym3");

    gsap.from(scroller.querySelector("#ym3 .ym-r3__points"), {
      opacity: 0, x: -36, duration: 0.9, ease: "power3.out",
      scrollTrigger: ST(scroller.querySelector("#ym3 .ym-r3__points"), "top 84%"),
    });

    const groupEl = scroller.querySelector("#ym3 .ym-r3__group");
    if (groupEl) {
      gsap.from(groupEl, {
        opacity: 0, y: 30, scale: 0.94, transformOrigin: "50% 100%",
        duration: 0.95, ease: "back.out(1.4)",
        scrollTrigger: ST(groupEl, "top 84%"),
      });
    }

    /* [교체] 메뉴 카드별 TL */
    scroller.querySelectorAll("#ym3 .ym-r3__menu").forEach((menu) => {
      const icon  = menu.querySelector(".ym-r3__micon");
      const label = menu.querySelector(".ym-r3__mlabel");
      const desc  = menu.querySelector(".ym-r3__mdesc");
      const cha   = menu.querySelector(".ym-r3__mcha");

      const tl = gsap.timeline({ scrollTrigger: ST(menu, "top 92%") });
      /* 카드 전체 진입 */
      tl.from(menu, { opacity: 0, y: 26, duration: 0.82, ease: "power3.out" }, 0);
      /* 아이콘 scale 팝 */
      if (icon)  tl.from(icon,  { scale: 0, transformOrigin: "50% 50%",
        duration: 0.46, ease: "back.out(2.2)" }, 0.24);
      /* 라벨 x 슬라이드 */
      if (label) tl.from(label, { opacity: 0, x: 18, duration: 0.44, ease: "power3.out" }, 0.35);
      /* 설명 x 슬라이드 */
      if (desc)  tl.from(desc,  { opacity: 0, x: 18, duration: 0.44, ease: "power3.out" }, 0.43);
      /* 캐릭터 팝 */
      if (cha)   tl.from(cha,   { scale: 0, opacity: 0, transformOrigin: "50% 100%",
        duration: 0.52, ease: "back.out(1.8)" }, 0.5);
    });

    /* ================================================================
       SECTION 4 · INTERACTION DESIGN (#ym4)
       기존: 카드 stagger 유지
       [추가] pill stagger scale back.out 팝
       [추가] .ym-r4__hero scrub 패럴랙스 yPercent
    ================================================================ */
    header("#ym4");

    stagger(
      "#ym4 .ym-r4__card",
      scroller.querySelector("#ym4 .ym-r4__card--1"),
      { y: 34, stagger: 0.12 }
    );

    /* [추가] pill 하나씩 scale 팝 */
    const pills = scroller.querySelectorAll("#ym4 .ym-r4__pill");
    if (pills.length) {
      const pillTrigger = scroller.querySelector("#ym4 .ym-r4__pill--1");
      if (pillTrigger) {
        gsap.from(pills, {
          scale: 0, opacity: 0, transformOrigin: "0% 50%",
          duration: 0.52, ease: "back.out(2.0)", stagger: 0.1,
          scrollTrigger: ST(pillTrigger, "top 88%"),
        });
      }
    }

    /* [추가] 히어로 레이어 이미지 미세 scrub 패럴랙스 */
    const heroLayer = scroller.querySelector("#ym4 .ym-r4__hero");
    if (heroLayer) {
      gsap.to(heroLayer, {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: scroller.querySelector("#ym4"),
          scroller,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.8,
          invalidateOnRefresh: true,
        },
      });
    }

    /* ================================================================
       SECTION 5 · TROUBLE SHOOTING (#ym5)
       [교체] q bulk stagger → 카드별 TL 좌/우 split reveal
               내부 solve(좌)/result(우) 분리 진입
    ================================================================ */
    header("#ym5");

    scroller.querySelectorAll("#ym5 .ym-r5__q").forEach((q) => {
      /* 우측 열 판별 */
      const isRight = q.classList.contains("ym-r5__q--2") || q.classList.contains("ym-r5__q--4");
      const xIn = isRight ? 40 : -40;

      const tl = gsap.timeline({ scrollTrigger: ST(q, "top 90%") });

      /* 카드 전체 진입 — 좌/우 방향 */
      tl.from(q, { opacity: 0, x: xIn, duration: 0.9, ease: "expo.out" }, 0);

      /* 질문 번호·제목 */
      const qno    = q.querySelector(".ym-r5__qno");
      const qtitle = q.querySelector(".ym-r5__qtitle");
      if (qno)    tl.from(qno,    { opacity: 0, x: -16, duration: 0.56, ease: "power3.out" }, 0.22);
      if (qtitle) tl.from(qtitle, { opacity: 0, x: -16, duration: 0.56, ease: "power3.out" }, 0.28);

      /* 해결/결과 박스 분리 reveal — solve 좌, result 우 */
      const solve  = q.querySelector(".ym-r5__solve");
      const result = q.querySelector(".ym-r5__result");
      if (solve)  tl.from(solve,  { opacity: 0, x: -20, duration: 0.62, ease: "power3.out" }, 0.4);
      if (result) tl.from(result, { opacity: 0, x:  20, duration: 0.62, ease: "power3.out" }, 0.48);
    });

    /* ================================================================
       SECTION 6 · PROJECT INSIGHTS (#ym6)
       기존: 카드 stagger + quote 유지
       [추가] .ym-r6__pink/.ym-r6__purple clipPath 좌→우 와이프
       [추가] 감정 입자 플로트 (once, 무한루프 없음)
    ================================================================ */
    header("#ym6");

    stagger(
      "#ym6 .ym-r6__card",
      scroller.querySelector("#ym6 .ym-r6__card--1"),
      { y: 30, stagger: 0.1 }
    );

    const quoteEl = scroller.querySelector("#ym6 .ym-r6__quote");
    if (quoteEl) {
      gsap.from(quoteEl, {
        opacity: 0, y: 28, scale: 0.98, transformOrigin: "50% 50%",
        duration: 0.9, ease: "back.out(1.2)",
        scrollTrigger: ST(quoteEl, "top 88%"),
      });
    }

    /* [추가] pink/purple clipPath 와이프 (좌→우 리빌) */
    if (quoteEl) {
      [".ym-r6__pink", ".ym-r6__purple"].forEach((sel, i) => {
        const el = quoteEl.querySelector(sel);
        if (!el) return;
        gsap.from(el, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.75, ease: "expo.out",
          delay: 0.36 + i * 0.2,
          scrollTrigger: ST(quoteEl, "top 88%"),
          clearProps: "clip-path",
        });
      });
    }

    /* [추가] 감정 입자 플로트 — reduced-motion 이미 위에서 가드됨 */
    (() => {
      const ptCont = scroller.querySelector("#ym6 .ym-r6__particles");
      if (!ptCont) return;

      const pColors = ["#ffb3cc", "#b3c8ff", "#ffe0b3", "#d4b3ff", "#b3f0e0", "#ffd6e8"];
      const n = 12;
      const rnd = gsap.utils.random;

      /* 파티클 DOM 생성 */
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const p = document.createElement("div");
        p.className = "ym-r6__particle";
        p.setAttribute("aria-hidden", "true");
        p.style.setProperty("--pc", pColors[i % pColors.length]);
        p.style.left = (7 + (i / n) * 86) + "%";
        frag.appendChild(p);
      }
      ptCont.appendChild(frag);

      const pts = ptCont.querySelectorAll(".ym-r6__particle");
      const trigger = scroller.querySelector("#ym6 .ym-r6__card--1");
      if (!trigger) return;

      /* 파티클별 독립 once 트리거 (delay로 stagger) */
      pts.forEach((p, i) => {
        const delay  = rnd(0, 1.1, 0.05);
        const rise   = rnd(65, 110, 1);
        const dur    = rnd(1.6, 2.4, 0.1);

        gsap.to(p, {
          keyframes: [
            { y: 0,     opacity: 0,   duration: 0 },
            { y: -rise * 0.4, opacity: 0.8, duration: dur * 0.38 },
            { y: -rise, opacity: 0,   duration: dur * 0.62 },
          ],
          delay,
          ease: "none",
          scrollTrigger: ST(trigger, "top 88%"),
          clearProps: "transform,opacity",
        });
      });
    })();

    /* ================================================================
       SECTION 7 · OUTRO (#ym-outro)
       기존: opacity once 유지 (scale 제거)
       [추가] scrub 느린 줌 scale 1→1.06 분리
    ================================================================ */
    const outroSec = scroller.querySelector("#ym-outro");
    const outImg   = scroller.querySelector("#ym-outro .ym-outro__img");
    if (outImg) {
      /* opacity once */
      gsap.from(outImg, {
        opacity: 0, duration: 1.5, ease: "power3.out",
        scrollTrigger: ST(outroSec || outImg, "top bottom"),
      });
      /* [추가] scrub 느린 줌 */
      if (outroSec) {
        gsap.fromTo(outImg,
          { scale: 1.0, transformOrigin: "50% 50%" },
          {
            scale: 1.06, transformOrigin: "50% 50%",
            ease: "none",
            scrollTrigger: {
              trigger: outroSec,
              scroller,
              start: "top bottom",
              end: "bottom center",
              scrub: 2.2,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }

    /* ================================================================
       안전망: 스크롤러 바닥 도달 시 미발동 once 트리거 즉시 완료
       (짧은 스크롤러에서 threshold 미도달로 고착된 opacity:0 요소 구제)
    ================================================================ */
    let safetyFired = false;
    scroller.addEventListener("scroll", function safetyNet() {
      if (safetyFired) return;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      if (scrollTop + clientHeight < scrollHeight - 2) return;
      safetyFired = true;
      scroller.removeEventListener("scroll", safetyNet);
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.scroller !== scroller || !st.vars.once) return;
        try {
          const anim = st.animation;
          if (anim && anim.totalProgress() < 1) {
            anim.progress(1, true);
            st.kill();
          }
        } catch (e) {}
      });
    }, { passive: true });

    /* ── 이미지 로드 후 위치 재계산 ── */
    scroller.querySelectorAll(".process__making--yumi img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", () => {
        try { ScrollTrigger.refresh(); } catch (e) {}
      }, { once: true });
    });

    return true;
  };

  /* GSAP CDN 지연 시 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => { if (init() || ++n > 30) clearInterval(t); }, 80);
  }
})();
