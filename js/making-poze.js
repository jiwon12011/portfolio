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
      gsap.from(quote, {
        opacity: 0,
        y: 28,
        duration: 0.95,
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
      gsap.from(rbTitle, {
        opacity: 0, y: 22, duration: 0.95, ease: "power3.out",
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
        gsap.killTweensOf(phoneTrack);
        gsap.to(phoneTrack, {
          y: -dist, duration: Math.max(3, dist / 300), ease: "none",  /* ≈300px/s 프리뷰 스크롤 */
          repeat: -1, yoyo: true,
        });
      };
      const phoneOut = () => {
        gsap.killTweensOf(phoneTrack);
        gsap.to(phoneTrack, { y: 0, duration: 0.6, ease: "power2.out" });
      };
      phoneDevice.addEventListener("mouseenter", phoneIn);
      phoneDevice.addEventListener("mouseleave", phoneOut);
      phoneDevice.addEventListener("focus", phoneIn);   /* 키보드 접근성 */
      phoneDevice.addEventListener("blur", phoneOut);

      /* 핸드폰 등장 페이드+업 */
      gsap.from(phoneDevice, {
        opacity: 0, y: 36, duration: 1.05, ease: "power3.out",
        scrollTrigger: ST("#pz-s9", "top 80%"),
      });
    }

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
