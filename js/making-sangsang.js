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

    rise("#ss1 .ss-overview__kicker", {
      y: 18,
      scrollTrigger: ST("#ss1 .ss-overview__kicker", "top 86%"),
    });
    /* 메인 타이틀 — 마스크 와이프(아래→위로 닦이며 등장) + 살짝 상승 (히어로 결과 통일) */
    gsap.from("#ss1 .ss-overview__title", {
      clipPath: "inset(110% 0% -10% 0%)",
      y: 34, opacity: 0, duration: 1.0, ease: "power4.out", delay: 0.08,
      scrollTrigger: ST("#ss1 .ss-overview__title", "top 84%"),
    });
    rise("#ss1 .ss-overview__lead", {
      y: 20, delay: 0.14,
      scrollTrigger: ST("#ss1 .ss-overview__lead", "top 84%"),
    });

    // .ss-em 강조어 전체: 진입 시 부드럽게 페이드인 (주황 #ffc284는 CSS 유지)
    // ※ display/transform 변경 금지 — 문장 중간 인라인 em의 줄바꿈·순서 깨짐 방지(이전 yPercent 버그)
    scroller.querySelectorAll(".ss-em").forEach((em) => {
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
       SECTION 3 · STORY 포스터 (#ss3)
       · .ss-story__lyr[data-anim] 각각 개별 ScrollTrigger(once)
       · data-anim → FROM 상태 매핑 (story.html 원본 재현)
       · 핀 없음. 스크롤 진입 시 한 번만 등장(once:true, start 'top 70%')
       · transform/opacity 만 건드림 — left/top 레이아웃 속성 보존
       · 별(.ss-story__star)은 CSS twinkle 이 있으므로 건드리지 않음
    ================================================================ */
    const ss3 = scroller.querySelector("#ss3");
    if (ss3) {
      /* data-anim 값 → GSAP fromTo FROM 상태 매핑 */
      const ANIM_FROM = {
        up:    { y: 48,   opacity: 0 },
        drop:  { y: -50,  opacity: 0, rotate: -5 },
        left:  { x: -60,  opacity: 0 },
        right: { x:  60,  opacity: 0 },
        rise:  { y: 84,   opacity: 0 },
        pop:   { scale: 0.55, opacity: 0, transformOrigin: "50% 100%" },
        swing: { rotate: -13, opacity: 0, transformOrigin: "50% 0%" },
      };

      /* TO 상태 공통 기저 — 자연 상태로 복귀 */
      const TO_BASE = {
        x: 0, y: 0, rotate: 0, scale: 1, opacity: 1,
        duration: 1.4, ease: "power3.out",
        clearProps: "transform,transformOrigin",  /* 인라인 transform 제거 → CSS 원복 */
      };

      ss3.querySelectorAll(".ss-story__lyr[data-anim]").forEach((el) => {
        const type = el.dataset.anim;
        const fromVars = ANIM_FROM[type];
        if (!fromVars) return;  /* 알 수 없는 data-anim 값 무시 */

        gsap.fromTo(
          el,
          fromVars,
          Object.assign({}, TO_BASE, {
            scrollTrigger: {
              trigger: el,
              scroller,
              start: "top 70%",
              once: true,
            },
          })
        );
      });
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
        gsap.set(keyTop, { xPercent: -50, willChange: "transform" });

        /* ── 트레일 CSS 삽입 (중복 방지) ── */
        if (!document.getElementById("ss-key-trail-style")) {
          const st = document.createElement("style");
          st.id = "ss-key-trail-style";
          st.textContent =
            ".ss-key-trail{position:absolute;pointer-events:none;opacity:0;z-index:5;}" +
            ".ss-key-trail__dot{position:absolute;border-radius:50%;" +
            "transform:translate(-50%,-50%);" +
            "box-shadow:0 0 0.35cqw 0.06cqw rgba(255,235,160,.95),0 0 0.8cqw 0.15cqw rgba(255,195,80,.60),0 0 1.6cqw 0.25cqw rgba(255,155,40,.25);}";
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
        const AMP =  40;     /* 스윙 진폭: 이미지(20~79cqw) 바깥 + 키 완전 노출 */

        /*
         * WP: [타임라인_pos, 지속, y비율, x(cqw), rotate(deg), ease]
         * 달칵 제거됨 — onUpdate progress≥0.98 시 시간기반 재생
         * 총 duration = 9.8
         */
        /*
         * WP rot: 진자 기울기 → 누적 스핀 720°(2바퀴)
         * rotate는 ease:"none" 으로 스크롤에 정비례 → "휠리릭" 느낌
         * 속도: 초반 120°/unit → 후반 37.5°/unit 자연 감속
         * 좌우 경로(x)는 각 구간 ease 유지 → 진자 리듬 보존
         */
        const WP = [
          /* pos    dur   yR      xCqw            rot(누적)  ease(경로)    */
          [   0,    1.0,  0.10,   AMP,             120,  "sine.inOut"  ],  /* →우 */
          [   1.0,  1.8,  0.25,  -AMP,             270,  "sine.inOut"  ],  /* ←좌 */
          [   2.8,  1.8,  0.42,   AMP * 0.80,      420,  "sine.inOut"  ],  /* →우 */
          [   4.6,  1.8,  0.59,  -AMP * 0.60,      540,  "sine.inOut"  ],  /* ←좌 */
          [   6.4,  1.4,  0.75,   AMP * 0.35,      630,  "sine.inOut"  ],  /* →우 */
          [   7.8,  1.2,  0.90,   FX * 0.40,       690,  "power1.out"  ],  /* ←수렴 */
          [   9.0,  0.8,  1.00,   FX,              720,  "power2.out"  ],  /* 착지 (720°=0° 시각) */
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

        /* ── 달칵 스크롤 차단 핸들러 (progress≥0.999 시 ~0.47s 차단) ── */
        let clackPlayed = false;
        let clackTL     = null;
        let blockWheel  = false;
        /* keyTop WP 트윈 레퍼런스 — 달칵 시 kill, onLeaveBack 시 재구축 */
        const keyTopTweens = [];

        const onWheelBlock = (e) => { if (blockWheel) e.preventDefault(); };
        scroller.addEventListener("wheel",     onWheelBlock, { passive: false });
        scroller.addEventListener("touchmove", onWheelBlock, { passive: false });

        /* ── keyTL: scrub으로 낙하 전체 제어 ── */
        const keyTL = gsap.timeline({
          scrollTrigger: {
            trigger:    ss4,
            scroller,
            start:      "top top",
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
                blockWheel  = true;

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
                });

                clackTL = gsap.timeline({ onComplete() { clackTL=null; } })
                  /* 1단계: 착지 좌표에서 바로 아래로 꽂기 — 예비 들어올림 없음
                   * 절대값(finalY+18) 사용: kill 후 scrub 간섭 없으므로 안전 */
                  .to(keyTop, { y: finalY + 18, rotate: -12, scale: 0.92, duration: 0.12, ease: "power3.in", overwrite: "auto" })
                  /* 2단계: 탄성 복귀 — back.out으로 finalY까지 스프링(오버슈트→안착) */
                  .to(keyTop, { y: finalY, rotate: 0, scale: 1.0, duration: 0.35, ease: "back.out(3)" })
                  /* 임팩트+반동(~0.47s)까지만 스크롤 차단 */
                  .call(() => { blockWheel = false; })
                  /* 3단계: 미세 흔들림 settle */
                  .to(keyTop, { rotate: 3, duration: 0.1, ease: "sine.inOut" })
                  .to(keyTop, { rotate: 0, duration: 0.1, ease: "sine.inOut" })
                  /* 4단계: top 페이드아웃 + lock 페이드인 */
                  .to(keyTop,  { opacity: 0, duration: 0.18, ease: "power1.in"  }, "+=0.08")
                  .to(keyLock, { opacity: 1, duration: 0.18, ease: "power1.out" }, "<")
                  /* 5단계: 잠금 후 살짝 늦게, 천천히 하단 배경 사진 위→아래로 촤르르 펼침 */
                  .to(photobg ? photobg : {}, { clipPath: "inset(0 0 0% 0)", duration: 1.5, ease: "power2.out" }, "+=0.2");
              }
            },

            onLeaveBack() {
              /* 섹션 위로 되돌아오면 달칵 상태 초기화 */
              clackPlayed = false;
              blockWheel  = false;
              if (clackTL) { clackTL.kill(); clackTL = null; }
              /* keyTop 초기 상태 복원 — WP 트윈 kill 후 scrub이 복원 못 하므로 명시 리셋 */
              gsap.set(keyTop,  { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 });
              gsap.set(keyLock, { opacity: 0 });
              /* 하단 배경 사진 다시 접기 → 재스크롤 시 펼침 재생 */
              if (photobg) gsap.set(photobg, { clipPath: "inset(0 0 100% 0)" });
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
              }
            },
          },
        });

        /* WP → keyTL 트윈 (열쇠 이동·회전, 트레일 bloom은 아래 별도 루프)
         * keyTopTweens에 레퍼런스 저장 → 달칵 시 kill, onLeaveBack 시 재구축 */
        WP.forEach(([pos, dur, yR, xCqw, rot]) => {
          /* y: ease:"none" → 스크롤 대비 하강 속도 균일 (중반 늘어짐 제거)
           * x·rotate: WP별 ease 유지 → 진자 감속/진입 리듬 보존 */
          keyTopTweens.push(
            keyTL.to(keyTop, {
              y: cp(FY * yR),
              x: cp(xCqw), rotate: rot,
              ease: "none", duration: dur,
            }, pos)
          );
        });

        /* 트레일 노드 bloom→fadeout
         * bloomStart: 도착 0.18s 전부터 피어오름 → 열쇠가 지나가는 자리에 자글자글 남는 느낌
         * fadeDur: 다음 노드까지 시간의 65% → 연속성 있게 겹쳐 소멸 (촤라락 흐름) */
        trailNodes.forEach(({ t }, idx) => {
          const bloomStart = Math.max(0, t - 0.18);
          keyTL.to(trailWraps[idx], {
            opacity: 0.88, duration: 0.22, ease: "power2.out",
          }, bloomStart);
          const nextT   = idx < trailNodes.length - 1 ? trailNodes[idx + 1].t : 9.8;
          const fadeDur = Math.min(1.4, Math.max(0.28, (nextT - t) * 0.65));
          keyTL.to(trailWraps[idx], {
            opacity: 0, duration: fadeDur, ease: "power1.in",
          }, t + 0.18);
        });
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

      /* sparkle — 팝인(back.out) 후 은은한 반짝(scale·opacity yoyo) */
      const sparkle5 = scroller.querySelector("#ss5 .ss-outro__sparkle");
      if (sparkle5) gsap.fromTo(sparkle5,
        { opacity: 0, scale: 0.3, rotate: -40, transformOrigin: "50% 50%" },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.7, ease: "back.out(2.5)",
          scrollTrigger: ST("#ss5 .ss-outro__sparkle", "top 90%"),
          onComplete() {
            gsap.to(sparkle5, { opacity: 0.5, scale: 0.85, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true });
          },
        }
      );

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
          x: () => gsap.utils.random(-220, 220),
          y: () => gsap.utils.random(-70, 70),
          rotateY: 160, rotate: () => gsap.utils.random(-12, 12),
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
        ["#ss4 .ss-story-pg__main",           { y:  50 }],
        ["#ss4 .ss-story-pg__label--theme",   { x: -30 }],
        ["#ss4 .ss-story-pg__desc--theme",    { x:  40 }],
        ["#ss4 .ss-story-pg__cap--theme",     { y:  50, scale: 1.04 }],
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

      /* 예약 페이지 캡처만 — 위→아래 클립 와이프(촤르르), photobg 리빌과 통일 */
      {
        const reserveCap = scroller.querySelector("#ss4 .ss-story-pg__cap--reserve");
        if (reserveCap) gsap.fromTo(reserveCap,
          { clipPath: "inset(0 0 100% 0)", opacity: 0 },
          { clipPath: "inset(0 0 0% 0)", opacity: 1, duration: 1.15, ease: "power2.out",
            scrollTrigger: ST("#ss4 .ss-story-pg__cap--reserve", "top 84%") }
        );
      }

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

      /* ss5 링크(LIVE/GITHUB/PROPOSAL): 글로우박스 대신 마우스오버 확대 */
      scroller.querySelectorAll("#ss5 .ss-outro__ri").forEach((ri) => {
        ri.addEventListener("mouseenter", () => gsap.to(ri, { scale: 1.08, duration: 0.3, ease: "power2.out" }));
        ri.addEventListener("mouseleave", () => gsap.to(ri, { scale: 1.0, duration: 0.3, ease: "power2.out" }));
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
