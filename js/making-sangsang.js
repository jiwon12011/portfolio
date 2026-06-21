/* =======================================================================
   making-sangsang.js — 상상의 문 제작 과정 본문 스크롤 모션
   -----------------------------------------------------------------------
   · scroller: #process-sangsang .process__content (모달 전용 스크롤러)
   · sangsang은 Lenis 미적용 → 네이티브 overflow 스크롤
     (smooth-process SELECTORS 미포함 — ScrollTrigger scroller로 직접 지정)
   · GSAP + ScrollTrigger, once 진입 트리거 위주 — transform/opacity만(60fps)
   · prefers-reduced-motion → 모션 없이 정상 표시(초기화 완료 처리)
   · 초기 상태는 gsap.from() 으로만 설정 → GSAP 미로드 시 요소가 그대로 보임
   · window.__makingRefresh()(making.js 전역)가 모달 열릴 때 ScrollTrigger.refresh()
     자동 호출 → sangsang 트리거도 함께 갱신

   #ss2 카드 클러스터 — 오른쪽에서 서서히 진입 (once)
   ─────────────────────────────────────────────────────
   · 핀/스크럽 폐기(네이티브 overflow 스크롤러 + 모달 scale 컨텍스트에서 핀 불안정)
   · 카드4 + 문·열쇠 데코 6개가 각자 뷰포트 진입 시 오른쪽(x:+)에서 페이드+슬라이드
   · 다른 섹션과 동일한 once 진입 패턴 → 안정적, 60fps
   · rule/sparkle/CI: 자연스럽게 스크롤 진입
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;

    const scroller = document.querySelector("#process-sangsang .process__content");
    if (!scroller) return true; // 마크업 없으면 통과

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* once 진입 트리거 공통 옵션 */
    const ST = (trigger, start = "top 84%") => ({
      trigger, scroller, start, once: true,
    });

    /* 진입 페이드+업 헬퍼 */
    const rise = (sel, opt = {}) =>
      gsap.from(sel, Object.assign({
        opacity: 0, y: 26, duration: 0.85, ease: "power3.out",
      }, opt));

    /* 중앙정렬 요소 전용 진입 헬퍼 — CSS translateX(-50%) 대신 gsap xPercent:-50로
     * 센터링을 gsap이 관장(트랜스폼 충돌로 중앙이 어긋나는 버그 방지). CSS에서 translateX 제거 필수 */
    const riseCenter = (sel, opt = {}) => {
      const el = scroller.querySelector(sel);
      if (!el) return;
      gsap.set(el, { xPercent: -50 });
      gsap.from(el, Object.assign({
        opacity: 0, y: 22, duration: 0.85, ease: "power3.out",
      }, opt));
    };

    /* ================================================================
       SECTION · 히어로 (#ss-hero)
       배경: scale 1.06→1 은은한 줌-세틀
       텍스트: kicker / sang×2 / moon / meta×3 페이드+업 스태거
    ================================================================ */
    const heroBg = scroller.querySelector("#ss-hero .ss-hero__bg");
    if (heroBg) {
      gsap.from(heroBg, {
        scale: 1.06, opacity: 0.55, transformOrigin: "50% 50%",
        duration: 1.4, ease: "power3.out",
        scrollTrigger: ST("#ss-hero", "top 90%"),
      });
    }

    // 큰 글씨(SANG-1, SANG-2, MOON): 클립와이프 + 스케일 시네마틱 진입
    // kicker + meta: heroTL에 통합해 배경→텍스트→메타 순 계층화
    const bigTexts = scroller.querySelectorAll(
      "#ss-hero .ss-hero__sang--1, #ss-hero .ss-hero__sang--2, #ss-hero .ss-hero__moon"
    );
    if (bigTexts.length) {
      const heroTL = gsap.timeline({
        scrollTrigger: { trigger: scroller.querySelector("#ss-hero"), scroller, start: "top 85%", once: true },
      });
      bigTexts.forEach((el, i) => {
        heroTL.from(el, {
          clipPath: "inset(110% 0% -10% 0%)",
          y: 40, opacity: 0,
          duration: 0.9, ease: "power4.out",
        }, i * 0.2);
      });
      heroTL.from(
        scroller.querySelectorAll(
          "#ss-hero .ss-hero__kicker, #ss-hero .ss-hero__meta--team, #ss-hero .ss-hero__meta--role, #ss-hero .ss-hero__meta--date"
        ),
        { opacity: 0, y: 18, duration: 0.7, ease: "power3.out", stagger: 0.1 },
        "-=0.3"
      );
    }

    /* ================================================================
       SECTION 1 · OVERVIEW (#ss1)
       kicker / title / lead 페이드+업 순차 진입
    ================================================================ */
    // 배경: 마우스 움직임에 따라 부드럽게 흔들리는 패럴랙스 (brightness 페이드 대체)
    // ※ 정밀 포인터(데스크톱)에서만 — 터치기기는 정적
    const ovBg  = scroller.querySelector("#ss1 .ss-overview__bg");
    const ss1El = scroller.querySelector("#ss1");
    if (ovBg && ss1El && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      /* 살짝 확대 → 흔들려도 가장자리 안 보이게(.ss-sec overflow:hidden로 클립) */
      gsap.set(ovBg, { scale: 1.1, transformOrigin: "50% 50%", willChange: "transform" });
      const xTo = gsap.quickTo(ovBg, "x",        { duration: 0.7, ease: "power2" });
      const yTo = gsap.quickTo(ovBg, "y",        { duration: 0.7, ease: "power2" });
      const rTo = gsap.quickTo(ovBg, "rotation", { duration: 0.9, ease: "power2" });
      const AMPX = 26, AMPY = 18, AMPR = 1.1; /* px / px / deg */
      let rect = null; /* pointerenter에서 캐싱 → mousemove 강제 reflow 제거 */
      ss1El.addEventListener("pointerenter", () => { rect = ss1El.getBoundingClientRect(); });
      /* M2: 스크롤 시 rect 무효화 → 레이지 재취득(ss4 photobg와 동일 패턴) */
      scroller.addEventListener("scroll", () => { rect = null; }, { passive: true });
      ss1El.addEventListener("pointermove", (e) => {
        if (!rect) rect = ss1El.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width  - 0.5; /* -0.5 ~ 0.5 */
        const ny = (e.clientY - rect.top)  / rect.height - 0.5;
        xTo(-nx * AMPX); /* 마우스 반대로 → 패럴랙스 */
        yTo(-ny * AMPY);
        rTo(nx * AMPR);  /* 좌우에 따라 미세 기울기 */
      });
      ss1El.addEventListener("pointerleave", () => { xTo(0); yTo(0); rTo(0); });
    }

    /* ── ss1 OVERVIEW 핀: "문 열리듯" 슬릿(clipPath) 오픈 → kicker/title/lead 진입 ──
       · 섹션(가로형, 뷰포트보다 낮음)을 setSs1Top 으로 뷰포트 세로중앙 sticky 고정
       · #ss1-pin 범위 동안 scrub — bg 가 중앙 세로슬릿(닫힘)에서 양쪽으로 열리며 장면 공개(상상의 '문')
       · fromTo + 명시 from/to → invalidateOnRefresh 안전(.from 재캡처 버그 회피)
       · reduced-motion 시 init early-return → 핀 CSS 폴백(static)으로 정상 표시 */
    const ss1Pin    = scroller.querySelector("#ss1-pin");
    const ss1Kicker = scroller.querySelector("#ss1 .ss-overview__kicker");
    const ss1Title  = scroller.querySelector("#ss1 .ss-overview__title");
    const ss1Lead   = scroller.querySelector("#ss1 .ss-overview__lead");
    if (ss1Pin && ss1El && ovBg && ss1Title) {
      const setSs1Top = () => {
        const gap = scroller.clientHeight - ss1El.offsetHeight;
        ss1El.style.top = Math.max(0, Math.round(gap / 2)) + "px";
      };
      gsap.timeline({
        scrollTrigger: {
          trigger: ss1Pin, scroller,
          start: "top top", end: "bottom bottom",
          scrub: true, invalidateOnRefresh: true,
          onRefreshInit: setSs1Top,
        },
      })
        .fromTo(ovBg,      { clipPath: "inset(0 49.5% 0 49.5%)" }, { clipPath: "inset(0 0% 0 0%)", ease: "power2.inOut", duration: 1.0 }, 0)
        .fromTo(ss1Kicker, { opacity: 0, y: 26 }, { opacity: 1, y: 0, ease: "power3.out", duration: 0.5 }, 0.5)
        .fromTo(ss1Title,  { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: "power4.out", duration: 0.6 }, 0.62)
        .fromTo(ss1Lead,   { opacity: 0, y: 22 }, { opacity: 1, y: 0, ease: "power3.out", duration: 0.6 }, 0.8);
      setSs1Top();
      window.addEventListener("resize", setSs1Top);
    }

    /* ── 타이틀 강조어(.ss-em) — 잉크 와이프 (base 타이틀색 → 강조 주황 왼→오 채움) ──
       대상: ss1·ss2·ss5 타이틀 .ss-em. base+color 2겹, color clipPath 왼→오. once(top 85%).
       나머지 .ss-em(캡션 등)은 아래 기존 페이드 유지. */
    const _ssEsc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const SS_TITLE_SELS = [".ss-overview__title", ".ss-tr__title", ".ss-outro__title"];
    const inkWipe = (titleSel) => {
      const title = scroller.querySelector(titleSel);
      const em = title && title.querySelector(".ss-em");
      if (!em) return;
      const text = em.textContent || "";
      if (!text.trim()) return;
      const emphColor = getComputedStyle(em).color;     /* 강조색(주황) */
      const inkColor  = getComputedStyle(title).color;   /* 타이틀 본문색 */
      em.classList.add("ss-emfx");
      em.innerHTML = '<span class="ss-emfx__sr">' + _ssEsc(text) + "</span>"
        + '<span class="ss-emfx__base" aria-hidden="true">' + _ssEsc(text) + "</span>"
        + '<span class="ss-emfx__color" aria-hidden="true">' + _ssEsc(text) + "</span>";
      const base = em.querySelector(".ss-emfx__base");
      const color = em.querySelector(".ss-emfx__color");
      base.style.color = inkColor;
      color.style.color = emphColor;
      gsap.set(color, { clipPath: "inset(0 100% 0 0)" });
      gsap.to(color, { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "power2.inOut", scrollTrigger: ST(em, "top 85%") });
    };
    SS_TITLE_SELS.forEach(inkWipe);

    // 나머지 .ss-em(캡션 등) 진입 페이드 — ss1 + 잉크와이프 타이틀 제외
    // ※ display/transform 변경 금지 — 문장 중간 인라인 em의 줄바꿈·순서 깨짐 방지(이전 yPercent 버그)
    scroller.querySelectorAll(".ss-em").forEach((em) => {
      if (em.closest("#ss1")) return;
      if (em.closest(SS_TITLE_SELS.join(","))) return;
      gsap.from(em, {
        opacity: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: ST(em, "top 85%"),
      });
    });

    /* ================================================================
       SECTION 2 · TEAM RESEARCH (#ss2)
    ================================================================ */

    /* 2-A. kicker / title — 핀 발동 전 먼저 진입 (#ss2 top 90%~88% 근방) */
    rise("#ss2 .ss-tr__kicker", {
      y: 18,
      scrollTrigger: ST("#ss2 .ss-tr__kicker", "top 90%"),
    });
    rise("#ss2 .ss-tr__title", {
      y: 28, duration: 0.95, delay: 0.1,
      scrollTrigger: ST("#ss2 .ss-tr__title", "top 88%"),
    });

    /* ----------------------------------------------------------------
       2-B. 카드 클러스터 — 위/아래 행 방향 분리 슬라이드 (once 진입)
       ----------------------------------------------------------------
       · 위 행 (in--r 클래스): 오른쪽에서 착착착
       · 아래 행 (in--l 클래스): 왼쪽에서 착착착
       · x / opacity 만 사용 — 60fps, 레이아웃 변경 없음
    ---------------------------------------------------------------- */
    // 위 행 (in--r 클래스): 오른쪽에서 → 착착착
    scroller.querySelectorAll("#ss2 .ss-tr__in--r, #ss2 .ss-tr__deco--door").forEach((el) => {
      gsap.from(el, {
        opacity: 0, x: 80, duration: 1.05, ease: "power3.out",
        scrollTrigger: ST(el, "top 84%"),
      });
    });
    // 아래 행 (in--l 클래스): 왼쪽에서 → 착착착
    scroller.querySelectorAll("#ss2 .ss-tr__in--l, #ss2 .ss-tr__deco--key").forEach((el) => {
      gsap.from(el, {
        opacity: 0, x: -80, duration: 1.05, ease: "power3.out",
        scrollTrigger: ST(el, "top 84%"),
      });
    });

    /* ----------------------------------------------------------------
       2-C. 구분선(rule) + 스파클 — 핀 해제 후 스크롤로 진입
       · rule-l: 오른쪽(스파클 방향)에서 안쪽→바깥으로 전개
       · rule-r: 왼쪽(스파클 방향)에서 안쪽→바깥으로 전개
       · sparkle: 중심에서 팝 인 (약간 지연)
    ---------------------------------------------------------------- */
    const ruleL   = scroller.querySelector("#ss2 .ss-tr__rule--l");
    const ruleR   = scroller.querySelector("#ss2 .ss-tr__rule--r");
    const sparkle = scroller.querySelector("#ss2 .ss-tr__sparkle");

    if (ruleL || ruleR || sparkle) {
      const ruleTrig = sparkle || ruleL;
      const ruleTL = gsap.timeline({
        scrollTrigger: { trigger: ruleTrig, scroller, start: "top 90%", once: true },
      });
      /* rule-l: transformOrigin을 오른쪽 끝으로 → 스파클 방향 기준으로 줄어드는 느낌 역재생 */
      if (ruleL) {
        ruleTL.from(ruleL, {
          scaleX: 0, transformOrigin: "100% 50%",
          duration: 0.75, ease: "power2.inOut",
        }, 0);
      }
      if (ruleR) {
        ruleTL.from(ruleR, {
          scaleX: 0, transformOrigin: "0% 50%",
          duration: 0.75, ease: "power2.inOut",
        }, 0);
      }
      if (sparkle) {
        ruleTL.from(sparkle, {
          opacity: 0, scale: 0.3, transformOrigin: "50% 50%",
          duration: 0.5, ease: "back.out(2.5)",
        }, 0.12);
      }
    }

    /* ----------------------------------------------------------------
       2-D. COMMON INSIGHT — ci-kicker + ci×3 페이드+업 순차 진입
    ---------------------------------------------------------------- */
    rise("#ss2 .ss-tr__ci-kicker", {
      y: 16,
      scrollTrigger: ST("#ss2 .ss-tr__ci-kicker", "top 88%"),
    });

    const ciEls = scroller.querySelectorAll(
      "#ss2 .ss-tr__ci--1, #ss2 .ss-tr__ci--2, #ss2 .ss-tr__ci--3"
    );
    if (ciEls.length) {
      gsap.from(ciEls, {
        opacity: 0, y: 20, duration: 0.85, ease: "power3.out", stagger: 0.12,
        scrollTrigger: {
          trigger: ciEls[0], scroller, start: "top 88%", once: true,
        },
      });
    }

    /* ================================================================
       SECTION 3 · STORY 포스터 (#ss3) — 필름스트립 핀
       · .ss3-stage(화면 높이) sticky 고정, 그 안에서 #ss3 포스터가 위로 translateY 팬업
       · 레이어 11개(.ss-story__lyr[data-anim])는 스테이지에 들어오는 순간 data-anim 별 팝인(1회)
       · onLeaveBack 시 from-상태 리셋 → 재스크롤 시 조립 재생
       · stage 높이/travel 은 onRefreshInit(measure)에서 스크롤러 clientHeight 기준 산출
       · #ss3 translate 됨 → 레이어 개별 ScrollTrigger 금지(좌표 깨짐). 메인 scrub progress 로 구동
       · 별(.ss-story__star)은 CSS twinkle — 건드리지 않음
    ================================================================ */
    const ss3Pin   = scroller.querySelector("#ss3-pin");
    const ss3Stage = scroller.querySelector("#ss3-pin .ss3-stage");
    const ss3El    = scroller.querySelector("#ss3");
    if (ss3Pin && ss3Stage && ss3El) {
      /* data-anim → FROM 상태 매핑 (story.html 원본 재현) */
      const ANIM_FROM = {
        up:    { y: 48,   opacity: 0 },
        drop:  { y: -50,  opacity: 0, rotate: -5 },
        left:  { x: -60,  opacity: 0 },
        right: { x:  60,  opacity: 0 },
        rise:  { y: 84,   opacity: 0 },
        pop:   { scale: 0.55, opacity: 0, transformOrigin: "50% 100%" },
        swing: { rotate: -13, opacity: 0, transformOrigin: "50% 0%" },
      };
      const layers = [...ss3El.querySelectorAll(".ss-story__lyr[data-anim]")]
        .filter((el) => ANIM_FROM[el.dataset.anim]);
      /* 초기 hidden 상태 (gsap.set → GSAP 미로드/reduced-motion 시 그대로 보임) */
      const resetLayers = () => layers.forEach((el) => gsap.set(el, ANIM_FROM[el.dataset.anim]));
      resetLayers();

      let travel = 1;
      const thresholds = new Map();
      const measure = () => {
        const stageH = scroller.clientHeight;
        ss3Stage.style.height = stageH + "px";
        travel = Math.max(1, ss3El.offsetHeight - stageH);
        layers.forEach((el) => {
          const cy = el.offsetTop + el.offsetHeight / 2;     /* #ss3 내 레이어 중심 Y */
          /* 팬업 중 레이어 중심이 스테이지 하단 ~74% 지점에 닿을 때 등장 */
          const t = (cy - 0.74 * stageH) / travel;
          thresholds.set(el, Math.min(0.97, Math.max(0, t)));
        });
      };

      const revealed = new Set();
      const revealLayer = (el) => {
        if (revealed.has(el)) return;
        revealed.add(el);
        gsap.to(el, {
          x: 0, y: 0, rotate: 0, scale: 1, opacity: 1,
          duration: 1.0, ease: "power3.out",
          clearProps: "transform,transformOrigin",  /* 인라인 transform 제거 → CSS 원복 */
        });
      };

      gsap.timeline({
        scrollTrigger: {
          trigger: ss3Pin, scroller,
          start: "top top", end: "bottom bottom",
          scrub: true, invalidateOnRefresh: true,
          onRefreshInit: measure,
          onUpdate: (self) => {
            const p = self.progress;
            for (const el of layers) if (p >= thresholds.get(el)) revealLayer(el);
          },
          onLeaveBack: () => { gsap.killTweensOf(layers); revealed.clear(); resetLayers(); },
        },
      }).fromTo(ss3El, { y: 0 }, { y: () => -travel, ease: "none", duration: 1 }, 0);
      measure();
      window.addEventListener("resize", measure);
    }

    /* ================================================================
       SECTION 4 · 열쇠 시그니처 모션 (#ss4)
       ────────────────────────────────────────────────────────────────
       v2 변경 (사용자 피드백 반영):
       · AMP 3.5 → 40cqw: 이미지 영역(20~79cqw) 바깥까지 크게 스윙,
         열쇠가 콘텐츠 양옆으로 완전히 노출됨
       · 회전 ±2~7° → ±20°: 스윙 방향에 맞춰 자연스러운 진자 기울기
         (→ 우 시 +, ← 좌 시 -, 착지 전 정렬)
       · ease: "none" → "sine.inOut": 진자 느낌 (끝서 느리고 중간 빠름)
       · 스파클 follow 방식 제거 → 트레일 시스템:
         WP 경로 6지점 × 도트 2개 = 총 12개 노드(transform/opacity만)
         열쇠가 지나간 자리에 bloom→fadeout (남아서 사라지는 별빛)
       · 달칵 scrub 분리: progress≥0.98 onUpdate에서 시간기반 재생
         wheel/touchmove 이벤트 차단(~0.5s)으로 스크롤 멈춤 구현
         핀 미사용 (모달 scale + 네이티브 스크롤러 불안정 이력 동일)
       · --lock: 달칵 수축 직후 페이드인
       scrub:0.6, invalidateOnRefresh:true → resize 시 cp() 재평가
    ================================================================ */
    {
      const ss4     = scroller.querySelector("#ss4");
      const keyTop  = ss4 ? ss4.querySelector(".ss-story-pg__key--top")    : null;
      const keyLock = ss4 ? ss4.querySelector(".ss-story-pg__key--lock")   : null;
      const plaque  = ss4 ? ss4.querySelector(".ss-story-pg__plaque")      : null;
      const photobg = ss4 ? ss4.querySelector(".ss-story-pg__photobg")     : null;

      if (ss4 && keyTop && keyLock && plaque) {
        /* --lock: 달칵까지 숨김 */
        gsap.set(keyLock, { opacity: 0 });
        /* 하단 팀 프로세스 배경 사진: 달칵 전까지 위에서 잘라 숨김 → 달칵 때 위→아래로 펼침 */
        if (photobg) gsap.set(photobg, { clipPath: "inset(0 0 100% 0)" });

        /* CSS translateX(-50%) → GSAP xPercent 관리
         * GSAP이 xPercent를 관장해야 x/y 추가 transform과 충돌 없음 */
        gsap.set(keyTop, { xPercent: -50, opacity: 0, willChange: "transform" });  /* v9: 여정 내내 숨김 — 끝(명패)에서만 페이드인 */

        /* ── 트레일 CSS 삽입 (중복 방지) ── */
        if (!document.getElementById("ss-key-trail-style")) {
          const st = document.createElement("style");
          st.id = "ss-key-trail-style";
          /* 글로우 은은하게 축소: 3레이어→2레이어, blur·alpha 대폭 감소 */
          st.textContent =
            ".ss-key-trail{position:absolute;pointer-events:none;opacity:0;z-index:5;}" +
            ".ss-key-trail__dot{position:absolute;border-radius:50%;" +
            "transform:translate(-50%,-50%);" +
            "box-shadow:0 0 0.14cqw 0.02cqw rgba(255,235,160,.65),0 0 0.42cqw 0.07cqw rgba(255,195,80,.28);}";
          document.head.appendChild(st);
        }

        /* ── cqw → px 변환 (invalidateOnRefresh 시 재평가) ── */
        const cw = () => ss4.offsetWidth;
        const cp = (v) => () => v * cw() / 100;

        /*
         * 착지 좌표 (xPercent:-50 적용 후 x=0 = 가로 중앙 50cqw)
         *   FX = (24.5 + 14.592÷2) − 50 = −18.204cqw  (keyLock left:24.5cqw 중심 정렬, 명패 텍스트 비침)
         *   FY = 339.319 − 8.889 = 330.43cqw  (착지 살짝 위로 2cqw ↑, keyLock·glow 동반 이동)
         */
        const FX  = -18.204;
        const FY  =  330.43;
        /* AMP(이전 진자 진폭 40cqw)는 v3 경로에서 미사용 */

        /*
         * WP: [타임라인_pos, 지속, y비율, x(cqw), rotate(deg), ease]
         * 달칵 제거됨 — onUpdate progress≥0.98 시 시간기반 재생
         * 총 duration = 9.8 (WP[6] pos 7.8 + dur 2.0)
         *
         * v3 경로 재설계:
         *   초반 오른쪽 이동 → off-screen 완전 퇴장(xCqw 65 → 50+65=115cqw, 키 좌측단 106.25cqw > 100) →
         *   화면 밖 y 하강 유지(xCqw 70) → 예약 높이(yR≈0.74≈247cqw)에서
         *   우측 반쯤 바깥 재등장(xCqw 44 → 중심 94cqw) →
         *   왼쪽 수렴 → FX·FY·720° 착지
         *
         * WP rot: ease:"none" 스크롤 정비례 누적 720°(2바퀴)
         *   속도: 71°/u(초반) → 90°/u(퇴장) → 67°/u(off-screen) → 92°/u(재등장)
         *         → 86°/u → 100°/u → 40°/u(착지 감속)
         * 퇴장/재등장 opacity 트윈은 WP 루프 직후 keyTopTweens에 별도 추가
         */
        /*
         * v4 WP 조정 (사용자 피드백 #2·#3):
         *   start "top 36%" 변경에 맞춰 yR 값을 선형-중앙 추종 이상값(p×336≈FY)에 근접하게 소폭 조정.
         *   결과: visible 구간(WP[3]~WP[5]) 내내 뷰포트 y ≈ 45~55% (중앙 근처).
         *   WP[0] yR 0.05→0.10: 초반 우이동 시 스크롤 진행과 보조 맞춰 뷰포트 중앙 유지.
         *   WP[3] yR 0.60→0.56: 재등장 지점 뷰포트 중앙 정렬 (기존 71%→50%).
         *   WP[4] yR 0.82→0.79: 하강 구간 중앙 추종.
         *   WP[5] yR 0.93→0.91: 수렴 직전 중앙 추종.
         *   WP[1][2][6]: 변경 없음(off-screen/착지 고정).
         */
        const WP = [
          /* pos    dur   yR      xCqw            rot(누적)  ease(경로)                          의미                          */
          [   0,    1.0,  0.10,   28,              90,  "sine.inOut"  ],  /* →우: 초반 이동 (회전 가볍게) */
          [   1.0,  0.9,  0.12,   66,             220,  "power2.in"   ],  /* →우: off-screen 퇴장 */
          [   1.9,  1.3,  0.34,   75,             560,  "none"        ],  /* 화면 밖 우측 대기(숨김) — v7: 오른쪽 재등장 셋업 + 회전 대부분 소화(안 보임) */
          [   3.2,  2.2,  0.48,   28,             620,  "power2.out"  ],  /* ←재등장: 오른쪽 위(THEME PAGE 여백) — v7 (회전 +60° 차분) */
          [   5.4,  2.2,  0.70,  -16,             665,  "sine.inOut"  ],  /* 하강: 오른쪽→왼쪽 대각 스윕(긴 구간서 완만) — v7.1 예약 들어서면 이미 왼쪽 */
          [   7.6,  1.2,  0.86,   FX,             695,  "power1.out"  ],  /* 예약 구간: 왼쪽(RESERVATION 여백) 유지 — v7.1 (FX=좌측) */
          [   8.8,  1.0,  1.00,   FX,             720,  "power2.out"  ],  /* 착지: FX·FY·720° 정합 */
        ];

        /* ── 트레일 노드 생성 — WP 도착 anchor를 보간해 경로 전체 촘촘하게 ──
         * anchor 6개(WP[0]~WP[5] 도착) + 구간별 중간 2개 = 총 16노드 × 4dots = 64별
         * leftCqw = 50 + xCqw  (xPercent:-50 기준, 중앙=50cqw)
         * topCqw  = keyTop.top(8.889) + height÷2(4.444) + FY*yR
         */
        const KEY_CY = 8.889 + 4.444; /* keyTop 수직 중심 시작점 */

        /* WP[0]~WP[5] 도착 지점을 anchor로 추출: [arriveT, yR, xCqw] */
        const ANCHORS = WP.slice(0, 6).map(([pos, dur, yR, xCqw]) => [pos + dur, yR, xCqw]);

        /* anchor 사이 선형보간 (구간당 2개 중간 노드 = 1/3, 2/3 지점) */
        const trailNodes = [];
        for (let i = 0; i < ANCHORS.length; i++) {
          const [t0, y0, x0] = ANCHORS[i];
          trailNodes.push({ t: t0, yR: y0, xCqw: x0 });
          if (i < ANCHORS.length - 1) {
            const [t1, y1, x1] = ANCHORS[i + 1];
            for (let k = 1; k <= 2; k++) {
              const f = k / 3;
              trailNodes.push({
                t:    t0 + (t1 - t0) * f,
                yR:   y0 + (y1 - y0) * f,
                xCqw: x0 + (x1 - x0) * f,
              });
            }
          }
        }

        /* 노드별 dot 패턴 4종 순환 — 작고 자글자글, warm gold/white 계열
         * [dx_cqw, dy_cqw, size_px, color] */
        const DOT_PATTERNS = [
          [[-0.7,-1.4,5,"#fff9ee"],[ 1.1, 0.9,3,"#ffd080"],[ 0.2,-0.5,2,"#ffffff"],[-1.6, 0.5,2,"#ffca80"]],
          [[ 0.9,-0.8,4,"#ffd080"],[-1.3, 1.3,5,"#ffffff"],[-0.4,-0.6,2,"#fff9ee"],[ 1.7, 0.5,2,"#ffca80"]],
          [[-0.5,-1.8,6,"#ffffff"],[ 1.3, 0.7,3,"#ffd080"],[ 0.3,-0.3,2,"#fff9ee"],[-1.9, 0.4,2,"#ffca80"]],
          [[ 1.2,-1.0,4,"#ffd080"],[-0.8, 1.6,5,"#ffffff"],[ 0.5,-0.5,2,"#fff9ee"],[-1.5, 0.8,2,"#ffca80"]],
        ];

        const trailWraps = trailNodes.map(({ yR, xCqw }, idx) => {
          const wrap = document.createElement("span");
          wrap.className  = "ss-key-trail";
          wrap.style.left = `${(50 + xCqw).toFixed(3)}cqw`;
          wrap.style.top  = `${(KEY_CY + FY * yR).toFixed(3)}cqw`;

          DOT_PATTERNS[idx % DOT_PATTERNS.length].forEach(([dx, dy, sz, clr]) => {
            const dot = document.createElement("span");
            dot.className        = "ss-key-trail__dot";
            dot.style.left       = `${dx}cqw`;
            dot.style.top        = `${dy}cqw`;
            dot.style.width      = `${sz}px`;
            dot.style.height     = `${sz}px`;
            dot.style.background = clr;
            wrap.appendChild(dot);
          });

          ss4.appendChild(wrap);
          return wrap;
        });

        /* ── 달칵 스크롤 차단 핸들러 (progress≥0.999 시 임팩트+반동 구간만 차단) ──
         * passive:false 리스너를 상시 붙이면 미발동 시에도 브라우저가 JS 실행 대기.
         * 달칵 직전에만 add, 임팩트+반동 완료 즉시 remove → 평소 스크롤 지연 0 */
        let clackPlayed       = false;
        let clackTL           = null;
        let scrollBlockActive = false; /* M1: 달칵 차단 리스너 중복 부착 방지 플래그 */
        /* keyTop WP 트윈 레퍼런스 — 달칵 시 kill, onLeaveBack 시 재구축 */
        const keyTopTweens = [];

        const onWheelBlock = (e) => { e.preventDefault(); };
        /* v10/11: 달칵 동안 스크롤 위치 하드핀 — preventDefault 를 빠져나간 입력(키보드·스크롤바·모멘텀)도 되돌림 */
        let scrollLockY = 0, scrollLockOn = false;
        const onScrollLock = () => { if (scroller.scrollTop !== scrollLockY) scroller.scrollTop = scrollLockY; };
        /* 휠/터치 입력 차단(즉시) — M1: 가드 플래그로 중복 부착 방지 */
        const addScrollBlock = () => {
          if (scrollBlockActive) return;
          scrollBlockActive = true;
          scroller.addEventListener("wheel",     onWheelBlock, { passive: false });
          scroller.addEventListener("touchmove", onWheelBlock, { passive: false });
        };
        /* v11: 위치 하드핀 — 명패 센터 스냅 완료 후 그 지점에 고정 */
        const lockScrollAt = (y) => {
          scrollLockY = y;
          if (scrollLockOn) return;
          scrollLockOn = true;
          scroller.addEventListener("scroll", onScrollLock, { passive: true });
        };
        const removeScrollBlock = () => {
          if (scrollBlockActive) {
            scrollBlockActive = false;
            scroller.removeEventListener("wheel",     onWheelBlock);
            scroller.removeEventListener("touchmove", onWheelBlock);
          }
          if (scrollLockOn) {
            scrollLockOn = false;
            scroller.removeEventListener("scroll", onScrollLock);
          }
        };

        /* ── keyTL: scrub으로 낙하 전체 제어 ── */
        const keyTL = gsap.timeline({
          scrollTrigger: {
            trigger:    ss4,
            scroller,
            /* "top 36%": scrub 시작 시 keyTop (top:8.889cqw) 이 뷰포트 중앙 근처에 위치.
             * 계산 근거: key_vp_y = startPct×scroller_h + 8.889cqw_px ≈ 0.36×900+128 = 452px (≈50%).
             * 기존 "top top"(key 128px=14% → 화면 상단 고착) 대비 중앙 등장+중앙 추종 (#2·#3 해소). */
            start:      "top 36%",
            /* 명패 카드 중앙이 뷰포트 중앙에 올 때 progress=1 → 달칵.
             * (사용자: 카드가 화면 정중앙에 왔을 때 꽂혀야 함) */
            endTrigger: plaque,
            end:        "center center",
            scrub: 0.4,
            invalidateOnRefresh: true,

            onUpdate(self) {
              /* progress ≥ 0.999 → 달칵 1회 시간기반 재생 + 스크롤 차단
               * 0.999 = 타임라인 9.79s → WP 마지막 트윈(9.0~9.8) 99% 완료
               * → keyTop이 착지 최종 좌표에 실질적으로 도달한 뒤 발화 */
              if (self.progress >= 0.999 && !clackPlayed) {
                clackPlayed = true;
                addScrollBlock(); /* 임팩트+반동 구간만 차단 */

                /* ── keyTop WP 트윈 kill ────────────────────────────────────
                 * scrub:0.4가 0.999→1.0 잔여 구간에서도 keyTL을 계속 렌더하면
                 * clackTL과 충돌해 "달칵 후 중앙으로 내려오는" 잔여 이동 발생.
                 * keyTopTweens를 모두 kill해 이후 scrub이 keyTop을 건드리지 못하게.
                 * trail/atmosphere는 타깃이 trailWraps이므로 영향 없음. */
                keyTopTweens.forEach(t => t.kill());
                keyTopTweens.length = 0;

                /* ── 최종 착지 좌표로 즉시 스냅 ── */
                const finalY = cp(FY)();
                gsap.set(keyTop, {
                  y:      finalY,            /* WP[6] yR=1.00 착지 */
                  x:      cp(FX)(),          /* WP[6] xCqw=FX 착지 */
                  rotate: 720,               /* WP[6] 720°=0° 시각 */
                  scale:  1,
                  opacity: 1,                /* v9: 빠른 스크롤로 페이드 미완 시에도 달칵 땐 또렷 */
                });

                /* v11: 달칵 멈춤 화면에서 명패가 뷰포트 정중앙에 오도록 부드럽게 스냅 → 완료 후 그 지점 하드핀.
                 * self.end("center center")가 모달 스크롤러에선 명패를 중앙에 안 맞춰서, 명패 실측 geometry로
                 * 중앙 정렬 scrollTop 직접 계산(현재 위치 + 중심 오프셋), maxScroll 로 클램프. */
                const _scR = scroller.getBoundingClientRect();
                const _pR  = plaque.getBoundingClientRect();
                const _off = (_pR.top + _pR.height / 2 - _scR.top) - scroller.clientHeight / 2;
                const _maxY = scroller.scrollHeight - scroller.clientHeight;
                const centerY = Math.max(0, Math.min(_maxY, Math.round(scroller.scrollTop + _off)));
                const sp = { y: scroller.scrollTop };
                gsap.to(sp, {
                  y: centerY, duration: 0.3, ease: "power2.out",
                  onUpdate() { scroller.scrollTop = sp.y; },
                  onComplete() { lockScrollAt(centerY); },
                });

                clackTL = gsap.timeline({ onComplete() { clackTL=null; } })
                  /* 1단계: 착지 좌표에서 아래로 꽂기 — v8: 0.12→0.18s, power3→power2(덜 급함), 플런지·딥 완화 */
                  .to(keyTop, { y: finalY + 13, rotate: -8, scale: 0.96, duration: 0.18, ease: "power2.in", overwrite: "auto" })
                  /* 2단계: 탄성 복귀 — v8: back.out(3)→back.out(1.5) 묵직하게, 0.35→0.48s 느긋한 안착 */
                  .to(keyTop, { y: finalY, rotate: 0, scale: 1.0, duration: 0.48, ease: "back.out(1.5)" })
                  /* 3단계: settle — v8: 떨림 진폭·속도 완화(3°/0.1s → 1.5°/느리게)로 허겁지겁 제거 */
                  .to(keyTop, { rotate: 1.5, duration: 0.18, ease: "sine.inOut" })
                  .to(keyTop, { rotate: 0, duration: 0.24, ease: "sine.inOut" })
                  /* 4단계: top 페이드아웃 + lock 페이드인 */
                  .to(keyTop,  { opacity: 0, duration: 0.18, ease: "power1.in"  }, "+=0.08")
                  .to(keyLock, { opacity: 1, duration: 0.18, ease: "power1.out" }, "<")
                  /* v10: 달칵+잠금 완료까지 스크롤 핀 유지 후 해제 (사용자: 달칵 동안 밑으로 못 내려가게) */
                  .call(() => { removeScrollBlock(); })
                  /* 5단계: 잠금 후 살짝 늦게, 천천히 하단 배경 사진 위→아래로 촤르르 펼침 (핀 해제 후 진행) */
                  .to(photobg ? photobg : {}, { clipPath: "inset(0 0 0% 0)", duration: 1.5, ease: "power2.out" }, "+=0.2");
              }
            },

            onLeaveBack() {
              /* 섹션 위로 되돌아오면 달칵 상태 초기화 */
              clackPlayed = false;
              removeScrollBlock(); /* clackTL 중단 전 혹시 남은 차단 해제 */
              if (clackTL) { clackTL.kill(); clackTL = null; }
              /* keyTop 초기 상태 복원 — WP 트윈 kill 후 scrub이 복원 못 하므로 명시 리셋 (v9: 숨김) */
              gsap.set(keyTop,  { opacity: 0, y: 0, x: 0, rotate: 0, scale: 1 });
              gsap.set(keyLock, { opacity: 0 });
              /* 하단 배경 사진 다시 접기 → 재스크롤 시 펼침 재생 */
              if (photobg) gsap.set(photobg, { clipPath: "inset(0 0 100% 0)" });
              /* M1: 트레일 wraps 강제 초기화 — gsap inline opacity 잔류 방지 */
              gsap.set(trailWraps, { opacity: 0 });
              /* keyTop WP 트윈 재구축 — kill됐으므로 재스크롤 시 낙하 재생을 위해 복원 */
              if (keyTopTweens.length === 0) {
                WP.forEach(([pos, dur, yR, xCqw, rot]) => {
                  keyTopTweens.push(
                    keyTL.to(keyTop, {
                      y: cp(FY * yR),
                      x: cp(xCqw), rotate: rot,
                      ease: "none", duration: dur,
                    }, pos)
                  );
                });
                /* v9: 끝(명패 접근)에서만 페이드인 — 재구축 */
                keyTopTweens.push(
                  keyTL.to(keyTop, { opacity: 1, duration: 0.5, ease: "power2.out" }, 9.2)
                );
              }
              /* M1: 타임라인 캐시 무효화 + 처음으로 리셋 → 재진입 시 progress 매핑 안정 */
              keyTL.invalidate().progress(0);
            },
          },
        });

        /* WP → keyTL 트윈 (열쇠 이동·회전, 트레일 bloom은 아래 별도 루프)
         * keyTopTweens에 레퍼런스 저장 → 달칵 시 kill, onLeaveBack 시 재구축 */
        WP.forEach(([pos, dur, yR, xCqw, rot]) => {
          /* ease:"none" → scrub 스크롤 대비 균일 이동(x·y·rotate 전부 선형) */
          keyTopTweens.push(
            keyTL.to(keyTop, {
              y: cp(FY * yR),
              x: cp(xCqw), rotate: rot,
              ease: "none", duration: dur,
            }, pos)
          );
        });

        /* v9: 열쇠는 콘텐츠 구간(테마·예약) 내내 숨김(opacity 0) → 명패 접근(스크럽 끝, t=9.2~9.7)에서만 페이드인.
         * 길/시작 노출을 없애 본문 읽는 동안 시선 분산 제거. 등장은 마지막 달칵 직전 명패 위에서만. */
        keyTopTweens.push(
          keyTL.to(keyTop, { opacity: 1, duration: 0.5, ease: "power2.out" }, 9.2)
        );

        /* v9: 트레일(별 자취) 제거 — 열쇠가 콘텐츠 위를 지나가지 않으므로 자취 불필요(시선 분산 제거).
         * trailWraps 는 생성돼 있으나 bloom 안 함 → CSS opacity:0 그대로 비표시. */
      }
    }

    /* ================================================================
       SECTION 6 · RESULT / PROPOSAL / OUTRO (#ss5)
       · 텍스트는 페이드+업, 제안서 캡처·LIVE SITE/GITHUB는 오른쪽→왼쪽 슬라이드
    ================================================================ */
    const ss5 = scroller.querySelector("#ss5");
    if (ss5) {
      rise("#ss5 .ss-outro__kicker--proposal", { y: 18, scrollTrigger: ST("#ss5 .ss-outro__kicker--proposal", "top 88%") });
      rise("#ss5 .ss-outro__title", { y: 28, duration: 0.95, delay: 0.06, scrollTrigger: ST("#ss5 .ss-outro__title", "top 86%") });

      riseCenter("#ss5 .ss-outro__desc--proposal", { y: 20, scrollTrigger: ST("#ss5 .ss-outro__desc--proposal", "top 86%") });
      riseCenter("#ss5 .ss-outro__kicker--result", { y: 16, scrollTrigger: ST("#ss5 .ss-outro__kicker--result", "top 88%") });
      const lessons = scroller.querySelectorAll("#ss5 .ss-outro__lesson");
      if (lessons.length) {
        gsap.set(lessons, { xPercent: -50 }); /* CSS translateX 제거 → gsap 센터링 */
        gsap.from(lessons, {
          opacity: 0, y: 20, duration: 0.85, ease: "power3.out", stagger: 0.12,
          scrollTrigger: ST("#ss5 .ss-outro__lesson--1", "top 86%"),
        });
      }
      /* Thank you — gsap 관리 센터링(xPercent:-50). CSS translateX 제거됨 → 어긋남 방지 */
      const thanks = scroller.querySelector("#ss5 .ss-outro__thanks");
      if (thanks) {
        gsap.set(thanks, { xPercent: -50 });
        /* 글자별 등장 — 수동 split(SplitText 미로드), 부모 센터링 유지·자식 char만 떠오름 */
        const tTxt = thanks.textContent;
        thanks.setAttribute("aria-label", tTxt);
        thanks.textContent = "";
        const tChars = [];
        for (const ch of tTxt) {
          const sp = document.createElement("span");
          sp.setAttribute("aria-hidden", "true");
          sp.style.display = "inline-block";
          sp.style.whiteSpace = "pre";
          sp.textContent = ch === " " ? " " : ch;
          thanks.appendChild(sp);
          tChars.push(sp);
        }
        gsap.from(tChars, {
          yPercent: 120, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.045,
          scrollTrigger: ST("#ss5 .ss-outro__thanks", "top 90%"),
        });
      }

      /* 제안서 캡처 마퀴 — 연속 슬라이드는 CSS가 담당. 진입 시 위→아래 클립 와이프로 펼침 */
      const shotsBox = scroller.querySelector("#ss5 .ss-outro__shots");
      if (shotsBox) gsap.fromTo(shotsBox,
        { clipPath: "inset(0 0 100% 0)", opacity: 0 },
        { clipPath: "inset(0 0 0% 0)", opacity: 1, duration: 1.1, ease: "power2.out",
          scrollTrigger: ST("#ss5 .ss-outro__shots", "top 84%") }
      );

      /* M3: 구분선(rule) 와이프 + 스파클 팝 — ss2 2-C 패턴 동일 적용
       * rule-l: 오른쪽(스파클 방향)에서 바깥→안 전개 (transformOrigin "100% 50%")
       * rule-r: 왼쪽(스파클 방향)에서 바깥→안 전개 (transformOrigin "0% 50%")
       * sparkle: 중심에서 팝인(0.12s 지연) → 3회 yoyo 후 정착 */
      const ss5RuleL    = scroller.querySelector("#ss5 .ss-outro__rule--l");
      const ss5RuleR    = scroller.querySelector("#ss5 .ss-outro__rule--r");
      const sparkle5    = scroller.querySelector("#ss5 .ss-outro__sparkle");
      const ss5RuleTrig = sparkle5 || ss5RuleL;
      if (ss5RuleTrig) {
        const ss5RuleTL = gsap.timeline({
          scrollTrigger: { trigger: ss5RuleTrig, scroller, start: "top 90%", once: true },
        });
        if (ss5RuleL) {
          ss5RuleTL.from(ss5RuleL, {
            scaleX: 0, transformOrigin: "100% 50%",
            duration: 0.75, ease: "power2.inOut",
          }, 0);
        }
        if (ss5RuleR) {
          ss5RuleTL.from(ss5RuleR, {
            scaleX: 0, transformOrigin: "0% 50%",
            duration: 0.75, ease: "power2.inOut",
          }, 0);
        }
        if (sparkle5) {
          ss5RuleTL.fromTo(sparkle5,
            { opacity: 0, scale: 0.3, rotate: -40, transformOrigin: "50% 50%" },
            { opacity: 1, scale: 1, rotate: 0, duration: 0.7, ease: "back.out(2.5)" },
            0.12
          ).call(() => {
            /* 3회 yoyo 후 opacity:1·scale:1로 정착 — 무한 반짝임이 마무리 집중 흐트러뜨리는 것 방지 */
            gsap.to(sparkle5, { opacity: 0.55, scale: 0.87, duration: 1.6, ease: "sine.inOut", repeat: 3, yoyo: true });
          });
        }
      }

      /* LIVE → GITHUB → PROPOSAL 오른쪽에서 왼쪽으로 샤악 흘러 들어옴 */
      const ris = scroller.querySelectorAll("#ss5 .ss-outro__ri");
      if (ris.length) gsap.from(ris, {
        opacity: 0, x: 160, duration: 1.1, ease: "power2.out", stagger: 0.22,
        scrollTrigger: ST("#ss5 .ss-outro__ri--live", "top 88%"),
      });
    }

    /* ================================================================
       SECTION 4 추가 모션 (#ss4) — 헤드라인 char 비행 / 페이지·카드 진입 / 골드 글로우
       · KEY(keyTop/keyLock/trail)·plaque(endTrigger)는 건드리지 않음
    ================================================================ */
    {
      const ss4El = scroller.querySelector("#ss4");

      /* ① UNLOCK 헤드라인 — 글자 단위 비행 등장(수동 split, SplitText 불필요) */
      const splitChars = (el) => {
        const raw = el.textContent;
        el.textContent = "";
        el.setAttribute("aria-label", raw);
        return [...raw].map((ch) => {
          const s = document.createElement("span");
          s.style.display = "inline-block";
          s.textContent = ch === " " ? " " : ch;
          el.appendChild(s);
          return s;
        });
      };
      const pgHead = ss4El && ss4El.querySelector(".ss-story-pg__head");
      if (pgHead) {
        const chars = splitChars(pgHead);
        gsap.set(pgHead, { perspective: 800 });
        gsap.from(chars, {
          x: () => gsap.utils.random(-120, 120),
          y: () => gsap.utils.random(-45, 45),
          rotateY: 120, rotate: () => gsap.utils.random(-10, 10),
          opacity: 0, duration: 0.9, ease: "power3.out",
          stagger: { amount: 0.5, from: "random" },
          scrollTrigger: ST("#ss4 .ss-story-pg__head", "top 82%"),
        });

        /* ④ 골드 글로우 — 헤드라인 뒤 빛 번짐(헤드라인 진입과 동시) */
        const glow = document.createElement("span");
        glow.className = "ss-pg-glow";
        glow.setAttribute("aria-hidden", "true");
        ss4El.appendChild(glow);
        gsap.set(glow, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });
        gsap.to(glow, {
          opacity: 1, scale: 1, duration: 1.4, ease: "power2.out",
          scrollTrigger: ST("#ss4 .ss-story-pg__head", "top 82%"),
        });
      }

      /* ② 페이지 쇼케이스 — 이미지 솟기 + 텍스트 좌우 슬라이드
         (caption--team은 .ss-em 전용 핸들러와 겹쳐 제외 / plaque 이미지는 endTrigger라 제외) */
      [
        ["#ss4 .ss-story-pg__caption--main",  { x:  40 }],
        ["#ss4 .ss-story-pg__mainbg",         { y:  60, scale: 1.04 }],
        ["#ss4 .ss-story-pg__label--theme",   { x: -30 }],
        ["#ss4 .ss-story-pg__desc--theme",    { x:  40 }],
        ["#ss4 .ss-story-pg__label--reserve", { x: -30 }],
        ["#ss4 .ss-story-pg__desc--reserve",  { x:  40 }],
      ].forEach(([sel, vars]) => {
        const el = scroller.querySelector(sel);
        if (!el) return;
        gsap.from(el, Object.assign(
          { opacity: 0, duration: 0.95, ease: "power3.out", transformOrigin: "50% 50%" },
          vars,
          { scrollTrigger: ST(sel, "top 86%") }
        ));
      });

      /* 페이지 캡처 3장(메인·테마·예약) — 위→아래 클립 와이프(촤르르), photobg 리빌과 통일 */
      ["#ss4 .ss-story-pg__main", "#ss4 .ss-story-pg__cap--theme", "#ss4 .ss-story-pg__cap--reserve"].forEach((sel) => {
        const el = scroller.querySelector(sel);
        if (!el) return;
        gsap.fromTo(el,
          { clipPath: "inset(0 0 100% 0)", opacity: 0 },
          { clipPath: "inset(0 0 0% 0)", opacity: 1, duration: 1.15, ease: "power2.out",
            scrollTrigger: ST(sel, "top 84%") }
        );
      });

      /* 중앙 헤드라인 보조(sub)·MAIN 라벨 — gsap 센터링(translateX 제거) */
      riseCenter("#ss4 .ss-story-pg__sub",         { y: 18, scrollTrigger: ST("#ss4 .ss-story-pg__sub", "top 88%") });
      riseCenter("#ss4 .ss-story-pg__label--main", { y: 14, scrollTrigger: ST("#ss4 .ss-story-pg__label--main", "top 88%") });

      /* 명패 텍스트 — gsap 관리 센터링(xPercent:-50)으로 페이드+업. CSS translateX 제거됨 */
      const plaqueText = scroller.querySelector("#ss4 .ss-story-pg__plaque-text");
      if (plaqueText) {
        gsap.set(plaqueText, { xPercent: -50 });
        gsap.from(plaqueText, {
          opacity: 0, y: 16, duration: 0.9, ease: "power3.out",
          scrollTrigger: ST("#ss4 .ss-story-pg__plaque-text", "top 86%"),
        });
      }

      /* 명패 골드 풀 — 열쇠 착지 순간 빛 번짐(진입 시 1회 페이드인) */
      if (ss4El && ss4El.querySelector(".ss-story-pg__plaque")) {
        const plaqueGlow = document.createElement("span");
        plaqueGlow.className = "ss-plaque-glow";
        plaqueGlow.setAttribute("aria-hidden", "true");
        ss4El.appendChild(plaqueGlow);
        gsap.set(plaqueGlow, { opacity: 0 });
        gsap.to(plaqueGlow, {
          opacity: 1, duration: 1.2, ease: "power2.out",
          scrollTrigger: ST("#ss4 .ss-story-pg__plaque", "center 60%"),
        });
      }

      /* ③ 팀 프로세스 카드 01/02/03 — 순차 진입 + 내부 텍스트 스태거 */
      const teamCards = scroller.querySelectorAll(
        "#ss4 .ss-story-pg__card--1, #ss4 .ss-story-pg__card--2, #ss4 .ss-story-pg__card--3"
      );
      if (teamCards.length) {
        const cardTL = gsap.timeline({
          scrollTrigger: { trigger: teamCards[0], scroller, start: "top 88%", once: true },
        });
        teamCards.forEach((card, i) => {
          cardTL.from(card, { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" }, i * 0.15);
          const inner = card.querySelectorAll(
            ".ss-story-pg__cnum, .ss-story-pg__ctitle, .ss-story-pg__cbody"
          );
          if (inner.length) cardTL.from(inner, {
            opacity: 0, y: 12, duration: 0.55, ease: "power2.out", stagger: 0.08,
          }, i * 0.15 + 0.12);
        });
      }

      /* ④ TEAM PROCESS 배경 패럴랙스 (.ss-story-pg__photobg)
       * ss1 .ss-overview__bg와 동일 패턴 — quickTo x/y/rotation, scale:1.1 확대 클립
       * ─────────────────────────────────────────────────────────────────────
       * · ss4는 매우 긴 섹션 → ss4El 전체에 pointermove 바인딩
       *   (카드/텍스트 z-index:2 위에서도 발동되도록)
       * · photobg의 getBoundingClientRect 기준으로 nx/ny 계산 + clamp(-0.5, 0.5)
       *   → 커서가 photobg 밖(위쪽 열쇠 영역)일 때는 엣지값으로 부드럽게 고정
       * · scroller scroll 시 pbRect null 초기화(레이지) → 다음 pointermove에서 재취득
       *   (모달 overflow 스크롤로 viewport 내 위치 변동 보정)
       * · .ss-sec overflow:hidden이 scale:1.1 가장자리 클립 담당
       * · 기존 keyTL / 달칵 / 트레일 등 절대 건드리지 않음 — photobg만 신규 추가
       */
      const photoBg = ss4El && ss4El.querySelector(".ss-story-pg__photobg");
      if (photoBg && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        /* 살짝 확대 → 흔들려도 가장자리 안 보임 */
        gsap.set(photoBg, { scale: 1.1, transformOrigin: "50% 50%", willChange: "transform" });

        const xTo = gsap.quickTo(photoBg, "x",        { duration: 0.7, ease: "power2" });
        const yTo = gsap.quickTo(photoBg, "y",        { duration: 0.7, ease: "power2" });
        const rTo = gsap.quickTo(photoBg, "rotation", { duration: 0.9, ease: "power2" });
        const AMPX = 26, AMPY = 18, AMPR = 1.1; /* px / px / deg */
        const clampNorm = gsap.utils.clamp(-0.5, 0.5);

        let pbRect = null;
        /* 스크롤마다 rect 무효화 → 다음 pointermove 시 재취득(레이지 갱신) */
        scroller.addEventListener("scroll", () => { pbRect = null; }, { passive: true });

        ss4El.addEventListener("pointerenter", () => { pbRect = photoBg.getBoundingClientRect(); });
        ss4El.addEventListener("pointermove", (e) => {
          if (!pbRect) pbRect = photoBg.getBoundingClientRect();
          /* photobg rect 기준 정규화, 엣지에서 자연스럽게 고정 */
          const nx = clampNorm((e.clientX - pbRect.left) / pbRect.width  - 0.5);
          const ny = clampNorm((e.clientY - pbRect.top)  / pbRect.height - 0.5);
          xTo(-nx * AMPX); /* 마우스 반대 방향 → 패럴랙스 원근감 */
          yTo(-ny * AMPY);
          rTo(nx * AMPR);  /* 좌우에 따라 미세 기울기 */
        });
        ss4El.addEventListener("pointerleave", () => { xTo(0); yTo(0); rTo(0); });
      }
    }

    /* ================================================================
       SECTION 4 · 별빛 지그재그 트레일 (#ss4) — 요청2
       ────────────────────────────────────────────────────────────────
       · caption--main 하단에서 시작 → 메인·테마·예약 캡처를 지그재그로 가로지름
       · 이중 레이어: 뒤(z:2) / 앞(z:4) — 캡처(z:3) 기준 앞/뒤 번갈아 통과
         바통터치: y≈200cqw(FRONT→BACK), y≈247cqw(BACK→FRONT)
       · 총 노드 18개 × 도트 2개 = 36도트 (성능 예산)
       · once 진입 트리거 + timed bloom 스태거 (scrub 아님 — 안정)
       · prefers-reduced-motion: init() early-return 안쪽 → 노드 생성 자체 없음
    ================================================================ */
    {
      const ss4Stl    = scroller.querySelector("#ss4");
      const stlCaption = ss4Stl && ss4Stl.querySelector(".ss-story-pg__caption--main");
      if (ss4Stl && stlCaption) {
        /* 별빛 라인 = 키 트레일과 같은 반짝이 입자(.ss-key-trail__dot 글로우)를 넓은 지그재그
         * 경로에 촘촘히 깔아 "촤르르" 순차 점등 → 그려진 뒤 그대로 남음(라인처럼) */
        if (!document.getElementById("ss-stl-style")) {
          const st = document.createElement("style");
          st.id = "ss-stl-style";
          st.textContent = ".ss-stl{position:absolute;pointer-events:none;opacity:0;z-index:4;}";
          document.head.appendChild(st);
        }

        /* 지그재그 꼭짓점 [x(cqw), y(cqw)] — 폭 넓게(6~94), 캡션 하단~예약 캡처 */
        const VERTS = [
          [50, 38], [8, 70], [92, 108], [6, 150], [92, 192],
          [8, 234], [92, 274], [8, 312], [58, 334],
        ];
        /* 꼭짓점 사이 arc-length 비례 보간 → 별빛이 선처럼 이어짐 */
        const SPACING = 9; /* cqw 간격(작을수록 촘촘) */
        const pts = [];
        for (let i = 0; i < VERTS.length - 1; i++) {
          const [x0, y0] = VERTS[i], [x1, y1] = VERTS[i + 1];
          const seg = Math.hypot(x1 - x0, y1 - y0);
          const n = Math.max(1, Math.round(seg / SPACING));
          for (let k = 0; k < n; k++) {
            const f = k / n;
            pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
          }
        }
        pts.push(VERTS[VERTS.length - 1]);

        /* 노드당 1~2 반짝이 — warm gold/white·크기 변주(자글자글 별빛) */
        const STAR = [
          [[0, 0, 5, "#fff9ee"]],
          [[0, 0, 3, "#ffd080"], [1.1, -0.6, 2, "#ffffff"]],
          [[0, 0, 6, "#ffffff"]],
          [[0, 0, 2, "#ffca80"]],
          [[0, 0, 4, "#ffd080"]],
          [[0, 0, 3, "#ffffff"], [-0.9, 0.6, 2, "#ffca80"]],
        ];

        const stlWraps = pts.map(([x, y], idx) => {
          const wrap = document.createElement("span");
          wrap.className  = "ss-stl";
          wrap.setAttribute("aria-hidden", "true");
          wrap.style.left = `${x.toFixed(2)}cqw`;
          wrap.style.top  = `${y.toFixed(2)}cqw`;
          STAR[idx % STAR.length].forEach(([dx, dy, sz, clr]) => {
            const dot = document.createElement("span");
            dot.className       = "ss-key-trail__dot"; /* 키 트레일과 동일 글로우 재사용 */
            dot.style.left      = `${dx}cqw`;
            dot.style.top       = `${dy}cqw`;
            dot.style.width     = `${sz}px`;
            dot.style.height    = `${sz}px`;
            dot.style.background = clr;
            wrap.appendChild(dot);
          });
          ss4Stl.appendChild(wrap);
          return wrap;
        });

        /* 촤라라 — 스크롤 따라 순차 점등(스크럽): 캡션 진입~예약 캡처 통과 구간에 매핑
         * → 보는 사람이 스크롤하며 별빛이 위에서 아래로 차례로 켜지는 걸 직접 봄 */
        gsap.set(stlWraps, { opacity: 0 });
        const stlReserve = ss4Stl.querySelector(".ss-story-pg__cap--reserve");
        const stlTL = gsap.timeline({
          scrollTrigger: {
            trigger: stlCaption,
            scroller,
            start: "top 88%",
            endTrigger: stlReserve || ss4Stl,
            end: stlReserve ? "bottom 8%" : "bottom bottom",  /* 구간 넓힘 → 더 천천히 촤라라 */
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        stlWraps.forEach((w, idx) => {
          /* 지그재그 별빛 트레일: 0.92→0.68 (박스쉐도우 축소에 맞춰 최대 밝기도 절제) */
          stlTL.to(w, { opacity: 0.68, duration: 0.16, ease: "power2.out" }, idx * 0.05);
        });
      }
    }

    /* ================================================================
       SECTION 4 분위기 요소 (#ss4) — 골드 먼지·배경 별·빛줄기·안개
       ────────────────────────────────────────────────────────────────
       · z-index: 0 (이미지·키·트레일 뒤) — 순수 배경 레이어
       · transform/opacity only — 60fps, 레이아웃 속성 무간섭
       · 키 scrub·트레일·달칵·기존 ScrollTrigger 절대 미간섭
       · 총 요소: god ray 2 + 먼지 18 + 별 25 + 안개 2 + 보케 4 = 51개
    ================================================================ */
    {
      const ss4Bg = scroller.querySelector("#ss4");
      if (ss4Bg) {
        const rnd = (a, b) => a + Math.random() * (b - a);

        /* ① 빛줄기 god ray 2개
         * transform-origin: 50% 0% → 상단 중심 기준 사선 회전
         * CSS 애니메이션은 opacity만 — inline transform과 충돌 없음 */
        [
          { left: "27cqw", rot: "-13deg", delay: "0s",   dur: "13s" },
          { left: "61cqw", rot:  "10deg", delay: "-8s",  dur: "17s" },
        ].forEach((cfg) => {
          const ray = document.createElement("span");
          ray.className = "ss-god-ray";
          ray.setAttribute("aria-hidden", "true");
          ray.style.left           = cfg.left;
          ray.style.transform      = `rotate(${cfg.rot})`;
          ray.style.animationDelay = cfg.delay;
          ray.style.setProperty("--ray-dur", cfg.dur);
          ss4Bg.appendChild(ray);
        });

        /* ② 골드 먼지 입자 18개 — 1~3px, 느리게 사선 부유, opacity 낮게 */
        for (let i = 0; i < 18; i++) {
          const d = document.createElement("span");
          d.className = "ss-dust";
          d.setAttribute("aria-hidden", "true");
          const sz = rnd(1, 3);
          /* 골드 60% / 화이트 40% */
          const isGold = Math.random() > 0.4;
          d.style.width      = `${sz.toFixed(1)}px`;
          d.style.height     = `${sz.toFixed(1)}px`;
          d.style.left       = `${rnd(3, 97).toFixed(2)}cqw`;
          d.style.top        = `${rnd(5, 410).toFixed(1)}cqw`;
          d.style.background = isGold
            ? `rgba(${220 + Math.floor(rnd(0, 35))},${158 + Math.floor(rnd(0, 50))},${Math.floor(rnd(28, 78))},1)`
            : "rgba(255,252,240,1)";
          d.style.setProperty("--df-dur",   `${rnd(17, 29).toFixed(1)}s`);
          d.style.setProperty("--df-delay", `-${rnd(0, 26).toFixed(1)}s`);
          d.style.setProperty("--df-hi",    `${rnd(0.13, 0.38).toFixed(2)}`);
          d.style.setProperty("--df-dx",    `${rnd(-28, 28).toFixed(0)}px`);
          d.style.setProperty("--df-dy",    `-${rnd(90, 240).toFixed(0)}px`);
          ss4Bg.appendChild(d);
        }

        /* ③ 배경 별 점멸 25개 — 1~2px, 트레일(5~6px)보다 훨씬 어둡게 차별화 */
        for (let i = 0; i < 25; i++) {
          const s = document.createElement("span");
          s.className = "ss-bg-star";
          s.setAttribute("aria-hidden", "true");
          const sz = Math.random() > 0.72 ? 2 : 1;
          s.style.width      = `${sz}px`;
          s.style.height     = `${sz}px`;
          s.style.left       = `${rnd(1, 99).toFixed(2)}cqw`;
          s.style.top        = `${rnd(3, 416).toFixed(1)}cqw`;
          /* 골드빛 vs 냉백 — 트레일의 warm gold/white와 구별되는 어두운 톤 */
          s.style.background = Math.random() > 0.5
            ? "rgba(255,220,140,1)"
            : "rgba(255,255,255,1)";
          s.style.setProperty("--tw-dur",   `${rnd(2.5, 5.5).toFixed(1)}s`);
          s.style.setProperty("--tw-delay", `-${rnd(0, 5.5).toFixed(1)}s`);
          s.style.setProperty("--tw-lo",    `${rnd(0.03, 0.07).toFixed(2)}`);
          s.style.setProperty("--tw-hi",    `${rnd(0.10, 0.24).toFixed(2)}`);
          ss4Bg.appendChild(s);
        }

        /* ④ 안개 추가 레이어 2개 — 섹션 중·하단 어두운 공백 채움
         * .ss-mist 기본 클래스에서 animation·border-radius 상속
         * CSS .ss-mist--3/4에서 gradient·delay·duration 오버라이드 */
        [
          { cls: "ss-mist--3", left: "8cqw",  top: "158cqw", w: "88cqw",  h: "20cqw" },
          { cls: "ss-mist--4", left: "-6cqw", top: "268cqw", w: "110cqw", h: "26cqw" },
        ].forEach((cfg) => {
          const mist = document.createElement("span");
          mist.className = `ss-mist ${cfg.cls}`;
          mist.setAttribute("aria-hidden", "true");
          mist.style.left   = cfg.left;
          mist.style.top    = cfg.top;
          mist.style.width  = cfg.w;
          mist.style.height = cfg.h;
          ss4Bg.appendChild(mist);
        });

        /* ⑤ 골드 보케 4개 — 초점 나간 큰 광원, 느리게 부유·호흡(먼지보다 크고 흐릿) */
        for (let i = 0; i < 4; i++) {
          const b = document.createElement("span");
          b.className = "ss-bokeh";
          b.setAttribute("aria-hidden", "true");
          const sz = rnd(6, 12);
          b.style.width  = `${sz.toFixed(1)}cqw`;
          b.style.height = `${sz.toFixed(1)}cqw`;
          b.style.left   = `${rnd(4, 88).toFixed(2)}cqw`;
          b.style.top    = `${rnd(20, 400).toFixed(1)}cqw`;
          b.style.setProperty("--bk-dur",   `${rnd(24, 38).toFixed(1)}s`);
          b.style.setProperty("--bk-delay", `-${rnd(0, 30).toFixed(1)}s`);
          b.style.setProperty("--bk-lo",    `${rnd(0.18, 0.30).toFixed(2)}`);
          b.style.setProperty("--bk-hi",    `${rnd(0.40, 0.55).toFixed(2)}`);
          b.style.setProperty("--bk-dx",    `${rnd(-30, 30).toFixed(0)}px`);
          b.style.setProperty("--bk-dy",    `${rnd(-50, -10).toFixed(0)}px`);
          ss4Bg.appendChild(b);
        }
      }
    }

    /* ================================================================
       SECTION 4 배경 톤 — 열쇠 섹션에서만 은은한 골드-다크 전환
       · 진입 시 #080d11(쿨) → #0d0a07(웜) 1.4s, 벗어나면 원복
       · onEnter 콜백 + gsap.to backgroundColor 만 — scrub·pin 없음(모달 안전)
    ================================================================ */
    {
      const ss4Tint = scroller.querySelector("#ss4");
      if (ss4Tint) {
        const BASE = "#080d11", WARM = "#0d0a07";
        const toWarm = () => gsap.to(ss4Tint, { backgroundColor: WARM, duration: 1.4, ease: "power2.out" });
        const toBase = () => gsap.to(ss4Tint, { backgroundColor: BASE, duration: 1.2, ease: "power2.out" });
        ScrollTrigger.create({
          trigger: ss4Tint, scroller,
          start: "top 70%", end: "bottom 30%",
          onEnter: toWarm, onEnterBack: toWarm,
          onLeave: toBase, onLeaveBack: toBase,
        });
      }
    }

    /* ================================================================
       마그네틱 골드 글로우 — ss5 링크카드(LIVE/GITHUB/PROPOSAL) + CTA
       · 포인터 따라 광원이 번짐(스크롤 무관 → 모달서 안정), quickTo 60fps
    ================================================================ */
    /* hover 가능한 정밀 포인터(데스크톱)에서만 — 터치기기 제외 */
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      /* CTA: 마그네틱 골드 글로우(포인터 추적) */
      const ctaEl = document.querySelector("#process-sangsang .process__cta");
      if (ctaEl) {
        ctaEl.classList.add("ss-mag");
        const flair = document.createElement("span");
        flair.className = "ss-mag__flair";
        flair.setAttribute("aria-hidden", "true");
        ctaEl.appendChild(flair);
        const clamp = gsap.utils.clamp(0, 100);
        const xTo = gsap.quickTo(flair, "xPercent", { duration: 0.4, ease: "power2" });
        const yTo = gsap.quickTo(flair, "yPercent", { duration: 0.4, ease: "power2" });
        let rect = null;
        const move = (e) => {
          if (!rect) return;
          xTo(clamp(((e.clientX - rect.left) / rect.width) * 100));
          yTo(clamp(((e.clientY - rect.top) / rect.height) * 100));
        };
        ctaEl.addEventListener("mouseenter", (e) => { rect = ctaEl.getBoundingClientRect(); move(e); gsap.to(flair, { scale: 1, duration: 0.4, ease: "power2.out" }); });
        ctaEl.addEventListener("mousemove", move);
        ctaEl.addEventListener("mouseleave", () => { gsap.to(flair, { scale: 0, duration: 0.3, ease: "power2.out" }); });
      }

      /* ss5 링크(LIVE/GITHUB/PROPOSAL): 글로우박스 대신 마우스오버 확대
       * M5: overwrite:"auto" — 빠른 enter→leave 반복 시 트윈 누적 방지 */
      scroller.querySelectorAll("#ss5 .ss-outro__ri").forEach((ri) => {
        ri.addEventListener("mouseenter", () => gsap.to(ri, { scale: 1.08, duration: 0.3, ease: "power2.out", overwrite: "auto" }));
        ri.addEventListener("mouseleave", () => gsap.to(ri, { scale: 1.0,  duration: 0.3, ease: "power2.out", overwrite: "auto" }));
      });
    }

    /* ── 이미지 로드 후 위치 재계산(레이아웃 점프 보정) ── */
    scroller.querySelectorAll(".process__making--sangsang img").forEach((img) => {
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
