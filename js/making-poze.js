/* =======================================================================
   making-poze.js — POZE 제작 과정 본문 스크롤 모션 (GSAP + ScrollTrigger)
   -----------------------------------------------------------------------
   · scroller: #process-poze .process__content (자린고비 컨테이너와 별도)
   · prefers-reduced-motion / GSAP 미로드 → 모션 없이 정상 표시
   · clip-path 초기값은 gsap.set()으로 JS에서만 적용 → GSAP 미로드 시
     요소가 clip-path로 숨는 일 없음
   · window.__makingRefresh() (전역) 가 열릴 때 ScrollTrigger.refresh()를
     호출하므로 POZE 트리거도 함께 갱신됨
   · 모바일(≤1024px portrait): scrub·핀 전체 비활성.
     gsap.set() 포함 from-상태 적용 코드 자체를 실행하지 않아
     clip-path/구분선/색카드 등 모든 요소가 CSS 기본(최종·보임) 상태로 유지됨.
     reduced-motion early-return 과 동일한 "GSAP skip" 방식.
======================================================================= */
(() => {
  /* ── 초기화 ────────────────────────────────────────────────────────── */
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;

    const scroller = document.querySelector("#process-poze .process__content");
    if (!scroller) return true; // 마크업 없으면 그냥 통과

    const { gsap, ScrollTrigger } = window;

    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시, 초기화는 완료로 처리 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* 모바일 portrait(≤1024px): scrub·핀 전체 skip.
       gsap.set()으로 clip-path 등 from-상태를 설정하는 코드도 실행하지 않아
       pathImg·rbTitle·pz-s7 색카드가 닫힌 채 고착되지 않는다.
       scrub이 아닌 once(ST) 트리거는 if 블록 밖에서 그대로 실행됨. */
    const isMobile = matchMedia("(max-width:1024px) and (orientation:portrait)").matches;

    /* ScrollTrigger 헬퍼 (once 트리거 공통 옵션) */
    const ST = (trigger, start = "top 86%") => ({
      trigger,
      scroller,
      start,
      once: true,
    });

    /* ScrollTrigger 헬퍼 (scrub — 스크롤 진행률 1:1 추종)
       scrub:true = 추가 lerp 없이 스크롤 위치에 즉시 추종(숫자 scrub 이중지연 금지).
       smooth-process의 lerp만 남아 자연스럽게 따라온다.
       요소가 화면 하단 근처(start)→중상단(end)을 지나는 동안 0→100%. */
    const STS = (trigger, start = "top 90%", end = "top 55%") => ({
      trigger,
      scroller,
      start,
      end,
      scrub: true,
    });

    /* ================================================================
       SECTION 1 — #pz1
       .pz-band 3장 stagger 페이드+업
       .pz-serif--poze / .pz-serif--everyday 순차 페이드+업
    ================================================================ */
    if (!isMobile) {
      const bands = scroller.querySelectorAll("#pz1 .pz-band");
      if (bands.length) {
        gsap.from(bands, {
          opacity: 0,
          y: 36,
          ease: "none",
          stagger: 0.15,
          scrollTrigger: STS("#pz1", "top 90%", "top 50%"),
        });
      }

      const serifPoze = scroller.querySelector(".pz-serif--poze");
      const serifEveryday = scroller.querySelector(".pz-serif--everyday");

      if (serifPoze) {
        gsap.from(serifPoze, {
          opacity: 0,
          y: 22,
          ease: "none",
          scrollTrigger: STS(".pz-serif--poze", "top 90%", "top 55%"),
        });
      }
      if (serifEveryday) {
        gsap.from(serifEveryday, {
          opacity: 0,
          y: 18,
          ease: "none",
          scrollTrigger: STS(".pz-serif--everyday", "top 88%", "top 53%"),
        });
      }
    }

    /* ================================================================
       SECTION 2 — #pz-s2 (RIPE 브랜드 소개)
       .rp-brief__img   우측(x: 44)에서 슬라이드+페이드
       .rp-brief__text  통째로 페이드+업
    ================================================================ */
    if (!isMobile) {
      const splitImg = scroller.querySelector(".rp-brief__img");
      if (splitImg) {
        gsap.from(splitImg, {
          opacity: 0,
          x: 44,
          ease: "none",
          scrollTrigger: STS("#pz-s2", "top 88%", "top 52%"),
        });
      }

      const brief = scroller.querySelector(".rp-brief__text");
      if (brief) {
        gsap.from(brief, {
          opacity: 0,
          y: 28,
          ease: "none",
          scrollTrigger: STS("#pz-s2", "top 86%", "top 48%"),
        });
      }
    }

    /* ================================================================
       SECTION 3 — #pz2 (핵심: 곡선 드로잉)

       곡선(.pz-flow__path)은 <img> filled path SVG → stroke-dashoffset 불가.
       clip-path inset(0 0 100% 0) → inset(0 0 0% 0) 으로 스크롤 scrub.
       → 위→아래로 그려지는 연출.

       clip-path 초기값은 gsap.set()으로만 설정 — GSAP 미로드 시 CSS에
       clip-path가 없어 요소가 정상 표시됨.

       모바일: gsap.set(pathImg) 포함 블록 전체 skip →
       pathImg가 clip-path:"inset(0 0 100% 0)" 로 닫힌 채 고착되지 않는다.
       구분선(scaleX:0)도 동일하게 tween 미생성 → CSS 기본(scaleX:1) 유지.

       라벨(.pz-flow__c1/c2/c3)과 블록(.pz-flow__b1/b2/b3)은
       곡선이 그 지점에 닿을 때 scrub 페이드+업.
    ================================================================ */
    if (!isMobile) {
      const flowSection = scroller.querySelector("#pz2");
      const pathImg = scroller.querySelector(".pz-flow__path");

      if (flowSection && pathImg) {
        /* 곡선 초기 clip-path 설정 (JS에서만 → GSAP 미로드 시 폴백) */
        gsap.set(pathImg, { clipPath: "inset(0 0 100% 0)" });

        /* 곡선 드로잉 — 스크롤 진행에 맞춰 위→아래로 그려짐(clip-path inset bottom 100%→0%).
           섹션이 화면 중앙쯤 올 때 완성. ease:"none" 으로 스크롤과 선형 일치. */
        gsap.fromTo(pathImg,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", ease: "none",
            scrollTrigger: STS(flowSection, "top 80%", "center 60%") });

        /* ── 중앙 라벨 c1/c2/c3 — 곡선 진행에 맞춰 순차 페이드 ── */
        /* 섹션 높이 기준으로 각 라벨이 나타날 진입 지점을 분산 */
        const cLabels = [
          scroller.querySelector(".pz-flow__c1"),
          scroller.querySelector(".pz-flow__c2"),
          scroller.querySelector(".pz-flow__c3"),
        ];
        /* 각 라벨: 섹션 상단 진입 후 25% / 50% / 75% 진행 시점에 등장(scrub 스팬) */
        const cStarts = ["top 78%", "top 52%", "top 26%"];
        const cEnds   = ["top 56%", "top 30%", "top 4%"];

        cLabels.forEach((el, i) => {
          if (!el) return;
          gsap.from(el, {
            opacity: 0,
            y: 14,
            ease: "none",
            scrollTrigger: STS(flowSection, cStarts[i], cEnds[i]),
          });
        });

        /* ── 좌우 블록 b1/b2/b3 — 각 위치 진입 시 페이드+업 ── */
        const blocks = [
          scroller.querySelector(".pz-flow__b1"),
          scroller.querySelector(".pz-flow__b2"),
          scroller.querySelector(".pz-flow__b3"),
        ];
        const bStarts = ["top 80%", "top 58%", "top 36%"];
        const bEnds   = ["top 58%", "top 36%", "top 14%"];

        blocks.forEach((el, i) => {
          if (!el) return;
          /* 좌/우 교차: b1·b3 좌측(-x), b2 우측(+x) */
          const xDir = i === 1 ? 32 : -32;
          gsap.from(el, {
            opacity: 0,
            x: xDir,
            y: 16,
            ease: "none",
            scrollTrigger: STS(flowSection, bStarts[i], bEnds[i]),
          });
        });

        /* ⑤ 구분선 드로잉 — 각 블록 위치에서 좌→우로 1px 라인이 그어짐(scrub) */
        scroller.querySelectorAll("#pz2 .pz-flow__line").forEach((line, i) => {
          gsap.from(line, {
            scaleX: 0,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: STS(flowSection, bStarts[i] || "top 36%", bEnds[i] || "top 14%"),
          });
        });
      }
    }

    /* ================================================================
       SECTION 4 — #pz-s4 (POZE Logo Analysis)
       제목 / Identity 리스트(스태거) / 중앙 로고 이미지(살짝 확대) /
       하단 문단 — 각 요소 once 페이드+업, 가볍게.
    ================================================================ */
    if (!isMobile) {
      const logoSection = scroller.querySelector("#pz-s4");
      if (logoSection) {
        const lCaption = logoSection.querySelector(".pz-logo__caption");
        const lTitle = logoSection.querySelector(".pz-logo__title");
        const lIdItems = logoSection.querySelectorAll(".pz-logo__id > *");
        const lImg = logoSection.querySelector(".pz-logo__img");
        const lDesc = logoSection.querySelector(".pz-logo__desc");

        if (lCaption) {
          gsap.from(lCaption, {
            opacity: 0, y: 18, ease: "none",
            scrollTrigger: STS("#pz-s4", "top 86%", "top 54%"),
          });
        }
        if (lTitle) {
          gsap.from(lTitle, {
            opacity: 0, y: 20, ease: "none",
            scrollTrigger: STS("#pz-s4", "top 84%", "top 52%"),
          });
        }
        if (lIdItems.length) {
          gsap.from(lIdItems, {
            opacity: 0, y: 16, ease: "none", stagger: 0.1,
            scrollTrigger: STS("#pz-s4", "top 80%", "top 46%"),
          });
        }
        if (lImg) {
          /* 줌-세틀: 살짝 확대된 채 페이드 → 1.0으로 정착(scrub) */
          gsap.from(lImg, {
            opacity: 0, y: 24, scale: 0.965, transformOrigin: "50% 50%",
            ease: "none",
            scrollTrigger: STS("#pz-s4", "top 76%", "top 42%"),
          });
        }
        if (lDesc) {
          gsap.from(lDesc, {
            opacity: 0, y: 18, ease: "none",
            scrollTrigger: STS("#pz-s4", "top 70%", "top 38%"),
          });
        }

        /* ⑦ 로고 마우스 틸트 — fine 포인터 + hover 가능 기기에서만(터치 제외).
           quickTo 로 커서를 부드럽게(0.5s) 따라가는 ±5° 틸트, 벗어나면 천천히 복귀. */
        if (lImg && matchMedia("(hover: hover) and (pointer: fine)").matches) {
          gsap.set(lImg, { transformPerspective: 900, transformOrigin: "50% 50%" });
          const rX = gsap.quickTo(lImg, "rotationX", { duration: 0.5, ease: "power2.out" });
          const rY = gsap.quickTo(lImg, "rotationY", { duration: 0.5, ease: "power2.out" });
          let lRect = null;   /* enter 시 1회 캐시 → mousemove 마다 getBoundingClientRect(강제 reflow) 방지 */
          lImg.addEventListener("mouseenter", () => { lRect = lImg.getBoundingClientRect(); });
          lImg.addEventListener("mousemove", (e) => {
            if (!lRect) return;
            const px = (e.clientX - lRect.left) / lRect.width - 0.5;   /* -0.5 ~ 0.5 */
            const py = (e.clientY - lRect.top) / lRect.height - 0.5;
            rY(px * 10);    /* ±5° */
            rX(-py * 10);   /* ±5° (위로 갈수록 윗변이 앞으로) */
          });
          lImg.addEventListener("mouseleave", () => {
            lRect = null;
            gsap.to(lImg, { rotationX: 0, rotationY: 0, duration: 0.6, ease: "power2.out" });
          });
        }
      }
    }

    /* ================================================================
       SECTION 5 — #pz-s5 (풀블리드 에디토리얼 이미지)
       살짝 확대된 채 페이드인 → 1.0으로 정착(은은한 줌-세틀).
    ================================================================ */
    if (!isMobile) {
      ["#pz-s5", "#pz-s10"].forEach((sel) => {
        const fullImg = scroller.querySelector(`${sel} .pz-full-img`);
        if (fullImg) {
          /* 줌-세틀: 1.045 확대 + 페이드 → 1.0 정착(scrub) */
          gsap.from(fullImg, {
            opacity: 0, scale: 1.045, transformOrigin: "50% 50%",
            ease: "none",
            scrollTrigger: STS(sel, "top 88%", "top 48%"),
          });
        }
      });
    }

    /* ================================================================
       ② #pz-s5 — 책 영상 소프트포커스 + 글로우 + 캡션
       소프트포커스: blur(7px)→0 (will-change는 tween 동안만, 끝나면 clearProps)
       s5Vid blur — ST once, 모바일 portrait에서도 실행(blur=0으로 자동 처리).
       s5Glow·s5Cap — scrub, 모바일에서 비활성.
         s5Cap 의 gsap.set(xPercent:-50) 도 모바일에서 skip →
         CSS translateX(-50%) 가 그대로 유지됨.
    ================================================================ */
    const s5Vid = scroller.querySelector("#pz-s5 .pz-full-vid");
    if (s5Vid) {
      const s5Blur = matchMedia("(max-width:1024px) and (orientation:portrait)").matches ? 0 : 7;   /* 모바일(태블릿 세로 포함)은 영상 blur 생략(디코드+blur 부담) */
      gsap.fromTo(s5Vid,
        { filter: `blur(${s5Blur}px)` },
        { filter: "blur(0px)", duration: 1.3, ease: "power3.out",
          onStart() { s5Vid.style.willChange = "filter"; },
          onComplete() { s5Vid.style.willChange = ""; gsap.set(s5Vid, { clearProps: "filter" }); },
          scrollTrigger: ST("#pz-s5", "top 82%") });
    }
    if (!isMobile) {
      const s5Glow = scroller.querySelector("#pz-s5 .pz-glow");
      if (s5Glow) {
        gsap.to(s5Glow, {
          opacity: 0.6, ease: "none",
          scrollTrigger: STS("#pz-s5", "top 86%", "top 48%"),
        });
      }
      const s5Cap = scroller.querySelector("#pz-s5 .pz-cap");
      if (s5Cap) {
        gsap.set(s5Cap, { xPercent: -50, x: 0 });   /* 중앙정렬 선점 (CSS translateX 대체) */
        gsap.fromTo(s5Cap,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, ease: "none",
            scrollTrigger: STS("#pz-s5", "top 78%", "top 44%") });
      }
    }

    /* ================================================================
       ⑥ #pz-s10 — 클로징 패럴랙스 (줌-세틀 once 와 별개의 scrub)
       transform y 만 0→-26 (scale/opacity 와 충돌 없음). .pz-sec overflow:hidden 으로 클립.
    ================================================================ */
    if (!isMobile) {
      const s10Img = scroller.querySelector("#pz-s10 .pz-full-img");
      if (s10Img) {
        gsap.to(s10Img, {
          y: -26, ease: "none",
          scrollTrigger: {
            trigger: "#pz-s10", scroller,
            start: "top bottom", end: "bottom top", scrub: 1,
          },
        });
      }
    }

    /* ================================================================
       SECTION 6 — #pz-s6 (REBUILT FOR IMMERSION, split)
       좌측 이미지 x:-40 슬라이드+페이드 / 우측 제목·서브 순차 페이드+업.
       모바일: gsap.set(rbTitle) 포함 블록 전체 skip →
       rbTitle 이 clipPath:"inset(100% 0 0 0)", opacity:0 으로 고착되지 않는다.
    ================================================================ */
    if (!isMobile) {
      const rbImg = scroller.querySelector("#pz-s6 .pz-rebuilt__img");
      const rbTitle = scroller.querySelector("#pz-s6 .pz-rebuilt__title");
      const rbSub = scroller.querySelector("#pz-s6 .pz-rebuilt__sub");
      if (rbImg) {
        gsap.from(rbImg, {
          opacity: 0, x: -40, ease: "none",
          scrollTrigger: STS("#pz-s6", "top 88%", "top 50%"),
        });
      }
      if (rbTitle) {
        /* ③ 마스크 와이프 — 아래에서 위로 드러남(scrub). clip 초기값은 set 으로만 → GSAP 미로드 폴백 */
        gsap.set(rbTitle, { clipPath: "inset(100% 0 0 0)", opacity: 0 });
        gsap.to(rbTitle, {
          clipPath: "inset(0% 0 0 0)", opacity: 1, ease: "none",
          scrollTrigger: STS("#pz-s6", "top 82%", "top 46%"),
        });
      }
      if (rbSub) {
        gsap.from(rbSub, {
          opacity: 0, y: 18, ease: "none",
          scrollTrigger: STS("#pz-s6", "top 78%", "top 42%"),
        });
      }
    }

    /* ================================================================
       SECTION 7 — #pz-s7 (COLOR DIRECTION) — 스크롤 핀 (A형)
       섹션 뷰포트에 들어옴(≈0.67×) → setPzS7Top 중앙 sticky, #pz-s7-pin scrub:
       타이틀 + 색 카드 3장 clipPath 페인트-업(아래서 색 차오름, 뷰티 팔레트 공개).
       기존 STS 교체. fromTo+명시값(refresh 안전). reduced-motion: init early-return + CSS 폴백.
       모바일: 핀·timeline 전체 skip →
       cTitle/cCards 의 fromTo from-상태(clipPath:"inset(100% 0 0 0)")가
       적용되지 않아 색카드가 닫힌 채 고착되지 않는다.
    ================================================================ */
    if (!isMobile) {
      const pzS7Pin = scroller.querySelector("#pz-s7-pin");
      const pzS7El  = scroller.querySelector("#pz-s7");
      if (pzS7Pin && pzS7El) {
        const setPzS7Top = () => {
          pzS7El.style.top = Math.round((scroller.clientHeight - pzS7El.offsetHeight) / 2) + "px";
        };
        const cTitle = scroller.querySelector("#pz-s7 .pz-color__title");
        const cCards = [...scroller.querySelectorAll("#pz-s7 .pz-color__card")];
        const wc = (v) => [cTitle, ...cCards].forEach((el) => el && (el.style.willChange = v));
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pzS7Pin, scroller,
            start: "top top", end: "bottom bottom",
            scrub: true, onRefreshInit: setPzS7Top,
            /* clipPath scrub GPU offload — 핀 구간에서만 (perf 게이트) */
            onEnter() { wc("clip-path"); }, onEnterBack() { wc("clip-path"); },
            onLeave() { wc("auto"); }, onLeaveBack() { wc("auto"); },
          },
        });
        if (cTitle) tl.fromTo(cTitle, { clipPath: "inset(100% 0 0 0)", opacity: 0 }, { clipPath: "inset(0% 0 0 0)", opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
        cCards.forEach((card, i) => {
          tl.fromTo(card, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.5, ease: "power2.out" }, 0.3 + i * 0.2);
        });
        setPzS7Top();
        window.addEventListener("resize", setPzS7Top);
      }
    }

    /* ================================================================
       SECTION 8 — #pz-s8 (POZE 웹사이트 목업)
       · 상단 목업/좌측 긴 컬럼 = 일반 페이드인
       · 오른쪽 짧은 사진(.pz-shop__sticky) = 좌측 긴 컬럼이 스크롤되는
         동안 pin 고정 (CSS sticky가 막혀 ScrollTrigger pin/transform 사용)
    ================================================================ */
    if (!isMobile) {
      const shopTop = scroller.querySelector("#pz-s8 .pz-shop__top");
      const shopRow = scroller.querySelector("#pz-s8 .pz-shop__row");
      const shopLong = scroller.querySelector("#pz-s8 .pz-shop__long");
      const shopSticky = scroller.querySelector("#pz-s8 .pz-shop__sticky");

      if (shopTop) {
        gsap.from(shopTop, {
          opacity: 0, y: 28, ease: "none",
          scrollTrigger: STS("#pz-s8 .pz-shop__top", "top 88%", "top 52%"),
        });
      }
      if (shopRow && shopLong && shopSticky) {
        gsap.from(shopLong, {
          opacity: 0, y: 30, ease: "none",
          scrollTrigger: STS("#pz-s8 .pz-shop__row", "top 86%", "top 50%"),
        });
        gsap.from(shopSticky, {
          opacity: 0, ease: "none",
          scrollTrigger: STS("#pz-s8 .pz-shop__row", "top 86%", "top 50%"),
        });

        /* 우측 사진을 모달 뷰포트 높이로 꽉 채움 → CSS position:sticky가 고정 담당.
           (ScrollTrigger pin의 transform 1프레임 지연 = "들썩임" 제거, 네이티브 sticky는 무진동)
           스크롤러 높이는 모달이 열려야 유효하므로 열릴 때마다 재계산. */
        const modalEl = document.querySelector("#process-poze");
        const sizeSticky = () => {
          const h = scroller.clientHeight;
          if (h) shopSticky.style.height = Math.round(h) + "px";
        };
        if (modalEl) {
          new MutationObserver(() => {
            if (modalEl.classList.contains("is-open")) sizeSticky();
          }).observe(modalEl, { attributes: true, attributeFilter: ["class"] });
        }
        sizeSticky();                              // 이미 열려있으면 즉시
      }
    }

    /* ================================================================
       SECTION 9 — #pz-s9 (모바일 목업)
       핸드폰 위에 마우스를 올리면 화면 안에서 모바일 이미지가 위→아래로
       스크롤(yoyo 반복), 벗어나면 맨 위로 부드럽게 복귀.
       화면 밖으로는 .pz-phone__screen 의 overflow:hidden 으로 안 보임.
       hover 이벤트: 모바일에서 mouseenter 발생 안 하므로 isMobile 가드 불필요.
       phoneDevice 등장 scrub(fromTo opacity/y): 모바일에서 비활성.
       phoneBlur: 이미 (max-width:1024px) 체크로 blur=0 → if(phoneBlur) 불통과 → 자동 skip.
    ================================================================ */
    const phoneDevice = scroller.querySelector("#pz-s9 .pz-phone__device");
    const phoneScreen = scroller.querySelector("#pz-s9 .pz-phone__screen");
    const phoneLive = scroller.querySelector("#pz-s9 .pz-phone__live");

    if (phoneDevice && phoneScreen && phoneLive) {
      /* 라이브 iframe 을 모바일 논리폭(390px)으로 렌더 → 화면 px 에 맞춰 scale 다운.
         (site 가 보는 viewport=390px → 제대로 된 모바일 레이아웃, 화면엔 선명히 축소)
         화면이 실제 크기를 가질 때(모달 오픈/리사이즈)마다 재계산. */
      const LOGICAL_W = 390;
      const setPhoneLive = () => {
        const w = phoneScreen.clientWidth, h = phoneScreen.clientHeight;
        if (w < 2) return;
        const s = w / LOGICAL_W;
        phoneLive.style.width = LOGICAL_W + "px";
        phoneLive.style.height = (h / s) + "px";
        phoneLive.style.transform = "scale(" + s + ")";
      };
      if (window.ResizeObserver) new ResizeObserver(setPhoneLive).observe(phoneScreen);
      else window.addEventListener("resize", setPhoneLive);
      /* 모달 오픈 시 process.js 가 ScrollTrigger.refresh 를 호출 → 그때 화면이 실제 px 를 가지므로
         refresh 마다 재계산(닫힌 채 setup 되어 화면=0 이던 초기 누락 보강). */
      ScrollTrigger.addEventListener("refresh", setPhoneLive);
      setPhoneLive();

      if (!isMobile) {
        /* ⑧ 핸드폰 등장 — fade+업(transform/opacity)은 scrub로 스크롤 따라.
           소프트포커스 blur 는 매 스크롤프레임 재계산 부담이라 scrub 금지 → once 유지(분리). */
        gsap.fromTo(phoneDevice,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, ease: "none",
            scrollTrigger: STS("#pz-s9", "top 84%", "top 50%") });
      }

      /* 모바일(≤1024px portrait)은 filter 부담 커서 blur 생략(0). will-change 는 tween 동안만. */
      const phoneBlur = matchMedia("(max-width:1024px) and (orientation:portrait)").matches ? 0 : 9;
      if (phoneBlur) {
        gsap.fromTo(phoneDevice,
          { filter: `blur(${phoneBlur}px)` },
          { filter: "blur(0px)", duration: 1.1, ease: "power3.out",
            onStart() { phoneDevice.style.willChange = "filter"; },
            onComplete() { phoneDevice.style.willChange = ""; gsap.set(phoneDevice, { clearProps: "filter" }); },
            scrollTrigger: ST("#pz-s9", "top 80%") });
      }
    }

    /* ================================================================
       ④ 섹션 배경톤 느린 전환 — "미세한 톤 드리프트"
       각 pz 섹션은 이미 의도적으로 다른 불투명 배경(크림/토프/다크/그라데)을
       갖고 텍스트 대비도 섹션별로 맞춰져 있다. → 컨테이너 한 장 크로스페이드는
       섹션에 가려 안 보이고, 섹션 배경을 통째로 바꾸면 Figma 팔레트·대비가 깨진다.
       그래서 각 섹션 '자신의' 배경을 캐논값과 거의 같은 톤에서 출발해 진입 시
       1.4s 동안 캐논값으로 수렴(거의 안 보이는 정착감). 대비 영향 없음.
       (풀블리드 pz-s5/s10 은 영상·이미지가 배경을 덮어 드리프트가 안 보여 제외,
        pz-s9 는 그라데이션 배경이라 제외.)
       ST once — scrub 아님. 모바일 portrait에서도 실행됨.
    ================================================================ */
    [
      ["#pz1",   "#f4efe9"],   /* 크림 #efe9e2 ← 살짝 밝게 */
      ["#pz-s2", "#f6f3f0"],   /* 화이트 #fff ← 거의 흰색(따뜻한 톤)에서 수렴 */
      ["#pz2",   "#ece9e4"],   /* 라이트 #f2f1ef ← 살짝 가라앉혀 수렴 */
      ["#pz-s4", "#f6f3f0"],   /* 화이트 #fff ← 거의 흰색에서 수렴 */
      ["#pz-s6", "#f6f3f0"],   /* 화이트 #fff ← 거의 흰색에서 수렴 */
      ["#pz-s7", "#ece9e4"],   /* 라이트 #f2f1ef ← 살짝 가라앉혀 수렴 */
      /* #pz-s8 제외 — 히어로 영상+긴 이미지가 배경을 완전히 덮어 드리프트가 안 보임 */
    ].forEach(([sel, fromTone]) => {
      const el = scroller.querySelector(sel);
      if (!el) return;
      gsap.from(el, {
        backgroundColor: fromTone, duration: 1.4, ease: "power2.out",
        scrollTrigger: ST(sel, "top 90%"),
      });
    });

    /* ── 이미지 로드 후 위치 재계산 ─────────────────────────────── */
    scroller.querySelectorAll(".process__making--poze img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", () => {
          try { ScrollTrigger.refresh(); } catch (e) {}
        }, { once: true });
      }
    });

    return true;
  };

  /* defer 순서상 보통 즉시 준비되지만 CDN 지연 시 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => {
      if (init() || ++n > 30) clearInterval(t);
    }, 80);
  }
})();
