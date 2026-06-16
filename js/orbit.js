/* =======================================================================
   orbit.js — 세로축 실린더(배럴) 캐러셀 · 인터랙티브
   -----------------------------------------------------------------------
   · 카드는 이미지#4 흩어진 배치(각자 높이 Y)를 유지한 채, 캐릭터(중앙)를
     세로축으로 회전한다. 좌우로 돌며 앞/뒤로 지나간다(평면 타원 아님).
   · 회전은 절대시간(elapsed)이 아니라 매 프레임 dt 로 phase 를 "누적"한다.
     → 호버 freeze / resume / 탭 복귀가 점프 없이 매끄럽다.
   · 인터랙션:
       - 호버/포커스 카드 → 전체 회전 freeze + 그 카드를 정면(z=1)으로 끌어옴
       - 마우스 좌우 위치 → 회전 속도 steering(바이어스)
       - 마우스 위치 → 다층 패럴럭스 (tiltX/tiltY 기반, tShow>1.8 이후)
       - 카드별 위상차 sin 으로 ±4px bobbing 부유
   · 깊이 리듬: 앞 크고 또렷(blur 금지), 뒤 작고 흐림(약한 blur 선택).
   · 빛 궤도: 여러 높이의 납작한 타원 링(배럴 케이지) + canvas 파티클.
   · 파티클: 블루 링 파티클 + 앰버 반딧불(ember). glow 스프라이트 캐싱으로 GC 절감.
   · perf: backdrop-filter 없음, 단일 rAF, transform/opacity/filter 만.

   ── 시그니처 모션 4종 ────────────────────────────────────────────────
   ① 시네마틱 인트로 리빌: translateZ(-320→0) + introBlur(데스크톱 4px→0) +
      introY(-28→0 easeOutCubic) + introScale easeOutBack(c=1.4)
      캐릭터: tShow<1.4 → brightness(0.55→1.0)+translateY(18→0)
   ② 다층 패럴럭스 디오라마: tShow>1.8 + 비모바일 + 비reduceMotion
      photo(역방향±8px/절반Y) + character(정방향±18px/0.4Y), 1/scale 보정
   ③ 포커스 카드 블룸 + 피사계심도:
      포커스 카드 filter:drop-shadow 2겹 글로우(~22px)
      비포커스 dim 경로 dimBlur(0→1.8px) 추가
   ④ 갓레이+앰버 반딧불: CSS 오버레이(별도 .hero-godray 요소) +
      canvas ember 파티클(sin 깜빡임, 앰버색, glow 스프라이트 캐싱)
   ====================================================================== */
