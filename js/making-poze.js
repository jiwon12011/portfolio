/* =======================================================================
   making-poze.js — POZE 제작 과정 본문 스크롤 모션 (GSAP + ScrollTrigger)
   -----------------------------------------------------------------------
   · scroller: #process-poze .process__content (자린고비 컨테이너와 별도)
   · prefers-reduced-motion / GSAP 미로드 → 모션 없이 정상 표시
   · clip-path 초기값은 gsap.set()으로 JS에서만 적용 → GSAP 미로드 시
     요소가 clip-path로 숨는 일 없음
   · window.__makingRefresh() (전역) 가 열릴 때 ScrollTrigger.refresh()를
     호출하므로 POZE 트리거도 함께 갱신됨
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

    /* ScrollTrigger 헬퍼 (once 트리거 공통 옵션) */
    const ST = (trigger, start = "top 86%") => ({
      trigger,
      scroller,
      start,
      once: true,
    });

    /* ================================================================
       SECTION 1 — #pz1
       .pz-band 3장 stagger 페이드+업
       .pz-serif--poze / .pz-serif--everyday 순차 페이드+업
    ================================================================ */
    const bands = scroller.querySelectorAll("#pz1 .pz-band");
    if (bands.length) {
      gsap.from(bands, {
        opacity: 0,
        y: 36,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: ST("#pz1", "top 88%"),
      });
    }

    const serifPoze = scroller.querySelector(".pz-serif--poze");
    const serifEveryday = scroller.querySelector(".pz-serif--everyday");

    if (serifPoze) {
      gsap.from(serifPoze, {
        opacity: 0,
        y: 22,
        duration: 1.0,
        ease: "power2.out",
        scrollTrigger: ST(".pz-serif--poze", "top 90%"),
      });
    }
    if (serifEveryday) {
      gsap.from(serifEveryday, {
        opacity: 0,
        y: 18,
        duration: 1.0,
        delay: 0.18,
        ease: "power2.out",
        scrollTrigger: ST(".pz-serif--everyday", "top 90%"),
      });
    }

    /* ================================================================
       SECTION 2 — #pz-s2
       .pz-split-img  우측(x: 40)에서 슬라이드+페이드
       .pz-quote      통째로 페이드+업
    ================================================================ */
    const splitImg = scroller.querySelector(".pz-split-img");
    if (splitImg) {
      gsap.from(splitImg, {
        opacity: 0,
        x: 44,
        duration: 1.0,
        ease: "power3.out",
        scrollTrigger: ST("#pz-s2", "top 84%"),
      });
    }

    const quote = scroller.querySelector(".pz-quote");
    if (quote) {
      /* ① 자간 호흡 — 넓은 자간(0.28em)에서 정상값으로 수렴 (단일 <p> once라 레이아웃 OK) */
      gsap.from(quote, {
        opacity: 0,
        y: 28,
        letterSpacing: "0.28em",
        duration: 1.6,
        delay: 0.12,
        ease: "power3.out",
        scrollTrigger: ST("#pz-s2", "top 84%"),
      });
    }

    /* ================================================================
       SECTION 3 — #pz2 (핵심: 곡선 드로잉)

       곡선(.pz-flow__path)은 <img> filled path SVG → stroke-dashoffset 불가.
       clip-path inset(0 0 100% 0) → inset(0 0 0% 0) 으로 스크롤 scrub.
       → 위→아래로 그려지는 연출.

       clip-path 초기값은 gsap.set()으로만 설정 — GSAP 미로드 시 CSS에
       clip-path가 없어 요소가 정상 표시됨.

       라벨(.pz-flow__c1/c2/c3)과 블록(.pz-flow__b1/b2/b3)은
       곡선이 그 지점에 닿을 때쯤 once 페이드+업 (scrub 아님).
    ================================================================ */
    const flowSection = scroller.querySelector("#pz2");
    const pathImg = scroller.querySelector(".pz-flow__path");

    if (flowSection && pathImg) {
      /* 곡선 초기 clip-path 설정 (JS에서만) */
      gsap.set(pathImg, { clipPath: "inset(0 0 100% 0)" });

      /* 곡선 scrub — 섹션이 화면에 들어와 framed 될 때쯤 완성되도록.
         (기존 end:"bottom 30%"는 섹션이 화면 위로 거의 빠져나가야 100% →
          자연스러운 읽기 위치에서 곡선이 중간에 멈춰 보였음 = "나오다 말아")
         start: 섹션 상단이 80% 진입 → end: 섹션 중심이 상단 58% 도달(거의
         framed)되는 시점에 곡선 완성. QIET INTERACTION 점까지 다 그려짐. */
      ScrollTrigger.create({
        trigger: flowSection,
        scroller,
        start: "top 80%",
        end: "center 58%",
        scrub: 1,            /* 부드럽게 따라오는 scrub */
        onUpdate: (self) => {
          /* progress 0→1 : inset bottom 100%→0% */
          const pct = (1 - self.progress) * 100;
          gsap.set(pathImg, { clipPath: `inset(0 0 ${pct.toFixed(2)}% 0)` });
        },
        /* 완성 지점을 지나 더 스크롤해도 곡선은 완전히 그려진 채 고정 */
        onLeave: () => gsap.set(pathImg, { clipPath: "inset(0 0 0% 0)" }),
        onLeaveBack: () => gsap.set(pathImg, { clipPath: "inset(0 0 100% 0)" }),
      });

      /* ── 중앙 라벨 c1/c2/c3 — 곡선 진행에 맞춰 순차 페이드 ── */
      /* 섹션 높이 기준으로 각 라벨이 나타날 진입 지점을 분산 */
      const cLabels = [
        scroller.querySelector(".pz-flow__c1"),
        scroller.querySelector(".pz-flow__c2"),
        scroller.querySelector(".pz-flow__c3"),
      ];
      /* 각 라벨: 섹션 상단 진입 후 25% / 50% / 75% 진행 시점에 등장 */
      const cStarts = ["top 78%", "top 52%", "top 26%"];

      cLabels.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          opacity: 0,
          y: 14,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: flowSection,
            scroller,
            start: cStarts[i],
            once: true,
          },
        });
      });

      /* ── 좌우 블록 b1/b2/b3 — 각 위치 진입 시 페이드+업 ── */
      const blocks = [
        scroller.querySelector(".pz-flow__b1"),
        scroller.querySelector(".pz-flow__b2"),
        scroller.querySelector(".pz-flow__b3"),
      ];
      const bStarts = ["top 80%", "top 58%", "top 36%"];

      blocks.forEach((el, i) => {
        if (!el) return;
        /* 좌/우 교차: b1·b3 좌측(-x), b2 우측(+x) */
        const xDir = i === 1 ? 32 : -32;
        gsap.from(el, {
          opacity: 0,
          x: xDir,
          y: 16,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: flowSection,
            scroller,
            start: bStarts[i],
            once: true,
          },
        });
      });

      /* ⑤ 구분선 드로잉 — 각 블록 등장 직후(+0.1s) 좌→우로 1px 라인이 그어짐 */
      scroller.querySelectorAll("#pz2 .pz-flow__line").forEach((line, i) => {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.6,
          delay: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: flowSection,
            scroller,
            start: bStarts[i] || "top 36%",
            once: true,
          },
        });
      });
    }

    /* ================================================================
       SECTION 4 — #pz-s4 (POZE Logo Analysis)
       제목 / Identity 리스트(스태거) / 중앙 로고 이미지(살짝 확대) /
       하단 문단 — 각 요소 once 페이드+업, 가볍게.
    ================================================================ */
    const logoSection = scroller.querySelector("#pz-s4");
    if (logoSection) {
      const lTitle = logoSection.querySelector(".pz-logo__title");
      const lIdItems = logoSection.querySelectorAll(".pz-logo__id > *");
      const lImg = logoSection.querySelector(".pz-logo__img");
      const lDesc = logoSection.querySelector(".pz-logo__desc");

      if (lTitle) {
        gsap.from(lTitle, {
          opacity: 0, y: 20, duration: 0.9, ease: "power2.out",
          scrollTrigger: ST("#pz-s4", "top 82%"),
        });
      }
      if (lIdItems.length) {
        gsap.from(lIdItems, {
          opacity: 0, y: 16, duration: 0.7, ease: "power2.out", stagger: 0.1,
          scrollTrigger: ST("#pz-s4", "top 78%"),
        });
      }
      if (lImg) {
        gsap.from(lImg, {
          opacity: 0, y: 24, scale: 0.965, transformOrigin: "50% 50%",
          duration: 1.05, ease: "power3.out",
          scrollTrigger: ST("#pz-s4", "top 72%"),
        });
      }
      if (lDesc) {
        gsap.from(lDesc, {
          opacity: 0, y: 18, duration: 0.95, delay: 0.1, ease: "power3.out",
          scrollTrigger: ST("#pz-s4", "top 64%"),
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

    /* ================================================================
       SECTION 5 — #pz-s5 (풀블리드 에디토리얼 이미지)
       살짝 확대된 채 페이드인 → 1.0으로 정착(은은한 줌-세틀).
    ================================================================ */
    ["#pz-s5", "#pz-s10"].forEach((sel) => {
      const fullImg = scroller.querySelector(`${sel} .pz-full-img`);
      if (fullImg) {
        gsap.from(fullImg, {
          opacity: 0, scale: 1.045, transformOrigin: "50% 50%",
          duration: 1.3, ease: "power3.out",
          scrollTrigger: ST(sel, "top 82%"),
        });
      }
    });

    /* ================================================================
       ② #pz-s5 — 책 영상 소프트포커스 + 글로우 + 캡션
       소프트포커스: blur(7px)→0 (will-change는 tween 동안만, 끝나면 clearProps)
       글로우: opacity 0→0.6 / 캡션: 선명해진 뒤 delay 0.4 로 페이드+업
    ================================================================ */
    const s5Vid = scroller.querySelector("#pz-s5 .pz-full-vid");
    if (s5Vid) {
      const s5Blur = matchMedia("(max-width: 768px)").matches ? 0 : 7;   /* 모바일은 영상 blur 생략(디코드+blur 부담) */
      gsap.fromTo(s5Vid,
        { filter: `blur(${s5Blur}px)` },
        { filter: "blur(0px)", duration: 1.3, ease: "power3.out",
          onStart() { s5Vid.style.willChange = "filter"; },
          onComplete() { s5Vid.style.willChange = ""; gsap.set(s5Vid, { clearProps: "filter" }); },
          scrollTrigger: ST("#pz-s5", "top 82%") });
    }
    const s5Glow = scroller.querySelector("#pz-s5 .pz-glow");
    if (s5Glow) {
      gsap.to(s5Glow, {
        opacity: 0.6, duration: 1.6, ease: "power2.out",
        scrollTrigger: ST("#pz-s5", "top 82%"),
      });
    }
    const s5Cap = scroller.querySelector("#pz-s5 .pz-cap");
    if (s5Cap) {
      gsap.set(s5Cap, { xPercent: -50, x: 0 });   /* 중앙정렬 선점 (CSS translateX 대체) */
      gsap.fromTo(s5Cap,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 1.0, delay: 0.4, ease: "power3.out",
          scrollTrigger: ST("#pz-s5", "top 82%") });
    }

    /* ================================================================
       ⑥ #pz-s10 — 클로징 패럴랙스 (줌-세틀 once 와 별개의 scrub)
       transform y 만 0→-26 (scale/opacity 와 충돌 없음). .pz-sec overflow:hidden 으로 클립.
    ================================================================ */
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

    /* ================================================================
       SECTION 6 — #pz-s6 (REBUILT FOR IMMERSION, split)
       좌측 이미지 x:-40 슬라이드+페이드 / 우측 제목·서브 순차 페이드+업.
    ================================================================ */
    const rbImg = scroller.querySelector("#pz-s6 .pz-rebuilt__img");
    const rbTitle = scroller.querySelector("#pz-s6 .pz-rebuilt__title");
    const rbSub = scroller.querySelector("#pz-s6 .pz-rebuilt__sub");
    if (rbImg) {
      gsap.from(rbImg, {
        opacity: 0, x: -40, duration: 1.05, ease: "power3.out",
        scrollTrigger: ST("#pz-s6", "top 84%"),
      });
    }
    if (rbTitle) {
      /* ③ 마스크 와이프 — 아래에서 위로 드러남 (clip 초기값은 set 으로만 → GSAP 미로드 폴백) */
      gsap.set(rbTitle, { clipPath: "inset(100% 0 0 0)", opacity: 0 });
      gsap.to(rbTitle, {
        clipPath: "inset(0% 0 0 0)", opacity: 1, duration: 1.0, ease: "power3.out",
        scrollTrigger: ST("#pz-s6", "top 78%"),
      });
    }
    if (rbSub) {
      gsap.from(rbSub, {
        opacity: 0, y: 18, duration: 0.9, delay: 0.12, ease: "power3.out",
        scrollTrigger: ST("#pz-s6", "top 78%"),
      });
    }

    /* ================================================================
       SECTION 7 — #pz-s7 (COLOR DIRECTION)
       제목 페이드+업 / 카드 3장 좌→우 stagger 페이드+업.
    ================================================================ */
    const colorTitle = scroller.querySelector("#pz-s7 .pz-color__title");
    const colorCards = scroller.querySelectorAll("#pz-s7 .pz-color__card");
    if (colorTitle) {
      gsap.from(colorTitle, {
        opacity: 0, y: 20, duration: 0.9, ease: "power3.out",
        scrollTrigger: ST("#pz-s7", "top 82%"),
      });
    }
    if (colorCards.length) {
      gsap.from(colorCards, {
        opacity: 0, y: 30, duration: 0.9, ease: "power3.out", stagger: 0.12,
        scrollTrigger: ST("#pz-s7", "top 78%"),
      });
    }

    /* ================================================================
       SECTION 8 — #pz-s8 (POZE 웹사이트 목업)
       · 상단 목업/좌측 긴 컬럼 = 일반 페이드인
       · 오른쪽 짧은 사진(.pz-shop__sticky) = 좌측 긴 컬럼이 스크롤되는
         동안 pin 고정 (CSS sticky가 막혀 ScrollTrigger pin/transform 사용)
    ================================================================ */
    const shopTop = scroller.querySelector("#pz-s8 .pz-shop__top");
    const shopRow = scroller.querySelector("#pz-s8 .pz-shop__row");
    const shopLong = scroller.querySelector("#pz-s8 .pz-shop__long");
    const shopSticky = scroller.querySelector("#pz-s8 .pz-shop__sticky");

    if (shopTop) {
      gsap.from(shopTop, {
        opacity: 0, y: 28, duration: 1.0, ease: "power3.out",
        scrollTrigger: ST("#pz-s8 .pz-shop__top", "top 84%"),
      });
    }
    if (shopRow && shopLong && shopSticky) {
      gsap.from(shopLong, {
        opacity: 0, y: 30, duration: 1.0, ease: "power3.out",
        scrollTrigger: ST("#pz-s8 .pz-shop__row", "top 82%"),
      });
      gsap.from(shopSticky, {
        opacity: 0, duration: 1.0, ease: "power2.out",
        scrollTrigger: ST("#pz-s8 .pz-shop__row", "top 82%"),
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

    /* ================================================================
       SECTION 9 — #pz-s9 (모바일 목업)
       핸드폰 위에 마우스를 올리면 화면 안에서 모바일 이미지가 위→아래로
       스크롤(yoyo 반복), 벗어나면 맨 위로 부드럽게 복귀.
       화면 밖으로는 .pz-phone__screen 의 overflow:hidden 으로 안 보임.
    ================================================================ */
    const phoneDevice = scroller.querySelector("#pz-s9 .pz-phone__device");
    const phoneScreen = scroller.querySelector("#pz-s9 .pz-phone__screen");
    const phoneTrack = scroller.querySelector("#pz-s9 .pz-phone__track");
    const phoneShot = scroller.querySelector("#pz-s9 .pz-phone__shot");

    if (phoneDevice && phoneScreen && phoneTrack) {
      /* enter/leave 마다 트랙의 기존 tween을 전부 죽이고 하나만 → 중첩/충돌 방지.
         스크롤 거리는 hover 시점에 계산(그때 이미지 로드 완료 보장). */
      const phoneIn = () => {
        const dist = phoneTrack.scrollHeight - phoneScreen.clientHeight;
        if (dist <= 4) return;
        phoneTrack.style.willChange = "transform";   /* hover 동안만 GPU 힌트 */
        gsap.killTweensOf(phoneTrack);
        gsap.to(phoneTrack, {
          y: -dist, duration: Math.max(3, dist / 300), ease: "none",  /* ≈300px/s 프리뷰 스크롤 */
          repeat: -1, yoyo: true,
        });
      };
      const phoneOut = () => {
        gsap.killTweensOf(phoneTrack);
        gsap.to(phoneTrack, { y: 0, duration: 0.6, ease: "power2.out",
          onComplete: () => { phoneTrack.style.willChange = "auto"; } });
      };
      phoneDevice.addEventListener("mouseenter", phoneIn);
      phoneDevice.addEventListener("mouseleave", phoneOut);
      phoneDevice.addEventListener("focus", phoneIn);   /* 키보드 접근성 */
      phoneDevice.addEventListener("blur", phoneOut);

      /* ⑧ 핸드폰 등장 — 소프트포커스 blur(9px)→0 + 페이드+업.
         모바일(≤768px)은 filter 부담 커서 blur 생략(0). will-change 는 tween 동안만. */
      const phoneBlur = matchMedia("(max-width: 768px)").matches ? 0 : 9;
      gsap.fromTo(phoneDevice,
        { opacity: 0, y: 36, filter: `blur(${phoneBlur}px)` },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out",
          onStart() { phoneDevice.style.willChange = "filter"; },
          onComplete() { phoneDevice.style.willChange = ""; gsap.set(phoneDevice, { clearProps: "filter" }); },
          scrollTrigger: ST("#pz-s9", "top 80%") });
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
    ================================================================ */
    [
      ["#pz1",   "#f4efe9"],   /* 크림 #efe9e2 ← 살짝 밝게 */
      ["#pz-s2", "#e7ddd6"],   /* 토프 #e0d6cf ← 살짝 따뜻하게 */
      ["#pz2",   "#2c2018"],   /* 다크 #251a13 ← 살짝 들어올려 */
      ["#pz-s4", "#e7ddd6"],
      ["#pz-s6", "#e7ddd6"],
      ["#pz-s7", "#e7ddd6"],
      ["#pz-s8", "#e7ddd6"],
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
