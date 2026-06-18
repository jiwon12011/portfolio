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
    // 배경: 어둡게 시작해서 천천히 밝아짐 (brightness 필터)
    const ovBg = scroller.querySelector("#ss1 .ss-overview__bg");
    if (ovBg) {
      gsap.from(ovBg, {
        filter: "brightness(0.3)", duration: 1.6, ease: "power2.out",
        scrollTrigger: ST("#ss1", "top 90%"),
      });
    }

    rise("#ss1 .ss-overview__kicker", {
      y: 18,
      scrollTrigger: ST("#ss1 .ss-overview__kicker", "top 86%"),
    });
    rise("#ss1 .ss-overview__title", {
      y: 28, duration: 0.95, delay: 0.08,
      scrollTrigger: ST("#ss1 .ss-overview__title", "top 84%"),
    });
    rise("#ss1 .ss-overview__lead", {
      y: 20, delay: 0.14,
      scrollTrigger: ST("#ss1 .ss-overview__lead", "top 84%"),
    });

    // ss1 .ss-em: 흰색→오렌지 + 글로우 텍스트섀도 동시 진행 (duration 1.0, power3)
    const ovEm = scroller.querySelector("#ss1 .ss-overview__title .ss-em");
    if (ovEm) {
      gsap.fromTo(ovEm,
        { color: "#ffffff", textShadow: "none" },
        { color: "#ffc284", textShadow: "0 0 1.2cqw rgba(255,194,132,0.55)", duration: 1.0, ease: "power3.out", delay: 0.3,
          scrollTrigger: ST("#ss1 .ss-overview__title", "top 80%") }
      );
    }

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

    // ss2 .ss-em (tr__title 안): 흰색→오렌지 + 글로우 텍스트섀도 동시 진행
    const trEm = scroller.querySelector("#ss2 .ss-tr__title .ss-em");
    if (trEm) {
      gsap.fromTo(trEm,
        { color: "#ffffff", textShadow: "none" },
        { color: "#ffc284", textShadow: "0 0 1.2cqw rgba(255,194,132,0.55)", duration: 1.0, ease: "power3.out", delay: 0.3,
          scrollTrigger: ST("#ss2 .ss-tr__title", "top 80%") }
      );
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

      if (ss4 && keyTop && keyLock && plaque) {
        /* --lock: 달칵까지 숨김 */
        gsap.set(keyLock, { opacity: 0 });

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
            "transform:translate(-50%,-50%);}";
          document.head.appendChild(st);
        }

        /* ── cqw → px 변환 (invalidateOnRefresh 시 재평가) ── */
        const cw = () => ss4.offsetWidth;
        const cp = (v) => () => v * cw() / 100;

        /*
         * 착지 좌표 (xPercent:-50 적용 후 x=0 = 가로 중앙 50cqw)
         *   FX = (27.5 + 14.592÷2) − 50 = −15.204cqw
         *   FY = 341.319 − 8.889 = 332.43cqw
         */
        const FX  = -15.204;
        const FY  =  332.43;
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

        /* ── 트레일 도트 생성 (WP 0~5 경로 지점, 각 2개 = 총 12개) ──
         * .ss-sec에 container-type:inline-size 이므로 1% = 1cqw
         * leftCqw = 50 + xCqw  (xPercent:-50 기준, 중앙=50cqw)
         * topCqw  = keyTop.top(8.889) + height÷2(4.444) + FY*yR
         */
        const KEY_CY = 8.889 + 4.444; /* keyTop 수직 중심 시작점 */

        /* [xCqw, yR, [[dx_cqw, dy_cqw, size_px, color], ...]] */
        const TRAIL_CFG = [
          [ AMP,         0.10, [[-0.8, -1.5, 5, "#ffffff"], [ 1.2,  1.0, 4, "#ffc284"]] ],
          [-AMP,         0.25, [[ 1.0, -0.8, 5, "#ffc284"], [-1.4,  1.5, 4, "#ffffff"]] ],
          [ AMP * 0.80,  0.42, [[-0.7, -1.8, 6, "#ffffff"], [ 1.5,  0.9, 4, "#ffc284"]] ],
          [-AMP * 0.60,  0.59, [[ 1.2, -1.0, 5, "#ffc284"], [-1.0,  1.6, 4, "#ffffff"]] ],
          [ AMP * 0.35,  0.75, [[-1.0, -1.4, 5, "#ffffff"], [ 1.4,  0.7, 4, "#ffc284"]] ],
          [ FX * 0.40,   0.90, [[ 0.9, -1.2, 5, "#ffffff"], [-1.2,  1.4, 4, "#ffc284"]] ],
        ];

        const trailWraps = TRAIL_CFG.map(([xCqw, yR, dots]) => {
          const wrap = document.createElement("span");
          wrap.className  = "ss-key-trail";
          wrap.style.left = `${(50 + xCqw).toFixed(3)}cqw`;
          wrap.style.top  = `${(KEY_CY + FY * yR).toFixed(3)}cqw`;

          dots.forEach(([dx, dy, sz, clr]) => {
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

        /* ── 달칵 스크롤 차단 핸들러 (progress≥0.98 시 ~0.5s 차단) ── */
        let clackPlayed = false;
        let clackTL     = null;
        let blockWheel  = false;

        const onWheelBlock = (e) => { if (blockWheel) e.preventDefault(); };
        scroller.addEventListener("wheel",     onWheelBlock, { passive: false });
        scroller.addEventListener("touchmove", onWheelBlock, { passive: false });

        /* ── keyTL: scrub으로 낙하 전체 제어 ── */
        const keyTL = gsap.timeline({
          scrollTrigger: {
            trigger:    ss4,
            scroller,
            start:      "top top",
            /* 명패 중앙이 뷰포트 중앙에 오는 순간 progress=1 →
             * 그 시점에 달칵+스크롤 멈춤 발동. 이후 하단(TEAM PROCESS)은 자유 스크롤 */
            endTrigger: plaque,
            end:        "center center",
            scrub: 0.4,
            invalidateOnRefresh: true,

            onUpdate(self) {
              /* progress ≥ 0.98 → 달칵 1회 시간기반 재생 + 스크롤 차단
               * overwrite:"auto" — scrub의 rotate 간섭(현재 ≈-0.3°)을 제거 */
              if (self.progress >= 0.98 && !clackPlayed) {
                clackPlayed = true;
                blockWheel  = true;

                clackTL = gsap.timeline({ onComplete() { blockWheel=false; clackTL=null; } })
                  /* 1단계: 열쇠를 살짝 위로 들었다가 — 예비동작 */
                  .to(keyTop, { y: "-=8", duration: 0.1, ease: "power1.in", overwrite: "auto" })
                  /* 2단계: 꽂아 넣기 — 아래로 쾅 + 회전 임팩트 */
                  .to(keyTop, { y: "+=18", rotate: -12, scale: 0.92, duration: 0.12, ease: "power3.in" })
                  /* 3단계: 탄성 복귀 — back 이징으로 흔들림 */
                  .to(keyTop, { y: "-=5", rotate: 0, scale: 1.0, duration: 0.35, ease: "back.out(3)" })
                  /* 4단계: 미세 흔들림 settle */
                  .to(keyTop, { rotate: 3, duration: 0.1, ease: "sine.inOut" })
                  .to(keyTop, { rotate: 0, duration: 0.1, ease: "sine.inOut" })
                  /* 5단계: top 페이드아웃 + lock 페이드인 */
                  .to(keyTop,  { opacity: 0, duration: 0.18, ease: "power1.in"  }, "+=0.08")
                  .to(keyLock, { opacity: 1, duration: 0.18, ease: "power1.out" }, "<");
              }
            },

            onLeaveBack() {
              /* 섹션 위로 되돌아오면 달칵 상태 초기화 */
              clackPlayed = false;
              blockWheel  = false;
              if (clackTL) { clackTL.kill(); clackTL = null; }
              gsap.set(keyTop,  { opacity: 1 });
              gsap.set(keyLock, { opacity: 0 });
            },
          },
        });

        /* WP → keyTL 트윈 + 트레일 bloom/fadeout */
        WP.forEach(([pos, dur, yR, xCqw, rot, ease], idx) => {
          /* 키 이동·회전
           * y: per-property ease "none" → 스크롤 대비 하강 속도 균일 (중반 늘어짐 제거)
           * x·rotate: WP별 ease 유지 → 진자 감속/진입 리듬 보존 */
          keyTL.to(keyTop, {
            y: cp(FY * yR),
            x: cp(xCqw), rotate: rot,
            ease: "none", duration: dur,
          }, pos);

          /* 트레일 bloom→fadeout (착지 WP[6] 제외) */
          if (idx < trailWraps.length) {
            const arriveT    = pos + dur;
            /* 다음 WP 도착 시간 (마지막 트레일 WP[5]은 keyTL 종료=9.8을 기준) */
            const nextArrive = idx < WP.length - 2
              ? WP[idx + 1][0] + WP[idx + 1][1]
              : 9.8;
            const fadeDur    = Math.min(1.4, nextArrive - arriveT - 0.1);

            /* 도착 → 반짝 */
            keyTL.to(trailWraps[idx], {
              opacity: 0.9, duration: 0.22, ease: "power1.out",
            }, arriveT);
            /* 잔광 → 소멸 */
            keyTL.to(trailWraps[idx], {
              opacity: 0, duration: fadeDur, ease: "power1.in",
            }, arriveT + 0.27);
          }
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

      // ss5 .ss-em, ss4 .ss-em: 흰색→오렌지 + 글로우 텍스트섀도 동시 진행
      scroller.querySelectorAll("#ss5 .ss-em, #ss4 .ss-em").forEach((em) => {
        gsap.fromTo(em,
          { color: "#ffffff", textShadow: "none" },
          { color: "#ffc284", textShadow: "0 0 1.2cqw rgba(255,194,132,0.55)", duration: 1.0, ease: "power3.out", delay: 0.25,
            scrollTrigger: ST(em, "top 80%") }
        );
      });

      rise("#ss5 .ss-outro__desc--proposal", { y: 20, scrollTrigger: ST("#ss5 .ss-outro__desc--proposal", "top 86%") });
      rise("#ss5 .ss-outro__kicker--result", { y: 16, scrollTrigger: ST("#ss5 .ss-outro__kicker--result", "top 88%") });
      const lessons = scroller.querySelectorAll("#ss5 .ss-outro__lesson");
      if (lessons.length) gsap.from(lessons, {
        opacity: 0, y: 20, duration: 0.85, ease: "power3.out", stagger: 0.12,
        scrollTrigger: ST("#ss5 .ss-outro__lesson--1", "top 86%"),
      });
      rise("#ss5 .ss-outro__thanks", { y: 18, scrollTrigger: ST("#ss5 .ss-outro__thanks", "top 90%") });

      /* 제안서 캡처 — 오른쪽에서 왼쪽으로 슬라이드(스크롤 시 오른쪽 이미지가 들어옴) */
      const shots = scroller.querySelectorAll("#ss5 .ss-outro__shot");
      if (shots.length) gsap.from(shots, {
        opacity: 0, x: 90, duration: 1.05, ease: "power3.out", stagger: 0.18,
        scrollTrigger: ST("#ss5 .ss-outro__shot--1", "top 82%"),
      });

      /* LIVE SITE → GITHUB 쇽쇽쇽 (오른쪽에서 순차 슬라이드) */
      const ris = scroller.querySelectorAll("#ss5 .ss-outro__ri");
      if (ris.length) gsap.from(ris, {
        opacity: 0, x: 80, duration: 0.8, ease: "power3.out", stagger: 0.18,
        scrollTrigger: ST("#ss5 .ss-outro__ri--live", "top 86%"),
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