(() => {
  /* ── 메인 버전 전환(우측 상단 토글) ────────────────────────────────
     localStorage('orbitVersion') === 'original' → 원본(빌보드 + 마우스 따라 이동)
     그 외(기본)                                 → 3D 실린더 회전 버전  ← 현재 기본
     토글 변경 시 값 저장 후 location.reload()(orbit 은 1회 초기화 구조).
     ※ 토글 UI 는 CSS 로 숨겼지만 배선·localStorage 기능은 그대로 유지. ── */
  const ORBIT_VER = (() => {
    try {
      const p = new URLSearchParams(location.search).get("ver"); // ?ver=3d|original → 미리보기 강제
      if (p === "3d" || p === "original") return p;
      return localStorage.getItem("orbitVersion");
    } catch (e) { return null; }
  })();
  /* 기본값 = 3D 회전. localStorage 가 명시적으로 'original' 일 때만 원본. */
  const IS_3D = ORBIT_VER === "original" ? false : true;

  /* 우측 상단 토글 배선(존재 시) — DOM 은 defer 라 준비됨 */
  (function wireVerToggle() {
    const t = document.getElementById("orbitVerToggle");
    if (!t) return;
    t.checked = IS_3D;
    t.addEventListener("change", () => {
      try { localStorage.setItem("orbitVersion", t.checked ? "3d" : "original"); } catch (e) {}
      location.reload();
    });
  })();

  /* ── 회전 멈춤 버튼(임시 — 위치 잡기용. 나중에 HTML/CSS 와 함께 제거) ──
     userPaused 가 true 면 phase 갱신을 건너뛰어 회전이 멈춘다. ── */
  let userPaused = false;
  (function wirePause() {
    const b = document.getElementById("orbitPauseBtn");
    if (!b) return;
    b.addEventListener("click", () => {
      userPaused = !userPaused;
      b.classList.toggle("is-paused", userPaused);
      b.setAttribute("aria-pressed", String(userPaused));
      b.textContent = userPaused ? "▶ 회전 재생" : "⏸ 회전 멈춤";
    });
  })();

  /* CYLINDER_3D: 3D 실린더(rotateY+translateZ) 경로 사용 여부. 버전 토글에 연동. */
  const CYLINDER_3D   = IS_3D;
  /* ── CYLINDER_3D 전용 튜닝 노브 ──────────────────────────────────
     CYLINDER_R    : 실린더 반경(px). 크게 → 카드 더 넓게.    ← 노브 #1
     PERSP_3D      : CSS perspective(px). 작게 → 과장된 원근. ← 노브 #2
     FOCUS_ADVANCE : 포커스 카드 추가 전진 Z(px).              ← 노브 #3
     CARD_SCALE_3D : 3D 전체 스케일(카드 --w 불변, cover 기준). ← 노브 #4
     PLAYER_SCALE_3D: player 카드(.card--player)만 추가 축소.   ← 노브 #5 ── */
  const CYLINDER_R    = 520;
  const PERSP_3D      = 2750;
  const FOCUS_ADVANCE = 30;   // 70 → 30: trailRotY 방식 도입 후 커서 이탈 최소화
  const CARD_SCALE_3D = 0.92; // 0.82→0.92: 전체 카드 크기 복원 — cover 카드(202px) 기준
  /* 가로로 긴 player 카드(.card--player = 자린고비·POZE)만 한 톤 더 작게.
     CARD_SCALE_3D 위에 곱해짐(1=영향 없음). 다른 타입(cover/link/about/lab/skills) 불변. */
  const PLAYER_SCALE_3D = 0.85;

  const CX  = 733;     // 중심 X (디자인 px, 1466 캔버스 기준)
  const RX  = 525;     // 수평 반경 (세로축 회전 반지름)
  const RPM = 0.05;    // 라디안/초 (한 바퀴 ≈ 126초)
  const CHARACTER_Z = 10;

  /* ── 회전 모드 ─────────────────────────────────────────────────────
     "continuous" : 진짜 느린 단방향 연속 회전(배럴 의도대로 카드가 앞/뒤로 지나감).
                    마우스 좌우 = 속도 가감, 호버 = freeze. ← 현재 선택(다듬기 대상)
     "hybrid"     : 진입 1회전 시네마틱 소개 후 정지(정적 디오라마+패럴럭스).
     "legacy"     : 기존 제자리 wobble(±15°, RPM 미사용) — 비추천(어색함의 원인).
     ▶ 다듬기 핵심 값: SPIN_SPEED(속도) · STEER_BIAS(마우스 감도) · bobAmp(부유). ── */
  const ORBIT_MODE = IS_3D ? "continuous" : "legacy";  // 3D=연속회전, 원본=레거시(마우스 따라 이동)
  const SPIN_SPEED = 0.09;   // [continuous] rad/s — 단방향 회전 속도(한 바퀴 ≈ 70초)
  const STEER_BIAS = 0.40;   // [continuous] 마우스 좌우 → 회전 속도 ±가감
  const SPIN_TURNS = 1;      // [hybrid] 인트로 회전 바퀴 수(2π 배수 안착)
  const SPIN_START = 1.8;    // [hybrid] 스핀 시작(초)
  const SPIN_DUR   = 11;     // [hybrid] 스핀 지속(초)

  /* 카드 중심(이미지#4 배치) — DOM 순서와 동일.
     ⚠ 원본/3D 버전이 좌표를 따로 가짐(3D 만 미세조정해도 원본 안 깨지게). */
  const CENTERS_ORIGINAL = [
    { x: 355,  y: 190 }, // visual-archive
    { x: 733,  y: 158 }, // jaringobi
    { x: 506,  y: 420 }, // gwihon  (플레디스와 위치 교환 → 좌중앙)
    { x: 293,  y: 461 }, // about
    { x: 1184, y: 233 }, // pledis  (귀혼과 위치 교환 → 우상단)
    { x: 960,  y: 434 }, // yumi
    { x: 467,  y: 695 }, // poze
    { x: 965,  y: 682 }, // content-lab
    { x: 1174, y: 566 }, // skills
    /* ── 인덱스 9~11: 뒤쪽 배치(theta0 는 GHOST_THETA0 로 override). 호버/밝기는 일반 카드 ── */
    { x: 733,  y: 250 }, // mathhub
    { x: 733,  y: 470 }, // 상상의 문(door)
    { x: 733,  y: 285 }, // 우리 사이의 음표(playlist)
  ];
  /* 3D(회전) 버전 전용 좌표 — 여기를 한 카드씩 미세조정. */
  const CENTERS_3D = [
    { x: 355,  y: 190 }, // visual-archive
    { x: 733,  y: 158 }, // jaringobi
    { x: 293,  y: 461 }, // gwihon   ← about 원래 자리로 이동
    { x: 600,  y: 230 }, // about    ← 앞쪽 배치(로드 시 정면) · y 위로(정가운데 회피)
    { x: 1184, y: 233 }, // pledis
    { x: 960,  y: 434 }, // yumi
    { x: 230,  y: 660 }, // poze     ← about·상상의문 중간 아래단
    { x: 965,  y: 682 }, // content-lab
    { x: 1174, y: 566 }, // skills
    { x: 733,  y: 250 }, // mathhub
    { x: 733,  y: 470 }, // 상상의 문(door)
    { x: 733,  y: 720 }, // 우리 사이의 음표(playlist)  ← 가장 아래단
  ];
  const CENTERS = IS_3D ? CENTERS_3D : CENTERS_ORIGINAL;
  /* 로드 시 정면에 둘 카드 인덱스(3D 연속회전 한정) — about(3). phase 초기값으로 사용. */
  const FRONT_CARD_3D = 3;

  /* ── 위치 편집기 적용 슬롯 ──────────────────────────────────────────
     편집 패널 '복사' 결과(각도/높이 배열)를 아래 두 배열에 붙여넣으면 그 값으로 고정.
     null = 미사용(위 CENTERS_3D/GHOST_THETA0_3D 기본값 사용). ── */
  const THETA0_3D_OVERRIDE = [-2.8, -0.2, -1.3, -0.8, 1.15, 0.7, -1.8, 0, 1.65, 2.9, 3.9, 2.35];
  const Y_3D_OVERRIDE = [510, 200, 230, 510, 233, 550, 645, 640, 510, 240, 240, 605];

  const CARD_NAMES = ["visual-archive","자린고비","귀혼","about","플레디스","유미","POZE","content-lab","skills","MathHub","상상의 문","우리 사이의 음표"];

  /* 고스트 "위치" 인덱스 범위 (CENTERS 9, 10, 11) — theta0 positioning 전용.
     ⚠ 호버/디밍과 무관: 9~11도 일반 카드처럼 호버 포커스·정상 밝기로 승격됨.
        좌표만 GHOST_THETA0 로 뒤쪽 배치(좌표는 designer 담당). */
  const POS_GHOST_START = 9;

  /* ── 고스트 전용 뒤쪽 각도(rad) — 조정 쉽게 한 곳에 모음
     cos(θ) < 0 = 인물 뒤. 2.6~3.7 rad 범위에서 고르게 분산.
     y 는 CENTERS[i].y 로 별도 지정. ── */
  const GHOST_THETA0_ORIGINAL = [
    2.40,  // mathhub
    3.90,  // 상상의 문(door)
    3.50,  // 우리 사이의 음표(playlist)
  ];
  /* 3D 전용 뒤쪽 각도 — 한 카드씩 조정 */
  const GHOST_THETA0_3D = [
    2.40,  // mathhub
    3.90,  // 상상의 문(door)
    2.70,  // 우리 사이의 음표(playlist)  ← 왼쪽(이전 4.30은 반대방향이라 되돌림)
  ];
  const GHOST_THETA0 = IS_3D ? GHOST_THETA0_3D : GHOST_THETA0_ORIGINAL;

  const RING_YS = [206, 432, 660];  // 빛 궤도 링 높이

  /* 초기각: 이미지#4 X 위치 기반 + SPREAD 로 살짝 넓게.
     고스트(인덱스 9~11)는 asin 으로 90° 이상 표현 불가 → GHOST_THETA0 로 override. */
  const clamp01 = (v) => Math.max(-1, Math.min(1, v));
  const SPREAD = 1.32;
  const theta0 = CENTERS.map((c, i) => {
    if (i >= POS_GHOST_START) return GHOST_THETA0[i - POS_GHOST_START];
    return Math.asin(clamp01((c.x - CX) / RX)) * SPREAD;
  });
  /* 카드 높이 배열(편집 가능). placeArm 은 cardY[i] 사용. */
  const cardY = CENTERS.map((c) => c.y);
  /* 편집기 복사값 override(3D 전용) */
  if (IS_3D && Array.isArray(THETA0_3D_OVERRIDE)) THETA0_3D_OVERRIDE.forEach((v, i) => { if (typeof v === "number") theta0[i] = v; });
  if (IS_3D && Array.isArray(Y_3D_OVERRIDE)) Y_3D_OVERRIDE.forEach((v, i) => { if (typeof v === "number") cardY[i] = v; });

  /* lerp + clamp + ease 유틸 */
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  /* easeOutBack — 카드 착지 overshoot(진폭 계수 c=1.4, 보수적)
     reduceMotion 시에는 easeOutCubic 으로 대체 */
  const easeOutBack  = (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  /* easeInOutSine — 하이브리드 인트로 스핀: 느리게 시작 → 가속 → 부드럽게 정지(휠 세틀) */
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const PHI = (1 + Math.sqrt(5)) / 2;     // bobbing 위상 분산(뭉침 방지)

  /* ── prefers-reduced-motion / 모바일 감지 ────────────────────────── */
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile     = matchMedia("(max-width:768px)").matches;
  const _lowEnd      = (navigator.hardwareConcurrency || 8) <= 4;

  /* ── 인터랙션 상태 ───────────────────────────────────────────────
     phase     : 누적 회전각(라디안). dt 기반으로만 증가.
     speedMul  : 0(정지)~1(정속). speedTarget 으로 부드럽게 수렴(freeze).
     steer     : 마우스 좌우 바이어스(-1..1) → 회전 속도 가감.
     focusIdx  : 현재 정면화할 카드 index(-1 없음).
     focusAmt[]: 카드별 정면화 진행도(0→1) lerp 상태.
     tiltX/Y   : 마우스 기반 패럴럭스 틸트(-1..1), tiltXSmooth/Y lerp 추종. */
  let phase = (IS_3D && ORBIT_MODE === "continuous") ? -theta0[FRONT_CARD_3D] : 0;  // 로드 시 about 정면
  let spinT = 0;          // 하이브리드 인트로 스핀 누적시간(호버 freeze 시 일시정지)
  let bobT = 0;           // 부유(bobbing) 전용 시간 — freeze 시 느려지되 멈추진 않음
  let speedMul = 1;
  let speedTarget = 1;
  let steer = 0;          // 목표 steering
  let steerSmooth = 0;    // 부드럽게 따라가는 steering
  let focusIdx = -1;
  let pendingLeave = null; // A→B 전환 글리치 방지용 timer id (setTimeout 기반)
  const focusAmt = CENTERS.map(() => 0);

  /* ② 패럴럭스: 마우스 틸트 상태 */
  let tiltX = 0, tiltY = 0;           // 목표(-1..1)
  let tiltXSmooth = 0, tiltYSmooth = 0; // lerp 추종값

  /* depth(z) → 기본 시각 매핑 (focus 영향 전).
     앞(z=+1) 크고 또렷, 뒤(z=-1) 작고 흐림 — 깊이 리듬 강화.
     3D 모드: perspective 가 깊이스케일 자동처리 → scale 범위 좁힘(0.92~1.04).
     뒤 카드 blur 4px 로 높여 rotateY 미러 텍스트 가독성 차단. */
  function depthVis(z) {
    const t = (z + 1) / 2;                 // 0(뒤) ~ 1(앞)
    const use3D = CYLINDER_3D && !isMobile;
    return {
      scale:   use3D ? lerp(0.92, 1.04, t) : lerp(0.74, 1.16, t),
      opacity: lerp(0.60, 1.0, t),
      blur:    z < 0 ? (1 - t / 0.5) * (use3D ? 4.0 : 1.5) : 0,
      zi:      z >= 0 ? CHARACTER_Z + 5 : CHARACTER_Z - 7,  // 후방 카드(3) < SVG링(4)·파티클(5) → 뚫지 않게
    };
  }

  /* ── DOM ─────────────────────────────────────────────────────── */
  const arms = [...document.querySelectorAll(".card-arm")];
  if (arms.length === 0) return;
  arms.forEach((a, i) => {
    /* ③ 포커스 글로우: filter 는 포커스/dim 시에만 — 상시 will-change:filter 금지.
       .card 의 translateZ(0)는 style.css 에서 제거됨 → 이중 레이어 승격 없음. */
    a.style.willChange = "transform, opacity";
    a.style.left = "0px";
    a.style.top = "0px";
    /* 고스트 위치(9~11) 호버 승격: index 9(mathhub)는 .card-arm--ghost 라 CSS
       pointer-events:none → 인라인으로 auto 강제(HTML/CSS 불변, JS-only). 10·11은 무해. */
    if (i >= POS_GHOST_START) a.style.pointerEvents = "auto";
  });
  /* player 카드(.card--player = 자린고비·POZE) 판별 1회 캐시 — 매 프레임 querySelector 회피. */
  const isPlayerArm = arms.map((a) => !!a.querySelector(".card--player"));
  const charEl   = document.querySelector(".scene__character");
  const photoEl  = document.querySelector(".scene__photo");
  if (charEl) charEl.style.zIndex = CHARACTER_Z;
  const stage    = document.querySelector(".orbit-stage");
  /* CYLINDER_3D 모드: perspective 를 PERSP_3D 로 override(CSS 1800px 기본값 강화) */
  if (CYLINDER_3D && !isMobile && stage) stage.style.perspective = PERSP_3D + "px";

  /* ── 스케일 값 읽기: orbit-stage 의 CSS var(--scale) → 패럴럭스 이동량 보정 */
  function getStageScale() {
    const s = parseFloat(getComputedStyle(stage).getPropertyValue("--scale")) || 1;
    return s > 0 ? s : 1;
  }

  /* ① 인트로: 카드별 introBlur 적용 여부 — 데스크톱만, 최대 4px */
  const introBlurEnabled = !isMobile && !_lowEnd && !reduceMotion;

  /* ── applyArm: transform/opacity/filter 인라인 적용 (공통) ──────── */
  /* introAlpha : 0(숨김)~1(완전 등장).
     focusGlow  : 0~1 → 포커스 카드 drop-shadow 블룸 강도(③).
     rotY       : 포커스 카드 입체 기울임.
     extraBlur  : 비포커스 dim 경로 피사계심도(③). */
  function applyArm(arm, x, y, scale, opacity, blur, bright, zi, introAlpha, rotY, focusGlow, extraBlur, rawT) {
    /* ① 인트로 리빌 효과 계산
       introAlpha = easeOutBack(overshoot 의도) → scale 에만 사용(착지 통통).
       rawZT      = easeOutCubic(선형 rawT) → Z·Y 에 사용. easeOutBack 을 Z 에 쓰면
                    0 을 지나 양수로 튀어(카드 돌출 깜빡임) → overshoot 없는 cubic 으로 차단. */
    const rawZT      = easeOutCubic(rawT === undefined ? introAlpha : rawT);
    /* introScale: 0.9→1 (easeOutBack 의도된 overshoot 유지) */
    const introEasedScale = lerp(0.9, 1, introAlpha);
    /* introY: -28→0, overshoot 없는 easeOutCubic */
    const introY     = reduceMotion ? 0 : lerp(-28, 0, rawZT);
    /* introBlur: 데스크톱 4px→0, 모바일·저사양 0 */
    const iBlur      = introBlurEnabled ? lerp(4, 0, introAlpha) : 0;
    /* introAlpha 앞부분 빠르게 — min(ia*1.6, 1) */
    const introOpa   = Math.min(introAlpha * 1.6, 1);
    /* translateZ: -320→0, overshoot 없는 easeOutCubic(양수 튐 방지) */
    const introZ     = reduceMotion ? 0 : lerp(-320, 0, rawZT);

    const finalScale = scale * introEasedScale;
    const tilt       = rotY ? ` rotateY(${rotY.toFixed(2)}deg)` : "";

    arm.style.transform =
      `translate(${x.toFixed(1)}px, ${(y + introY).toFixed(1)}px) translate(-50%, -50%) translateZ(${introZ.toFixed(1)}px) scale(${finalScale.toFixed(4)})${tilt}`;
    arm.style.opacity = (opacity * introOpa).toFixed(4);
    arm.style.zIndex = zi;

    /* filter 조합: blur(깊이) + brightness(dim) + introBlur + dimBlur(피사계심도) + focusGlow(블룸) */
    const f = [];
    const totalBlur = blur + iBlur + (extraBlur || 0);
    if (totalBlur > 0.05) f.push(`blur(${totalBlur.toFixed(2)}px)`);
    if (bright < 0.999) f.push(`brightness(${bright.toFixed(3)})`);

    /* ③ 포커스 카드 블룸: drop-shadow 2겹 (파란/흰, 최대 ~22px)
       transform:scale 에 따라가므로 box-shadow 대신 filter:drop-shadow 사용 */
    if (focusGlow && focusGlow > 0.02) {
      const g = focusGlow;
      /* glow1: 흰 코어 글로우(작고 선명) — 은은하게 */
      const r1 = (6  * g).toFixed(1);
      const a1 = (0.42 * g).toFixed(3);
      /* glow2: 파란 헤일로(넓고 부드럽) — 은은하게 */
      const r2 = (16 * g).toFixed(1);
      const a2 = (0.26 * g).toFixed(3);
      f.push(`drop-shadow(0 0 ${r1}px rgba(230,245,255,${a1}))`);
      f.push(`drop-shadow(0 4px ${r2}px rgba(100,170,255,${a2}))`);
    }

    arm.style.filter = f.length ? f.join(" ") : "none";
  }

  /* dim 경로용 얇은 래퍼(가독성) — ③ extraBlur(피사계심도) 추가 */
  function scaleDimAndApply(arm, x, y, scale, opacity, blur, bright, zi, introAlpha, dimBlur, rawT) {
    applyArm(arm, x, y, scale, opacity, blur, bright, zi, introAlpha, 0, 0, dimBlur, rawT);
  }

  /* ── applyArm3D: CYLINDER_3D 모드 전용 ──────────────────────────────
     perspective 가 X투영·깊이스케일 자동처리 → rotateY(θ)+translateZ(R) 으로 배치.
     introZ 는 translateZ 에 흡수: totalZ = effectiveR + introZ (= R-320→R).
     → 카드가 실린더 안쪽에서 바깥으로 펼쳐지는 인트로 리빌.
     filter 파이프라인(blur/brightness/drop-shadow 글로우)은 기존과 동일. ── */
  function applyArm3D(arm, cx, y, scale, opacity, blur, bright, zi, introAlpha, effectiveR, thetaRad, focusGlow, extraBlur, rawT, trailRotY) {
    const rawZT           = easeOutCubic(rawT === undefined ? introAlpha : rawT);
    const introEasedScale = lerp(0.9, 1, introAlpha);
    const introY          = reduceMotion ? 0 : lerp(-28, 0, rawZT);
    const iBlur           = introBlurEnabled ? lerp(4, 0, introAlpha) : 0;
    const introOpa        = Math.min(introAlpha * 1.6, 1);
    /* translateZ(R + introZ): 카드가 실린더 내부(-320)에서 표면(0)으로 펼쳐짐 */
    const introZ          = reduceMotion ? 0 : lerp(-320, 0, rawZT);

    const finalScale = scale * introEasedScale;
    const thetaDeg   = thetaRad * (180 / Math.PI);
    const totalZ     = effectiveR + introZ;
    /* trailRotY(도): 포커스 시 translateZ 뒤에 역회전을 더해 카드 면만 뷰어 쪽으로 un-tilt.
       카드 XY 위치(θ)는 그대로여서 커서 밑을 벗어나지 않음 — 깜빡임 방지 핵심. */
    const trailDeg   = trailRotY || 0;

    arm.style.transform =
      `translate(${cx.toFixed(1)}px, ${(y + introY).toFixed(1)}px) translate(-50%, -50%) rotateY(${thetaDeg.toFixed(2)}deg) translateZ(${totalZ.toFixed(1)}px)${trailDeg ? ` rotateY(${trailDeg.toFixed(2)}deg)` : ""} scale(${finalScale.toFixed(4)})`;
    arm.style.opacity = (opacity * introOpa).toFixed(4);
    arm.style.zIndex  = zi;

    const f = [];
    const totalBlur = blur + iBlur + (extraBlur || 0);
    if (totalBlur > 0.05) f.push(`blur(${totalBlur.toFixed(2)}px)`);
    if (bright < 0.999)   f.push(`brightness(${bright.toFixed(3)})`);

    /* ③ 포커스 카드 블룸: drop-shadow 2겹 (흰 코어 + 파란 헤일로) */
    if (focusGlow && focusGlow > 0.02) {
      const g  = focusGlow;
      const r1 = (6  * g).toFixed(1);
      const a1 = (0.42 * g).toFixed(3);
      const r2 = (16 * g).toFixed(1);
      const a2 = (0.26 * g).toFixed(3);
      f.push(`drop-shadow(0 0 ${r1}px rgba(230,245,255,${a1}))`);
      f.push(`drop-shadow(0 4px ${r2}px rgba(100,170,255,${a2}))`);
    }
    arm.style.filter = f.length ? f.join(" ") : "none";
  }

  /* ── placeArm: 한 카드 배치 ─────────────────────────────────────
     회전 위치(rotX/rotZ)와 정면 위치(z=1, x=CX) 사이를 focusAmt 로 블렌드.
     비포커스 카드는 다른 카드가 포커스됐을 때 dim(어둡게+뒤로). */
  const FRONT_SCALE = 1.2;    // 정면화 카드 최대 스케일(과하지 않게)
  const FRONT_Z     = 30;     // 정면화 카드 zIndex
  const DIM_OPACITY = 0.42;   // 다른 카드 dim 시 곱
  const DIM_BRIGHT  = 0.78;   // 다른 카드 dim 밝기
  const DIM_SCALE   = 0.82;   // 다른 카드 dim 시 축소(원근 분리↑ — 주변이 더 비킴)
  const DIM_BLUR    = 1.8;    // ③ 피사계심도: dim 카드 추가 blur 최대값

  function placeArm(arm, i, introAlpha, rawT) {
    if (rawT === undefined) rawT = introAlpha;   // 정적 호출(reduceMotion) 시 1
    const c = CENTERS[i];
    if (!c) return;
    const θ = theta0[i] + phase;

    const fa          = easeOutCubic(focusAmt[i]);
    const someFocused = focusIdx !== -1;
    const isFocused   = focusIdx === i;
    const G           = window.__cardGather || 1;

    if (CYLINDER_3D && !isMobile) {
      /* ── 안 A: perspective + rotateY(θ) + translateZ(R) 경로 ──────────
         · 카드 중심을 (CX, y)에 고정. perspective 가 X투영·깊이스케일 자동처리.
         · 포커스: θ 위치 고정, translateZ 뒤 rotateY(-θ·fa) 트레일링으로
           카드 면만 뷰어 쪽으로 un-tilt → 카드가 커서 밑에 머뭄(깜빡임 방지).
         · gather: R 에 적용(2D 의 X오프셋 대신). ── */
      const z_eff = Math.cos(θ);
      const base  = depthVis(z_eff);           // 3D 모드: scale 0.92~1.04, blur ≤4px
      /* gather 된 반경 + 포커스 전진(작게: 커서 이탈 방지) */
      const gR    = CYLINDER_R * G;
      const effR  = lerp(gR, gR + FOCUS_ADVANCE, fa);

      /* CARD_SCALE_3D: 3D 전체 스케일(노브 #4). player 카드만 PLAYER_SCALE_3D 추가 곱(노브 #5). */
      let scale   = lerp(base.scale,   FRONT_SCALE, fa) * CARD_SCALE_3D
                    * (isPlayerArm[i] ? PLAYER_SCALE_3D : 1);
      let opacity = lerp(base.opacity, 1.0,         fa);
      let blur    = base.blur * (1 - fa);
      let zi      = isFocused ? FRONT_Z : base.zi;

      const bobAmp = ORBIT_MODE !== "legacy"
        ? (0.6 + 0.6 * ((z_eff + 1) / 2))
        : (2   + 2   * ((z_eff + 1) / 2));
      const yRaw = cardY[i] + Math.sin(bobT * 0.9 + i * PHI * 6.283) * bobAmp;
      const y    = 423.5 + (yRaw - 423.5) * G;

      /* 포커스 카드: 위치(θ)는 그대로, 면만 뷰어 쪽으로 un-tilt.
         ⚠ θ = theta0 + phase 라 phase 누적 시 -θ 가 커져 카드가 '팽이'처럼 여러 바퀴 돔.
         → θ 를 [-π,π] 로 정규화(θNorm)해 '최단 각도'만 돌려 정면을 향하게. */
      const θNorm = θ - Math.round(θ / (Math.PI * 2)) * (Math.PI * 2);
      const trailRotY = -θNorm * fa * (180 / Math.PI);

      /* ③ dim 경로: 피사계심도 dimBlur 추가 */
      if (someFocused && !isFocused) {
        const dimT    = easeOutCubic(focusAmt[focusIdx]);
        opacity      *= lerp(1, DIM_OPACITY, dimT);
        const bright  = lerp(1, DIM_BRIGHT,  dimT);
        const dimBlur = lerp(0, DIM_BLUR,    dimT);
        applyArm3D(arm, CX, y, scale * lerp(1, DIM_SCALE, dimT), opacity, blur, bright, zi,
                   introAlpha, effR, θ, 0, dimBlur, rawT);
        return;
      }

      const focusGlow = isFocused ? fa : 0;
      applyArm3D(arm, CX, y, scale, opacity, blur, 1, zi, introAlpha, effR, θ, focusGlow, 0, rawT, trailRotY);

    } else {
      /* ── 기존 2D 빌보드 경로 (CYLINDER_3D=false 또는 모바일 폴백) ──── */
      const s    = Math.sin(θ);
      const z    = Math.cos(θ);                 // depth: 앞(+1) ~ 뒤(-1)
      const rotX = CX + RX * s;
      const base = depthVis(z);

      const x = 733 + (rotX - 733) * G;
      let   scale   = lerp(base.scale,   FRONT_SCALE, fa);
      let   opacity = lerp(base.opacity, 1.0,         fa);
      let   blur    = base.blur * (1 - fa);
      let   zi      = isFocused ? FRONT_Z : base.zi;

      const bobAmp = ORBIT_MODE !== "legacy"
        ? (0.6 + 0.6 * ((z + 1) / 2))
        : (2   + 2   * ((z + 1) / 2));
      const yRaw = cardY[i] + Math.sin(bobT * 0.9 + i * PHI * 6.283) * bobAmp;
      const y    = 423.5 + (yRaw - 423.5) * G;

      /* ③ dim 경로: 피사계심도 dimBlur 추가 */
      if (someFocused && !isFocused) {
        const dimT    = easeOutCubic(focusAmt[focusIdx]);
        opacity      *= lerp(1, DIM_OPACITY, dimT);
        const bright  = lerp(1, DIM_BRIGHT,  dimT);
        const dimBlur = lerp(0, DIM_BLUR,    dimT);
        scaleDimAndApply(arm, x, y, scale * lerp(1, DIM_SCALE, dimT), opacity, blur, bright, zi, introAlpha, dimBlur, rawT);
        return;
      }

      /* fa > 0.92 구간에서 tilt 점감 → 안착 시 잔떨림 제거 */
      const tiltFade = fa < 0.92 ? fa : lerp(fa, 0, (fa - 0.92) / 0.08);
      const rotY     = (isFocused && !reduceMotion) ? z * -3.5 * tiltFade : 0;

      const focusGlow = isFocused ? fa : 0;
      applyArm(arm, x, y, scale, opacity, blur, 1, zi, introAlpha, rotY, focusGlow, 0, rawT);
    }
  }

  /* ── 호버/포커스 바인딩 → freeze + 정면화 ───────────────────────── */
  arms.forEach((arm, i) => {
    const enter = () => {
      clearTimeout(pendingLeave);
      focusIdx = i; speedTarget = 0;
    };
    const leave = (e) => {
      if (e && e.type === "focusout" && arm.contains(e.relatedTarget)) return;
      if (focusIdx !== i) return;
      clearTimeout(pendingLeave);
      /* 50ms 히스테리시스: trailRotY 방식 위치 고정 후 추가 안전망.
         A→B 카드 연속 이동 시 짧은 leave 이벤트를 무시. */
      pendingLeave = setTimeout(() => {
        if (focusIdx === i) { focusIdx = -1; speedTarget = 1; }
      }, 50);
    };
    arm.addEventListener("mouseenter", enter);
    arm.addEventListener("mouseleave", leave);
    arm.addEventListener("focusin", enter);
    arm.addEventListener("focusout", leave);
  });

  /* ── 마우스 steering + ② 패럴럭스 tilt 수집 ─────────────────────
     tiltX/tiltY: -1..1 정규화. 패럴럭스는 비모바일·비reduceMotion 만 사용.
     gyro는 추가하지 않음(접근성·멀미 우려). */
  window.addEventListener("pointermove", (e) => {
    steer = clamp((e.clientX / window.innerWidth - 0.5) * 2, -1, 1);
    if (!isMobile && !reduceMotion) {
      tiltX = clamp((e.clientX / window.innerWidth  - 0.5) * 2, -1, 1);
      tiltY = clamp((e.clientY / window.innerHeight - 0.5) * 2, -1, 1);
    }
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    steer = 0; tiltX = 0; tiltY = 0;
  }, { passive: true });

  /* ── 빛 궤도 SVG: 여러 높이의 납작한 타원 링(배럴 케이지) ───────── */
  const svgNS = "http://www.w3.org/2000/svg";
  const RY = 80;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "orbit-ring-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 1466 847");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;overflow:visible";
  const rings = RING_YS.map(
    (cy) => `<ellipse cx="${CX}" cy="${cy}" rx="${RX}" ry="${RY}" fill="none"
      stroke="url(#orbitGrad)" stroke-width="1.4" filter="url(#orbit-glow)"/>`
  ).join("");
  /* SVG feGaussianBlur: 현재 stdDeviation 합 12.5(3.5+9) — 한계 근접이므로 추가 금지 */
  svg.innerHTML = `
    <defs>
      <filter id="orbit-glow" x="-20%" y="-160%" width="140%" height="420%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b1"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="9"   result="b2"/>
        <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="orbitGrad" gradientUnits="userSpaceOnUse" x1="${CX - RX}" y1="0" x2="${CX + RX}" y2="0">
        <stop offset="0%"   stop-color="rgba(150,190,240,0.16)"/>
        <stop offset="50%"  stop-color="rgba(220,238,255,0.72)"/>
        <stop offset="100%" stop-color="rgba(150,190,240,0.16)"/>
      </linearGradient>
    </defs>
    ${rings}
  `;
  stage.insertBefore(svg, stage.firstChild);

  /* ── 파티클 canvas (링 따라 흐르는 빛 + 앰버 반딧불) ─────────────
     ④ glow 스프라이트 캐싱: createRadialGradient 를 매 프레임 생성(GC 끊김) →
        OffscreenCanvas(또는 일반 Canvas)에 미리 렌더링 후 drawImage 로 재사용. */
  const canvas = document.createElement("canvas");
  canvas.className = "orbit-particles";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none";
  stage.insertBefore(canvas, svg.nextSibling);
  const ctx = canvas.getContext("2d");

  let cW = 1466, cH = 847, canvasDirty = true;
  function resizeCanvas() {
    if (!canvasDirty) return;
    canvasDirty = false;
    const r = stage.getBoundingClientRect();
    cW = r.width || 1466;
    cH = r.height || 847;
    canvas.width = cW;
    canvas.height = cH;
    /* 리사이즈 시 glow 스프라이트 재생성 */
    buildGlowSprites();
  }

  /* ── glow 스프라이트 캐싱 ─────────────────────────────────────────
     블루 파티클용(GLOW_BLUE)과 앰버 반딧불용(GLOW_AMBER) 각 1개씩 미리 렌더링.
     크기는 파티클 최대 반경 × 2 (넉넉하게).
     drawImage 로 재사용 → createRadialGradient GC 제거. */
  const SPRITE_SIZE = 48; // 오프스크린 스프라이트 크기(픽셀)
  let glowBlueSprite  = null;
  let glowAmberSprite = null;

  function makeGlowSprite(r, g, b) {
    /* 일반 canvas 로 오프스크린 렌더링(OffscreenCanvas 지원 여부 무관) */
    const oc = document.createElement("canvas");
    oc.width = oc.height = SPRITE_SIZE;
    const oc2 = oc.getContext("2d");
    const half = SPRITE_SIZE / 2;
    const grad = oc2.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,   `rgba(${r},${g},${b},0.85)`);
    grad.addColorStop(0.3, `rgba(${r},${g},${b},0.40)`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    oc2.fillStyle = grad;
    oc2.beginPath();
    oc2.arc(half, half, half, 0, Math.PI * 2);
    oc2.fill();
    return oc;
  }

  function buildGlowSprites() {
    glowBlueSprite  = makeGlowSprite(127, 174, 229); // 블루 파티클 glow
    glowAmberSprite = makeGlowSprite(255, 180,  80); // 앰버 반딧불 glow
  }
  buildGlowSprites();

  /* ── 파티클 풀 생성 ─────────────────────────────────────────────
     ④ perf: 캐싱 후 데스크톱 MAX_P 30→60, 저사양 16→24, 모바일 0.
        앰버 ember 타입 추가: 링 궤도 무시, 자유 부유 + opacity sin 깜빡임.
        블루/앰버 1:1 혼합(앰버가 노을과 호응). */
  const MAX_P = isMobile ? 0 : (_lowEnd ? 24 : 60);
  const BLUE_COUNT  = Math.floor(MAX_P * 0.55); // 블루 파티클 (링 궤도)
  const EMBER_COUNT = MAX_P - BLUE_COUNT;        // 앰버 반딧불 (자유 부유)

  /* 블루 링 파티클 */
  const parts = Array.from({ length: BLUE_COUNT }, (_, i) => ({
    type:  "blue",
    ring:  i % RING_YS.length,
    phase: Math.PI * 2 * (i / BLUE_COUNT),
    speed: 0.005 + Math.random() * 0.006,
    size:  0.9 + Math.random() * 1.6,
    alpha: 0.45 + Math.random() * 0.5,
  }));

  /* ④ 앰버 반딧불: 1466×847 캔버스 내 자유 위치 + 부유 벡터 */
  const emberRange = { x0: 400, x1: 1060, y0: 80, y1: 760 }; // 인물 주변 범위
  const embers = Array.from({ length: EMBER_COUNT }, (_, i) => ({
    type:   "ember",
    x:      emberRange.x0 + Math.random() * (emberRange.x1 - emberRange.x0),
    y:      emberRange.y0 + Math.random() * (emberRange.y1 - emberRange.y0),
    vx:     (Math.random() - 0.5) * 0.5, // 느린 드리프트
    vy:     -0.15 - Math.random() * 0.25, // 위로 천천히 떠오름
    size:   0.7 + Math.random() * 1.2,
    /* sin 깜빡임: 각자 다른 주파수/위상 */
    sinFreq:  0.6 + Math.random() * 0.8,
    sinPhase: Math.PI * 2 * (i / EMBER_COUNT),
    alpha:    0.30 + Math.random() * 0.45,
  }));

  /* ── rAF (dt 기반 누적) ────────────────────────────────────────
     last : 직전 프레임 ts. tShow : 누적 표시 시간(intro/파티클용). */
  let last = null, rafId = null, tShow = 0;

  function tick(ts) {
    /* 제작과정/About 오버레이가 열려 있으면 orbit 연산·렌더 스킵(가려진 채 CPU·GPU 낭비 방지).
       rAF 는 유지해 닫힐 때 즉시 재개, dt 점프 방지 위해 last 갱신 */
    const root = document.documentElement;
    if (root.classList.contains("process-open") || root.classList.contains("about-open")) {
      last = ts;
      rafId = requestAnimationFrame(tick);
      return;
    }
    if (last === null) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.1) dt = 0.1;
    tShow += dt;
    bobT  += dt * lerp(0.2, 1.0, speedMul);

    /* 속도 수렴 + steering 평활화 */
    speedMul    += (speedTarget - speedMul) * Math.min(dt * 6, 1);
    steerSmooth += (steer - steerSmooth)    * Math.min(dt * 2.2, 1);

    /* ② 패럴럭스: tiltXSmooth/Y lerp(dt*1.8) 추종 */
    tiltXSmooth += (tiltX - tiltXSmooth) * Math.min(dt * 1.8, 1);
    tiltYSmooth += (tiltY - tiltYSmooth) * Math.min(dt * 1.8, 1);

    if (ORBIT_MODE === "continuous") {
      /* 진짜 느린 단방향 연속 회전 + 마우스 좌우 = 속도 변조(위치 오프셋 아님).
         호버 freeze(speedMul→0) 시 정지. idle wobble 없음(방향 없는 흔들림 제거). */
      phase += SPIN_SPEED * (1 + steerSmooth * STEER_BIAS) * dt * speedMul * (userPaused ? 0 : 1);
    } else if (ORBIT_MODE === "hybrid") {
      /* 진입 1회전(2π 배수) 시네마틱 소개 → 디자인 레이아웃에 안착 후 정지. */
      spinT += dt * speedMul * (userPaused ? 0 : 1);
      const st = clamp((spinT - SPIN_START) / SPIN_DUR, 0, 1);
      phase = easeInOutSine(st) * (Math.PI * 2 * SPIN_TURNS);
    } else {
      /* legacy: 기존 제자리 wobble + steering(±15°, 비추천) */
      const idle = 0.18 * Math.sin(tShow * 0.28)
                 + 0.055 * Math.sin(tShow * 0.17 + 1.1)
                 + 0.028 * Math.sin(tShow * 0.11 + 2.7);
      const phaseTarget = idle + steerSmooth * 0.42;
      phase += (phaseTarget - phase) * Math.min(dt * 3.5, 1) * speedMul * (userPaused ? 0 : 1);
    }

    /* 카드별 정면화 진행도 lerp */
    arms.forEach((_, i) => {
      const target = i === focusIdx ? 1 : 0;
      focusAmt[i] += (target - focusAmt[i]) * Math.min(dt * 4, 1);
    });

    /* ① 인트로: INTRO_STAGGER 0.09(스펙에 맞게), INTRO_DUR 0.65s
       카드 착지 ~1.3s 기준 — 파티클 점화(PARTICLE_FADE_START)를 그 뒤로 지연. */
    const INTRO_STAGGER = 0.09, INTRO_DUR = 0.65;
    const introEase = reduceMotion ? easeOutCubic : easeOutBack;
    arms.forEach((a, i) => {
      const t = clamp((tShow - i * INTRO_STAGGER) / INTRO_DUR, 0, 1);
      /* introAlpha = easeOutBack(스케일 overshoot 의도) / rawT = 선형(Z·Y overshoot 방지) */
      placeArm(a, i, introEase(t), t);
    });

    /* ① 캐릭터 빛과 함께 떠오름: tShow < 1.4 → brightness(0.55→1.0) + translateY(18→0)
       tShow > 1.8 이후 charEl transform 소유권을 ② 패럴럭스로 넘김 */
    if (charEl) {
      if (tShow < 1.8) {
        /* 인트로 구간: 0~1.4 s 동안 brightness·translateY, 1.4~1.8 은 유지 */
        const charT  = clamp(tShow / 1.4, 0, 1);
        const charP  = easeOutCubic(charT);
        const bright = lerp(0.55, 1.0, charP);
        const cY     = reduceMotion ? 0 : lerp(18, 0, charP);
        charEl.style.filter    = `brightness(${bright.toFixed(3)})`;
        charEl.style.transform = `translateY(${cY.toFixed(2)}px)`;
      } else {
        /* ② 패럴럭스 구간: 소유권 이전. 비모바일·비reduceMotion 만 적용 */
        /* 인트로 filter 리셋 */
        charEl.style.filter = "";
        if (!reduceMotion && !isMobile) {
          const sc    = getStageScale();
          /* 캐릭터: 마우스 정방향(±18px), Y는 절반(0.4). 1/scale 보정 */
          const cParX = (tiltXSmooth * 18) / sc;
          const cParY = (tiltYSmooth *  7) / sc;  // 18 * 0.4 ≈ 7
          charEl.style.transform = `translate(${cParX.toFixed(2)}px, ${cParY.toFixed(2)}px)`;
        } else {
          charEl.style.transform = "";
        }
      }
    }

    /* ② 패럴럭스: photoEl(배경) — tShow>1.8, 비모바일, 비reduceMotion
       역방향(±8px), Y는 절반. orbit-stage 가 scale 중이므로 1/scale 보정 */
    if (photoEl && tShow > 1.8 && !reduceMotion && !isMobile) {
      const sc    = getStageScale();
      const pParX = (-tiltXSmooth * 8) / sc;
      const pParY = (-tiltYSmooth * 4) / sc;  // 8 * 0.5 = 4
      photoEl.style.transform = `scale(1.04) translate(${pParX.toFixed(2)}px, ${pParY.toFixed(2)}px)`;
    }

    /* 파티클 렌더링 */
    resizeCanvas();
    ctx.clearRect(0, 0, cW, cH);
    const sx = cW / 1466, sy = cH / 847;

    /* ① 파티클 점화: 카드 착지(마지막 카드 ~0.09*11+0.65≈1.64s)보다 늦게 시작.
       PARTICLE_FADE_START 을 ~1.3s 로 높여 카드 뒤에서 기다렸다 점화 */
    const PARTICLE_FADE_START = 1.30;
    const PARTICLE_FADE_DUR   = 0.60;
    const introGlobal = Math.min(Math.max(tShow - PARTICLE_FADE_START, 0) / PARTICLE_FADE_DUR, 1);
    const pSpeed = lerp(0.75, 1.0, speedMul);

    /* ── 블루 링 파티클 (glow 스프라이트 drawImage) ── */
    parts.forEach((p) => {
      p.phase += p.speed * pSpeed;
      const cyR = RING_YS[p.ring];
      const x = (CX + RX * Math.sin(p.phase)) * sx;
      const y = (cyR + RY * Math.cos(p.phase)) * sy;
      const z = Math.cos(p.phase);
      const br = 0.4 + (z + 1) / 2 * 0.6;
      const r  = p.size * (0.7 + (z + 1) / 2 * 0.6) * introGlobal;

      if (r < 0.1 || !glowBlueSprite) return;

      /* glow 헤일로: 스프라이트 drawImage (GC-free) */
      const haloR = r * 4;
      ctx.globalAlpha = p.alpha * br * 0.7 * introGlobal;
      ctx.drawImage(glowBlueSprite, x - haloR, y - haloR, haloR * 2, haloR * 2);

      /* 코어 점 */
      ctx.globalAlpha = p.alpha * br * introGlobal;
      ctx.fillStyle = `rgba(242,249,255,1)`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });

    /* ── ④ 앰버 반딧불 (ember) — 자유 부유 + sin 깜빡임 ── */
    /* ember x/y 는 design-px 좌표(1466×847 기준). 렌더 시 sx/sy 로 canvas-px 변환.
       경계 비교도 design-px 단위로 통일. reduceMotion 시 깜빡임 약하게, 모바일 0 */
    embers.forEach((e) => {
      /* 위치 업데이트 — design-px 단위 */
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < emberRange.x0 || e.x > emberRange.x1) e.vx *= -1;
      /* y 경계에서 리셋: 위로 떠오르다 상단 넘으면 하단에서 재시작 */
      if (e.y < emberRange.y0) {
        e.y = emberRange.y1;
        e.x = emberRange.x0 + Math.random() * (emberRange.x1 - emberRange.x0);
      }

      /* sin 깜빡임: reduceMotion 시 진폭 0.2배 */
      const sinAmp   = reduceMotion ? 0.15 : 0.55;
      const flicker  = 1 - sinAmp + sinAmp * Math.sin(tShow * e.sinFreq * 3.14 + e.sinPhase);
      const finalAlpha = e.alpha * flicker * introGlobal;
      if (finalAlpha < 0.02 || !glowAmberSprite) return;

      /* canvas-px 변환 */
      const ex = e.x * sx, ey = e.y * sy;
      const r = e.size * introGlobal;
      const haloR = r * 5;

      /* 앰버 glow 헤일로 */
      ctx.globalAlpha = finalAlpha * 0.6;
      ctx.drawImage(glowAmberSprite, ex - haloR, ey - haloR, haloR * 2, haloR * 2);

      /* 앰버 코어 */
      ctx.globalAlpha = finalAlpha;
      ctx.fillStyle = `rgba(255,210,120,1)`;
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
    });

    ctx.globalAlpha = 1; // 리셋

    rafId = requestAnimationFrame(tick);
  }

  function startRAF() {
    if (rafId) return;
    last = null;
    rafId = requestAnimationFrame(tick);
  }
  function stopRAF() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ── 시작 / reduced-motion ──────────────────────────────────── */
  document.documentElement.classList.add("orbit-active");
  if (reduceMotion) {
    /* 정적 배치. 호버 정면화는 살짝 살림. 인트로 blur/Y/Z 없음(reduceMotion=true → applyArm 내 처리). */
    arms.forEach((a, i) => placeArm(a, i, 1));
    arms.forEach((arm, i) => {
      arm.addEventListener("mouseenter", () => { focusAmt[i] = 1; focusIdx = i; redrawStatic(); });
      arm.addEventListener("mouseleave", () => { focusAmt[i] = 0; if (focusIdx === i) focusIdx = -1; redrawStatic(); });
      arm.addEventListener("focusin",  () => { focusAmt[i] = 1; focusIdx = i; redrawStatic(); });
      arm.addEventListener("focusout", (e) => {
        if (arm.contains(e.relatedTarget)) return;
        focusAmt[i] = 0; if (focusIdx === i) focusIdx = -1; redrawStatic();
      });
    });
    function redrawStatic() { arms.forEach((a, i) => placeArm(a, i, 1)); }
    return;
  }

  resizeCanvas();
  window.addEventListener("resize", () => { canvasDirty = true; }, { passive: true });
  arms.forEach((a, i) => placeArm(a, i, 0));
  startRAF();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopRAF();
    else startRAF();
  });
  window.addEventListener("pagehide", stopRAF);

  /* ── 위치 편집 패널(임시 — 3D 전용. 확정 후 제거) ───────────────────
     각 카드 각도(rad)/높이(px)를 직접 입력 → 실시간 반영. '값 복사'로 배열 출력. ── */
  if (IS_3D) (function buildPosEditor() {
    const scene = document.querySelector(".scene");
    if (!scene) return;
    const panel = document.createElement("div");
    panel.className = "orbit-edit"; panel.hidden = true;
    panel.innerHTML = '<div class="orbit-edit__hd">위치 편집<span>idx · 각도(rad) · 높이(px)</span></div>';
    CARD_NAMES.forEach((name, i) => {
      const row = document.createElement("div"); row.className = "orbit-edit__row";
      row.innerHTML = `<span class="orbit-edit__nm">${i} ${name}</span>`;
      const a = document.createElement("input");
      a.type = "number"; a.step = "0.05"; a.value = theta0[i].toFixed(2); a.title = "각도";
      const yo = document.createElement("input");
      yo.type = "number"; yo.step = "5"; yo.value = Math.round(cardY[i]); yo.title = "높이";
      a.addEventListener("input", () => { const v = parseFloat(a.value); if (!isNaN(v)) theta0[i] = v; });
      yo.addEventListener("input", () => { const v = parseFloat(yo.value); if (!isNaN(v)) cardY[i] = v; });
      row.append(a, yo); panel.append(row);
    });
    const copy = document.createElement("button");
    copy.className = "orbit-edit__copy"; copy.type = "button"; copy.textContent = "값 복사";
    copy.addEventListener("click", () => {
      const out = "THETA0_3D_OVERRIDE = [" + theta0.map((v) => +v.toFixed(3)).join(", ") + "];\n"
                + "Y_3D_OVERRIDE = [" + cardY.map((v) => Math.round(v)).join(", ") + "];";
      try { navigator.clipboard.writeText(out); } catch (e) {}
      console.log(out);
      copy.textContent = "복사됨!"; setTimeout(() => (copy.textContent = "값 복사"), 1200);
    });
    panel.append(copy);
    scene.append(panel);
    const tg = document.getElementById("orbitEditBtn");
    if (tg) tg.addEventListener("click", () => { panel.hidden = !panel.hidden; });
  })();
})();
